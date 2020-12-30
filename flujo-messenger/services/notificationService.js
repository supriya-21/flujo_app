const axios = require('axios');
const { usersModel } = require('../models/usersModel');
const { conversationsModel } = require('../models/conversationsModel');
const { notificationSvc } = require('./notificationSvc')
const sha1 = require('sha1');

/* curl -i -H 'Content-type: application/json' \
-H 'Authorization: key=AAAA7mrHqes:APA91bH-b-ND___fByT5uZmui_kDpGDcERsYfdRsYRlSvz-RHL-BPTSVSMj9IUSBGAL3wNtYPId5vQQe4fBXLtPCldo6TbtH_bE0GQhwd5ojwWc51Gpv56u0U7SjVxR7ppzBF88kybBi' \
-XPOST https://fcm.googleapis.com/fcm/send \
-d '{
  "registration_ids":["fBDVJp60UZA:APA91bEiwUrGimqeh1VY__fOumnojfDYNS8oijlUdoO5THIvOPYUCSTxgWOew3kH2TeO-la9o4zUD6pbvu82mTHS5uvkrkU5tE0YtMPzHV-cBa8xJjBmcRPW-cnSxXJo4Ad6z_cM7D53"],
  "notification": {
      "title":"Title of your notification",
      "body":"content of your notification"
  },
  "data": {
    "key1" : "value1",
    "key2" : "value2",
    "key3" : 23.56565,
    "key4" : true
  }
}'

//Curl command to send notification.
//Need to write an api to receive tokens which will be used as registration_ids
//And a function to trigger notification
*/


