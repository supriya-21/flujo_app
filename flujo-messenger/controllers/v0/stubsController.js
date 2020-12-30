
// global.fetch = require('node-fetch');
// const jwt = require('jsonwebtoken');
// const { userVerifyService } = require('../../services/userVerifyService');


// const stubsController = {

//     conversations: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid) {
//             // userVerifyService.isValidUser(req.headers.authorization)
//             //     .then(resp => {

//                     conversations = {
//                         data: [
//                             {
//                                 "convId": 1,
//                                 "members": [0, 1, 2, 3, 4, 5],
//                                 "admins": [1, 2],
//                                 "guests": [5],
//                                 "name": "Team dev",
//                                 "description": "dev desc",
//                                 "pinnedMessages": [],
//                                 "threads": [],
//                                 "workspaceId": req.headers.workspaceid,
//                                 "lastUpdated": "2019-08-09 07:11:22",
//                                 "isOneToOne": false,
//                                 "teamType": "public",
//                                 "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                                 "apps": []
//                             },
//                             {
//                                 "convId": 2,
//                                 "members": [0, 1, 2, 3, 4, 5],
//                                 "admins": [1, 2],
//                                 "guests": [5],
//                                 "name": "Team dev",
//                                 "description": "dev desc",
//                                 "pinnedMessages": [],
//                                 "threads": [],
//                                 "workspaceId": req.headers.workspaceid,
//                                 "lastUpdated": "2019-08-09 07:11:22",
//                                 "isOneToOne": false,
//                                 "teamType": "public",
//                                 "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                                 "apps": []
//                             },
//                             {
//                                 "convId": 3,
//                                 "members": [0, 1, 2, 3, 4, 5],
//                                 "admins": [1, 2],
//                                 "guests": [5],
//                                 "name": "Team dev",
//                                 "description": "dev desc",
//                                 "pinnedMessages": [],
//                                 "threads": [],
//                                 "workspaceId": req.headers.workspaceid,
//                                 "lastUpdated": "2019-08-09 07:11:22",
//                                 "isOneToOne": false,
//                                 "teamType": "public",
//                                 "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                                 "apps": []
//                             }
//                         ],
//                         offset: 0,
//                         limit: 10,
//                         total: 3
//                     };

//                     res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
//                 // }).catch(cogErr => {
//                 //     res.status(400).send({ error: false, message: "Token Error!", result: cogErr, status_code: 150 })

//                 // })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
//         }

//     },

//     addConversations: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.body.conObject) {
//             conversations = {
//                 data: [
//                     {
//                         "convId": 1,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     },
//                     {
//                         "convId": 2,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     },
//                     {
//                         "convId": 3,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     }
//                 ],
//                 offset: 0,
//                 limit: 10,
//                 total: 3
//             };
//             conversations.data.push(req.body.conObject)
//             res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
//         }

//     },

