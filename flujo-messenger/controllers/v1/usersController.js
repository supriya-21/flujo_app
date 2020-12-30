global.fetch = require('node-fetch');
const { usersModel } = require('../../models/usersModel');
const { userVerifyService } = require('../../services/userVerifyService');
const { conversationsModel } = require('../../models/conversationsModel');
const { notificationSvc } = require('../../services/notificationSvc');
const sha1 = require('sha1');



const usersController = {
    createUsers: (req, res) => {
        //console.log(req.headers.authorization, req.headers.userid, req.headers.workspaceid, 'req')
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else {
            try {
                let userData = req.user_info;
                let userid = userData.id;
                let workspaceid = userData.workspaces[0].id;

                //console.log(resp, 'resp')
                let userObj = {
                    "userId": parseInt(userid),
                    "starredMessages": [],
                    "pinnedConversations": [],
                    "lastSeen": new Date(),
                    "fcmKeys": []
                }
                //console.log(userObj, 'userObj')
                usersModel.insert(req.db, userObj)
                    .then(userRes => {
                        console.log("Successfully created user")
                        res.status(200).send({ error: false, message: "Success", result: userRes, status_code: 100 })
                    }).catch(errors => {
                        console.log("Error creating user : ", errors)
                        res.status(500).send({ error: true, message: "Error while inserting", result: errors, status_code: 160 })
                    })

            } catch (e) {
                res.status(400).send({ error: true, message: "Error while inserting", result: e, status_code: 160 })

            }
        }
    },

    getUser: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization ", status_code: 101 })
        } else {
            let userData = req.user_info;
            let userid = userData.id;
            let workspaceid = userData.workspaces[0].id;
            usersModel.getOne(req.db, parseInt(userid))
                .then(user => {
                    conversationsModel.getAllIds(req.db, parseInt(userid, 10), workspaceid)
                        .then(conversations => {
                            let conversationsArr = []
                            for (var conversation in conversations) {
                                conversationsArr.push(conversations[conversation]["_id"])
                            }
                            user.conversations = conversationsArr
                            // console.log("User obtained : ", user)
                            res.status(200).send({ error: false, message: "Success", result: user, status_code: 100 })
                        }).catch(err => {
                            console.log("Unable to get conversations of user : ", err)
                            res.status(500).send({ error: true, message: "Cannot obtain conversations from database", result: err, status_code: 160 })
                        })
                }).catch(err => {
                    console.log("Cannot obtain user from database", err)
                    res.status(500).send({ error: true, message: "Cannot obtain user from database", result: err, status_code: 160 })
                })
        }
    },

    getUsers: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid && req.params.convid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, workspaceId and convId", status_code: 101 })
        } else {
            console.log("You shouldn't be seeing this message from user controller")
        }
    },
    updateUser: (req, res) => {
        //console.log(req.body)
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization and convId", status_code: 101 })
        } else if (!(req.body.starredMessages || req.body.pinnedConversations || req.body.hideConversations || req.body.muteConversations || req.body.peopleRecentMax || req.body.teamsRecentMax || req.body.reminders)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            // let userData = req.user_info;
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            let updateObj = {};
            if (req.body.starredMessages) { updateObj['starredMessages'] = req.body.starredMessages; }
            if (req.body.pinnedConversations) { updateObj['pinnedConversations'] = req.body.pinnedConversations; }
            if (req.body.hideConversations) { updateObj['hideConversations'] = req.body.hideConversations; }
            if (req.body.muteConversations) { updateObj['muteConversations'] = req.body.muteConversations; }
            if (req.body.peopleRecentMax) { updateObj['peopleRecentMax'] = req.body.peopleRecentMax; }
            if (req.body.teamsRecentMax) { updateObj['teamsRecentMax'] = req.body.teamsRecentMax; }
            if (req.body.reminders) { updateObj['reminders'] = req.body.reminders; }
            usersModel.update(req.db, parseInt(userid), updateObj)
                .then(conversations => {
                    console.log("Successfully updated user")
                    let delta = {
                        workspace: workspaceid,
                        user: userid,
                        event_ts: Date.now(),
                        data: updateObj,
                        type: 'messenger.update_user_me',
                    }
                    delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13);
                    notificationSvc.notifyUser(delta);
                    res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
                }).catch(err => {
                    console.log("Error updating user", err)
                    res.status(500).send({ error: true, message: "Error updating user", result: err, status_code: 160 })
                })
        }
    },
    createGuestUser: (req, res) => {
        // console.log(req.headers.userid, req.headers.workspaceid, 'req')
        if (!(req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected userId and workspaceId", status_code: 101 })
        } else {
            console.log('createGuestUser')
            try {
                // let userData = req.user_info;
                let userid = req.headers.userid;
                let workspaceid = req.headers.workspaceid;
                console.log('createGuestUser')
                let userObj = {
                    "userId": parseInt(userid),
                    "starredMessages": [],
                    "pinnedConversations": [],
                    "lastSeen": new Date(),
                    "fcmKeys": []
                }
                //console.log(userObj, 'userObj')
                //find or create
                usersModel.getOne(req.db, parseInt(userid)).then(userDetail => {
                    console.log(userDetail, 'user detatils')
                    if (userDetail === null) {
                        usersModel.insert(req.db, userObj)
                            .then(userRes => {
                                console.log("Successfully created user", userRes)
                                res.status(200).send({ error: false, message: "Success", result: userRes, status_code: 100 })
                            }).catch(errors => {
                                console.log("Error creating user : ", errors)
                                res.status(500).send({ error: true, message: "Error while inserting", result: errors, status_code: 160 })
                            })
                    } else {
                        console.log('findres', userDetail)
                        res.status(200).send({ error: false, message: "Success", result: userDetail, status_code: 100 })
                    }
                }).catch(error => {
                    res.status(500).send({ error: true, message: "Error while finding", result: error, status_code: 160 })
                })

            } catch (e) {
                res.status(400).send({ error: true, message: "Error while inserting", result: e, status_code: 160 })

            }
        }
    },
    getMyWall: (req, res) => {
        if (!(req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected 'workspaceid' in header", status_code: 101 })
        } else {
        let workspaceid = req.headers.workspaceid;
        conversationsModel.getMyWall(req.db, req.params.userid, workspaceid)
            .then(conversations => {
                // console.log(conversations)
                if (conversations.length !== 1) {
                    //Check isOneToOne true before sending it out.
                    res.status(404).send({ error: true, message: "My wall not found", result: {}, status_code: 101 })
                } else {
                    res.status(200).send({ message: "Success", result: conversations[0]._id, error: false, status_code: 100 })
                }
            }).catch(err => {
                console.log("Unable to find my wall conversation", err)
                res.status(500).send({ error: true, message: "Error in db", result: {}, status_code: 102 })
            })
        }
    }
}

module.exports = { usersController };