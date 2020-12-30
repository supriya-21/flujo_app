const { mongoSvc } = require('../services/mongoSvc');

const archivesModel = {
    insert: (object) => {
        return new Promise(async (resolve, reject) => {
            mongoSvc.getDbClient().then(dbConn => {
                dbConn.collection('archives').insertOne(object)
                    .then(res => {
                        resolve(res);
                    })
                    .catch(err => {
                        console.log("archivesModel:insert => ERROR", err)
                        reject('archivesModel:insert ERROR');
                    });
            })

        })

    }
}

module.exports = { archivesModel };