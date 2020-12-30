var express = require('express');
var router = express.Router();
var { messagesController } = require('../../../controllers/v1/messagesController');
var { conversationsController } = require('../../../controllers/v1/conversationsController');
var { threadsController } = require('../../../controllers/v1/threadsController');
var { usersController } = require('../../../controllers/v1/usersController');
var { notificationService } = require('../../../services/notificationService');
var { workspaceController } = require('../../../controllers/v1/workspaceController');
var { deviceController } = require('../../../controllers/v1/deviceController');
var { talkController } = require('../../../controllers/v1/talkController')
var { notificationSvc } = require('../../../services/notificationSvc');
var { bulkMessagesController } = require('../../../controllers/v1/bulkMessagesController');
var { tokenVerificationService } = require('../../../services/tokenVerificationService');

var { clientPushController } = require('../../../controllers/v1/clientPushController');


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

router.post('/init', conversationsController.init);
router.post('/user/init', conversationsController.myWallInit);
router.post('/user/conversation', tokenVerificationService.userVerifyAndData, conversationsController.createOneToOneConv);
router.get('/updateDeltas', function (req, res, next) {
  try {
    console.log("Received ping")
    res.status(200).send({ error: false, changes: true, delta: { newAuth: true } });
    return;
  } catch (error) {
    console.log("Error fetching delta", error)
    res.status(500).send({ error: true, message: "Error with ping" });
    return;
  }
});

router.post('/init', tokenVerificationService.userVerifyAndData, conversationsController.init);

//conversations
router.get('/conversations', tokenVerificationService.userVerifyAndData, conversationsController.getConversations);
router.post('/conversations', tokenVerificationService.userVerifyAndData, conversationsController.createConversations);
router.get('/conversations/:convid', tokenVerificationService.userVerifyAndData, conversationsController.getConversation);
router.delete('/conversations/:convid', tokenVerificationService.userVerifyAndData, conversationsController.deleteConversation);
router.put('/conversations/:convid', tokenVerificationService.userVerifyAndData, conversationsController.updateConversation);
router.put('/team/conversations/:convid', tokenVerificationService.userVerifyAndData, conversationsController.updateTeamConversation);
router.put('/inactive/conversations', tokenVerificationService.userVerifyAndData, conversationsController.updateInactiveConversation);
router.post('/users/conversations', tokenVerificationService.userVerifyAndData, conversationsController.getUsersConversations);
router.post('/users/oneonone/conversations', tokenVerificationService.userVerifyAndData, conversationsController.getUsersOneOnOneConversations);


//messages
router.post('/messages', tokenVerificationService.userVerifyAndData, messagesController.pushMessages);
router.get('/messages', tokenVerificationService.userVerifyAndData, messagesController.getMessages);
router.get('/messages/:msgid', tokenVerificationService.userVerifyAndData, messagesController.getMessage);
router.delete('/messages/:msgid', tokenVerificationService.userVerifyAndData, messagesController.deleteMessage);
router.delete('/messages/', tokenVerificationService.userVerifyAndData, messagesController.deleteMessages);
router.delete('/message/permadelete/:msgid', tokenVerificationService.userVerifyAndData, messagesController.deleteBotMessage)
router.put('/messages/:msgid', tokenVerificationService.userVerifyAndData, messagesController.updateMessage);
router.get('/message/count', tokenVerificationService.userVerifyAndData, messagesController.getMessageCount);
router.post('/update/app/permission', tokenVerificationService.userVerifyAndData, messagesController.updateAppPermission);
router.post('/delete/anymsgs', tokenVerificationService.userVerifyAndData, messagesController.deleteAnyMessages);
router.post('/update/team/join', tokenVerificationService.userVerifyAndData, messagesController.updateTeamJoin);
router.post('/specialmessages', tokenVerificationService.userVerifyAndData, messagesController.overloadPushMessage);
router.get('/specialmessages', tokenVerificationService.userVerifyAndData, messagesController.overloadGetMessages);



router.post('/conversation/poll', tokenVerificationService.userVerifyAndData, messagesController.pushPollMessages);
router.put('/messages/invite/:msgid', tokenVerificationService.userVerifyAndData, messagesController.updateInviteMessage);
router.post('/messages/bulk', tokenVerificationService.userVerifyAndData, messagesController.pushBulkMessage);

router.post('/bulkmessages', tokenVerificationService.userVerifyAndData, bulkMessagesController.pushAnyBulkMessage);


//users
router.post('/users', tokenVerificationService.userVerifyAndData, usersController.createUsers);
router.get('/users/me', tokenVerificationService.userVerifyAndData, usersController.getUser);
router.put('/users/me', tokenVerificationService.userVerifyAndData, usersController.updateUser);
router.get('/users/:userid/mywall', tokenVerificationService.userVerifyAndData, usersController.getMyWall);
//router.get('/users/:userid', tokenVerificationService.userVerifyAndData, usersController.getUser)

//threads
router.post('/threads', tokenVerificationService.userVerifyAndData, threadsController.createThread);
router.get('/threads/:threadid', tokenVerificationService.userVerifyAndData, threadsController.getThread);
router.delete('/threads/:threadid', tokenVerificationService.userVerifyAndData, threadsController.deleteThread);
router.put('/threads/:threadid', tokenVerificationService.userVerifyAndData, threadsController.updateThread);

//workspace
router.get('/workspace/', tokenVerificationService.userVerifyAndData, workspaceController.getWorkspace);

//Notification registration
router.post('/notify/fcmToken', tokenVerificationService.userVerifyAndData, notificationService.newFCMToken);
router.delete('/notify/fcmToken/:device', tokenVerificationService.userVerifyAndData, notificationService.deleteFCMToken);
router.delete('/notify/fcmToken', tokenVerificationService.userVerifyAndData, notificationService.deleteFCMToken);

router.get('/deltas', tokenVerificationService.userVerifyAndData, notificationSvc.getDeltasAPIController);

//for Guest
router.post('/conversation/guest', tokenVerificationService.userVerifyAndData, conversationsController.createGuest);
router.post('/usermywall/conversations', tokenVerificationService.userVerifyAndData, conversationsController.getUsersMywallConv);
router.put('/conversations/guest/:convid', tokenVerificationService.userVerifyAndData, conversationsController.updateGuestConversation);
router.post('/user/guests', tokenVerificationService.userVerifyAndData, usersController.createGuestUser);

//For device id
router.post('/device/', deviceController.newDevice);
router.delete('/device/:device', deviceController.deleteDevice);

router.post('/talk/oneonone', talkController.startOneToOneConference);
router.post('/talk/decline', talkController.endOneToOneConference);
router.post('/talk/ignore', talkController.ignoreOneToOneConference);
router.post('/talk/answer', talkController.answerOneToOneConference);

router.post('/push', tokenVerificationService.userVerifyAndData, clientPushController.pushDelta);
router.post('/pushToWorkspace', tokenVerificationService.userVerifyAndData, clientPushController.pushToWorkspace);



router.post('/talk/oneonone', tokenVerificationService.userVerifyAndData, talkController.startOneToOneConference);
router.post('/talk/decline', tokenVerificationService.userVerifyAndData, talkController.endOneToOneConference);
router.post('/talk/ignore', tokenVerificationService.userVerifyAndData, talkController.ignoreOneToOneConference);
router.post('/talk/answer', tokenVerificationService.userVerifyAndData, talkController.answerOneToOneConference);

module.exports = router;
