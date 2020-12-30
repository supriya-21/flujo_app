const { messagesModel } = require('../../models/messagesModel');
const { conversationsModel } = require('../../models/conversationsModel');
const { messageService } = require('../../services/messageService');
const { conversationsController } = require('./conversationsController');

const bulkMessagesController = {
    /**
     * Push bulk messages to my wal or one-on-one 
     * If from 0 it considered from bot
     * If from not 0 sending messages from users
     * if convIds then directly sending message to all related conv ids
     * if userids then finding convIds then sending the messges 
     */
    pushAnyBulkMessage: (req, res) => {
        // console.log('In messenger poll creation.')
        if (!((req.headers.authorization && req.headers.userid && req.headers.workspaceid))) {
            res.status(400).send({ error: true, message: "Expected authorization, User Id and Workspace Id", status_code: 101 })
        } else if (!(req.body.conversation_ids || req.body.user_ids)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            // let userData = req.user_info;
            let userid = req.headers.userid
            let workspaceid = req.headers.workspaceid;
            // if un define from user id considered from bot (0)
            let from = (req.body.from !== undefined || req.body.from !== null) ? req.body.from : 0;
            // console.log(msgObj, 'msgObj1')
            if (req.body.conversation_ids) { // based on the conversation ids
                bulkMessagesController.messagesMapping(req.db, req.body.conversation_ids, from, req.body, userid, workspaceid)
                    .then(mesgResp => {
                        res.status(200).send({ error: false, message: "Messages sent successfully.", status_code: 100, result: mesgResp })
                    }).catch(msgErr => {
                        res.status(500).send({ error: true, message: "Error while sending the messages!.", status_code: 101, result: msgErr })
                    })
            } else { // based on the user ids
                if (req.body.user_ids && req.body.user_ids.length > 0) {
                    if (from === 0) { // for bot 
                        // getting the user my val convIds
                        bulkMessagesController.getMywalAndPushMsgs(req.db, workspaceid, userid, req.body.user_ids, req.body, from)
                            .then(mesgMyResp => {
                                res.status(200).send({ error: false, message: "Messages sent successfully.", status_code: 100, result: mesgMyResp })
                            }).catch(msgMyErr => {
                                res.status(500).send({ error: true, message: "Error while sending the messages!.", status_code: 101, result: msgMyErr })
                            })

                    } else { // for user one on one 
                        bulkMessagesController.getOneOnOneAndPushMsg(req.db, workspaceid, userid, req.body.user_ids, req.body, parseInt(from))
                            .then(mesgMyResp => {
                                res.status(200).send({ error: false, message: "Messages sent successfully.", status_code: 100, result: mesgMyResp })
                            }).catch(msgMyErr => {
                                res.status(500).send({ error: true, message: "Error while sending the messages!.", status_code: 101, result: msgMyErr })
                            })
                    }
                } else {
                    res.status(400).send({ error: true, message: "userIds required.", status_code: 101 })
                }
            }

        }
    },

    getMywalAndPushMsgs: (db, workspaceid, userid, user_ids, body, from = 0) => {
        // console.log(workspaceid, userid, user_ids, body, from, 'workspaceid, userid, user_ids, body, from')
        return new Promise((resolve, reject) => {
            if (user_ids.length > 0) {
                conversationsController.getMywallConvIds(db, user_ids, workspaceid, null).then(conVresp => {
                    // console.log('conVresp=>', conVresp)
                    if (conVresp.success && conVresp.success.length > 0) {
                        let convIds = []
                        for (let con of conVresp.success) {
                            convIds = [...convIds, con.convId]
                        }
                        // console.log('convIds=>', convIds)
                        bulkMessagesController.messagesMapping(db, convIds, from, body, userid, workspaceid)
                            .then(mesgResp => {
                                resolve({ error: false, message: "Messages sent successfully.", status_code: 100, result: mesgResp })
                            }).catch(msgErr => {
                                // console.log(msgErr, 'msgErr')
                                reject({ error: true, message: "Error while sending the messages!.", status_code: 101, result: msgErr })
                            })
                    } else {
                        reject({ error: true, message: "ConvIds not found!.", status_code: 101, result: {} })
                    }

                }).catch(covErr => {
                    reject({ error: true, message: "Error while convIds fetching.", status_code: 101, result: covErr })
                })
            } else {
                reject({ error: true, message: "UserIds required.", status_code: 101 });
            }

        })
    },


    getOneOnOneAndPushMsg: (db, workspaceid, userid, user_ids, body, from) => {
        return new Promise((resolve, reject) => {
            if (user_ids.length > 0) {
                bulkMessagesController.getAllOneOnOneConv(db, parseInt(from), user_ids, workspaceid).then(convResp => {
                    bulkMessagesController.messagesMapping(db, convResp, from, body, userid, workspaceid)
                        .then(mesgResp => {
                            resolve({ error: false, message: "Messages sent successfully.", status_code: 101, result: mesgResp })
                        }).catch(msgErr => {
                            reject({ error: true, message: "Error while sending the messages!.", status_code: 101, result: msgErr })
                        })
                }).catch(convErr => {
                    reject({ error: true, message: "Error while fetching the one on ones!.", status_code: 101, result: convErr })

                })
            } else {
                reject({ error: true, message: "UserIds required.", status_code: 101 });
            }

        })
    },

    messagesMapping: (db, convIds, from, body, userid, workspaceid) => {
        return new Promise((resolve, reject) => {

            if (convIds.length > 0) {
                // console.log(convId.length, 'length')
                users = [];
                result = [];
                // let msg = `${req.body.user_name} deleted ${req.body.app_name} App and app configuration was removed.`;
                //get conversation id
                result = convIds.map(el => {
                    // console.log('el=>')
                    return messageService.pushMsgs(db, `${el}`, from, body, userid, workspaceid)
                })
                Promise.all(result).then(resp => {
                    // console.log(resp, 'resp')
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
                        resolve({ success: success, fail: fail })
                    }
                }).catch(convErr => {
                    console.log('bulkMessagesController:messagesMapping => ERROR', convErr);
                    reject(convErr)
                })
            } else {
                console.log('bulkMessagesController:messagesMapping => ERROR No convids given', convIds)
                reject(true)
            }
        })
    },

    getAllOneOnOneConv: (db, from, userIds, workspaceid) => {
        return new Promise((resolve, reject) => {
            let orArray = [];
            for (let userId of userIds) {
                if (from != userId) {
                    orArray = [...orArray, {
                        members: { $eq: [from, userId] },
                        isOneToOne: true,
                        workspaceId: parseInt(workspaceid),

                    },
                    {
                        members: { $eq: [userId, from] },
                        isOneToOne: true,
                        workspaceId: parseInt(workspaceid),

                    }]
                    // orArray = [...orArray, name: `${from}-${userId}` }]
                }
            }
            // where_obj = { isOneToOne: true, workspaceId: parseInt(workspaceid), $or: orArray };
            let where_obj = { $or: orArray };

            conversationsModel.getAllConv(db, where_obj)
                .then(getConvs => {
                    let convIds = [];
                    for (let conv of getConvs) {
                        convIds = [...convIds, conv._id]
                    }
                    resolve(convIds)
                }).catch(errConv => {
                    reject(errConv)
                })
        })

    },

    insertBulk: (db, convIds, msgObject, userid) => {
        return new Promise((resolve, reject) => {
            if (convIds.length > 0) {
                let msgs = [];
                convIds.map(conv => {
                    console.log('conv=>', conv)
                    msgObject.convId = conv;
                    msgs = [...msgs, msgObject]
                })
                messagesModel.bulkCreate(db, msgs)
                    .then(msgResp => {
                        resolve(msgResp)
                    }).catch(err => {
                        reject(err)
                    })
            } else {
                reject(true)
            }
        })
    },

}

module.exports = { bulkMessagesController };