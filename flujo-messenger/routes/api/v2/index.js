var express = require('express');
var router = express.Router();


var { threadsController } = require('../../../controllers/v2/threadsController');
var { usersController } = require('../../../controllers/v2/usersController');
var { tokenVerificationService } = require('../../../services/tokenVerificationService');
// var { usersController } = require('../../../controllers/v2/usersController');



/* GET home page. */
router.get('/ping', function (req, res, next) {
  try {
    console.log("Received ping")
    if (req.db.serverConfig.isConnected()) {
      console.log("Db connected, app running. Ping success")
      res.status(200).send({ error: false, message: "Success", result: {}, status_code: 100 })
    } else {
      console.log("Db not connected. Ping failed")
      res.status(500).send({ error: true, message: "Db connection error" })
    }
  } catch (error) {
    console.log("Error with ping", error)
    res.status(500).send({ error: true, message: "Error with ping" })
  }
});



//threads
router.post('/threads', tokenVerificationService.userVerifyAndData, threadsController.createThread);
router.get('/threads/:threadid', tokenVerificationService.userVerifyAndData, threadsController.getThread);
router.delete('/threads/:threadid', tokenVerificationService.userVerifyAndData, threadsController.deleteThread);
// router.put('/threads/:threadid', threadsController.updateThread);

// //workspace
// router.get('/workspace/', workspaceController.getWorkspace);

// //Notification registration
// router.post('/notify/fcmToken', notificationService.newFCMToken);
// router.delete('/notify/fcmToken/:device', notificationService.deleteFCMToken);
// router.delete('/notify/fcmToken', notificationService.deleteFCMToken);


// Users
router.put('/users/me', usersController.updateUser);




module.exports = router;
