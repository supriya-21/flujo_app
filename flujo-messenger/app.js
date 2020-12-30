const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
let indexRouter = require('./routes');
let v1Router = require('./routes/api/v1');
let v2Router = require('./routes/api/v2');
let usersRouter = require('./routes/users');
let cors = require('cors');
const app = express();
var expressMongoDb = require('./services/expressMongo');
const user = encodeURIComponent(process.env.MONGO_USER);
const password = encodeURIComponent(process.env.MONGO_PWD);
//const host = encodeURIComponent(process.env.MONGO_HOST);
const host = process.env.MONGO_HOST;
const port = encodeURIComponent(process.env.MONGO_PORT);
const dbName = encodeURIComponent(process.env.MONGO_DB);
const { userVerifyService } = require('./services/userVerifyService');


// Connection URL
if (!host) {
  console.log("ENV not set")
}
let url = "mongodb+srv://" + user + ":" + password + "@" + host;
// if (process.env.ORIGIN == "app") {  //BAD CODE: Fix for alpha and beta compatabilty and remove origin check
// } else {
//   url = "mongodb://" + user + ":" + password + "@" + host;
// }
// console.log(url)
app.use(expressMongoDb(url, { useUnifiedTopology: true }));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/* Middleware to secure messenger APIs */

// var validateToken = function (req, res, next) {
//   console.log("app.js => Validating token for ", req.method, req.url)
//   //console.log('Token Obtained', req.headers.authorization, req.headers.userid, req.headers.workspaceid)
//   // console.log(req.url)
//   if (req.method == "OPTIONS" || req.url == "/api/v1/ping") {
//     next()
//     //console.log("Ignoring Auth check for OPTIONS request")
//   } else if (req.url.includes('/guest')) {
//     console.log('guest apis')
//     next()
//   } else if (!(req.headers.authorization) || !(req.headers.workspaceid) || !(req.headers.userid)) {
//     console.log("app.js => Token verification: Rejected - Missing params")
//     // next()
//     res.status(400).send({ error: true, message: "Expected authorization, userId, and workspaceId ", status_code: 101 })
//   } else {
//     if (req.headers.authorization == "Bearer " + process.env.BOTAUTH) {
//       //    console.log("Token verification: Token Verified")
//       next()
//     } else {
//       userVerifyService.isValidUserWithData(req.headers.authorization, parseInt(req.headers.userid), parseInt(req.headers.workspaceid)).then(res => {
//         // console.log("Token verification: Token Verified")
//         next()
//       }).catch(err => {
//         console.log("app.js => Token verification: Rejected - Invalid", err)
//         // next()
//         res.status(403).send({ error: true, message: "Token unautherised", status_code: 101 })
//       })
//     }
//   }

// }

// app.use(validateToken)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.xml());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use(cookieParser());


app.use('/api/v0/', indexRouter);
app.use('/api/v1/', v1Router);
app.use('/api/v2/', v2Router);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//});


module.exports = app;
