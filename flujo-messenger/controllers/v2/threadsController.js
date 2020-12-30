global.fetch = require('node-fetch');
const { threadsModel } = require('../../models/threadsModel');
const { conversationsModel } = require('../../models/conversationsModel');
const { messagesModel } = require('../../models/messagesModel')
const { notificationService } = require('../../services/notificationService');
const { mongoSvc } = require('../../services/mongoSvc');
const { messagesFunctions } = require('../v1/messagesFunctions');
const { notificationSvc } = require('../../services/notificationSvc');



const threadsController = {

    createThread: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else if (!(req.body.msgs && req.body.convId)) {
            res.status(400).send({ error: true, message: "Expects msgs and convId in the body", status_code: 101 })
        } else {
            try {
                let userData = req.user_info;
                let userid = userData.id;
                let workspaceid = userData.workspaces[0].id;
                let threadObj = {
                    "owner": parseInt(userid),
                    "msgs": [req.body.msgs],
                    "convId": req.body.convId,
                    "workspaceId": parseInt(workspaceid)
                }
                threadsModel.insert(req.db, threadObj)
                    .then(thread => {
                        threadsController.updateConversation(req, String(thread.ops[0]._id)).then(resp => {
                            threadsController.updateMessage(req, String(thread.ops[0]._id), req.body.msgs, req.body.convId, userData).then(resp => {
                                res.status(200).send({ error: false, message: "Success", result: thread.ops[0], status_code: 100 })
                            }).catch(error => {
                                console.log(error)
                                res.status(500).send({ error: true, message: "Error updating message", status_code: 160 })
                            })

                        }).catch(error => {
                            res.status(500).send({ error: true, message: "Error creating thread", result: error, status_code: 160 })
                            console.log("Could not create thread");
                        })
                    }).catch(errors => {
                        console.log("Error creating thread")
                        console.log(errors)
                        res.status(500).send({ error: true, message: "Error creating thread", result: errors, status_code: 160 })
                    })
            } catch (e) {
                console.log("Error: Badly formed thread object")
                res.status(400).send({ error: true, message: "Malformed thread object", result: e, status_code: 160 })

            }

        }

    },
    getThread: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else {
            let userData = req.user_info;
            let userid = userData.id;
            let workspaceid = userData.workspaces[0].id;
            var db_obj = {
                workspaceId: parseInt(workspaceid),
                threadId: req.params.threadid
            };
            var offset = (req.query.offset) ? req.query.offset : 0;
            var limit = (req.query.limit) ? req.query.limit : 50;
            threadsModel.getOne(req.db, req.params.threadid)
                .then(msgResp => {
                    db_obj.convId = msgResp.convId
                    if (msgResp == null) {
                        res.status(404).send({ error: true, message: "Error, thread not found", result: null, status_code: 160 })
                    } else {
                        messagesModel.getAll(req.db, db_obj, parseInt(offset), parseInt(limit))
                            .then(messages => {
                                msgResp.messages = messages;
                                if (messages.length === 0) {
                                    res.status(404).send({ error: true, message: "Error, thread has no messages", result: null, status_code: 160 })
                                } else {
                                    threadsController.getFirstMessage(msgResp)
                                        .then(thread => {
                                            res.status(200).send({ error: false, message: "Success", result: thread, status_code: 100 })
                                        })
                                        .catch(err => {
                                            res.status(err.status).send(err);
                                        });
                                }
                            }).catch(err => {
                                console.log('Huston we have a problem getting messages from the db in threads v2', err)
                                res.status(500).send({ error: true, message: "Error getting messages", result: null, status_code: 160 })
                            })
                    }
                }).catch(err => {
                    console.log("Error obtaining thread", err)
                    res.status(500).send({ error: true, message: "Error obtaining thread", status_code: 160 })
                })
        }

    },

    updateConversation: (req, threadId) => {
        return new Promise(async (resolve, reject) => {
            conversationsModel.getOne(req.db, req.body.convId).then(conversation => {
                let updateObj = {};
                updateObj.threads = conversation.threads;
                updateObj.threads.push(threadId);
                conversationsModel.update(req.db, req.body.convId, updateObj).then(resp => {
                    resolve(resp);
                    return;
                }).catch(error => {
                    reject(error);
                    return;
                });
            }).catch(error => {
                console.log("Conversation not found!")
                reject(error);
                return;
            });
        });
    },

    deleteFromConversation: (req, threadId, convId) => {
        return new Promise(async (resolve, reject) => {
            conversationsModel.getOne(req.db, convId).then(conversation => {
                let updateObj = {};
                updateObj.threads = conversation.threads;
                updateObj.threads = updateObj.threads.filter(item => item !== threadId)
                conversationsModel.update(req.db, convId, updateObj).then(resp => {
                    resolve(resp);
                    return;
                }).catch(error => {
                    reject(error);
                    return;
                });
            }).catch(error => {
                console.log("Conversation not found!")
                reject(error);
                return;
            });
        });
    },

    updateMessage: (req, threadId, msgId, convId, userData) => {
        return new Promise(async (resolve, reject) => {
            let updateObj = {};
            updateObj.threadId = threadId;
            messagesModel.update(req.db, msgId, updateObj)
                .then(message => {
                    // console.log("Successfully updated message")
                    let delta = { type: "messenger.update_message", workspace: userData.workspaces[0].id, data: { messageid: msgId, convid: convId, update: updateObj } }
                    notificationService.push(req.db, convId, req.headers.userid, "UpdateMessage", msgId, delta)
                    resolve(true);
                    return;
                });
        });
    },

    // deleteFromConversation: (req, threadId, convId) => {
    //     return new Promise(async (resolve, reject) => {
    //         conversationsModel.getOne(req.db, convId).then(conversation => {
    //             let updateObj = {};
    //             let index = -1;
    //             let i = 0
    //             while (i < conversation.threads.length) {
    //                 if (threadId == conversation.threads[i]) {
    //                     index = i;
    //                 }
    //                 i = i + 1;
    //             }
    //             if (index > -1) {
    //                 conversation.threads.splice(index, 1);
    //             }
    //             updateObj.threads = conversation.threads;
    //             conversationsModel.update(req.db, convId, updateObj).then(resp => {
    //                 resolve(resp);
    //             }).catch(error => {
    //                 console.log(error)
    //                 reject(error);
    //             });
    //         }).catch(error => {
    //             console.log("Conversation not found!")
    //             reject(error)
    //         });
    //     });
    // },

    getFirstMessage: (thread) => {
        return new Promise(async (resolve, reject) => {
            if (thread.msgs.length < 1) {
                reject({ error: true, reason: "Thread does not have a first message.", status: 404 });
                return;
            }
            mongoSvc.getDbClient()
                .then(db => {
                    messagesModel.getOne(db, thread.msgs[0])
                        .then(message => {
                            // console.log(message.ops);
                            if (message === undefined) {
                                reject({
                                    error: true,
                                    reason: "Message that initiated the thread was not found.", status: 404
                                });
                                return;
                            }
                            thread.firstMessageObj = message;
                            resolve(thread);
                            return;
                        }).catch(error => {
                            console.log("Looks like getting the first message was fucked, here are the bloody logs : ", error)
                            reject({ error: true, reason: "Internal server error.", status: 500 });
                            return;
                        })
                })
                .catch(err => {
                    console.log('Could not make db connection', err)
                    reject({ error: true, reason: "Internal server error.", status: 500 });
                    return;
                })
        });
    },

    unthreadMessage: (messageid) => {
        return new Promise((resolve, reject) => {
            console.log('First message: ', messageid);
            const updateObj = {
                threadId: null
            };
            messagesModel.update('db', messageid, updateObj)
                .then(() => {
                    resolve();
                })
                .catch(error => {
                    console.log('threadsController2:unthreadMessage => ERROR Unable to update first message', error);
                    reject('threadsController2:unthreadMessage => ERROR Unable to update first message');
                })


        });
    },

    sendDeltasToConversationMembers: (convId, conversation = null, delta) => {
        if (conversation) {
            let users = conversation.members;
            users.forEach(user => {
                delta.user = String(user);
                console.log('threadsController2:sendDeltasToConversationMembers => delta ', delta)
                notificationSvc.notifyUser(delta);
            });
            return;
        } else {
            conversationsModel.getOne('db', convId)
                .then(conversation => {
                    if (conversation) {
                        let users = conversation.members;
                        users.forEach(user => {
                            delta.user = String(user);
                            console.log('threadsController2:sendDeltasToConversationMembers => delta ', delta)
                            notificationSvc.notifyUser(delta);
                        });
                        return;
                    } else {
                        console.log('threadsController2:sendDeltasToConversationMembers => ERROR conversation not found');
                    }

                })
                .catch(error => {
                    console.log('threadsController2:sendDeltasToConversationMembers => ERROR finding conversation ', error);
                });
        }
    },

    deleteThread: (req, res) => {
        threadsModel.getOne(req.db, req.params.threadid)
            .then(thread => {
                if (thread) {
                    if (String(thread.owner) === String(req.headers.userid)) {
                        threadsController.unthreadMessage(thread.msgs[0])
                            .then(() => {
                                const find = {
                                    threadId: req.params.threadid
                                }
                                messagesModel.getAll(req.db, find, 0, 1000)
                                    .then(messages => {
                                        messages.forEach(message => {
                                            messagesFunctions.deleteMessage(message._id)
                                                .then(delta => {
                                                    threadsController.sendDeltasToConversationMembers(thread.convId, null, delta);
                                                }).catch(err => {
                                                    console.log('Could not delete', message._id);
                                                })
                                        });
                                        threadsController.deleteFromConversation(req, req.params.threadid, thread.convId)
                                            .then(whatever => {
                                                let delta = {
                                                    type: "messenger.delete_thread",
                                                    workspace: thread.workspaceId,
                                                    data: {
                                                        thread: req.params.threadid,
                                                        convId: thread.convId
                                                    }
                                                }
                                                threadsController.sendDeltasToConversationMembers(thread.convId, null, delta);
                                                // notificationService
                                                //     .push(req.db, messages[0].convId, userid, "UpdateMessage", messages[0]._id, delta)
                                                res.status(200).send({
                                                    message: "Success", error: false, status_code: 100
                                                });
                                            })
                                            .catch(err => {
                                                console.log(err);
                                                res.status(500).send({
                                                    message: "Could not update conversation", error: true, status_code: 100
                                                });
                                            })
                                    })
                                    .catch(err => {
                                        console.log('Unable to fetch messages', err)
                                        res.status(500).send({
                                            error: true, message: "Unable to fetch messages", status_code: 100
                                        })
                                    });
                            })
                            .catch(error => {
                                console.log('threadsController2:deleteThread => ERROR Failed to unthread message', error);
                                res.status(500).send({
                                    error: true, message: "Failed to unthread message"
                                });
                                return;
                            });
                    } else {
                        console.log('threadsController2:deleteThread => ERROR Delete attempt denied. No access');
                        res.status(403).send({
                            error: true, message: "Access denied"
                        });
                        return;
                    }
                } else {
                    console.log('threadsController2:deleteThread => ERROR Thread not found');
                    res.status(404).send({
                        error: true, message: "Thread not found"
                    });
                    return;
                }
            })
            .catch(error => {
                console.log('threadsController2:deleteThread => ERROR Unable to obtain thread', error);
                res.status(500).send({
                    error: true, message: "Unable to fetch thread"
                });
                return;
            });


        // if (false) {
        //     // Reject if guy doesn't own the thread
        // }
        // else {
        //     let userData = req.user_info;
        //     let userid = userData.id;
        //     let workspaceid = userData.workspaces[0].id;
        //     let db_obj = {
        //         workspaceId: parseInt(workspaceid),
        //         threadId: req.params.threadid
        //     };
        //     var offset = (req.query.offset) ? req.query.offset : 0;
        //     var limit = (req.query.limit) ? req.query.limit : 1000;
        // messagesModel.getAll(req.db, db_obj, parseInt(offset), parseInt(limit))
        //     .then(messages => {
        //         // console.log('All the messages', messages);
        //         messages.forEach(message => {
        //             messagesFunctions.deleteMessage(message._id)
        //                 .then(delta => {
        //                     notificationService
        //                         .push(req.db, message.convId, userid, "UpdateMessage", message._id, delta)
        //                 }).catch(err => {
        //                     console.log('Could not delete', message._id);
        //                 })
        //         });
        //         threadsController.deleteFromConversation(req, req.params.threadid, messages[0].convId)
        //             .then(whatever => {
        //                 let delta = {
        //                     type: "messenger.delete_thread",
        //                     workspace: messages[0].workspaceId,
        //                     data: {
        //                         thread: req.params.threadid,
        //                         convId: messages[0].convId
        //                     }
        //                 }
        //                 notificationService
        //                     .push(req.db, messages[0].convId, userid, "UpdateMessage", messages[0]._id, delta)
        //                 res.status(200).send({
        //                     message: "Success", error: false, status_code: 100
        //                 });
        //             })
        //             .catch(err => {
        //                 console.log(err);
        //                 res.status(500).send({
        //                     message: "Could not update conversation", error: true, status_code: 100
        //                 });
        //             })
        //     })
        //     .catch(err => {
        //         console.log('Unable to fetch messages', err)
        //         res.status(500).send({
        //             error: true, message: "Unable to fetch messages", status_code: 100
        //         })
        //     });

        // }

    },

}

module.exports = { threadsController };