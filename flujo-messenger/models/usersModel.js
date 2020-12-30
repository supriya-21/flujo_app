var mongo = require('mongodb');
const { mongoSvc } = require('../services/mongoSvc')


const usersModel = {
    insert: (dbConn, object) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(dbConn => {
                    console.log("Creating new user : ", object)
                    dbConn.collection('users').insertOne(object)
                        .then(res => {
                            console.log(res, 'res') 
                            resolve(res)
                        })
                        .catch(err => {
                            if (err.code === 11000) {
                                console.log("activitiesModel:newView => WARN user already added");
                                resolve({
                                    status: 'duplicate',
                                    message: 'No view added',
                                });
                                return;
                            } else {
                                console.log(err, 'Could not insert data')
                                reject(err)
                            }
                        });
                })
                .catch(err => {
                    console.log("usersModel:insert => ERROR connection error", err)
                    reject("usersModel:insert => ERROR connection error");
                });           
        })
    },
    // getAll: (dbConn, userId, workspaceId, is_status, status, offset, limit) => {
    //     console.log(userId, workspaceId, status, offset, limit, 'object')
    //     return new Promise(async (resolve, reject) => {
    //         if (is_status) {
    //             var find_obj = { 'workspaceId': workspaceId, 'status': status, $or: [{ from: userId }, { to: userId }] }
    //         } else {
    //             var find_obj = { 'workspaceId': workspaceId, $or: [{ from: userId }, { to: userId }] }
    //         }
    //         dbConn.collection('messages')
    //             .find(find_obj)
    //             .sort({ 'timestamp': -1 })
    //             .skip(offset)
    //             .limit(limit)
    //             .toArray((err, resp) => {
    //                 if (err) {
    //                     console.log(err, 'err')
    //                     reject(err);
    //                 } else {
    //                     resolve(resp)
    //                 }
    //             })
    //     })

    // },

    // getAllConMesg: (dbConn, userId, workspaceId, convId, is_status, status, offset, limit) => {
    //     return new Promise(async (resolve, reject) => {
    //         if (is_status) {
    //             var find_obj = { 'workspaceId': workspaceId, 'convId': convId, 'status': status };
    //         } else {
    //             var find_obj = { 'workspaceId': workspaceId, 'convId': convId }
    //         }
    //         dbConn.collection('messages')
    //             .find(find_obj)
    //             .sort({ 'timestamp': -1 })
    //             .skip(offset)
    //             .limit(limit)
    //             .toArray((err, resp) => {
    //                 if (err) {
    //                     console.log("usersModel:getAllConMesg => ERROR ", err)
    //                     reject("usersModel:getAllConMesg => ERROR ");
    //                 } else {
    //                     resolve(resp)
    //                 }
    //             })
    //     })

    // },

    getOne: (dbConn, userId) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(dbConn => {
                    console.log(dbConn, 'dbConn')
                    dbConn.collection('users')
                        .findOne({ 'userId': userId }, (err, resp) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(resp)
                            }
                        })
                })
                .catch(err => {
                    console.log("usersModel:getOne => ERROR connection error", err)
                    reject("usersModel:getOne => ERROR connection error");
                });
        })
    },

    update: (dbConn, userId, object) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(dbConn => {
                    dbConn.collection('users')
                        .updateOne({ 'userId': userId }, { $set: object }, (err, resp) => {
                            if (err) {
                                console.log("usersModel:update => ERROR", err)
                                reject("usersModel:update => ERROR");
                            } else {
                                resolve(resp)
                            }
                        });
                })
                .catch(err => {
                    console.log("usersModel:update => ERROR connection error", err)
                    reject("usersModel:update => ERROR connection error");
                });
        })
    }

}
module.exports = { usersModel };