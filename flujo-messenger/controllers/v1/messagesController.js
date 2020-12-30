const { messagesModel } = require('../../models/messagesModel');
const { conversationsModel } = require('../../models/conversationsModel');
const { archivesModel } = require('../../models/archivesModel');
const { notificationService } = require('../../services/notificationService');
const { messageService } = require('../../services/messageService');
const { bulkMessagesController } = require('./bulkMessagesController');
const { notificationSvc } = require('../../services/notificationSvc');
const sha1 = require('sha1');


const messagesController = {
    pushMessages: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 });
            return;
        } else if (!(req.body.convId)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
            return;
        } else {
            // console.log(`Creating message for user ${req.headers.userid} in conv ${req.body.convId}`)
            if (Array.isArray(req.body.to)) {
                if (req.body.to.length <= 0) {
                    req.body.to = false;
                }
            } else {
                req.body.to = false;
            }
            let msgObj = {
                "from": parseInt(req.headers.userid),
                "to": req.body.to,
                "convId": req.body.convId,
                "workspaceId": parseInt(req.headers.workspaceid),
                "msg": (req.body.msg) ? req.body.msg : "",
                "metaMsg": (req.body.metaMsg) ? req.body.metaMsg : null,
                "isForward": (req.body.isForward) ? true : false,
                "encryption": {},
                "replyingTo": (req.body.replyingTo) ? req.body.replyingTo : null,
                "threadId": (req.body.threadId) ? req.body.threadId : null,
                "topics": (req.body.topics) ? req.body.topics : [],
                "reactions": [],
                "status": "sent",
                "timestamp": new Date(),
                "delivered": (parseInt(req.headers.userid) === 0) ? [] : [parseInt(req.headers.userid)],
                "read": (parseInt(req.headers.userid) === 0) ? [] : [parseInt(req.headers.userid)],
                "hashtags": [],
                "links": (req.body.links) ? req.body.links : [],
                "msgPlainText": req.body.msgPlainText,
                "mentions": (req.body.mentions) ? req.body.mentions : [],
                "calendar": (req.body.calendar) ? req.body.calendar : 'message',
            }
            conversationsModel.getOne('db', req.body.convId)
                .then(conversation => {
                    if ((conversation.members.indexOf(parseInt(req.headers.userid)) !== -1) || parseInt(req.headers.userid) === 0) {
                        if ('isActive' in conversation) {
                            if (conversation.isActive === 0) {
                                console.log("messagesController:pushMessages => ERROR Inactive conversation");
                                console.log("messagesController:pushMessages => ERROR req", conversation);
                                res.status(403).send({ error: true, message: "messagesController:pushMessages => ERROR Inactive conversation", result: {}, status_code: 100 })
                                return;
                            }
                        }
                        messagesModel.insert(req.db, msgObj)
                            .then(msgResp => {
                                // console.log("Successfully inserted data. Sending notifications")
                                if (msgObj.calendar && msgObj.calendar != 'message') {
                                    msgObj.to.forEach(user => {
                                        let delta = {
                                            type: `${msgObj.calendar}.new_message`,
                                            workspace: req.headers.workspaceid,
                                            data: msgResp.ops[0]
                                        }
                                        delta.user = String(user)
                                        notificationSvc.notifyUser(delta);
                                    })
                                } else {
                                    let delta = { type: "messenger.new_message", workspace: req.headers.workspaceid, data: msgResp.ops[0] }
                                    conversation.members.forEach(user => {
                                        delta.user = String(user);
                                        notificationSvc.notifyUser(delta);
                                    });
                                    const index = conversation.members.indexOf(delta.data.from);
                                    if (index > -1) {
                                        conversation.members.splice(index, 1);
                                    }
                                    notificationSvc.pushFCM(conversation.members, req.headers.workspaceid);
                                    // notificationService.push(req.db, req.body.convId, req.headers.userid, "NewMessage", [msgResp.ops[0]._id], delta)
                                }
                                const resp = {
                                    ops: msgResp.ops,
                                    insertedCount: msgResp.insertedCount,
                                    insertedId: msgResp.insertedId,
                                }
                                res.status(200).send({ error: false, message: "Success", result: resp, status_code: 100 });
                                return;
                            })
                            .catch(errors => {
                                console.log("messagesController:pushMessages => ERROR inserting message", errors);
                                res.status(500).send({ error: true, message: "messagesController:pushMessages => ERROR inserting message", result: {}, status_code: 160 });
                                return;
                            });
                    } else {
                        console.log("messagesController:pushMessages => ERROR fetching conversation");
                        res.status(403).send({ error: true, message: "messagesController:pushMessages => ERROR user not part of conversation", result: {}, status_code: 160 });
                        return;
                    }
                })
                .catch(err => {
                    console.log("messagesController:pushMessages => ERROR fetching conversation", err);
                    res.status(500).send({ error: true, message: "messagesController:pushMessages => ERROR fetching conversation", result: {}, status_code: 160 });
                    return;
                });
        }

    },

    pushPollMessages: (req, res) => {
        console.log('In messenger poll creation.')
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })

        } else if (!((req.body.conversation_ids) && (req.body.polldata))) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            console.log(`Creating message for user in conv ${req.body.conversation_ids}`)
            var msgObj = []
            var convId = req.body.conversation_ids;
            var polldata = req.body.polldata;

            if (convId.length > 0) {
                convId.map(el => {
                    msgObj = [...msgObj,
                    {
                        "from": parseInt(req.headers.userid),
                        "convId": el,
                        "workspaceId": parseInt(req.headers.workspaceid),
                        "msg": (req.body.msg) ? req.body.msg : "",
                        "metaMsg": {
                            polls: polldata
                        },
                        "isForward": (req.body.isForward) ? true : false,
                        "encryption": {},
                        "replyingTo": (req.body.replyingTo) ? req.body.replyingTo : null,
                        "threadId": (req.body.threadId) ? req.body.threadId : null,
                        "msgNum": req.body.msgNum ? req.body.msgNum : null,
                        "topics": (req.body.topics) ? req.body.topics : [],
                        "reactions": [],
                        "status": "sent",
                        "timestamp": new Date(),
                        "delivered": [parseInt(req.headers.userid)],
                        "read": [parseInt(req.headers.userid)],
                        "hashtags": []
                    }]
                })
                console.log(msgObj, 'msgObj')
            }
            messagesModel.bulkCreate(req.db, msgObj)
                .then(msgResp => {
                    console.log("Successfully inserted data. Sending notifications", msgResp)
                    // var attach_obj = [];
                    if (convId.length > 0) {

                        convId.map(convid => {
                            let delta = { type: "messenger.new_message", workspace: req.headers.workspaceid, data: msgResp.ops[0] }
                            // attach_obj = [...attach_obj, ...el];
                            notificationService.push(req.db, convid, parseInt(req.headers.userid), "NewMessage", [msgResp.ops[0]._id], delta)
                        })
                    }
                    res.status(200).send({ error: false, message: "Success", result: msgResp, status_code: 100 })

                }).catch(errors => {
                    console.log("Error inserting message to database")
                    res.status(500).send({ error: true, message: "Error while inserting", result: errors, status_code: 160 })
                })
        }

    },

    getMessages: async (req, res) => {
        //console.log(req.db, 'req.db')
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
        } else {
            // userVerifyService.isValidUserWithData(req.headers.authorization, req.headers.userid, req.headers.workspaceid)
            //     .then(async resp => {
            //        console.log('User verification response : ', resp)
            var offset = (req.query.offset) ? req.query.offset : 0;
            var limit = (req.query.limit) ? req.query.limit : 10;
            var db_obj = {
                'workspaceId': parseInt(req.headers.workspaceid)
            };
            if (req.query.status) {
                db_obj['status'] = req.query.status;
            }
            if (req.query.convId) {
                // console.log("convId exist")
                db_obj['convId'] = req.query.convId;
            }
            if (req.query.text) {
                // db_obj['msgPlainText'] = {}
                // db_obj['msgPlainText']['$regex'] = req.query.text
                db_obj['$text'] = { '$search': req.query.text };
            }
            if (req.query.from) {
                db_obj['from'] = parseInt(req.query.from);
            }
            if (req.query.file) {
                db_obj["metaMsg.attachments.fileName"] = {}
                db_obj["metaMsg.attachments.fileName"]['$regex'] = req.query.file
            }
            if (req.query.date) {
                db_obj["timestamp"] = { $gt: new Date(req.query.date) }
            }
            if (req.query.flag) {
                db_obj["isFlag"] = true;
            }
            if (typeof req.query.convId == 'undefined') {
                var convids = [];
                const conResp = await conversationsModel.getAll(req.db, parseInt(req.headers.userid), parseInt(req.headers.workspaceid))

                if (conResp.length > 0) {
                    conResp.map(el => {
                        convids = [...convids, el._id + '']
                    })
                }
                db_obj['convId'] = { $in: convids };
            }
            messagesModel.getAll(req.db, db_obj, parseInt(offset), parseInt(limit))
                .then(msgResp => {
                    // console.log("Successfully obtained messages")
                    res.status(200).send({ error: false, message: "Success", result: { 'messages': msgResp, offset: offset, limit: limit, total: msgResp.length }, status_code: 100 })
                }).catch(err => {
                    console.log("messagesController => Error getting messages")
                    res.status(500).send({ error: true, message: "Error getting messages", result: err, status_code: 160 })
                })

            //console.log(db_obj, 'db_obj')
            // }).catch(errors => {
            //     res.status(403).send({ error: true, message: "Not a valid user!", result: errors, status_code: 140 })
            // })

        }
    },
    getMessage: (req, res) => {
        console.log(req.params.msgid, 'req.params.msgid');
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and msgId", status_code: 101 })
        } else {
            messagesModel.getOne(req.db, req.params.msgid)
                .then(msgResp => {
                    if (msgResp == null) {
                        res.status(404).send({ error: true, message: "Error, message not found", result: null, status_code: 160 })
                    } else {
                        // console.log("Successfully obtained message")
                        res.status(200).send({ error: false, message: "Success", result: msgResp, status_code: 100 })
                    }
                }).catch(err => {
                    console.log("messagesController => Error obtaining message : ", err)
                    res.status(500).send({ error: true, message: "Error while listing", result: err, status_code: 160 })
                })
        }
    },
    getConversationMessages: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.headers.convid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and convId", status_code: 101 })
        } else {
            var offset = (req.query.offset) ? req.query.offset : 0;
            var limit = (req.query.limit) ? req.query.limit : 10;
            var is_status = false;
            var status = '';
            if (req.query.status) {
                is_status = true;
                status = req.query.status;
            }
            messagesModel.getAllConMesg(req.db, parseInt(req.headers.userid), parseInt(req.headers.workspaceid), req.headers.convid, is_status, status, parseInt(offset), parseInt(limit))
                .then(msgResp => {
                    console.log("Successfully obtained messages")
                    res.status(200).send({ error: false, message: "Success", result: { 'messages': msgResp, offset: offset, limit: limit, total: msgResp.length }, status_code: 100 })
                }).catch(err => {
                    console.log("Database query error while getting messages", err)
                    res.status(500).send({ error: true, message: "Database Error", result: err, status_code: 160 })
                })
        }
    },

    deleteMessage: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and msgId", status_code: 101 });
            return;
        } else {
            console.log(`Deleting message ${req.params.msgid} for user ${req.headers.userid}`)
            messagesModel.getOne(req.db, req.params.msgid).then(message => {
                if (!(parseInt(message.from) === parseInt(req.headers.userid))) {
                    res.status(403).send({ error: true, message: "Cannot delete other users messages", result: {}, status_code: 160 });
                    return;
                }
                archivesModel.insert(message)
                const updateObj = { msg: '<p style="color:grey"><i>This message was deleted</i></p>', metaMsg: { deleted: true }, msgPlainText: "This message was deleted", links: [], mentions: [] }
                messagesModel.update(req.db, req.params.msgid, updateObj)
                    .then(msgResp => {
                        console.log("Message deleted")
                        let delta = { type: "messenger.delete_message", workspace: req.headers.workspaceid, data: { msgids: [req.params.msgid], convid: message.convId } }
                        notificationService.push(req.db, message.convId, req.headers.userid, "UpdateMessage", [req.params.msgid], delta)
                        res.status(200).send({ error: false, message: "Success", result: msgResp, status_code: 100 });
                        return;
                    }).catch(err => {
                        console.log("Error deleting message", err)
                        res.status(500).send({ error: true, message: "Error deleting message", result: err, status_code: 160 });
                        return;
                    })
            }).catch(err => {
                console.log("Unable to find conversation")
                res.status(500).send({ error: true, message: "Error finding message", result: err, status_code: 160 });
                return;
            })

        }
    },

    deleteBotMessage: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and msgId", status_code: 101 });
            return;
        } else {
            console.log(`Deleting message ${req.params.msgid} for user ${req.headers.userid}`)
            messagesModel.getOne(req.db, req.params.msgid).then(message => {
                if (!(parseInt(message.from) == 0)) {
                    res.status(403).send({ error: true, message: "Cannot delete non bot messages", result: {}, status_code: 160 });
                    return;
                }
                // archivesModel.insert(message)
                // const updateObj = { msg: '<p style="color:grey"><i>This message was deleted</i></p>', metaMsg: { deleted: true }, msgPlainText: "This message was deleted", links: [], mentions: [] }
                messagesModel.delete(req.db, req.params.msgid)
                    .then(msgResp => {
                        // console.log(message.convId)
                        console.log("Message deleted")
                        let delta = { type: "messenger.perma_delete_message", workspace: req.headers.workspaceid, data: { msgids: [req.params.msgid], convid: message.convId } }
                        notificationService.push(req.db, message.convId, req.headers.userid, "UpdateMessage", [req.params.msgid], delta)
                        res.status(200).send({ error: false, message: "Success", status_code: 100 });
                        return;
                    }).catch(err => {
                        console.log("Error deleting message", err)
                        res.status(500).send({ error: true, message: "Error deleting message", result: err, status_code: 160 });
                        return;
                    })
            }).catch(err => {
                console.log("Unable to find message", err)
                res.status(500).send({ error: true, message: "Error finding message", status_code: 160 });
                return;
            })

        }
    },

    deleteMessages: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId", status_code: 101 })
        } else if (!(req.body.messages)) {
            res.status(400).send({ error: true, message: "Expected messages: [...]", status_code: 101 })
        } else if (req.body.messages == []) {
            res.status(400).send({ error: true, message: "Need at least one message Id", status_code: 101 })
        }
        else {
            console.log(`Deleting messages for user ${req.headers.userid}`)
            messagesModel.getOne(req.db, req.body.messages[0]).then(message => {
                messagesModel.deleteMany(req.db, req.body.messages)
                    .then(msgResp => {
                        console.log(msgResp.deletedCount, "Messages deleted")
                        if (msgResp.deletedCount > 0) {
                            let delta = { type: "messenger.delete_message", workspace: req.headers.workspaceid, data: { msgids: req.body.messages } }
                            notificationService.push(req.db, message.convId, req.headers.userid, "DeleteMessage", req.body.messages, delta)
                        }
                        res.status(200).send({ error: false, message: "Success", result: msgResp, status_code: 100 });
                        return;
                    }).catch(err => {
                        console.log("Error deleting message", err)
                        res.status(500).send({ error: true, message: "Error deleting message", result: err, status_code: 160 });
                        return;
                    })
            }).catch(err => {
                console.log("Unable to find conversation")
                res.status(500).send({ error: true, message: "Error finding message", result: err, status_code: 160 });
                return;
            })

        }
    },
    updateMessage: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and messageId param", status_code: 101 });
            return;
        } else if (!(req.body.reaction || req.body.delivered || req.body.read || req.body.metaMsg || req.body.threadid || ('flag' in req.body))) {
            res.status(400).send({ error: true, message: "Expected body params: threadid, reactions, delivered or read", status_code: 101 });
            return;
        } else {
            // console.log(`Updating message ${req.params.msgid} for user ${req.headers.userid}`)
            messagesModel.getOne(req.db, req.params.msgid)
                .then(currentObj => {
                    let updateObj = {};
                    let updated = false;
                    if (req.body.reaction) {
                        updateObj['reactions'] = messagesController.insertReaction(req, currentObj)
                        updated = true;
                    }
                    if (req.body.delivered) {
                        if (!currentObj.delivered) {
                            currentObj.delivered = []
                            currentObj.deliveredMeta = []
                        }
                        const oldReadList = currentObj.delivered.length;
                        updateObj['delivered'] = messagesController.insertDelivered(req, currentObj);
                        updateObj.deliveredMeta = messagesController.insertDeliveredMeta(req, currentObj);
                        if (updateObj.delivered.length !== oldReadList) {
                            updated = true;
                        }
                    }
                    if (req.body.read) {
                        const oldReadList = currentObj.read.length;
                        updateObj['read'] = messagesController.insertRead(req, currentObj);
                        updateObj.readMeta = messagesController.insertReadMeta(req, currentObj);
                        if (updateObj.read.length !== oldReadList) {
                            updated = true;
                            updateObj['delivered'] = messagesController.insertDelivered(req, currentObj);
                            updateObj.deliveredMeta = messagesController.insertDeliveredMeta(req, currentObj);
                        }
                    }
                    if (req.body.threadid) {
                        updateObj['threadId'] = req.body.threadid;
                        currentObj['threadId'] = req.body.threadid;
                        updated = true;
                    }
                    if (req.body.flag === true) {
                        if (currentObj.isFlag) {
                            // deltaRequired = false;
                            res.status(500).send({ error: true, message: "Already flagged" });
                            return;
                        } else {
                            updateObj.isFlag = true;
                            updateObj.flagMeta = {
                                flaggedBy: req.headers.userid,
                                flaggedAt: new Date(),
                                flagPriority: req.body.flagPriority
                            }
                            currentObj.isFlag = true;
                            currentObj.flagMeta = updateObj.flagMeta;
                            updated = true;
                        }
                    }
                    if (req.body.flag === false) {
                        if (currentObj.isFlag) {
                            if (currentObj.flagMeta.flaggedBy === req.headers.userid) {
                                updateObj.isFlag = false;
                                updateObj.flagMeta = {}
                                currentObj.isFlag = updateObj.isFlag;
                                currentObj.flagMeta = updateObj.flagMeta;
                                updated = true;
                            } else {
                                res.status(403).send({ error: true, message: "Flagged by an other user. Insufficient permission" });
                                return;
                            }
                        } else {
                            res.status(500).send({ error: true, message: "Message is not flagged. Cannot unflag" });
                            return;
                        }
                    }
                    if (req.body.metaMsg) {
                        updateObj.metaMsg = req.body.metaMsg;
                        currentObj.threadId = req.body.threadid;
                        updated = true;
                    }
                    if (updated) {
                        messagesModel.update(req.db, req.params.msgid, updateObj)
                            .then(message => {
                                // console.log("Successfully updated message")
                                let delta = { type: "messenger.update_message", workspace: req.headers.workspaceid, data: { messageid: req.params.msgid, convid: currentObj.convId, update: updateObj } }
                                notificationService.push(req.db, currentObj.convId, req.headers.userid, "UpdateMessage", [req.params.msgid], delta)
                                res.status(200).send({ error: false, message: "Success", result: currentObj, status_code: 100 });
                                return;
                            }).catch(err => {
                                console.log("messagesController:updateMessage => ERROR updating message", err)
                                res.status(500).send({ error: true, message: "messagesController:updateMessage => ERROR", status_code: 160 });
                                return;
                            })
                    } else {
                        console.log("messagesController:updateMessage => WARN message already updated");
                        res.status(200).send({ error: false, message: "Message already updated", result: currentObj, status_code: 100 });
                        return;
                    }
                }).catch(error => {
                    console.log("Cannot find message id", error)
                    res.status(500).send({ error: true, message: "Error updating message", result: error, status_code: 160 });
                    return;
                })
        }
    },

    insertReaction: (req, currentObj) => {
        if (req.body.reaction) {
            let updated = false;
            let reaction = { "userId": parseInt(req.headers.userid), "reaction": req.body.reaction };
            currentObj['reactions'].forEach((part, index, object) => {
                if (part['userId'] === parseInt(req.headers.userid)) {
                    if (req.body.reaction == 'remove') {
                        object.splice(index, 1);
                        console.log("Reaction removed")
                    } else {
                        part.reaction = req.body.reaction
                        console.log("Reaction modified")
                    }
                    updated = true
                }
            })
            if (!updated) {
                currentObj['reactions'].push(reaction);
                console.log("Reaction created")
            }
            return currentObj['reactions']
        }
    },

    insertRead: (req, currentObj) => {
        let updated = false;
        currentObj['read'].forEach((part, index) => {
            if (part === parseInt(req.headers.userid)) {
                console.log("Already marked read!")
                updated = true
            }
        })
        if (!updated) {
            // console.log(`${req.headers.userid} has read message ${req.params.msgid}`)
            currentObj.read.push(parseInt(req.headers.userid));
        }
        return currentObj.read
    },
    insertReadMeta: (req, currentObj) => {
        let updated = false;
        if (currentObj.readMeta) {
            currentObj.readMeta.forEach((part, index) => {
                if (part.user === parseInt(req.headers.userid)) {
                    updated = true
                }
            })
        } else {
            currentObj.readMeta = [{ user: parseInt(req.headers.userid), time: new Date() }]
            updated = true
        }
        if (!updated) {
            currentObj.readMeta.push({ user: parseInt(req.headers.userid), time: new Date() });
        }
        return currentObj.readMeta
    },
    insertDelivered: (req, currentObj) => {
        let updated = false;
        currentObj['delivered'].forEach((part, index) => {
            if (part === parseInt(req.headers.userid)) {
                console.log("Already marked delivered!")
                updated = true
            }
        })
        if (!updated) {
            // console.log(`${req.params.msgid} has been delivered to ${req.headers.userid}`)
            currentObj.delivered.push(parseInt(req.headers.userid));
        }
        return currentObj.delivered
    },
    insertDeliveredMeta: (req, currentObj) => {
        let updated = false;
        if (currentObj.deliveredMeta) {
            currentObj.deliveredMeta.forEach((part, index) => {
                if (part.user === parseInt(req.headers.userid)) {
                    updated = true
                }
            })
        } else {
            currentObj.deliveredMeta = [{ user: parseInt(req.headers.userid), time: new Date() }]
            updated = true
        }
        if (!updated) {
            currentObj.deliveredMeta.push({ user: parseInt(req.headers.userid), time: new Date() });
        }
        return currentObj.deliveredMeta
    },

    updateInviteMessage: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid && req.headers.convid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and messageId param", status_code: 101 })
        } else if (req.body.isAccepted === undefined || req.body.isAccepted === null) {
            res.status(400).send({ error: true, message: "Expected body isAccepted", status_code: 101 })
        } else {
            console.log(`Updating message ${req.params.msgid} for user ${req.headers.userid}`)
            messagesModel.getOne(req.db, req.params.msgid)
                .then(currentObj => {
                    let updateObj = {};
                    console.log(currentObj, 'currentObj')
                    if (req.body.isType && req.body.isType == 'app_directory') {
                        updateObj = { "metaMsg.appDirectory.isAccepted": req.body.isAccepted }
                        currentObj.metaMsg.appDirectory.isAccepted = req.body.isAccepted
                    } else if (req.body.isType && req.body.isType == 'team_join') {
                        updateObj = { "metaMsg.teamJoin.isAccepted": req.body.isAccepted }
                        currentObj.metaMsg.teamJoin.isAccepted = req.body.isAccepted
                    }
                    else {
                        updateObj = { "metaMsg.teamInvite.isAccepted": req.body.isAccepted }
                        currentObj.metaMsg.teamInvite.isAccepted = req.body.isAccepted
                    }

                    console.log(req.body.isType, 'req.body.isType')
                    messagesModel.update(req.db, req.params.msgid, updateObj)
                        .then(message => {
                            console.log(message, 'message---')
                            if (req.body.isType === 'app_directory' || req.body.isType === 'team_join') {
                                bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.headers.userid, req.body.userIds, req.body, 0)
                            }
                            let delta = { type: "messenger.update_message", workspace: req.headers.workspaceid, data: { messageid: req.params.msgid, convid: currentObj.convId, update: currentObj } }
                            // let delta = { type: "messenger.update_message", workspace: req.headers.workspaceid, data }
                            notificationService.push(req.db, currentObj.convId, req.headers.userid, "UpdateMessage", [req.params.msgid], delta)

                            res.status(200).send({ error: false, message: "Success", result: message, update: currentObj, status_code: 100 })
                        }).catch(err => {
                            console.log("Error updating message", err)
                            res.status(500).send({ error: true, message: "Error updating message", result: err, status_code: 160 })
                        })
                }).catch(error => {
                    // console.log("Cannot find message id", error)
                    res.status(500).send({ error: true, message: "Error updating message", result: error, status_code: 160 })
                })
        }
    },

    getMessageCount: (req, res) => {
        console.log(req.headers,
            'req.headers.authorization && req.headers.userid && req.headers.workspaceid')
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization and workspaceId", status_code: 101 })
        } else {
            let where_obj;
            if (req.headers.isworkspace) {
                where_obj = { 'workspaceId': parseInt(req.headers.workspaceid) }
            } else {
                where_obj = { 'from': parseInt(req.headers.userid), 'workspaceId': parseInt(req.headers.workspaceid) }
            }
            messagesModel.getCount(req.db, where_obj)
                .then(msgResp => {
                    console.log(msgResp, 'messege count')
                    res.status(200).send({ error: false, message: "User message count", result: msgResp, status_code: 100 })
                }).catch(msgErr => {
                    console.log("Error counting message", msgErr)
                    res.status(500).send({ error: true, message: "Error counting message", result: msgErr, status_code: 160 })
                })
        }
    },
    /** 
     * Update the app directory permission to all owners objects
     * req.headers.userid,  workspaceid, authorization => owner keys
     * req.body.userId => user id 
    */

    updateAppPermission: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and messageId param", status_code: 101 })
        } else if (!((req.body.isAccepted !== undefined || req.body.isAccepted !== null) && req.body.app_id && req.body.userId && req.body.ownerName && req.body.userName && req.body.ownerIds && req.body.appName)) {
            res.status(400).send({ error: true, message: "Expected status, app_id", status_code: 101 })
        } else {
            console.log(req.headers.userid, req.headers.workspaceid, 'req.headers.userid && req.headers.workspaceid')
            console.log(req.body.isAccepted, req.headers.workspaceid, req.body.app_id, req.body.userId, req.body.ownerName, req.body.userName, req.body.ownerIds, req.body.appName, 'req.headers.userid && req.headers.workspaceid')
            console.log(`Updating owner message for user ${req.body.userId}`)
            let where_obj = {
                workspaceId: parseInt(req.headers.workspaceid),
                "metaMsg.appDirectory.appId": req.body.app_id,
                "metaMsg.appDirectory.userId": req.body.userId,
                "metaMsg.appDirectory.isAcceptedBy": 0,
            }
            messagesModel.getMessages(req.db, where_obj)
                .then(currentObj => {
                    // console.log('----------')
                    console.log(currentObj, 'currentObj');// return false
                    if (currentObj.length > 0) {

                        let updateObj = {
                            "metaMsg.appDirectory.isAccepted": req.body.isAccepted,
                            "metaMsg.appDirectory.isAcceptedBy": parseInt(req.headers.userid),
                            "metaMsg.appDirectory.isAcceptedByName": req.body.ownerName
                        }
                        // sending message to user
                        let appName = currentObj[0].metaMsg.appDirectory.appName ? currentObj[0].metaMsg.appDirectory.appName : '';
                        // let user_msg_body = {
                        //     msg: `@${req.body.ownerName} accepted your request, now you have access to ${appName} app.`
                        // }
                        // console.log(user_msg_body, 'user_msg_body')
                        // bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.headers.userid, [req.body.userId], user_msg_body, 0)
                        // .then( pushRes => {
                        //     console.log(pushRes, 'push_response')
                        //     let owner_msg_body = {
                        //         msg: `You made @${req.body.userName} admin to ${appName}. He or She can access the App now.`
                        //     }
                        //     console.log(owner_msg_body, 'owner_msg_body')
                        //     bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.body.userId, [parseInt(req.headers.userid)], owner_msg_body, 0)
                        // currentObj.metaMsg.appDirectory.isAccepted = req.body.isAccepted
                        //console.log(currentObj.length, 'length');
                        currentObj.map(obj => {
                            console.log(obj, 'find_msg');
                            obj.metaMsg.appDirectory.isAccepted = req.body.isAccepted;
                            obj.metaMsg.appDirectory.isAcceptedBy = parseInt(req.headers.userid);
                            obj.metaMsg.appDirectory.isAcceptedByName = req.body.ownerName;
                            messagesModel.update(req.db, obj._id, updateObj)
                                .then(message => {
                                    console.log(message, 'update_msg');
                                    let delta = {
                                        type: "messenger.update_message", workspace: req.headers.workspaceid,
                                        data: { messageid: obj._id, convid: obj.convId, update: obj }
                                    }

                                    console.log(delta, 'delta')
                                    notificationService.push(req.db, obj.convId, req.headers.userid, "UpdateMessage", [obj._id], delta)
                                    // let ownerIds = req.body.ownerIds.filter( id => id !== parseInt(req.headers.userid))
                                    // console.log(ownerIds, 'ownerIds')
                                    // if(ownerIds.length > 0) {
                                    //     let other_msg_body = {
                                    //         msg: `@${req.body.ownerName} gave @${req.body.userName} access to ${appName} app. View more in permission.`,
                                    //     } 
                                    //     bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.headers.userid, ownerIds, other_msg_body, 0)
                                    // }else {
                                    //     console.log('Owners not found.')
                                    // }
                                    // let user_msg_body = {
                                    //     msg: `@${req.body.ownerName} accepted your request, now you have access to ${appName} app.`
                                    // }
                                    // console.log(user_msg_body, 'user_msg_body')

                                    // bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.headers.userid, [req.body.userId], user_msg_body, 0)

                                    // let owner_msg_body = {
                                    //     msg: `You made @${req.body.userName} admin to ${appName}. He or She can access the App now.`
                                    // }
                                    // console.log(owner_msg_body, 'owner_msg_body')
                                    // bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.body.userId, [parseInt(req.headers.userid)], owner_msg_body, 0)

                                }).catch(err => {
                                    console.log("Error updating message", err)
                                    res.status(500).send({ error: true, message: "Error updating message", result: err, status_code: 160 })
                                })
                        })
                        res.status(200).send({ error: false, message: "Success", update: currentObj, status_code: 100 })
                        // })
                        // .catch( pushErr => {
                        //     res.status(200).send({ error: false, message: "No messages found in push message", result: pushErr, status_code: 100 })
                        // })
                    } else {
                        res.status(200).send({ error: false, message: "No messages found", update: currentObj, status_code: 100 })

                    }
                }).catch(error => {
                    console.log(error, "Cannot find message id")
                    res.status(500).send({ error: true, message: "Error updating message", result: error, status_code: 160 })
                })
        }
    },

    pushBulkMessage: (req, res) => {
        console.log('In messenger poll creation.')
        if (!((req.headers.authorization) && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
        } else if (!(req.body.conversation_ids && req.body.app_name && req.body.user_name)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            var convId = req.body.conversation_ids;
            // var polldata = req.body.polldata;
            // console.log(req.body.conversation_ids, req.body.app_name, req.body.user_name, 'req.body.conversation_ids && req.body.app_name && req.body.user_name')
            console.log(`Creating message for user in conv ${convId}`)

            if (convId.length > 0) {
                console.log(convId.length, 'length')
                let users = [];
                let result = [];
                let msg_text = `${req.body.user_name} disabled ${req.body.app_name} App as well as deleted App configuration.`;
                //get conversation id 
                let userId = parseInt(req.headers.userid)
                let msg_body = `<span class="mention" data-index="2" data-denotation-char="@" data-id="${userId}" data-value="${req.body.user_name}">
                <span contenteditable="false"><span class="ql-mention-denotation-char">@</span>${req.body.user_name}</span>
                </span> disabled ${req.body.app_name} App as well as deleted App configuration.`
                result = convId.map(el => {
                    // console.log('el=>')
                    return messageService.pushMessageFromBot(req.db, el, msg_text, req.headers.workspaceid, req.headers.userid, '', msg_body)
                })
                Promise.all(result).then(resp => {
                    let success = [];
                    let fail = [];
                    let i = 0;
                    do {
                        if (resp[i].error) {
                            fail = [...fail, { convId: resp[i].convId }]
                            i++;
                        } else {
                            success = [...success, { convId: resp[i].convId }]
                            i++;
                        }
                    } while (i < resp.length) {
                        res.status(200).send({ error: false, message: "Success", result: { success: success, fail: fail }, status_code: 100 })
                    }
                }).catch(convErr => {
                    res.status(500).send({ error: true, message: "Error while sending messages", status_code: 101, result: convErr })
                })
            } else {
                res.status(400).send({ error: true, message: "ConvIds required.", status_code: 101 })

            }
        }
    },

    deleteAnyMessages: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and messageId param", status_code: 101 })
        } else if (!((req.body.isType !== undefined || req.body.isAccepted !== null))) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            console.log(`Updating owner message for user ${req.body.userId}`)
            let where_obj = {};
            if (req.body.isType == 'app_directory') {
                where_obj = {
                    workspaceId: parseInt(req.headers.workspaceid),
                    "metaMsg.appDirectory.appId": req.body.app_id
                }
            } else if (req.body.isType == 'team_invite') {
                where_obj = {
                    workspaceId: parseInt(req.headers.workspaceid),
                    "metaMsg.teamInvite.teamId": req.body.team_id
                }
            } else {
                where_obj = {
                    workspaceId: parseInt(req.headers.workspaceid),
                    "metaMsg.appDirectory.appId": req.body.app_id
                }
            }
            let messageids = [];
            messagesModel.getMessages(req.db, where_obj)
                .then(currentObj => {
                    // console.log('----------')
                    // console.log(currentObj, 'currentObj');// return false
                    currentObj.map(msgIds => {
                        messageids = [...messageids, `${msgIds._id}`]
                    })
                    // console.log(messageids, 'messageids'); return false;
                    messagesModel.deleteMany(req.db, messageids)
                        .then(msgResp => {
                            res.status(200).send({ error: false, message: "Success", update: msgResp, status_code: 100 })
                        }).catch(err => {
                            res.status(500).send({ error: true, message: "Error while deleting the message", result: err, status_code: 160 })

                        })

                }).catch(error => {
                    console.log(error, "Cannot find message id")
                    res.status(500).send({ error: true, message: "Error updating message", result: error, status_code: 160 })
                })
        }
    },

    updateTeamJoin: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and messageId param", status_code: 101 })
        } else if (!((req.body.isAccepted !== undefined || req.body.isAccepted !== null) && req.body.teamId && req.body.userId && req.body.ownerName)) {
            res.status(400).send({ error: true, message: "Expected status, app_id", status_code: 101 })
        } else {
            console.log(`Updating owner message for user ${req.body.userId}`)
            let where_obj = {
                workspaceId: parseInt(req.headers.workspaceid),
                "metaMsg.teamJoin.teamId": req.body.teamId,
                "metaMsg.teamJoin.userId": req.body.userId,
                "metaMsg.teamJoin.isAcceptedBy": 0,
            }
            messagesModel.getMessages(req.db, where_obj)
                .then(currentObj => {
                    // console.log('----------') 
                    console.log(currentObj, 'currentObj');// return false
                    if (currentObj.length > 0) {

                        let updateObj = {
                            "metaMsg.teamJoin.isAccepted": req.body.isAccepted,
                            "metaMsg.teamJoin.isAcceptedBy": parseInt(req.headers.userid),
                            "metaMsg.teamJoin.isAcceptedByName": req.body.ownerName
                        }
                        // sending message to user
                        // let teamName = currentObj[0].metaMsg.teamJoin.teamName ? currentObj[0].metaMsg.teamJoin.teamName : '';
                        // let body = {
                        //     msg: `${req.body.ownerName} accepted ${teamName} team join request.`
                        // }
                        // console.log(body, 'body')
                        bulkMessagesController.getMywalAndPushMsgs(req.db, req.headers.workspaceid, req.headers.userid, [req.body.userId], req.body, 0)
                        console.log(currentObj.length, 'length');
                        currentObj.map(obj => {
                            //  console.log(obj, 'find_msg'); 
                            obj.metaMsg.teamJoin.isAccepted = req.body.isAccepted;
                            obj.metaMsg.teamJoin.isAcceptedBy = parseInt(req.headers.userid);
                            obj.metaMsg.teamJoin.isAcceptedByName = req.body.ownerName;
                            messagesModel.update(req.db, obj._id, updateObj)
                                .then(message => {
                                    console.log(message, 'update_msg');
                                    let delta = {
                                        type: "messenger.update_message", workspace: req.headers.workspaceid,
                                        data: { messageid: obj._id, convid: obj.convId, update: obj }
                                    }
                                    console.log(delta, 'delta')
                                    notificationService.push(req.db, obj.convId, req.headers.userid, "UpdateMessage", [obj._id], delta)
                                }).catch(err => {
                                    console.log("Error updating message", err)
                                    res.status(500).send({ error: true, message: "Error updating message", result: err, status_code: 160 })
                                })
                        })
                        res.status(200).send({ error: false, message: "Success", update: currentObj, status_code: 100 })
                    } else {
                        res.status(200).send({ error: false, message: "No messages found", update: currentObj, status_code: 100 })

                    }
                }).catch(error => {
                    console.log(error, "Cannot find message id")
                    res.status(500).send({ error: true, message: "Error updating message", result: error, status_code: 160 })
                })
        }
    },

    overloadPushMessage: (req, res) => {
        const msgObj = {
            "from": parseInt(req.headers.userid),
            "to": req.body.to,
            "convId": req.body.convId,
            "workspaceId": parseInt(req.headers.workspaceid),
            "msg": (req.body.msg) ? req.body.msg : "",
            "msgPlainText": req.body.msgPlainText,
            "metaMsg": (req.body.metaMsg) ? req.body.metaMsg : null,
            "reactions": [],
            "timestamp": new Date(),
            "delivered": (parseInt(req.headers.userid) === 0) ? [] : [parseInt(req.headers.userid)],
            "read": (parseInt(req.headers.userid) === 0) ? [] : [parseInt(req.headers.userid)],
            "links": (req.body.links) ? req.body.links : [],
            "mentions": (req.body.mentions) ? req.body.mentions : [],
            "calendar": (req.body.calendar) ? req.body.calendar : 'message',
        }
        messagesModel.insert(req.db, msgObj)
            .then(msgResp => {
                if (msgObj.calendar && msgObj.calendar !== 'message') {
                    msgObj.to.forEach(user => {
                        const delta = {
                            type: `${msgObj.calendar}.new_message`,
                            workspace: req.headers.workspaceid,
                            data: msgResp.ops[0]
                        }
                        delta.user = String(user)
                        notificationSvc.notifyUser(delta);
                    })
                }
                const resp = {
                    ops: msgResp.ops,
                    insertedCount: msgResp.insertedCount,
                    insertedId: msgResp.insertedId,
                }
                res.status(200).send({ error: false, message: "Success", result: resp, status_code: 100 });
                return;
            })
            .catch(errors => {
                console.log("messagesController:overloadPushMessage => ERROR inserting message", errors);
                res.status(500).send({ error: true, message: "messagesController:pushMessages => ERROR inserting message", result: {}, status_code: 160 });
                return;
            });
    },

    overloadGetMessages: async (req, res) => {
        var offset = (req.query.offset) ? req.query.offset : 0;
        var limit = (req.query.limit) ? req.query.limit : 10;
        var db_obj = {
            'workspaceId': parseInt(req.headers.workspaceid)
        };
        if (req.query.convId) {
            db_obj.convId = req.query.convId;
        }
        if (req.query.text) {
            db_obj['$text'] = { '$search': req.query.text };
        }
        if (req.query.from) {
            db_obj.from = parseInt(req.query.from);
        }
        if (req.query.file) {
            db_obj["metaMsg.attachments.fileName"] = {}
            db_obj["metaMsg.attachments.fileName"]['$regex'] = req.query.file
        }
        if (req.query.date) {
            db_obj.timestamp = { $gt: new Date(req.query.date) }
        }
        if (typeof req.query.convId === 'undefined') {
            res.status(404).send({ error: true, message: "Need a valid conversation id", result: {}, status_code: 160 })
        }
        messagesModel.getAll(req.db, db_obj, parseInt(offset), parseInt(limit))
            .then(msgResp => {
                res.status(200).send({ error: false, message: "Success", result: { 'messages': msgResp, offset: offset, limit: limit, total: msgResp.length }, status_code: 100 })
            }).catch(err => {
                console.log("messagesController => Error getting messages")
                res.status(500).send({ error: true, message: "Error getting messages", result: err, status_code: 160 })
            })
    },


}



module.exports = { messagesController };