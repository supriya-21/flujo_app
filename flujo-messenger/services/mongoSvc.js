'use strict';

var MongoClient = require('mongodb').MongoClient;

const user = encodeURIComponent(process.env.MONGO_USER);
const password = encodeURIComponent(process.env.MONGO_PWD);
const host = process.env.MONGO_HOST;
// const port = encodeURIComponent(process.env.MONGO_PORT);
const dbName = encodeURIComponent(process.env.MONGO_DB);

let _mongoConnection = null;
let connection = null;
let url = "mongodb+srv://" + user + ":" + password + "@" + host;
// if (process.env.ORIGIN == "app") {  //BAD CODE: Fix for alpha and beta compatabilty and remove origin check
// 	url = "mongodb+srv://" + user + ":" + password + "@" + host;
// } else {
// 	url = "mongodb://" + user + ":" + password + "@" + host;
// }

const mongoSvc = {
	getDbClient: () => {
		let options = { useUnifiedTopology: true }
		return new Promise((resolve, reject) => {
			if (!connection) {
				console.log("mongoSvc => Creating new mongo connection")
				// let ca = [new Buffer(process.env.certificate_base64, 'base64')]
				options.useUnifiedTopology = true
				options.useNewUrlParser = true
				// if (process.env.ORIGIN !== "app") { //BAD CODE FOR BACKWARD COMPATABILITY. Fix alpha and beta
				// 	options.ssl = true
				// 	options.sslCA = ca
				// }
				options.replicaSet = process.env.REPLICASET
				options.autoReconnect = true
				options.connectTimeoutMS = 30000
				options.socketTimeoutMS = 5000
				options.reconnectTries = Number.MAX_VALUE
				options.reconnectInterval = 5000
				connection = MongoClient.connect(url, options)
			}

			connection
				.then((client) => {
					_mongoConnection = client.db(dbName);
					// console.log('mongoSvc => Connected to mongo!')
					resolve(_mongoConnection);
					return;
				})
				.catch((err) => {
					connection = null;
					console.log('mongoSvc => Connection to mongo failed!', err)
					reject(null);
					return;
				});
		})
	},
};
module.exports = { mongoSvc }