var mongo = require('mongodb');
const { mongoSvc } = require('../services/mongoSvc');


const conversationsModel = {
    insert: (dbConn, object) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('conversations').insert(object)
                .then(res => {
                    resolve(res)
                })
                .catch(err => {
                    console.log("conversationsModel:insert => ERROR", err);
                    reject("conversationsModel:insert => ERROR");
                });
        })

    },
    bulkCreate: (dbConn, object) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('conversations').insertMany(object)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    console.log("conversationsModel:bulkCreate => ERROR", err);
                    reject("conversationsModel:bulkCreate => ERROR");
                });
        })

    },
    getAll: (dbConn, userId, workspaceId) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('conversations')
                .find({ 'workspaceId': workspaceId, members: { $in: [parseInt(userId)] } })
                .toArray((err, resp) => {
                    if (err) {
                        console.log("conversationsModel:getAll => ERROR", err);
                        reject("conversationsModel:getAll => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })

    },

    getAllIds: (dbConn, userId, workspaceId) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('conversations')
                .find({ 'workspaceId': workspaceId, members: { $in: [userId] } })
                .toArray((err, resp) => {
                    if (err) {
                        reject(err);
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },

    getOne: (dbConn, connid) => {
        return new Promise(async (resolve, reject) => {
            try {
                var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                reject(error);
                return;
            }
            mongoSvc.getDbClient()
                .then(dbConn => {
                    dbConn.collection('conversations')
                        .findOne({ "_id": o_id }, (err, resp) => {
                            if (err) {
                                console.log("conversationsModel:getOne => ERROR", err);
                                reject("conversationsModel:getOne => ERROR");
                                return;
                            } else {
                                resolve(resp);
                                return;
                            }
                        })
                })
                .catch(err => {
                    console.log("conversationsModel:getOne => ERROR connection error", err)
                    reject("conversationsModel:getOne => ERROR connection error");
                    return;
                });
        })
    },
    getMyWall: (dbConn, userId, workspaceId) => {  // Fix cases where this fails. should check for isonetoone true and only one memeber
        return new Promise(async (resolve, reject) => {
            dbConn.collection("conversations")
                .find({ name: String(userId + '-' + userId), workspaceId: parseInt(workspaceId), isOneToOne: true }).toArray((err, resp) => {
                    // .find({ members: [String(userId)], isOneToOne: true, workspaceId: parseInt(workspaceId) }).toArray((err, resp) => {

                    if (err) {
                        console.log("conversationsModel:getMyWall => ERROR", err)
                        reject("conversationsModel:getMyWall => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    getUserMyWall: (dbConn, userId, workspaceId) => {
        return new Promise(async (resolve, reject) => {
            await dbConn.collection("conversations")
                .findOne({ workspaceId: parseInt(workspaceId), members: [userId], isOneToOne: true }, (err, resp) => {
                    if (err) {
                        console.log("conversationsModel:getUserMyWall => ERROR", err);
                        resolve({ error: true, userId: userId });
                        return;
                    } else {
                        resolve({ error: false, convId: resp._id, userId: userId });
                        return;
                    }
                })
        })
    },
    delete: (dbConn, connid) => {
        return new Promise(async (resolve, reject) => {
            // var o_id = new mongo.ObjectID(connid);
            try {
                var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                reject(error);
                return;
            }
            dbConn.collection('conversations')
                .deleteOne({ '_id': o_id }, (err, resp) => {
                    if (err) {
                        console.log("conversationsModel:delete => ERROR", err);
                        reject("conversationsModel:delete => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    update: (dbConn, connid, object) => {
        return new Promise(async (resolve, reject) => {
            // var o_id = new mongo.ObjectID(connid);
            try {
                var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                reject(error);
                return;
            }
            dbConn.collection('conversations')
                .updateOne({ '_id': o_id }, { $set: object }, (err, resp) => {
                    if (err) {
                        console.log("conversationsModel:update => ERROR", err);
                        reject("conversationsModel:update => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    updateMembers: (dbConn, teamId, object) => {
        return new Promise(async (resolve, reject) => {
            //var dbConn = await databaseService.db()
            dbConn.collection('conversations')
                .updateOne({ 'teamId': parseInt(teamId) }, { $set: object }, (err, resp) => {
                    if (err) {
                        console.log("conversationsModel:updateMembers => ERROR", err)
                        reject("conversationsModel:updateMembers => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    getOneConv: (dbConn, userId, workspaceId) => {
        return new Promise(async (resolve, reject) => {
            dbConn.collection('conversations')
                .find({ 'workspaceId': parseInt(workspaceId), members: [parseInt(userId)], isOneToOne: true })
                .toArray((err, resp) => {
                    if (err) {
                        console.log("conversationsModel:getOneConv => ERROR", err);
                        reject("conversationsModel:getOneConv => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    updateIsActive: (dbConn, userId, workspaceId, object) => {
        return new Promise(async (resolve, reject) => {
            // var o_id = new mongo.ObjectID(connid);
            // try {
            //     var o_id = new mongo.ObjectID(connid);
            // }
            // catch (error) {
            //     reject(error);
            // }
            dbConn.collection('conversations')
                .updateMany({ isOneToOne: true, workspaceId: workspaceId, members: { $in: [userId] } }, { $set: object }, (err, resp) => {
                    if (err) {
                        console.log("conversationsModel:updateIsActive => ERROR", err);
                        reject("conversationsModel:updateIsActive => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    getOnetoOneConv: (dbConn, userId, workspaceId) => {
        return new Promise(async (resolve, reject) => {
            //var dbConn = await databaseService.db()
            dbConn.collection('conversations')
                .find({ isOneToOne: true, workspaceId: workspaceId, members: { $in: [userId] } })
                .toArray((err, resp) => {
                    if (err) {
                        console.log("conversationsModel:getOnetoOneConv => ERROR", err);
                        reject("conversationsModel:getOnetoOneConv => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    getAllConv: (dbConn, where) => {
        return new Promise(async (resolve, reject) => {
            //var dbConn = await databaseService.db()
            dbConn.collection('conversations')
                .find(where)
                .toArray((err, resp) => {
                    if (err) {
                        console.log("conversationsModel:getAllConv => ERROR", err)
                        reject("conversationsModel:getAllConv => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },
    getOnetoOneConvByMembers: (dbConn, workspaceId, members1, members2) => {
        return new Promise(async (resolve, reject) => {
            //var dbConn = await databaseService.db()
            dbConn.collection('conversations')
                .findOne({ isOneToOne: true, workspaceId: workspaceId, $or: [{ members: members1 }, { members: members2 }] }, (err, resp) => {
                    if (err) {
                        console.log("conversationsModel:getOnetoOneConvByMembers => ERROR", err);
                        reject("conversationsModel:getOnetoOneConvByMembers => ERROR");
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })

        })
    },
}

module.exports = { conversationsModel };