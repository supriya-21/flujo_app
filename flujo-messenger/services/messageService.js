const { messagesModel } = require('../models/messagesModel')
const { notificationService } = require('../services/notificationService')

const messageService = {
  pushMessage: (ownerid, convId, workspaceid, params, db) => {
    console.log(ownerid, convId, workspaceid,params, 'ownerid, appid, convId, workspaceid, user_name, app_name')
    let msgObj = {
      "from": 0,
      "to": [`${ownerid}`],
      "convId": convId,
      "workspaceId": parseInt(workspaceid),
      // "msg": `@${params.user_name} requested you to grant the access for ${params.app_name}. Click on allow to accept and decline to reject.`,     
      "msg": `<span class="mention" data-index="2" data-denotation-char="@" data-id="${params.userid}" data-value="${params.user_name}">
                <span contenteditable="false"><span class="ql-mention-denotation-char">@</span>${params.user_name}</span>
                </span> is requesting access for ${params.app_name} application.`, 
      "metaMsg": {
        "appDirectory": {
          "userId": parseInt(params.userid),
          "ownerId": ownerid,
          "appId": params.app_id,
          "appName": params.app_name,
          "isAccepted": 0,
          "isAcceptedBy": 0,
          "isAcceptedByName": "",
          "info": 1
        }
      },
      "isForward": false,
      "encryption": {
      },
      "topics": [],
      "reactions": [],
      "replyingTo": null,
      "threadId": null,
      "msgNum": 9,
      "status": "sent",
      "timestamp": new Date(),
      "delivered": [ownerid],
      "read": [ownerid],
      "hashtags": [],
      "links": [],
      "msgPlainText": `@${params.user_name} requested you to grant the access for ${params.app_name}.`,
      "mentions": []
    }
    messagesModel.insert(db, msgObj)
      .then(msgResp => {
        console.log('pushmsgResp')
        console.log("Successfully inserted data. Sending notifications")
        let delta = { type: "messenger.new_message", workspace: workspaceid, data: msgResp.ops[0] }
        notificationService.push(db, convId, params.userid, "NewMessage", [msgResp.ops[0]._id], delta)
      }).catch(errors => {
        console.log("Error inserting message to database")
      })
  },

  pushMessageFromBot: (db, convId, msg, workspaceid, userid, metaMsg, msg_body) => {
    // console.log(convId, msg, workspaceid, userid,metaMsg, 'convId, msg, workspaceid, userid, metaMsg')
    return new Promise((resolve, reject) => {
      let msgObj = {
        "from": 0,
        "to": false,
        "convId": convId,
        "workspaceId": parseInt(workspaceid),
        "msg": msg_body,
        "metaMsg": (metaMsg) ? metaMsg : null,
        "isForward": false,
        "encryption": {
        },
        "topics": [],
        "reactions": [],
        "replyingTo": null,
        "threadId": null,
        "msgNum": 9,
        "status": "sent",
        "timestamp": new Date(),
        "delivered": [],
        "read": [],
        "hashtags": [],
        "links": [],
        "msgPlainText": msg,
        "mentions": []
      }
      messagesModel.insert(db, msgObj)
        .then(msgResp => {
          // console.log(msgResp, 'msgResp')
          console.log("Successfully inserted data. Sending notifications")
          let delta = { type: "messenger.new_message", workspace: workspaceid, data: msgResp.ops[0] }
          notificationService.push(db, convId, userid, "NewMessage", [msgResp.ops[0]._id], delta)
          resolve({ error: false, convId: convId, message: 'success' })
        }).catch(errors => {
          console.log("Error inserting message to database")
          resolve({ error: true, convId: convId, message: 'fail' })

        })
    })
  },
  pushMsgs: (db, convId, from,  body, userid, workspaceid) => {
    // console.log(convId, msg, workspaceid, userid,metaMsg, 'convId, msg, workspaceid, userid, metaMsg')
    return new Promise((resolve, reject) => {
     let  msgObj = {
        "from": from,
        "to": (body.to) ? body.to : false,
        "convId":convId,
        "workspaceId": parseInt(workspaceid),
        "msg": (body.msg) ? body.msg : "",
        "metaMsg": (body.metaMsg) ? body.metaMsg : null,
        "isForward": (body.isForward) ? true : false,
        "encryption": {},
        "replyingTo": (body.replyingTo) ? body.replyingTo : null,
        "threadId": (body.threadId) ? body.threadId : null,
        "msgNum": (body.msgNum) ? (body.msgNum) : 9,
        "topics": (body.topics) ? body.topics : [],
        "reactions": [],
        "status": "sent",
        "timestamp": new Date(),
        "delivered": (from === 0) ? [] : [parseInt(userid)],
        "read": (from === 0) ? [] : [parseInt(userid)],
        "hashtags": [],
        "links": (body.links) ? body.links : [],
        "msgPlainText": (body.msgPlainText) ? body.msgPlainText : (body.msg) ? body.msg : '',
        "mentions": (body.mentions) ? body.mentions : [],
    }
      messagesModel.insert(db, msgObj)
        .then(msgResp => {
          // console.log(msgResp, 'msgResp')
          console.log("Successfully inserted data. Sending notifications")
          let delta = { type: "messenger.new_message", workspace: workspaceid, data: msgResp.ops[0] }
          notificationService.push(db, convId, userid, "NewMessage", [msgResp.ops[0]._id], delta)
          resolve({ error: false, convId: convId, message: 'success' })
        }).catch(errors => {
          console.log("Error inserting message to database")
          resolve({ error: true, convId: convId, message: 'fail' })

        })
    })
  },


  pushDynamicMessageFromBot :(db,msgObj, userid) => {
    //  console.log(msgObj, userid, 'db,msgObj, userid')
     return new Promise((resolve, reject) =>{
      
      messagesModel.insert(db, msgObj)
        .then(msgResp => {
  
         console.log(msgObj.convId, 'msgObj.convId') 
         console.log(msgResp.ops[0]._id, 'msgResp.ops[0]._id') 
          // console.log(msgResp, 'msgResp')
          console.log("Successfully inserted data. Sending notifications")
          let delta = { type: "messenger.new_message", workspace: msgObj.workspaceId, data: msgResp.ops[0] }
          notificationService.push(db, msgObj.convId, userid, "NewMessage", [msgResp.ops[0]._id], delta)
          resolve({ error: false, convId: msgObj.convId, message:'success'})
        }).catch(errors => {
          console.log(errors, "Error inserting message to database")
          resolve({ error: true, convId: msgObj.convId, message:'fail'})
        })
     })
  
    }
}

module.exports = { messageService }