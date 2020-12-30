var mongo = require('mongodb');
const { mongoSvc } = require('../services/mongoSvc');
const { timeout } = require('async');

const deltasModel = {
    insert: (object) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(db => {
                    db.collection('deltas').insertOne(object)
                        .then(res => {
                            resolve(res);
                            return;
                        })
                        .catch(err => {
                            console.log('deltasModel:insert => ERROR 1 ', err);
                            reject('deltasModel:insert => ERROR 1');
                            return;
                        });
                })
                .catch(error => {
                    console.log("deltasModel:insert => ERROR 2 getDbClient Failed", error);
                    reject("deltasModel:insert => ERROR getDbClient Failed");
                    return;
                })
        })
    },


    getAllDeltas: (userId, workspaceId, timestamp) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient()
                .then(db => {
                    var find_obj = { 'workspace': String(workspaceId), 'user': String(userId), event_ts: { $gt: parseInt(timestamp) } }
                    db.collection('deltas')
                        .find(find_obj)
                        .sort({ 'event_ts': 1 })
                        // .skip(offset)
                        // .limit(limit)
                        .toArray((err, resp) => {
                            if (err) {
                                console.log('deltasModel:getAllDeltas => WARN: Retrying ', err);
                                setTimeout(() => {
                                    db.collection('deltas')
                                        .find(find_obj)
                                        .sort({ 'event_ts': 1 })
                                        .toArray((err, resp) => {
                                            if (err) {
                                                console.log('deltasModel:getAllDeltas => ERROR ', err)
                                                reject('Error at deltasModel:getAllDeltas');
                                                return;
                                            } else {
                                                resolve(resp);
                                                return;
                                            }
                                        });
                                }, 2000);
                            } else {
                                resolve(resp);
                                return;
                            }
                        })
                })
                .catch(error => {
                    console.log('deltasModel:getAllDeltas => ERROR getDbClient Failed');
                    console.log('deltasModel:getAllDeltas => ERROR ', error);
                    reject('deltasModel:getAllDeltas => ERROR getDbClient Failed');
                    return;
                })
        })
    },

}
module.exports = { deltasModel };
