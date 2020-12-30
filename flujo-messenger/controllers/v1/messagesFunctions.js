const { messagesModel } = require('../../models/messagesModel');
const { conversationsModel } = require('../../models/conversationsModel');

const { mongoSvc } = require('../../services/mongoSvc')

const messagesFunctions = {
    getMessages: (req) => {
        return new Promise(async (resolve, reject) => {
            var offset = (req.query.offset) ? req.query.offset : 0;
            var limit = (req.query.limit) ? req.query.limit : 10;
            var db_obj = {
                'workspaceId': parseInt(req.headers.workspaceid)
            };
            if (req.query.convId) {
                db_obj['convId'] = req.query.convId;
            }
            if (req.query.text) {
                db_obj['msg'] = {}
                db_obj['msg']['$regex'] = req.query.text
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
            mongoSvc.getDbClient().then(db => {
                messagesModel.getAll(db, db_obj, parseInt(offset), parseInt(limit))
                    .then(msgResp => {
                        resolve({
                            message: "Success",
                            result: {
                                'messages': msgResp, offset: offset, limit: limit, total: msgResp.length
                            }, error: false, status_code: 100, status: 200
                        });
                        return;
                    }).catch(err => {
                        console.log("messagesFunctions:getMessages => ERROR ", err);
                        console.log("messagesFunctions:getMessages => ERROR req:", req);
                        reject({
                            error: true,
                            message: "Error getting messages",
                            result: "messagesFunctions:getMessages => ERROR ",
                            status_code: 160, status: 500
                        });
                        return;
                    });
            })
        });
    },

    getMessage: (req) => {
        return new Promise(async (resolve, reject) => {
            messagesModel.getOne(req.db, req.params.msgid)
                .then(msgResp => {
                    if (msgResp == null) {
                        console.log("messagesFunctions:getMessage => ERROR: No message found");
                        console.log("messagesFunctions:getMessage => ERROR: req", req);
                        reject({
                            error: true,
                            message: "Error getting message",
                            result: {},
                            status_code: 160,
                            status: 404
                        });
                        return;
                    } else {
                        resolve({
                            message: "Success",
                            result: msgResp,
                            error: false,
                            status_code: 100,
                            status: 200
                        });
                        return;
                    }
                }).catch(err => {
                    console.log("messagesFunctions:getMessage => ERROR", err);
                    console.log("messagesFunctions:getMessage => ERROR req", req)
                    reject({
                        error: true,
                        message: "Error getting message",
                        result: "messagesFunctions:getMessage => ERROR",
                        status_code: 160,
                        status: 404
                    });
                    return;
                });
        });
    },

    postMessage: (req) => {
        return new Promise((resolve, reject) => {
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
                "timestamp": new Date(),
                "delivered": [parseInt(req.headers.userid)],
                "read": [parseInt(req.headers.userid)],
                "deliveredMeta": [{ user: parseInt(req.headers.userid), time: new Date() }],
                "readMeta": [{ user: parseInt(req.headers.userid), time: new Date() }],
                "hashtags": [],
                "links": (req.body.links) ? req.body.links : [],
                "msgPlainText": req.body.msgPlainText,
                "mentions": (req.body.mentions) ? req.body.mentions : [],
                "tempId": (req.body.tempId) ? req.body.tempId : null
            }
            conversationsModel.getOne('db', req.body.convId)
                .then(conversation => {
                    if (conversation.members.indexOf(parseInt(req.headers.userid)) !== -1) {
                        if ('isActive' in conversation) {
                            if (conversation.isActive === 0) {
                                console.log("messagesFunctions:postMessage => ERROR Inactive conversation");
                                console.log("messagesFunctions:postMessage => ERROR req", req);
                                reject({
                                    error: true,
                                    status: 403,
                                    tempId: req.body.tempId,
                                    message: "Inactive conversation"
                                });
                                return;
                            }
                        }
                        messagesModel.insert('db', msgObj)
                            .then(msgResp => {
                                if (('tempId' in msgResp.ops[0]) && (req.body.tempId !== msgResp.ops[0].tempId)) {
                                    console.log('messagesFunctions:postMessages => FUCK ALL ERROR tempId: ', req.body.tempId);
                                    console.log('messagesFunctions:postMessages => FUCK ALL ERROR _id: ', msgResp.ops[0]._id);
                                    reject({
                                        error: true,
                                        status: 500,
                                        tempId: req.body.tempId,
                                        message: "messagesFunctions:postMessage => ERROR _id collission"
                                    });
                                    return;
                                } else {
                                    let delta = {
                                        type: "messenger.new_message",
                                        workspace: req.headers.workspaceid,
                                        data: msgResp.ops[0],
                                        users: conversation.members
                                    }
                                    resolve(delta);
                                    return;
                                }
                            })
                            .catch(errors => {
                                console.log("messagesFunctions:postMessage => ERROR Unable to write to db", errors);
                                console.log("messagesFunctions:postMessage => ERROR req", req)
                                reject({
                                    error: true,
                                    status: 500,
                                    tempId: req.body.tempId,
                                    message: "messagesFunctions:postMessage => ERROR Unable to insert into db"
                                });
                                return;
                            });
                    } else {
                        console.log("messagesFunctions:postMessage => ERROR Not a member of the conversation");
                        console.log("messagesFunctions:postMessage => ERROR req", req);
                        reject({
                            error: true,
                            status: 403,
                            tempId: req.body.tempId,
                            message: "Not a member of the conversation"
                        });
                        return;
                    }
                })
                .catch(error => {
                    console.log("messagesFunctions:postMessage => ERROR Unable to fetch conversation", error);
                    console.log("messagesFunctions:postMessage => ERROR req", req);
                    reject({
                        error: true,
                        status: 500,
                        message: "messagesFunctions:postMessage => ERROR Unable to fetch conversation",
                        tempId: req.body.tempId
                    });
                    return;
                })
        })
    },

    updateMessage: (req) => {
        return new Promise((resolve, reject) => {
            messagesModel.getOne('db', req.body.msgId)
                .then(currentObj => {
                    let updated = false;
                    let updateObj = {};
                    if (req.body.reaction) {
                        updateObj['reactions'] = messagesFunctions.insertReaction(req, currentObj);
                        updated = true;
                    }
                    if (req.body.delivered) {
                        const oldReadList = currentObj.delivered.length;
                        updateObj['delivered'] = messagesFunctions.insertDelivered(req, currentObj);
                        updateObj.deliveredMeta = messagesFunctions.insertDeliveredMeta(req, currentObj);
                        if (updateObj.delivered.length !== oldReadList) {
                            updated = true;
                        }
                    }
                    if (req.body.read) {
                        const oldReadList = currentObj.read.length;
                        updateObj['read'] = messagesFunctions.insertRead(req, currentObj);
                        updateObj.readMeta = messagesFunctions.insertReadMeta(req, currentObj);
                        if (updateObj.read.length !== oldReadList) {
                            updated = true;
                            updateObj['delivered'] = messagesFunctions.insertDelivered(req, currentObj);
                            updateObj.deliveredMeta = messagesFunctions.insertDeliveredMeta(req, currentObj);
                        }
                    }
                    if (req.body.threadid) {
                        updateObj['threadId'] = req.body.threadid;
                        currentObj['threadId'] = req.body.threadid;
                        updated = true;
                    }
                    if (updated) {
                        messagesModel.update('db', req.body.msgId, updateObj)
                            .then(message => {
                                let delta = {
                                    type: "messenger.update_message",
                                    workspace: req.headers.workspaceid,
                                    data: { messageid: req.body.msgId, convid: currentObj.convId, update: updateObj, to: currentObj.to }
                                }
                                // if (Array.isArray(currentObj.to) && currentObj.to.length > 0) {
                                //     delta.to = currentObj.to;
                                //     delta.data.to = currentObj.to;
                                //     resolve(delta);
                                // } else {
                                conversationsModel.getOne('db', currentObj.convId)
                                    .then(conversation => {
                                        if (conversation) {
                                            delta.to = conversation.members;
                                            // delta.data.to = conversation.members;
                                            resolve(delta);
                                            return;
                                        } else {
                                            console.log('messagesFunctions:updateMessage => ERROR conversation not found');
                                            console.log('messagesFunctions:updateMessage => ERROR req', req);
                                            reject({
                                                status: 404,
                                                error: true,
                                                reason: "messagesFunctions:updateMessage => ERROR conversation not found",
                                                request: req,
                                                tempId: req.body.tempId
                                            });
                                            return;
                                        }
                                    }).catch(err => {
                                        console.log('messagesFunctions:updateMessage => ERROR fetching conversation', err);
                                        console.log('messagesFunctions:updateMessage => ERROR req', req);
                                        reject({
                                            status: 500,
                                            error: true,
                                            reason: "messagesFunctions:updateMessage => ERROR fetching conversation",
                                            request: req,
                                            tempId: req.body.tempId
                                        });
                                        return;
                                    })
                                // }
                            })
                            .catch(err => {
                                console.log('messagesFunctions:updateMessage => ERROR updating message', err);
                                console.log('messagesFunctions:updateMessage => ERROR req', req);
                                reject({
                                    status: 500,
                                    error: true,
                                    reason: "messagesFunctions:updateMessage => ERROR updating message",
                                    request: req,
                                    tempId: req.body.tempId
                                });
                                return;
                            })
                    } else {
                        console.log('messagesFunctions:updateMessage => WARN already updated');
                        console.log('messagesFunctions:updateMessage => WARN already updated', req);
                        reject({
                            status: 200,
                            error: false,
                            reason: "messagesFunctions:updateMessage => WARN already updated",
                            request: req,
                            tempId: req.body.tempId
                        });
                        return;
                    }
                }).catch(error => {
                    console.log('messagesFunctions:updateMessage => ERROR Cannot find message', error);
                    console.log('messagesFunctions:updateMessage => ERROR req', req);
                    reject({
                        status: 404,
                        error: true,
                        reason: "messagesFunctions:updateMessage => ERROR Cannot find message",
                        request: req,
                        tempId: req.body.tempId
                    });
                    return;
                });
        });
    },

    insertReaction: (req, currentObj) => {
        if (req.body.reaction) {
            let updated = false;
            let reaction = { "userId": parseInt(req.headers.userid), "reaction": req.body.reaction };
            currentObj['reactions'].forEach((part, index, object) => {
                if (part['userId'] === parseInt(req.headers.userid)) {
                    if (req.body.reaction == 'remove') {
                        object.splice(index, 1);
                    } else {
                        part.reaction = req.body.reaction
                    }
                    updated = true
                }
            })
            if (!updated) {
                currentObj['reactions'].push(reaction);
            }
            return currentObj['reactions']
        }
    },

    insertRead: (req, currentObj) => {
        let updated = false;
        currentObj['read'].forEach((part, index) => {
            if (part === parseInt(req.headers.userid)) {
                updated = true
            }
        })
        if (!updated) {
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
        currentObj.delivered.forEach((part, index) => {
            if (part === parseInt(req.headers.userid)) {
                updated = true
            }
        })
        if (!updated) {
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

    deleteMessage: (msgId) => {
        return new Promise((resolve, reject) => {
            mongoSvc.getDbClient()
                .then(db => {
                    messagesModel.getOne(db, msgId)
                        .then(message => {
                            // archivesModel.insert(message); // It's ok if that one update failed
                            const updateObj = { msg: '<p style="color:grey"><i>This thread was deleted</i></p>', metaMsg: { deleted: true }, msgPlainText: "This thread was deleted", links: [], mentions: [] }
                            messagesModel.update(db, msgId, updateObj)
                                .then(msgResp => {
                                    console.log("Message deleted")
                                    let delta = { type: "messenger.delete_message", workspace: message.workspaceId, data: { msgids: [msgId], convid: message.convId } }
                                    resolve(delta);
                                    return;
                                    // notificationService.push(req.db, message.convId, req.headers.userid, "UpdateMessage", [msgId], delta)
                                    // res.status(200).send({ error: false, message: "Success", result: msgResp, status_code: 100 })
                                }).catch(err => {
                                    console.log("Error deleting message", err)
                                    reject(false);
                                    return;
                                    // res.status(500).send({ error: true, message: "Error deleting message", result: err, status_code: 160 })
                                })
                        });
                })
                .catch(err => {
                    console.log('Unable to connect to db');
                    reject(err);
                    return;
                })
        });
    },
}

module.exports = { messagesFunctions }