//     deleteConversations: async (req, res) => {
//         console.log(req.params.convid, 'req.params.convid')
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.convid) {
//             conversations = {
//                 data: [
//                     {
//                         "convId": 1,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     },
//                     {
//                         "convId": 2,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     },
//                     {
//                         "convId": 3,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     }
//                 ],
//                 offset: 0,
//                 limit: 10,
//                 total: 3
//             };
//             await conversations.data.filter((el) => {
//                 if (el.convId != req.params.convid) {
//                     return true;

//                 }
//             })
//             res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
//         }

//     },


//     userConversation: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.convid) {
//             conversations = {
//                 "convId": req.params.convid,
//                 "members": [0, 1, 2, 3, 4, 5],
//                 "admins": [1, 2],
//                 "guests": [5],
//                 "name": "Team dev",
//                 "description": "dev desc",
//                 "pinnedMessages": [],
//                 "threads": [],
//                 "workspaceId": req.headers.workspaceid,
//                 "lastUpdated": "2019-08-09 07:11:22",
//                 "isOneToOne": false,
//                 "teamType": "public",
//                 "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                 "apps": []
//             }
//             res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId,workspaceId and conversationId", status_code: 101 })
//         }
//     },

//     unreadMessage: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid) {
//             var offset = (req.query.offset) ? req.query.offset : 0;
//             var limit = (req.query.limit) ? req.query.limit : 10;
//             var status = (req.query.status) ? req.query.status : 'sent';
//             messages = {

//                 "messages": [
//                     {
//                         "msgId": 1,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 2,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": status,
//                         "status": "sent",
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 2,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 4,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": status,
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 3,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 3,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": status,
//                         "timestamp": "2019-08-09 07:11:22"
//                     }
//                 ],
//                 "offset": offset,
//                 "limit": limit,
//                 "total": 3
//             }
//             res.status(200).send({ error: false, message: "Success", result: messages, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId,workspaceId and conversationId", status_code: 101 })
//         }
//     },

//     conversationMessages: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.headers.convid) {
//             var offset = (req.query.offset) ? req.query.offset : 0;
//             var limit = (req.query.limit) ? req.query.limit : 10;
//             var status = (req.query.status) ? req.query.status : 'sent';
//             messages = {

//                 "messages": [
//                     {
//                         "msgId": 1,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": req.headers.convid,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": status,
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 2,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": req.headers.convid,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": status,
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 3,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": req.headers.convid,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": status,
//                         "timestamp": "2019-08-09 07:11:22"
//                     }
//                 ],
//                 "offset": offset,
//                 "limit": limit,
//                 "total": 3
//             }
//             res.status(200).send({ error: false, message: "Success", result: messages, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId,workspaceId and convid", status_code: 101 })
//         }
//     },

//     messageObject: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid) {
//             messages = {
//                 "msgId": req.params.msgid,
//                 "from": 2,
//                 "to": req.headers.userid,
//                 "convID": 2,
//                 "workspaceID": req.headers.workspaceid,
//                 "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                 "encryption": {},
//                 "replyingTo": null,
//                 "threadID": null,
//                 "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                 "topics": [],
//                 "reactions": [{ "userId": 1, reaction: "like" }],
//                 "status": 'sent',
//                 "timestamp": "2019-08-09 07:11:22"
//             },
//                 res.status(200).send({ error: false, message: "Success", result: messages, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId,workspaceId and msgId", status_code: 101 })
//         }
//     },

//     pushMessage: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.body.messageObject) {
//             messages = {
//                 "messages": [
//                     {
//                         "msgId": 1,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 2,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": "sent",
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 2,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 4,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": 'sent',
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 3,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 3,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": 'sent',
//                         "timestamp": "2019-08-09 07:11:22"
//                     }
//                 ],
//             }
//             messages.messages.push(req.body.messageObject)
//             res.status(200).send({ error: false, message: "Success", result: messages, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and messageObject", status_code: 101 })
//         }

//     },

//     deleteMessage: async (req, res) => {

//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.msgid) {
//             messages = {
//                 "messages": [
//                     {
//                         "msgId": 1,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 2,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": "sent",
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": 2,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 4,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": 'sent',
//                         "timestamp": "2019-08-09 07:11:22"
//                     },
//                     {
//                         "msgId": req.params.msgid,
//                         "from": 2,
//                         "to": req.headers.userid,
//                         "convID": 3,
//                         "workspaceID": req.headers.workspaceid,
//                         "msg": "Hello. This is a text message with <link a='https://someurl.com'>a link</link> and some formatting like <bold>Bold</bold>, <italics>italics</italics> etc. <br/>It can also support code like <code>import module\nprintln(\"Some line\")</code>. A mention would look like <mention userId=id/>. We can also add an action to occur on clicking <action call=functionURI/> like a calendar event.Maybe even embedded media like <media a='mediaURI or mediaID'>",
//                         "encryption": {},
//                         "replyingTo": null,
//                         "threadID": null,
//                         "msgNum": "An incrementing number in the context of the conversation for indexing/sorting",
//                         "topics": [],
//                         "reactions": [{ "userId": 1, reaction: "like" }],
//                         "status": 'sent',
//                         "timestamp": "2019-08-09 07:11:22"
//                     }
//                 ],
//             }
//             await messages.messages.filter(el => {
//                 if (el.msgId != req.params.msgid) {
//                     return true;
//                 }
//             })
//             res.status(200).send({ error: false, message: "Success", result: messages, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and msgid", status_code: 101 })
//         }

//     },
//     threadMessages: (req, res) => {
//         if (req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.threadid) {
//             var offset = (req.query.offset) ? req.query.offset : 0;
//             var limit = (req.query.limit) ? req.query.limit : 10;
//             var status = (req.query.status) ? req.query.status : 'sent';
//             conversations = {
//                 data: [
//                     {
//                         "convId": 1,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [req.params.threadid],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     },
//                     {
//                         "convId": 2,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [req.params.threadid],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     },
//                     {
//                         "convId": 3,
//                         "members": [0, 1, 2, 3, 4, 5],
//                         "admins": [1, 2],
//                         "guests": [5],
//                         "name": "Team dev",
//                         "description": "dev desc",
//                         "pinnedMessages": [],
//                         "threads": [req.params.threadid],
//                         "workspaceId": req.headers.workspaceid,
//                         "lastUpdated": "2019-08-09 07:11:22",
//                         "isOneToOne": false,
//                         "teamType": "public",
//                         "invitationType": "Anybody can join, request, see all messages or only some, invite",
//                         "apps": []
//                     }
//                 ],
//                 "offset": offset,
//                 "limit": limit,
//                 "total": 3
//             };

//             res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
//         } else {
//             res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and threadId", status_code: 101 })
//         }

//     },


// }

// module.exports = { stubsController };