const notificationService = {

  getUserKey: (db, userId, workspace) => {
    console.log("Getting FCM keys for user : ", userId)
    return new Promise(async (resolve, reject) => {
      usersModel.getOne(db, parseInt(userId))
        .then(user => {
          //console.log(user, 'user')

          if (user) {
            if (typeof user.fcmToken != 'undefined' && user.fcmToken.length > 0) {
              //console.log(user.fcmKeys, 'user.fcmKeys')
              console.log("FCM keys obtained successfully")
              let fcmTokens = [];
              user.fcmToken.forEach(device => {
                // console.log(device);
                if (String(device.workspace) === String(workspace)) {
                  fcmTokens.push(device.device)
                }
              })
              resolve({ user_id: userId, status: true, message: 'Success', keys: fcmTokens });
            } else {
              console.log("No FCM keys found")
              resolve({ user_id: userId, status: false, message: 'No kyes found', keys: '' });
            }
          } else {
            console.log("FCM => User not found")
            resolve({ user_id: userId, status: false, message: 'User not found', keys: '' });

          }
        })

    })

  },

  // getUserKey: (db, userId) => {
  //   console.log("Getting FCM keys for user : ", userId)
  //   return new Promise(async (resolve, reject) => {
  //     usersModel.getOne(db, parseInt(userId))
  //       .then(user => {
  //         //console.log(user, 'user')

  //         if (user) {
  //           if (typeof user.fcmKeys != 'undefined' && user.fcmKeys.length > 0) {
  //             //console.log(user.fcmKeys, 'user.fcmKeys')
  //             console.log("FCM keys obtained successfully")
  //             resolve({ user_id: userId, status: true, message: 'Success', key: user.fcmKeys[0] });
  //           } else {
  //             console.log("No FCM keys found")
  //             resolve({ user_id: userId, status: false, message: 'No kyes found', key: '' });
  //           }
  //         } else {
  //           console.log("FCM => User not found")
  //           resolve({ user_id: userId, status: false, message: 'User not found', key: '' });

  //         }
  //       })

  //   })

  // },
  //New conversation - Data has convId
  //Delete message - Data has mesgId and convId

  push: (db, convid, userid, notification, msgId = [], delta = {}) => { //Should take userId and convId as parameters, find fcm key from user object and notify
    const FCM_URL = process.env.FCM_URL;
    const FCM_KEY = process.env.FCM_KEY;
    // console.log('Posting to FCM_URL : ', FCM_URL)
    const instance = axios.create({
      timeout: 1000,
      headers: { 'Authorization': 'key=' + FCM_KEY }
    });

    // console.log("Firebase instance created")
    try {
      // console.log("convId : ", convid, " and userId : ", userid);
      conversationsModel.getOne(db, convid)
        .then(conversation => {
          // console.log('conversation obtained: ', conversation)
          if (conversation) {
            var registrationIds = []
            // console.log('conversation.members : ', conversation.members);
            registrationIds = conversation.members.map(userId => {
              try {
                delta.user = String(userId)

                notificationSvc.notifyUser(delta);
              } catch (e) {
                console.log("Socket notif failed, ", e)
              }
              // if (parseInt(userId) != parseInt(userid)) {

              // } else {
              //   return { user_id: userid, status: false, message: 'Self notification not required', key: '' };
              // }

            })
            if (delta.type === 'messenger.new_message') {
              const index = conversation.members.indexOf(delta.data.from);
              if (index > -1) {
                conversation.members.splice(index, 1);
              }
              notificationSvc.pushFCM(conversation.members, delta.workspace);
              // return notificationService.getUserKey(db, userId, delta.workspace);
            }

            // var result = Promise.all(registrationIds);
            // result.then(idsResp => {
            //   console.log('FCM => ', result, 'registrationIds')
            //   var success = [];
            //   var fail = [];
            //   var i = 0;
            //   do {
            //     if (idsResp[i].status) {
            //       success = [...success, ...idsResp[i].keys]
            //       i++;
            //     } else {
            //       fail = [...fail, idsResp[i]]
            //       i++;
            //     }

            //   } while (i < idsResp.length) {

            //     //     // console.log(success, 'success')
            //     let msgIdsStr = {}
            //     msgIdsStr.messages = msgId
            //     //     //console.log(msgIdsStr)

            //     instance.post(FCM_URL, {
            //       "registration_ids": success,
            //       "notification": {
            //         "title": "FLUJO",
            //         "body": "You may have new messages"
            //       },
            //       "data":
            //       {
            //         "title": `MissedDeltas`,
            //       }
            //     })
            //       .then((response) => {
            //         console.log("FCM => Notification successful");
            //         //res.status(200).send({ error: false, message: "Success", result: {}, status_code: 100 })

            //       })
            //       .catch((error) => {
            //         console.log("FCM => Notification failed");
            //         //res.status(400).send({ error: true, message: "Error while pushing notification", result: errors, status_code: 160 })  
            //       })
            //   }

            //   // console.log(idsResp, 'idsResp')
            // })
          } else {
            console.log("notificationService => Conversation Not found!")
          }
        }).catch(convErr => {
          console.log("notificationService => Conversation Error ", convErr);
        })
    } catch (e) {
      console.log("notificationService => Exception at notification push")
    }
  },

  // exponentialBackoffNotification: (userId) => {
  //   console.log("To Do")
  // },


  newToken: (req, res) => {
    if (!(req.headers.authorization)) {
      res.status(400).send({ error: true, message: "Expected authorization, userId, and workspaceId ", status_code: 101 })
    } else {
      let userData = req.user_info;
      let userid = userData.id;
      let workspaceid = userData.workspaces[0].id;
      usersModel.getOne(req.db, parseInt(userid))
        .then(user => {
          if (!(req.body.fcmKey)) {
            res.status(400).send({ error: true, message: "Require fcmKey", result: {}, status_code: 160 })
          }
          else {

            user.fcmKeys = [req.body.fcmKey]
            console.log(user)
            usersModel.update(req.db, user["userId"], user).
              then(result => {
                console.log("Successfully inserted FCM keys")
                res.status(200).send({ error: false, message: "Success", status_code: 100, result: {} })
              }).
              catch(err => {
                console.log("Unable to add keys to users db", err)
                res.status(500).send({ error: true, message: "Unable to add keys to users db", result: err, status_code: 160 })
              })
          }
        }).catch(err => {
          console.log("Unable to find user.", err)
          res.status(500).send({ error: true, message: "Unable to find user", result: err, status_code: 160 })
        })

    }
  },
  newFCMToken: (req, res) => {
    let userData = req.user_info;
    let userid = userData.id;
    let workspaceid = userData.workspaces[0].id;
    usersModel.getOne(req.db, parseInt(userid))
      .then(user => {
        if (!(req.body.fcmKey)) {
          res.status(400).send({ error: true, message: "Require fcmKey in body", result: {}, status_code: 160 });
          return;
        }
        else {
          if (user.fcmToken) {
            user.fcmToken.push({ device: req.body.fcmKey, workspace: workspaceid })
          } else {
            user.fcmToken = [{ device: req.body.fcmKey, workspace: workspaceid }]
          }
          user.fcmToken = user.fcmToken.filter((device, index, self) => self.findIndex(t => t.workspace === device.workspace && t.device === device.device) === index)
          // console.log(user)
          usersModel.update(req.db, user["userId"], user).
            then(result => {
              // console.log("Successfully inserted Device id")
              res.status(200).send({ error: false, message: "Successfully inserted Device id", status_code: 100, result: {} });
              return;
            }).
            catch(err => {
              console.log("Unable to add device keys to users db", err)
              res.status(500).send({ error: true, message: "Unable to add device keys to users db", result: err, status_code: 160 });
              return;
            })
        }
        user.fcmToken = user.fcmToken.filter((device, index, self) => self.findIndex(t => t.workspace === device.workspace && t.device === device.device) === index)
        console.log(user)
        usersModel.update(req.db, user["userId"], user)
          .then(result => {
            console.log("Successfully inserted Device id")
            res.status(200).send({ error: false, message: "Successfully inserted Device id", status_code: 100, result: {} });
            return;
          })
          .catch(err => {
            console.log("Unable to add device keys to users db", err)
            res.status(500).send({ error: true, message: "Unable to add device keys to users db", result: err, status_code: 160 });
            return;
          })
        // }
      }).catch(err => {
        console.log("Unable to find user.", err)
        res.status(500).send({ error: true, message: "Unable to find user", result: err, status_code: 160 });
        return;
      })

    //}
  },
  // deleteFCMToken: (req, res) => {
  //   if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
  //     res.status(400).send({ error: true, message: "Expected authorization, userId, and workspaceId ", status_code: 101 })
  //   } else {
  //     usersModel.getOne(req.db, parseInt(req.headers.userid))
  //       .then(user => {
  //         user.fcmKeys = []
  //         console.log(user)
  //         usersModel.update(req.db, user["userId"], user).
  //           then(result => {
  //             console.log("Successfully deleted FCM keys")
  //             res.status(200).send({ error: false, message: "Success", status_code: 100, result: {} })
  //           }).
  //           catch(err => {
  //             console.log("Unable to delete keys of users db", err)
  //             res.status(500).send({ error: true, message: "Unable to delete keys of user", result: err, status_code: 160 })
  //           })

  //       }).catch(err => {
  //         console.log("Unable to find user.", err)
  //         res.status(500).send({ error: true, message: "Unable to find user", result: err, status_code: 160 })
  //       })

  //   }
  // }

  deleteFCMToken: (req, res) => {
    // if (!(req.headers.userid)) {
    //   res.status(400).send({ error: true, message: "Expected userId", status_code: 101 })
    // } else {
    let userData = req.user_info;
    let userid = userData.id;
    let workspaceid = userData.workspaces[0].id;
    usersModel.getOne(req.db, parseInt(userid))
      .then(user => {
        console.log(req.params.device)
        user.fcmToken = user.fcmToken.filter((ele) => {
          return ele.device !== req.params.device || ele.workspace !== workspaceid;
        });
        // user.device = []
        console.log(user)
        usersModel.update(req.db, user["userId"], user).
          then(result => {
            console.log("Successfully deleted FCM keys")
            res.status(200).send({ error: false, message: "Success", status_code: 100, result: {} })
          }).
          catch(err => {
            console.log("Unable to delete keys of users db", err)
            res.status(500).send({ error: true, message: "Unable to delete keys of user", result: err, status_code: 160 })
          })

      }).catch(err => {
        console.log("Unable to find user.", err)
        res.status(500).send({ error: true, message: "Unable to find user", result: err, status_code: 160 })
      })

  }
  // }

}

module.exports = { notificationService }