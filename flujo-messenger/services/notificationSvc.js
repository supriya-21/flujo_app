const { deltasModel } = require('../models/deltasModel');
const { usersModel } = require('../models/usersModel')

const { messagesFunctions } = require('../controllers/v1/messagesFunctions');
const { conversationsFunctions } = require('../controllers/v1/conversationsFunctions');
const { presenceManager, typingManager } = require('./presenceAndTypingSvc')
const { socketSvc } = require('./socketSvc');

const sha1 = require('sha1');
const axios = require('axios');


const notificationSvc = {
    subscriptionHandler: (socket) => {
        socket.on("messenger.deltas?", query => {
            console.log(`notificationSvc:socketManager => User: ${socket.user} of Workspace: ${socket.workspace} asks messenger.deltas?`);
            console.log('notificationSvc:socketManager => socketVersion', socket.socketVersion);
            if (query.socketVersion === 2) {
                notificationSvc.getDeltasBundled(query.query, socket);
            } else {
                notificationSvc.getDeltas(query.query, socket)
            }
        });

        socket.on("messenger.set_presence", delta => {
            if (socket.authenticated) {
                presenceManager.setPresence(socket.user, socket.workspace, delta.presence)
            }
        })

        socket.on("messenger.get_presence", body => {
            if (socket.authenticated) {
                presenceManager.getPresenceOfUser(body.user, socket)
            }
        })

        socket.on("messenger.set_typing", body => {
            if (socket.authenticated) {
                typingManager.setStatusOfConversation(body.conv, body.user)
            }
        })

        socket.on("messenger.get_typing", body => {
            if (socket.authenticated) {
                typingManager.getStatusOfConversation(body.conv, socket)
            }
        })

        socket.on("messenger.get.api-v1-messages?", req => {
            if (socket.authenticated) {
                console.log(`notificationSvc:subscriptionHandler:getMessages => REQ user: ${socket.user} workspace: ${socket.workspace} socket: ${socket.id}`)
                if (!req.req.headers) {
                    req.req.headers = {}
                }
                req.req.headers.userid = socket.user
                req.req.headers.workspaceid = socket.workspace
                messagesFunctions.getMessages(req.req)
                    .then(resp => {
                        socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, resp)
                    })
                    .catch(resp => {
                        socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, resp)
                    })
                    .finally(() => {
                        // All this is under the assumption that messenger.get.api-v1-messages? gets 
                        // called only when a device logs in, which need not be true.
                        // However, I am too lazy at the moment to find a more appropriate place for this
                        // Someday, when you read this again, fix it. 
                        // Send it only once after the user has logged in.
                        let delta = {};
                        delta.user = String(socket.user);
                        delta.workspace = String(socket.workspace);
                        delta.type = "flujo.new_login";
                        delta.data = { status: 'loggedin' };
                        delta.event_ts = Date.now();
                        delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13);
                        socket.emit('flujo.delta', delta);
                    })
            } else {
                console.log('notificationSvc:subscriptionHandler:getMessages => ERROR ', `user ${socket.id} not authenticated`)
                socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, {
                    error: true,
                    message: "Socket not authenticated",
                    result: "notificationSvc:subscriptionHandler:getMessages => ERROR ",
                    status_code: 160, status: 403
                });
            }
        })

        socket.on("messenger.get.api-v1-message?", req => {
            if (socket.authenticated) {
                console.log(`notificationSvc:subscriptionHandler:getMessage => REQ user: ${socket.user} workspace: ${socket.workspace} socket: ${socket.id}`)
                if (!req.req.headers) {
                    req.req.headers = {}
                }
                req.req.headers.userid = socket.user
                req.req.headers.workspaceid = socket.workspace
                messagesFunctions.getMessage(req.req)
                    .then(resp => {
                        socket.emit('messenger.get.api-v1-message.' + req.params.msgid, resp)
                    }).catch(resp => {
                        socket.emit('messenger.get.api-v1-messages.' + req.params.msgid, resp)
                    })
            }
        })

        socket.on("messenger.get.api-v1-conversations?", req => {
            if (socket.authenticated) {
                if (!req.req.headers) {
                    req.req.headers = {}
                }
                req.req.headers.userid = socket.user
                req.req.headers.workspaceid = socket.workspace
                console.log("notificationSvc:socketManager => Use bot auth for this to work🤓")
                // req.req.headers.authorization = "botauth" // Take care of this please. This can only work on testing
                conversationsFunctions.getConversations(req.req).then(resp => {
                    socket.emit('messenger.get.api-v1-conversations', resp)
                }).catch(resp => {
                    socket.emit('messenger.get.api-v1-conversations', resp)
                })
            }
        })

        socket.on("messenger.post.api-v1-messages", req => {
            if (socket.authenticated) {
                console.log(`notificationSvc:subscriptionHandler:postMessages => REQ user: ${socket.user} workspace: ${socket.workspace} socket: ${socket.id}`)
                if (!req.req.headers) {
                    req.req.headers = {}
                }
                req.req.headers.userid = socket.user
                req.req.headers.workspaceid = socket.workspace
                messagesFunctions.postMessage(req.req)
                    .then(delta => {
                        delta.user = String(socket.user)
                        delta.event_ts = Date.now()
                        delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
                        socket.emit("messenger.post.api-v1-messages", {
                            tempId: req.req.body.tempId,
                            delta: delta,
                            status: 200,
                            error: false
                        })
                        let users = delta.users;
                        users.forEach(user => {
                            delta.user = String(user);
                            notificationSvc.notifyUser(delta);
                        });
                        // I am hoping that this is a solid idea. God save us all when it finally breaks
                        const index = users.indexOf(delta.data.from);
                        if (index > -1) {
                            users.splice(index, 1);
                        }
                        notificationSvc.pushFCM(users, socket.workspace);
                    })
                    .catch(resp => {
                        console.log("notificationSvc:subscriptionHandler:postMessage => Failed to write message", resp)
                        socket.emit("messenger.post.api-v1-messages", resp);
                    });
            } else {
                console.log('notificationSvc:subscriptionHandler:postMessages => ERROR ', `user ${socket.id} not authenticated`);
                console.log('notificationSvc:subscriptionHandler:postMessages => ERROR req', req);
                socket.emit("messenger.post.api-v1-messages",
                    {
                        tempId: req.req.body.tempId,
                        status: 403,
                        error: true,
                        reason: "Socket not authenticated"
                    })
            }
        });

        socket.on("messenger.put.api-v1-messages", req => {
            if (socket.authenticated) {
                console.log(`notificationSvc:subscriptionHandler:updateMessages => REQ user: ${socket.user} workspace: ${socket.workspace} socket: ${socket.id}`)
                if (!req.req.headers) {
                    req.req.headers = {}
                }
                req.req.headers.userid = socket.user
                req.req.headers.workspaceid = socket.workspace
                messagesFunctions.updateMessage(req.req)
                    .then(delta => {
                        if (('tempId' in delta.data) && (req.req.body.tempId !== delta.data.tempId)) {
                            console.log('notificationSvc:subscriptionHandler:updateMessages => FUCK ALL ERROR');
                            console.log('notificationSvc:subscriptionHandler:updateMessages => FUCK ALL ERROR socket', socket);
                            console.log('notificationSvc:subscriptionHandler:updateMessages => FUCK ALL ERROR tempId', req.req.body.tempId);
                            console.log('notificationSvc:subscriptionHandler:updateMessages => FUCK ALL ERROR delta', delta);
                        } else {
                            const users = delta.to;
                            users.forEach(user => {
                                delta.user = String(user);
                                notificationSvc.notifyUser(delta);
                            });
                            // I am hoping that this is a solid idea. God save us all when it finally breaks
                            socket.emit("messenger.put.api-v1-messages", { tempId: req.req.body.tempId, status: 200, error: false })
                        }
                    })
                    .catch(resp => {
                        console.log("notificationSvc:subscriptionHandler:updateMessages => ERROR", resp);
                        socket.emit("messenger.put.api-v1-messages", resp);
                        socket.emit('flujo.socket-error', resp);
                    })
            } else {
                console.log("notificationSvc:subscriptionHandler:updateMessage => ERROR: Unauthorised");
                console.log("notificationSvc:subscriptionHandler:updateMessage => ERROR req", req);
                socket.emit("messenger.put.api-v1-messages", {
                    tempId: req.req.body.tempId,
                    status: 403, error: true,
                    reason: "Token is invalid, current socket in not authorised"
                });
                socket.emit('flujo.socket-error', {
                    status: 403, error: true, reason: "Token is invalid, current socket in not authorised"
                });
            }
        });
    },
    newSocket: (socket) => {
        socketSvc.authenticateSocket(socket)
            .then(resp => {
                socket.authenticated = resp.status;
                if (resp.status) {
                    console.log('notificationSvc:newSocket => socketVersion', socket.socketVersion)
                    if (socket.socketVersion === 2) {
                        notificationSvc.getDeltasBundled(resp.data.query, socket);
                    } else {
                        notificationSvc.getDeltas(resp.data.query, socket);
                    }
                }
            });
        notificationSvc.subscriptionHandler(socket);
        socket.on('disconnect', () => {
            console.log("notificationSvc:newSocket => Socket disconnected: ", socket.id);
        })
    },

    getDeltas: async (query, socket) => {
        console.log("notificationSvc:getDeltas => Query: ", query)
        if (query) {
            if (!query.timestamp) {
                console.log("notificationSvc:getDeltas => WARN ", "Bad request. No timestamp");
            } else {
                deltasModel.getAllDeltas(socket.user, socket.workspace, query.timestamp)
                    .then(resp => {
                        resp.forEach(delta => {
                            socket.emit('flujo.delta', delta)
                        });
                    })
                    .catch(error => {
                        console.log("notificationSvc:getDeltas => ERROR ", error);
                    })
            }
        }
    },

    getDeltasBundled: async (query, socket) => {
        console.log("notificationSvc:getDeltasBundled => Query: ", query);
        if (query) {
            if (!query.timestamp) {
                console.log("notificationSvc:getDeltasBundled => WARN ", "Bad request. No timestamp");
            } else {
                deltasModel.getAllDeltas(socket.user, socket.workspace, query.timestamp)
                    .then(deltas => {
                        socket.emit('flujo.bundled_deltas', deltas);
                    })
                    .catch(error => {
                        console.log("notificationSvc:getDeltasBundled => ERROR ", error);
                    })
            }
        }
    },

    notifyUser: async (delta) => {
        if ((!delta.user) || (!delta.workspace) || (!delta.type) || (!delta.data)) {
            console.log("notificationSvc:notifyUser => Need user, workspace, type and data in delta", delta);
            return;
        }
        let deltaU = JSON.parse(JSON.stringify(delta));
        deltaU.event_ts = Date.now();
        deltaU.createdAt = new Date();
        deltaU.event_id = sha1(JSON.stringify(deltaU)).slice(0, 13);
        delta.event_id = deltaU.event_id;

        if (deltaU.relevance !== 'Immediate') {    // Immediate are deltas that need not be saved
            try {
                deltasModel.insert(deltaU)
                    .then(msgResp => {
                    }).catch(err => {
                        console.log("notificationSvc:notifyUser => Could not save delta on db 1", err)
                    });
            } catch (error) {
                console.log("notificationSvc:notifyUser => Could not save delta on db 2", error)
            }
        }
        // console.log('notificationSvc:notifyUser => DELTA: ', deltaU)
        socketSvc.postDelta(deltaU);
    },

    getDeltasAPIController: (req, res) => {
        if (!req.query.offset) {
            req.query.offset = 0
        }
        if (!req.query.limit) {
            req.query.limit = 50
        }
        if (!req.query.timestamp) {
            console.log("notificationSvc:getDeltasAPIController => ", "Bad request")
            res.status(400).send({ error: true, message: 'Need timestamp as a query parameter' });
            return;
            // Return 400
        } else {
            deltasModel.getAllDeltas(req.headers.userid, req.headers.workspaceid, req.query.timestamp, req.query.offset, req.query.limit)
                .then(resp => {
                    res.status(200).send({ deltas: resp, error: false });
                    return;
                })
                .catch(err => {
                    console.log("notificationSvc:getDeltasAPIController => ERROR", err);
                    res.status(500).send({ error: true, message: 'notificationSvc:getDeltasAPIController => ERROR' });
                    return;
                })
        }
    },

    pushFCM: (users, workspace) => {
        const FCM_URL = process.env.FCM_URL;
        const FCM_KEY = process.env.FCM_KEY;
        const instance = axios.create({
            timeout: 1000,
            headers: { 'Authorization': 'key=' + FCM_KEY }
        });
        let fcmKeys = [];
        fcmKeys = users.map(user => {
            return notificationSvc.getUserKey(user, workspace);
        })
        var result = Promise.all(fcmKeys);
        result
            .then(idsResp => {
                // This is giving me a headache. Future visitor, if you find this, please fix it.
                // I don't even know what's wrong, but I have a bad feeling about this.
                // console.log('FCM => ', result, 'registrationIds')
                var success = [];
                var fail = [];
                var i = 0;
                do {
                    if (idsResp[i].status) {
                        success = [...success, ...idsResp[i].keys]
                        i++;
                    } else {
                        fail = [...fail, idsResp[i]]
                        i++;
                    }
                } while (i < idsResp.length) {
                    setTimeout(() => {
                        instance.post(FCM_URL, {
                            "registration_ids": success,
                            "content_available": true,
                            "content-available": 1,
                            // "notification": {
                            //     "title": "FLUJO",
                            //     "body": "You may have new messages"
                            // },
                            // "webpush": {
                            //     "headers": {
                            //         "Urgency": "high"
                            //     }
                            // },
                            "apns": {
                                "headers": {
                                    "apns-priority": 5
                                }
                            },
                            "data":
                            {
                                "title": `MissedDeltas`,
                            }
                        }).then((response) => {
                            // console.log("FCM => Notification successful");
                        }).catch((error) => {
                            // console.log("notificationSvc:pushFCM => ERROR ", error);
                            console.log("notificationSvc:pushFCM => ERROR FCM ids", idsResp);
                            console.log("notificationSvc:pushFCM => ERROR FCM users", users);
                        })
                    }, 5000);
                }
            }).catch(err => {
                console.log('notificationSvc:pushFCM => WARN Most likely unable to resolve keys for all users', err)
            })
    },
    getUserKey: (userId, workspace) => {
        // console.log("FCM => Getting FCM keys for user : ", userId)
        return new Promise(async (resolve, reject) => {
            usersModel.getOne('', parseInt(userId))
                .then(user => {
                    if (user) {
                        if (typeof user.fcmToken != 'undefined' && user.fcmToken.length > 0) {
                            let fcmTokens = [];
                            user.fcmToken.forEach(device => {
                                if (String(device.workspace) === String(workspace)) {
                                    fcmTokens.push(device.device)
                                }
                            })
                            resolve({ user_id: userId, status: true, message: 'Success', keys: fcmTokens });
                            return;
                        } else {
                            console.log("notificationSvc:getUserKey => No FCM keys found");
                            resolve({ user_id: userId, status: false, message: 'No kyes found', keys: '' });
                            return;
                        }
                    } else {
                        console.log("notificationSvc:getUserKey => User not found");
                        resolve({ user_id: userId, status: false, message: 'User not found', keys: '' });
                        return;
                    }
                })
        })
    },

}



module.exports = { notificationSvc }
