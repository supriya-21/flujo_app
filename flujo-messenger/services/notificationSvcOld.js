// // const axios = require('axios');
// const { userVerifyService } = require('./userVerifyService');
// const { deltasModel } = require('../models/deltasModel');
// const { usersModel } = require('../models/usersModel')
// const redis = require('redis');
// const { messagesFunctions } = require('../controllers/v1/messagesFunctions');
// const { conversationsFunctions } = require('../controllers/v1/conversationsFunctions')
// const sha1 = require('sha1');
// const axios = require('axios');


// const { presenceManager, typingManager } = require('./presenceAndTypingSvc')

// redisClient = redis.createClient({
//     port: 6379,               // replace with your port
//     host: process.env.REDIS,        // replace with your hostanme or IP address
//     // optional, if using SSL
//     // use `fs.readFile[Sync]` or another
//     // TO DO: Add authentication.
// })
// redisPublish = redis.createClient({
//     port: 6379,               // replace with your port
//     host: process.env.REDIS,        // replace with your hostanme or IP address
//     // optional, if using SSL
//     // use `fs.readFile[Sync]` or another
//     // TO DO: Add authentication.
// })

// let sockets = new Map();
// const INSTANCE = process.env.INSTANCE

// const notificationSvc = {

//     eventSubscription: (redisSbscbr) => {
//         redisSbscbr.on("message", function (channel, message) {
//             // console.log("Message '" + message + "' on channel '" + channel + "' arrived!")
//             notification = JSON.parse(message)
//             // console.log("notificationSvc:notificationSvc => ", message)
//             notificationSvc.pushDelta(notification.socketid, notification.delta)
//         });
//         redisSbscbr.subscribe(process.env.INSTANCE)
//     },

//     eventPublish: (socketKey, delta) => {
//         let notification = {}
//         notification.socketid = socketKey.socketid;
//         notification.delta = delta
//         // console.log("notificationSvc:notificationSvc => ", notification)
//         redisPublish.publish(socketKey.instance, JSON.stringify(notification))
//     },

//     findDevices: (user, workspace) => {
//         return new Promise((resolve, reject) => {
//             usersModel.getOne("db", parseInt(user))
//                 .then(user => {
//                     //console.log(user, 'user')
//                     if (user) {
//                         if (typeof user.devices != 'undefined' && user.devices.length > 0) {
//                             // console.log("notificationSvc:notificationSvc => user found for devices")
//                             let devicesList = [];
//                             user.devices.forEach(device => {
//                                 if (String(device.workspace) === String(workspace)) {
//                                     devicesList.push(device.device)
//                                 }
//                             })
//                             devicesList.push('device');
//                             // Write a check to remove duplicates
//                             // console.log("notificationSvc:notificationSvc => Devicesfor user " + user.userId + ": ", devicesList)
//                             resolve(devicesList)
//                             // resolve({ user_id: userId, status: true, message: 'Success', key: user.fcmKeys[0] });
//                         } else {
//                             console.log("notificationSvc:notificationSvc => No devices in db")
//                             resolve(['device']);
//                         }
//                     } else {
//                         console.log("notificationSvc:notificationSvc => User not found")
//                         resolve(['device']);
//                     }
//                 })
//             // resolve(['device'])  //This should look at the db to list all devices and return it
//         })
//     },

//     notifyUser: (user, workspace, delta) => {
//         // Find all devices
//         // Save delta on mongo with TTL of 4 or 5 days
//         if (delta.relevance !== 'Immediate') {
//             try {
//                 const deltaU = JSON.parse(JSON.stringify(delta))
//                 // console.log("notificationSvc => ", deltaU)
//                 deltasModel.insert(deltaU)
//                     .then(msgResp => {
//                         // console.log('notificationSvc:notifyUser => Successfully insert delta')
//                     }).catch(err => {
//                         console.log("notificationSvc:notifyUser => Could not save delta on db 1", err)
//                     })
//             } catch (error) {
//                 console.log("notificationSvc:notifyUser => Could not save delta on db 2", error)
//             }
//         }
//         notificationSvc.findDevices(user, workspace).then(devices => {
//             // console.log("notificationSvc:notifyUser => devices list : ", devices)
//             devices.forEach(device => {
//                 let socketKey = process.env.ORIGIN + `-MsgrSckt:${user}:${workspace}:${device}`
//                 redisClient.get(socketKey, (error, result) => {
//                     if (result) {
//                         console.log("notificationSvc:notificationSvc => ", "Found live socket on instace: ", result, " for user:  ", socketKey);
//                         notificationSvc.eventPublish(JSON.parse(result), delta)
//                     } else {
//                         // console.log("notificationSvc:notificationSvc => ", "No live socket for ", user, workspace)
//                     }
//                     // Notify also via FCM
//                 })
//             })
//         })
//     },

