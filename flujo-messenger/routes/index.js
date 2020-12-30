var express = require('express');
var router = express.Router();
// var {stubsController}= require('../controllers/v0/stubsController');
var {userVerifyService}= require('../services/userVerifyService');
var {notificationService} = require('../services/notificationService')
//userVerifyService

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//v0 Stubs
// router.get('/conversations',stubsController.conversations);
// router.post('/conversations', stubsController.addConversations);
// router.get('/conversations/:convid', stubsController.userConversation);
// router.delete('/conversations/:convid', stubsController.deleteConversations);
// router.get('/messages', stubsController.unreadMessage);
// router.get('/messages/conversation', stubsController.conversationMessages);
// router.get('/messages/:msgid', stubsController. messageObject);
// router.delete('/messages/:msgid', stubsController.deleteMessage);
// router.post('/messages', stubsController.pushMessage);
// router.get('/threads/:threadid', stubsController.threadMessages);

router.get('/pushNotification', notificationService.push)




module.exports = router;
