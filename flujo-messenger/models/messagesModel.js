var mongo = require('mongodb');
const { mongoSvc } = require('../services/mongoSvc')


const messagesModel = {
    insert: (dbConn, object) => {
        return new Promise((resolve, reject) => {
            mongoSvc.getDbClient()
                .then(dbConn => {
                    dbConn.collection('messages').insertOne(object)
                        .then(res => {
                            resolve(res);
                            return;
                        })
                        .catch(err => {
                            console.log("messagesModel:insert => ERROR", err);
                            reject("messagesModel:insert => ERROR");
                            return;
                        });
                })
                .catch(err => {
                    console.log("messagesModel:insert => ERROR connection error", err)
                    reject("messagesModel:insert => ERROR connection error");
                    return;
                });
        })
    },
    getAll: (dbConn, find_obj, offset, limit) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('messages')
                .find(find_obj)
                .sort({ 'timestamp': -1 })
                .skip(offset)
                .limit(limit)
                .toArray((err, resp) => {
                    if (err) {
                        console.log("messagesModel:getAll => ERROR", err);
                        reject("messagesModel:getAll => ERROR");
                        return;
                    } else {
                        resolve(resp)
                        return;
                    }
                })
        })

    },

    getAllConMesg: (dbConn, userId, workspaceId, convId, is_status, status, offset, limit) => {
        return new Promise(async (resolve, reject) => {
            if (is_status) {
                var find_obj = { 'workspaceId': workspaceId, 'convId': convId, 'status': status };
            } else {
                var find_obj = { 'workspaceId': workspaceId, 'convId': convId }
            }
            dbConn.collection('messages')
                .find(find_obj)
                .sort({ 'timestamp': -1 })
                .skip(offset)
                .limit(limit)
                .toArray((err, resp) => {
                    if (err) {
                        console.log("messagesModel:getAllConMesg => ERROR", err);
                        reject("messagesModel:getAllConMesg => ERROR");
                        return;
                    } else {
                        resolve(resp)
                        return;
                    }
                })
        })

    },

    getOne: (dbConn, msgId) => {
        return new Promise(async (resolve, reject) => {

            mongoSvc.getDbClient()
                .then(dbConn => {
                    try {
                        var o_id = new mongo.ObjectID(msgId);
                    }
                    catch (error) {
                        console.log("messagesModel:getOne => ERROR", error);
                        reject("messagesModel:getOne => ERROR");
                        return;
                    }

                    dbConn.collection('messages')
                        .findOne({ '_id': o_id }, (err, resp) => {
                            if (err) {
                                console.log("messagesModel:getOne => ERROR", err);
                                reject("messagesModel:getOne => ERROR");
                                return;
                            } else {
                                // console.log(resp)
                                resolve(resp);
                                return;
                            }
                        })
                })
                .catch(err => {
                    console.log("messagesModel:getOne => ERROR connection error", err)
                    reject("messagesModel:getOne => ERROR connection error");
                    return;
                });
        });
    },
    delete: (dbConn, msgId) => {
        console.log("Deleting message : ", msgId)
        return new Promise(async (resolve, reject) => {
            try {
                var o_id = new mongo.ObjectID(msgId);
                // var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                console.log("messagesModel:delete => ERROR", error);
                reject("messagesModel:delete => ERROR");
                return;
            }
            dbConn.collection('messages')
                .deleteOne({ '_id': o_id }, (err, resp) => {
                    if (err) {
                        console.log("messagesModel:delete => ERROR", err);
                        reject("messagesModel:delete => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },

    deleteMany: (dbConn, msgIds) => {
        return new Promise(async (resolve, reject) => {
            let msgs = []
            msgIds.forEach(item => {
                try {
                    msgs.push(new mongo.ObjectID(item))
                }
                catch (error) {
                    console.log("messagesModel:deleteMany => ERROR", error);
                    reject("messagesModel:deleteMany => ERROR");
                    return;
                }
            })
            dbConn.collection('messages')
                .deleteMany({ '_id': { '$in': msgs } }, (err, resp) => {
                    if (err) {
                        console.log("messagesModel:deleteMany => ERROR", err);
                        reject("messagesModel:deleteMany => ERROR");
                        return;
                    } else {
                        //console.log(resp.deletedCount)
                        resolve({ "deletedCount": resp.deletedCount })
                        return;
                    }
                })
        })
    },

    update: (dbConn, mesgid, object) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(dbConn => {
                    try {
                        var o_id = new mongo.ObjectID(mesgid);
                    }
                    catch (error) {
                        console.log("messagesModel:update => ERROR Bad ID", error)
                        reject("messagesModel:update => ERROR Bad Object ID");
                        return;
                    }
                    dbConn.collection('messages')
                        .updateOne({ '_id': o_id }, { $set: object }, (err, resp) => {
                            if (err) {
                                console.log("messagesModel:update => ERROR", err);
                                reject("messagesModel:update => ERROR");
                                return;
                            } else {
                                if (resp.result.nModified === 1) {
                                    resolve(true);
                                    return;
                                } else {
                                    console.log("messagesModel:update => ERROR Updating message");
                                    reject("messagesModel:update => ERROR Updating message");
                                    return;
                                }
                            }
                        });
                })
                .catch(err => {
                    console.log("messagesModel:update => ERROR connection error", err)
                    reject("messagesModel:update => ERROR connection error");
                    return;
                });
        });
    },

    updateMany: (find, update) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(dbConn => {
                    // try {
                    //     var o_id = new mongo.ObjectID(mesgid);
                    // }
                    // catch (error) {
                    //     console.log("messagesModel:update => ERROR Bad ID", error)
                    //     reject("messagesModel:update => ERROR Bad Object ID");
                    //     return;
                    // }
                    dbConn.collection('messages')
                        .updateMany(find, { $set: update }, (err, resp) => {
                            if (err) {
                                console.log("messagesModel:updateMany => ERROR", err);
                                reject("messagesModel:updateMany => ERROR");
                                return;
                            } else {
                                if (resp.result.nModified >= 0) {
                                    resolve(true);
                                    return;
                                } else {
                                    console.log("messagesModel:updateMany => ERROR Updating messages");
                                    reject("messagesModel:updateMany => ERROR Updating messages");
                                    return;
                                }
                            }
                        });
                })
                .catch(err => {
                    console.log("messagesModel:updateMany => ERROR connection error", err)
                    reject("messagesModel:updateMany => ERROR connection error");
                    return;
                });
        });
    },

    bulkCreate: (dbConn, object) => {
        console.log("Creating multiple message object : ", object)
        return new Promise(async (resolve, reject) => {
            dbConn.collection('messages').insertMany(object)
                .then(res => {
                    console.log("Successfully bulk created")
                    resolve(res);
                    return;
                })
                .catch(err => {
                    console.log("messagesModel:bulkCreate => ERROR", err);
                    reject("messagesModel:bulkCreate => ERROR");
                    return;
                });
        })

    },

    getCount: (dbConn, where) => {
        console.log("Getting user_id, workspace_id : ", where)
        return new Promise(async (resolve, reject) => {
            dbConn.collection('messages')
                .count(where, (err, resp) => {
                    if (err) {
                        console.log("messagesModel:getCount => ERROR", err);
                        reject("messagesModel:getCount => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },

    getMessages: (dbConn, find_obj) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('messages')
                .find(find_obj)
                .toArray((err, resp) => {
                    if (err) {
                        console.log("messagesModel:getMessages => ERROR", err);
                        reject("messagesModel:getMessages => ERROR");
                        return;
                    } else {
                        // console.log(resp, 'getting all owner_ids')
                        resolve(resp);
                        return;
                    }
                })
        })

    }

}
module.exports = { messagesModel };