//     pushDelta: (socketid, delta) => {
//         // get device ids and all sockets/fcm keys and push notifs
//         // Check redis for available sockets
//         // Publish sockid, delta to required channel
//         let socket = sockets.get(socketid)
//         if (socket) {
//             console.log("notificationSvc:notificationSvc => Pushing delta: ", delta, "via socket : ", socketid);
//             socket.emit('flujo.delta', delta)
//         } else {
//             console.log(`notificationSvc:notificationSvc => Socket not found: ${socketid}`)
//         }
//     },

//     getDeltas: (query, socket) => {
//         console.log("notificationSvc:notificationSvc => ", query)
//         if (query) {
//             // if (!query.offset) {
//             //     query.offset = 0
//             // }
//             // if (!query.limit) {
//             //     query.limit = 50
//             // }
//             if (!query.timestamp) {
//                 console.log("notificationSvc:notificationSvc => ", "Bad request")
//                 // Return 400
//             } else {
//                 try {
//                     deltasModel.getAllDeltas(socket.user, socket.workspace, query.timestamp).then(resp => {
//                         // console.log("notificationSvc:notificationSvc => ", resp)
//                         resp.forEach(delta => {
//                             socket.emit('flujo.delta', delta)
//                         })
//                     })
//                 } catch (error) {
//                     console.log("notificationSvc:notificationSvc => ", error)
//                     // Return 500
//                 }
//             }
//         }
//     },

//     getDeltasAPIController: (req, res) => {
//         if (!req.query.offset) {
//             req.query.offset = 0
//         }
//         if (!req.query.limit) {
//             req.query.limit = 50
//         }
//         if (!req.query.timestamp) {
//             console.log("notificationSvc:notificationSvc => ", "Bad request")
//             res.status(400).send({ error: true, message: 'Need timestamp as a query parameter' })
//             // Return 400
//         } else {
//             deltasModel.getAllDeltas(req.headers.userid, req.headers.workspaceid, req.query.timestamp, req.query.offset, req.query.limit)
//                 .then(resp => {
//                     console.log("notificationSvc:notificationSvc => ", resp)
//                     res.status(200).send({ deltas: resp, error: false })
//                     // resp.forEach(delta => {
//                     //     socket.emit('flujo.delta', delta)
//                     // })
//                 })
//                 .catch(err => {
//                     console.log('Error getting deltas', err);
//                     res.status(500).send({ error: true, message: 'Something went wrong getting deltas' })
//                 })
//         }
//     },

//     pushFCM: (users, workspace) => {
//         const FCM_URL = process.env.FCM_URL;
//         const FCM_KEY = process.env.FCM_KEY;
//         const instance = axios.create({
//             timeout: 1000,
//             headers: { 'Authorization': 'key=' + FCM_KEY }
//         });
//         let fcmKeys = [];
//         fcmKeys = users.map(user => {
//             return notificationSvc.getUserKey(user, workspace);
//         })
//         var result = Promise.all(fcmKeys);
//         result
//             .then(idsResp => {
//                 // This is giving me a headache. Future visitor, if you find this, please fix it.
//                 // I don't even know what's wrong, but I have a bad feeling about this.
//                 console.log('FCM => ', result, 'registrationIds')
//                 var success = [];
//                 var fail = [];
//                 var i = 0;
//                 do {
//                     if (idsResp[i].status) {
//                         success = [...success, ...idsResp[i].keys]
//                         i++;
//                     } else {
//                         fail = [...fail, idsResp[i]]
//                         i++;
//                     }
//                 } while (i < idsResp.length) {
//                     setTimeout(() => {
//                         instance.post(FCM_URL, {
//                             "registration_ids": success,
//                             "content_available": true,
//                             "content-available": 1,

