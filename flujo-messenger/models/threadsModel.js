var mongo = require('mongodb');
const { mongoSvc } = require('../services/mongoSvc');

const threadsModel = {
    insert: (dbConn, object) => {
        console.log("Inserting new thread : ", object)
        return new Promise(async (resolve, reject) => {
            dbConn.collection('threads').insertOne(object)
                .then(res => {
                    resolve(res);
                    return;
                })
                .catch(err => {
                    console.log('thread could not be insterted', err)
                    reject(err)
                });
        })

    },

    getOne: (dbConn, threadid) => {
        console.log("Searching for thread : ", threadid)
        return new Promise(async (resolve, reject) => {
            try {
                var o_id = new mongo.ObjectID(threadid);
                // var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                reject(error);
            }
            dbConn.collection('threads')
                .findOne({ '_id': o_id }, (err, resp) => {
                    if (err) {
                        console.log(err, 'err')
                        reject(err);
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },

    deleteOne: (dbConn, threadid) => {
        console.log("Deleting thread : ", threadid)
        return new Promise(async (resolve, reject) => {
            try {
                var o_id = new mongo.ObjectID(threadid);
                // var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                reject(error);
                return;
            }
            dbConn.collection('threads')
                .deleteOne({ '_id': o_id }, (err, resp) => {
                    if (err) {
                        console.log("Error deleting thread", err)
                        reject(err);
                        return;
                    } else {
                        resolve(resp);
                        return;
                    }
                })
        })
    },

    update: (dbConn, threadid, object) => {
        console.log("Updating thread : ", threadid, ' as : ', object)
        return new Promise(async (resolve, reject) => {
            try {
                var o_id = new mongo.ObjectID(threadid);
                // var o_id = new mongo.ObjectID(connid);
            }
            catch (error) {
                reject(error);
            }
            dbConn.collection('threads')
            .updateOne({'_id': o_id},{$set: object}, (err, resp) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(resp);
                        return;
                    }
                })
            })
    },

}

module.exports = { threadsModel };