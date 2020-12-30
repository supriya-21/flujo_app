global.fetch = require('node-fetch');
const { threadsModel } = require('../../models/threadsModel');
const { conversationsModel } = require('../../models/conversationsModel');
const { messagesModel } = require('../../models/messagesModel')


const threadsController = {
    createThread: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
        } else if (!(req.body.msgs && req.body.convId)) {
            res.status(400).send({ error: true, message: "Expects msgs and convId in the body", status_code: 101 })
        } else {
            let userData = req.user_info;
            let userid = userData.id;
            let workspaceid = userData.workspaces[0].id;
            try {
                let threadObj = {
                    "owner": parseInt(userid),
                    "msgs": [req.body.msgs],
                    "convId": req.body.convId,
                    "workspaceId": parseInt(workspaceid)
                }
                threadsModel.insert(req.db, threadObj)
                    .then(thread => {
                        console.log("Thread created with id ", thread.ops[0]._id);
                        threadsController.updateConversation(req, String(thread.ops[0]._id)).then(resp => {
                            console.log("Successfully created thread and attached to conversation")
                            res.status(200).send({ error: false, message: "Success", result: thread, status_code: 100 })
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

    deleteThread: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else {
            threadsModel.getOne(req.db, req.params.threadid)
                .then(thread => {
                    console.log("Successfully obtained thread object", thread.msgs)
                    messagesModel.deleteMany(req.db, thread.msgs)
                        .then(deleteMsgResp => {
                            console.log("Successfully deleted messages of thread")
                            threadsController.deleteFromConversation(req, req.params.threadid, thread.convId).then(updateConversationResp => {
                                threadsModel.deleteOne(req.db, req.params.threadid)
                                    .then(threadDeleteResponse => {
                                        console.log("Successfully deleted thread object")
                                        res.status(200).send({ error: false, message: "Success", result: threadDeleteResponse, status_code: 100 })
                                    }).catch(err => {
                                        console.log("Error deleting thread", err)
                                        res.status(500).send({ error: true, message: "Error deleting thread", result: null, status_code: 160 })
                                    })
                            }).catch(err => {
                                console.log("Error removing thread from conversation", err)
                                res.status(500).send({ error: true, message: "Error removing thread from conversation", result: null, status_code: 160 })
                            })
                        }).catch(err => {
                            console.log("Error deleting messages in thread")
                            res.status(500).send({ error: true, message: "Error deleting messages in thread", result: err, status_code: 160 })
                        })
                }).catch(err => {
                    console.log("Error obtaining thread")
                    res.status(500).send({ error: true, message: "Error obtaining thread for delete", result: err, status_code: 160 })
                })
        }

    },

    getThread: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else {
            threadsModel.getOne(req.db, req.params.threadid)
                .then(msgResp => {
                    console.log("Successfully obtained thread object")
                    if (msgResp == null) {
                        res.status(404).send({ error: true, message: "Error, thread not found", result: null, status_code: 160 })
                    } else {
                        res.status(200).send({ error: false, message: "Success", result: msgResp, status_code: 100 })
                    }
                }).catch(err => {
                    console.log("Error obtaining thread")
                    res.status(500).send({ error: true, message: "Error obtaining thread", result: err, status_code: 160 })
                })
        }

    },


    updateThread: (req, res) => {
        if (!(req.headers.authorization && req.params.threadid)) {
            res.status(400).send({ error: true, message: "Expected authorization and threadid", status_code: 101 })
        } else if (!(req.body.msgs)) {
            res.status(400).send({ error: true, message: "Expected list of Messages (msgs: ['msgId1',...])", status_code: 101 })
        } else {
            let userData = req.user_info;
            let updateObj = {};
            if (req.body.msgs) { updateObj['msgs'] = req.body.msgs; }
            threadsModel.update(req.db, req.params.threadid, updateObj)
                .then(conversations => {
                    console.log("Successfully updated thread")
                    res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
                }).catch(err => {
                    console.log("Error while updating thread", err)
                    res.status(500).send({ error: true, message: "Error while updating thread", result: err, status_code: 160 })
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
                let index = -1;
                let i = 0
                while (i < conversation.threads.length) {
                    if (threadId == conversation.threads[i]) {
                        index = i;
                    }
                    i = i + 1;
                }
                if (index > -1) {
                    conversation.threads.splice(index, 1);
                }
                updateObj.threads = conversation.threads;
                conversationsModel.update(req.db, convId, updateObj).then(resp => {
                    resolve(resp);
                    return;
                }).catch(error => {
                    console.log(error)
                    reject(error);
                    return;
                });
            }).catch(error => {
                console.log("Conversation not found!")
                reject(error)
                return;
            });
        });
    },
}

module.exports = { threadsController };