//                             // "notification": {
//                             //     "title": "FLUJO",
//                             //     "body": "You may have new messages"
//                             // },
//                             // "webpush": {
//                             //     "headers": {
//                             //         "Urgency": "high"
//                             //     }
//                             // },
//                             "apns": {
//                                 "headers": {
//                                     "apns-priority": 5
//                                 }
//                             },
//                             "data":
//                             {
//                                 "title": `MissedDeltas`,
//                             }
//                         }).then((response) => {
//                             console.log("FCM => Notification successful");
//                         }).catch((error) => {
//                             console.log("FCM => Notification failed");
//                         })
//                     }, 5000);
//                 }
//             }).catch(err => {
//                 console.log('Most likely unable to resolve keys for all users', err)
//             })

//     },
//     getUserKey: (userId, workspace) => {
//         console.log("FCM => Getting FCM keys for user : ", userId)
//         return new Promise(async (resolve, reject) => {
//             usersModel.getOne('', parseInt(userId))
//                 .then(user => {
//                     if (user) {
//                         if (typeof user.fcmToken != 'undefined' && user.fcmToken.length > 0) {
//                             console.log("FCM keys obtained successfully")
//                             let fcmTokens = [];
//                             user.fcmToken.forEach(device => {
//                                 if (String(device.workspace) === String(workspace)) {
//                                     fcmTokens.push(device.device)
//                                 }
//                             })
//                             resolve({ user_id: userId, status: true, message: 'Success', keys: fcmTokens });
//                         } else {
//                             console.log("No FCM keys found")
//                             resolve({ user_id: userId, status: false, message: 'No kyes found', keys: '' });
//                         }
//                     } else {
//                         console.log("FCM => User not found")
//                         resolve({ user_id: userId, status: false, message: 'User not found', keys: '' });
//                     }
//                 })
//         })
//     },

// }



// const socketManager = {
//     socketAuth: (socket) => {
//         return new Promise(async (resolve, reject) => {
//             socket.emit('auth?', { status: "Backend is good, what's your status?" })
//             socket.authStatus = false;
//             // let authStatus = ;
//             await socket.on('auth', async (data) => {
//                 userVerifyService. //This function does not check against user/workspace. Rewrite or add a new function. PLEASE.
//                     isValidUserWithData(data.token, data.user, data.workspace).then(status => {
//                         console.log("notificationSvc:socketManager => Attempting connection with ", data.user, data.workspace)
//                         socket.user = data.user;
//                         socket.workspace = data.workspace;
//                         socket.device = data.device; // Get this info from socket, but created on client during login
//                         socket.socketKey = process.env.ORIGIN + `-MsgrSckt:${socket.user}:${socket.workspace}:${socket.device}`
//                         let socketIdentifier = {}
//                         socketIdentifier.instance = INSTANCE;
//                         socketIdentifier.socketid = socket.id;
//                         console.log("notificationSvc:socketManager => Adding to redis", socket.socketKey, JSON.stringify(socketIdentifier))
//                         // try {
//                         //     redisClient.del(socket.socketKey, () => {
//                         //         console.log("notificationSvc:socketManager => Deleting from redis : ", socket.socketKey)
//                         //     })
//                         // } catch (error) {
//                         //     console.log("notificationSvc:socketManager => ", error)
//                         // }
//                         redisClient.set(socket.socketKey, JSON.stringify(socketIdentifier), () => {
//                             console.log("notificationSvc:socketManager => Socket added to redis")
//                             console.log("notificationSvc:socketManager => ", socket.socketKey, JSON.stringify(socketIdentifier))
//                             socket.authorised = true
//                             notificationSvc.getDeltas(data.query, socket)
//                             socket.emit('accept', { status: 'Good', message: "All good, welcome to Flujo" })
//                             console.log("notificationSvc:socketManager => Connected to ", socket.socketKey)
//                             socket.authStatus = true;
//                             resolve(true)
//                         })
//                     }).catch(error => {
//                         console.log("notificationSvc:socketManager => Nope, bad token", error)
//                         console.log("notificationSvc:socketManager => Token rejected")
//                         console.log(`notificationSvc:socketManager => token: ${data.token}, user: ${data.user}, workspace: ${data.workspace}`)
//                         socket.emit('reject', { status: 'ExpiredToken', message: "Token is invalid" })
//                         reject(false)

