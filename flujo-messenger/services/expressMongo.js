'use strict';
const dbName = encodeURIComponent(process.env.MONGO_DB);
var MongoClient = require('mongodb').MongoClient;
const { mongoSvc } = require('./mongoSvc')
const fs = require('fs');
const path = require('path');


module.exports = function (uri, opts) {
	if (typeof uri !== 'string') {
		throw new TypeError('Expected uri to be a string');
	}

	const options = opts || {};
	var property = options.property || 'db';
	delete options.property;

	var connection;

	return function expressMongoDb(req, res, next) {
		if (!connection) {
			console.log("expressMongo => Creating new mongo connection")
			// let ca = [new Buffer(process.env.certificate_base64, 'base64')]
			options.useUnifiedTopology = true
			options.useNewUrlParser = true
			// if (process.env.ORIGIN !== "app") { //BAD CODE FOR BACKWARD COMPATABILITY. Fix alpha and beta
			// 	options.ssl = true
			// 	options.sslCA = ca
			// }
			options.replicaSet = process.env.REPLICASET
			options.autoReconnect = true
			options.connectTimeoutMS = 1000
			options.socketTimeoutMS = 1000
			options.reconnectTries = Number.MAX_VALUE
			options.reconnectInterval = 1000

			connection = MongoClient.connect(uri, options)
		}

		connection
			.then((client) => {
				req[property] = client.db(dbName);
				// console.log('Connected to mongo!')
				next();
			})
			.catch((err) => {
				connection = undefined;
				console.log('expressMongo => Connection to mongo failed!', err)
				next(err);
			});
	};
};