//                         // TO DO: This should be taken care of, separate invalid from expired.

//                         // reject(false)  
//                         // console.log("Token rejected")
//                         // socket.emit('reject', { status: 'BadToken', message: "Token is invalid" })
//                         // socket.disconnect()
//                     })
//             })
//         })
//     },

//     newSocket: (socket) => {
//         socketManager.socketAuth(socket).then(authStatus => {
//             sockets.set(socket.id, socket)
//             console.log(`notificationSvc:socketManager => New socket connected: ${socket.id}`);
//             console.log(`notificationSvc:socketManager => Connected to ${sockets.size} clients via websockets`);
//         })

//         socket.on("messenger.deltas?", query => {
//             console.log(`notificationSvc:socketManager =>  ${socket.user} ${socket.workspace} : messenger.deltas?`);
//             notificationSvc.getDeltas(query.query, socket)
//         })

//         socket.on("messenger.set_presence", delta => {
//             if (socket.authStatus) {
//                 presenceManager.setPresence(socket.user, socket.workspace, delta.presence)
//             }
//         })

//         socket.on("messenger.get_presence", body => {
//             if (socket.authStatus) {
//                 presenceManager.getPresenceOfUser(body.user, socket)
//             }
//         })

//         socket.on("messenger.set_typing", body => {
//             if (socket.authStatus) {
//                 typingManager.setStatusOfConversation(body.conv, body.user)
//             }
//         })

//         socket.on("messenger.get_typing", body => {
//             if (socket.authStatus) {
//                 typingManager.getStatusOfConversation(body.conv, socket)
//             }
//         })

//         socket.on("messenger.get.api-v1-messages?", req => {
//             if (socket.authStatus) {
//                 if (!req.req.headers) {
//                     req.req.headers = {}
//                 }
//                 req.req.headers.userid = socket.user
//                 req.req.headers.workspaceid = socket.workspace
//                 messagesFunctions.getMessages(req.req).then(resp => {
//                     socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, resp)
//                 }).catch(resp => {
//                     socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, resp)
//                 }).finally(() => {
//                     // All this is under the assumption that messenger.get.api-v1-messages? gets 
//                     // called only when a device logs in, which need not be true.
//                     // However, I am too lazy at the moment to find a more appropriate place for this
//                     // Someday, when you read this again, fix it. 
//                     // Send it only once after the user has logged in.
//                     const delta = {};
//                     delta.user = String(socket.user)
//                     delta.workspace = String(socket.workspace)
//                     delta.type = "flujo.new_login"
//                     delta.data = { device: socket.device }
//                     delta.event_ts = Date.now()
//                     delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
//                     // console.log("notificationSvc:socketManager => ", delta)
//                     notificationSvc.notifyUser(delta.user, delta.workspace, delta)
//                 })
//             }
//         })

//         socket.on("messenger.get.api-v1-message?", req => {
//             if (!req.req.headers) {
//                 req.req.headers = {}
//             }
//             req.req.headers.userid = socket.user
//             req.req.headers.workspaceid = socket.workspace
//             messagesFunctions.getMessage(req.req).then(resp => {
//                 socket.emit('messenger.get.api-v1-message.' + req.params.msgid, resp)
//             }).catch(resp => {
//                 socket.emit('messenger.get.api-v1-messages.' + req.params.msgid, resp)
//             })
//         })

//         socket.on("messenger.get.api-v1-conversations?", req => {
//             if (socket.authStatus) {
//                 if (!req.req.headers) {
//                     req.req.headers = {}
//                 }
//                 req.req.headers.userid = socket.user
//                 req.req.headers.workspaceid = socket.workspace
//                 console.log("notificationSvc:socketManager => Use bot auth for this to work🤓")
//                 // req.req.headers.authorization = "botauth" // Take care of this please. This can only work on testing
//                 conversationsFunctions.getConversations(req.req).then(resp => {
//                     socket.emit('messenger.get.api-v1-conversations', resp)
//                 }).catch(resp => {
//                     socket.emit('messenger.get.api-v1-conversations', resp)
//                 })
//             }
//         })

//         socket.on("messenger.post.api-v1-messages", req => {
//             if (socket.authStatus) {
//                 console.log(`Message received from user ${socket.user} on socket: ${socket.id}`)
//                 if (!req.req.headers) {
//                     req.req.headers = {}
//                 }
//                 req.req.headers.userid = socket.user
//                 req.req.headers.workspaceid = socket.workspace
//                 messagesFunctions.postMessage(req.req).then(delta => {
//                     // console.log(delta.data)
//                     delta.user = String(socket.user)
//                     delta.event_ts = Date.now()
//                     delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
//                     socket.emit("messenger.post.api-v1-messages", {
//                         tempId: req.req.body.tempId,
//                         delta: delta,
//                         status: 200,
//                         error: false
//                     })
//                     users = delta.data.to;
//                     users.forEach(user => {
//                         delta.user = String(user)
//                         delta.event_ts = Date.now()
//                         delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
//                         // console.log("notificationSvc:socketManager => ", delta)
//                         notificationSvc.notifyUser(delta.user, delta.workspace, delta)
//                     })
//                     // I am hoping that this is a solid idea. God save us all when it finally breaks
//                     notificationSvc.pushFCM(users, socket.workspace);
//                 }).catch(resp => {
//                     console.log("notificationSvc:socketManager => Failed to write message", resp)
//                     socket.emit("messenger.post.api-v1-messages", { tempId: req.req.body.tempId, status: 500, error: true })
//                     // socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, resp)
//                 })
//             } else {
//                 socket.emit("messenger.post.api-v1-messages", { tempId: req.req.body.tempId, status: 403, error: true })
//             }
//         })

//         socket.on("messenger.put.api-v1-messages", req => {
//             if (socket.authStatus) {
//                 if (!req.req.headers) {
//                     req.req.headers = {}
//                 }
//                 req.req.headers.userid = socket.user
//                 req.req.headers.workspaceid = socket.workspace
//                 messagesFunctions.updateMessage(req.req).then(delta => {
//                     // console.log(delta.data)
//                     users = delta.data.to;
//                     users.forEach(user => {
//                         delta.user = String(user)
//                         delta.event_ts = Date.now()
//                         delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
//                         // console.log("notificationSvc:socketManager => ", delta)
//                         notificationSvc.notifyUser(delta.user, delta.workspace, delta)
//                     })
//                     // I am hoping that this is a solid idea. God save us all when it finally breaks
//                     socket.emit("messenger.put.api-v1-messages", { tempId: req.req.body.tempId, status: 200, error: false })
//                 }).catch(resp => {
//                     console.log("notificationSvc:socketManager => Failed to write message", resp)
//                     socket.emit("messenger.put.api-v1-messages", { tempId: req.req.body.tempId, status: 500, error: true })
//                     socket.emit('flujo.socket-error', {
//                         status: 500, error: true, reason: resp, request: req.req
//                     });
//                     // socket.emit('messenger.get.api-v1-messages.' + req.req.query_id, resp)
//                 })
//             } else {
//                 socket.emit("messenger.put.api-v1-messages", { tempId: req.req.body.tempId, status: 403, error: true })
//                 socket.emit('flujo.socket-error', {
//                     status: 403, error: true, reason: "Token is invalid, current socket in not authorised"
//                 });
//             }
//         })

//         socket.on('disconnect', () => {
//             redisClient.del(socket.socketKey, () => { console.log("notificationSvc:socketManager => Deleting from redis : ", socket.socketKey) })
//             sockets.delete(socket.id)
//             console.log(`notificationSvc:socketManager => Connected to ${sockets.size} clients via websockets`);
//         })
//     },

// }



// module.exports = { notificationSvc, socketManager }