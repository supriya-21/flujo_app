global.fetch = require('node-fetch');
const { usersModel } = require('../../models/usersModel');
const { conversationsModel } = require('../../models/conversationsModel');
const { userVerifyService } = require('../../services/userVerifyService');
const { notificationService } = require('../../services/notificationService');
const { notificationSvc } = require('../../services/notificationSvc');
const { teamService } = require('../../services/teamService');
const { botService } = require('../../services/botService')
const { messageService } = require('../../services/messageService');
const sha1 = require('sha1');


const conversationsController = {

    init: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId.", status_code: 101 })
        } else {
            // let userData = req.user_info;
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            userVerifyService.getWorkspaceUsers(req.headers.authorization, userid, workspaceid)
                .then(wsResp => {
                    userVerifyService.getUserConvObj(wsResp, userid, workspaceid)
                        .then(idResp => {
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
                                    conversationsModel.bulkCreate(req.db, idResp)
                                        .then(conversations => {
                                            console.log("Successfully created one to one conversations")
                                            conversations.ops.forEach(conversation => {
                                                try {
                                                    console.log('Sending only to old users')
                                                    conversation.members.forEach(member => {
                                                        if (parseInt(member) !== parseInt(userid)) {
                                                            let delta = {
                                                                user: String(member),
                                                                event_ts: Date.now(),
                                                                type: "messenger.new_conversation",
                                                                workspace: workspaceid,
                                                                data: conversation
                                                            }
                                                            delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
                                                            notificationSvc.notifyUser(delta);
                                                        }
                                                    })
                                                    // notificationSvc.push(req.db, conversation._id, userid, "NewConversation", [], delta)
                                                } catch (error) {
                                                    console.log("New user conversation notification failed", error);
                                                }
                                            })
                                            let event = {
                                                "type": "app.new_workspace",
                                                "user": String(userid),
                                                "workspace": String(workspaceid),
                                                "timestamp": "1515449522.000016",
                                                "eventid": "U0LAN0Z89",
                                                "text": "Hello, welcome to Flujo!",
                                                "channel": "C0LAN2Q65",
                                                "event_ts": "1515449522000016"
                                            }
                                            botService.newBotEvent(event);
                                            res.status(200).send({ error: false, message: "Success", result: { "conversations": conversations, "total": conversations.length }, status_code: 100 })
                                        }).catch(errors => {
                                            console.log("Error creating one to one conversations for user : ", errors)
                                            res.status(500).send({ error: true, message: "Error creating one to one conversations for user", result: errors, status_code: 160 })
                                        })
                                    //res.status(200).send({ error: false, message: "Success", result: userRes, status_code: 100 })
                                }).catch(errors => {
                                    console.log("Error inserting user : ", errors)
                                    res.status(500).send({ error: true, message: "Error while inserting", result: errors, status_code: 160 })
                                })

                        }).catch(idErr => {
                            console.log("Errors while getting users", idErr)
                            res.status(500).send({ error: true, message: "Errors while getting users!", result: idErr, status_code: 160 })
                        })
                }).catch(wsErr => {
                    res.status(403).send({ error: true, message: "Unauthorized", result: wsErr, status_code: 160 })

                })
        }
    },
    getConversations: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization.", status_code: 101 })
        } else {
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            conversationsModel.getAll(req.db, parseInt(userid), parseInt(workspaceid))
                .then(conversations => {
                    console.log(conversations, 'conversations')
                    if (conversations.length > 0) {
                        let teamConvIds = [];
                        let userConvIds = [];
                        conversations.map(convs => {
                            if (!convs.isOneToOne) {
                                teamConvIds = [...teamConvIds, convs._id + ""]
                            } else {
                                userConvIds = [...userConvIds, convs._id + ""]
                            }
                        })
                        if (teamConvIds.length > 0) {
                            teamService.getTeams(req.headers.authorization, parseInt(workspaceid), teamConvIds)
                                .then(dataResp => {
                                    var finalObj = [];
                                    let addMember = 0;
                                    let addGuest = 0;
                                    let addApp = 0;
                                    conversations.map(convrs => {
                                        if (!convrs.isOneToOne) {
                                            dataResp.some(teams => {
                                                if (convrs._id == teams.conversation_id) {
                                                    if (teams.team_user_preferences.length > 0) {
                                                        addMember = (teams.team_user_preferences[0].add_member !== undefined) ? teams.team_user_preferences[0].add_member : 0;
                                                        addGuest = (teams.team_user_preferences[0].add_guest !== undefined) ? teams.team_user_preferences[0].add_guest : 0;
                                                        addApp = (teams.team_user_preferences[0].add_app !== undefined) ? teams.team_user_preferences[0].add_app : 0;
                                                    } else {
                                                        addMember = 0;
                                                        addGuest = 0;
                                                        addApp = 0;
                                                    }
                                                    finalObj = [...finalObj, {
                                                        "_id": convrs._id,
                                                        "members": convrs.members,
                                                        "pendingMembers": convrs.pendingMembers,
                                                        "guests": convrs.guests,
                                                        "name": teams.name,
                                                        "admins": convrs.admins,
                                                        "description": teams.description,
                                                        "isOneToOne": convrs.isOneToOne,
                                                        "teamType": teams.type,
                                                        "invitationType": teams.invitationType,
                                                        "pinnedMessages": convrs.pinnedMessages,
                                                        "threads": convrs.threads,
                                                        "workspaceId": convrs.workspaceId,
                                                        "lastUpdated": convrs.lastUpdated,
                                                        "apps": [],
                                                        "timestamp": convrs.timestamp,
                                                        "lastMessageNumber": convrs.lastMessageNumber,
                                                        "bucket_name": teams.bucket_name,
                                                        "created_by": teams.created_by,
                                                        "team_id": teams.id,
                                                        "addMember": addMember,
                                                        "addGuest": addGuest,
                                                        "addApp": addApp,
                                                        "isActive": (!convrs.hasOwnProperty('isActive') || convrs.isActive === null) ? 1 : convrs.isActive
                                                    }]
                                                }
                                            })
                                        } else {
                                            finalObj = [...finalObj, convrs]
                                        }
                                    })
                                    res.status(200).send({ error: false, message: "Success", result: { "conversations": finalObj, "total": finalObj.length }, status_code: 100 })
                                })
                                .catch(teamErr => {
                                    console.log("conversationsController:getConversations => ERROR getting conversations from global", teamErr)
                                    res.status(500).send({ error: true, message: "Error getting from teams!", result: teamErr, status_code: 160 })
                                });
                        } else {
                            res.status(200).send({
                                error: false, message: "Success",
                                result: { "conversations": conversations, "total": conversations.length, }, status_code: 100
                            })
                        }
                    } else {
                        res.status(200).send({
                            error: false, message: "No conversation found!",
                            result: { "conversations": conversations, "total": conversations.length }, status_code: 100
                        })
                    }
                })
                .catch(err => {
                    console.log("conversationsController:getConversations => ERROR getting conversations", err)
                    res.status(500).send({ error: true, message: "Error getting conversations", result: err, status_code: 160 })
                })
        }
    },
    createConversations: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else if (!(req.body.members && req.body.name && req.body.teamType && req.body.invitationType)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            try {
                let userData = req.user_info;
                let userid = userData.id
                let workspaceid = userData.workspaces[0].id;
                var members = [];
                if (req.body.members && req.body.members.length > 0) {
                    teamService.getPreferencedUser(req.headers.authorization, parseInt(workspaceid), req.body.members, req.body.teamType, parseInt(userid))
                        .then(prefRes => {
                            let noPrefUsers = prefRes.no_pref_users;
                            let prefUsers = prefRes.pref_users;
                            members = [...new Set(noPrefUsers)];
                            let conObj = {
                                "members": members,
                                "pendingMembers": prefUsers,
                                "guests": (req.body.guests) ? req.body.guests : [],
                                "name": req.body.name,
                                "admins": [parseInt(userid)],
                                "description": (req.body.description) ? req.body.description : "",
                                "isOneToOne": (req.body.isOneToOne) ? req.body.isOneToOne : false,
                                "teamType": (req.body.teamType) ? req.body.teamType : 'public',
                                "invitationType": (req.body.invitationType) ? req.body.invitationType : 1,
                                "pinnedMessages": [],
                                "threads": [],
                                "workspaceId": parseInt(workspaceid),
                                "lastUpdated": new Date(),
                                "apps": (req.body.apps) ? req.body.apps : [],
                                "timestamp": new Date(),
                                "lastMessageNumber": 0,
                                "isActive": 1
                            }
                            conversationsModel.insert(req.db, conObj)
                                .then(conversations => {
                                    const teamObj = {
                                        "app_ids": (req.body.apps) ? req.body.apps : [],
                                        "invite_type": (req.body.invitationType) ? req.body.invitationType : 1,
                                        "members": members,
                                        "prefUsers": prefUsers,
                                        "name": req.body.name,
                                        "description": (req.body.description) ? req.body.description : "",
                                        "type": (req.body.teamType) ? req.body.teamType : 'public',
                                        "workspace_id": parseInt(workspaceid),
                                        "conversation_id": conversations.insertedIds[0],
                                        "user_info": userData
                                    };
                                    console.log(teamObj, 'teamObj')
                                    teamService.createTeam(req.headers.authorization, teamObj).then(resp => {
                                        // console.log(resp, 'resp===')

                                        console.log("conversationController => Successfully added conversation")
                                        if (prefUsers.length > 0) {
                                            conversationsController.getMywallConvIds(req.db, prefUsers, workspaceid)
                                                .then(response => {
                                                    let event = {
                                                        "type": "messenger.team_invite",
                                                        "user": String(userid),
                                                        "workspace": String(workspaceid),
                                                        "users": response.success,
                                                        "teamId": String(resp.result.id),
                                                        "teamName": req.body.name,
                                                        "teamConvId": conversations.insertedIds[0]
                                                    }
                                                    botService.newBotEvent(event);
                                                })
                                        }
                                        let delta = { type: "messenger.new_conversation", workspace: workspaceid, data: conversations.ops[0] }
                                        delta.data.team_id = String(resp.result.id);
                                        delta.data.bucket_name = process.env.USER_PREFIX + process.env.ORIGIN + '-' + parseInt(req.headers.workspaceid) + '-' + userid + '/' + process.env.TEAM_PREFIX + parseInt(req.headers.workspaceid) + '-' + resp.result.id;
                                        console.log('delta=>', delta)
                                        console.log('delta.data.bucket_name=>', delta.data.bucket_name)
                                        // notificationService.push(req.db, conversations.ops[0]._id, userid, "NewConversation", [], delta)
                                        conversationsController.sendDeltasToConversationMembers(conversations.ops[0]._id, conversations.ops[0], delta);

                                        res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
                                    }).catch(errors => {
                                        console.log("ERROR creating conversation", errors)
                                        res.status(500).send({ error: true, message: "Error creating team", result: errors, status_code: 160 })
                                    })
                                }).catch(err => {
                                    res.status(500).send({ error: true, message: "Error while creating conversation", result: err, status_code: 160 })
                                })

                        }).catch(preferr => {
                            res.status(500).send({ error: true, message: "Error while preference fetching", result: preferr, status_code: 160 })
                        })

                } else {
                    res.status(400).send({ error: true, message: "Users not found", status_code: 160 })
                }

            } catch (e) {
                console.log("ERROR: conversationController => Malformed conversation object : ", e)
                res.status(400).send({ error: true, message: "Malformed conversation object", result: e, status_code: 160 })

            }

        }
    },

    getUsersMywallConv: (req, res) => {
        console.log(req.headers, 'req.headers')
        if (!(req.body.userids && req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization and convId", status_code: 101 })
        } else {
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            if (req.body.userids.length > 0) {
                var params;
                if (req.headers.istype && req.headers.istype === 'app_permission') {
                    params = {
                        userid: userid, istype: req.headers.istype, app_name: req.body.app_name, app_id: req.body.app_id,
                        user_name: req.body.user_name
                    }
                    conversationsController.getMywallConvIds(req.db, req.body.userids, workspaceid, params)
                        .then(response => {
                            res.status(200).send({ error: true, message: "fetching", result: response, status_code: 100 })
                        }).catch(resErr => {
                            res.status(500).send({ error: true, message: "Error!", result: resErr, status_code: 160 })
                        })
                } else {
                    params = { istype: "team_invite" }
                    conversationsController.getMywallConvIds(req.db, req.body.userids, workspaceid, params)
                        .then(response => {
                            let event = {
                                "type": "messenger.team_invite",
                                "user": String(userid),
                                "workspace": String(workspaceid),
                                "users": response.success,
                                "teamId": String(req.headers.teamid),
                                "teamName": req.body.name,
                                "teamConvId": req.params.convid
                            }
                            botService.newBotEvent(event);
                            res.status(200).send({ error: true, message: "fetching", result: response, status_code: 100 })
                        }).catch(resErr => {
                            res.status(500).send({ error: true, message: "Error!", result: resErr, status_code: 160 })
                        })
                }
            } else {
                res.status(500).send({ error: true, message: "Required userIds", result: '', status_code: 160 })

            }
        }
    },

    getMywallConvIds: (db, userIds, workspaceid, params) => {
        console.log(params, 'params')
        return new Promise((resolve, reject) => {
            let prefUsers = userIds;
            if (prefUsers.length > 0) {
                let users = [];
                let result = [];
                //get conversation id of user
                result = prefUsers.map(usrId => {
                    return conversationsModel.getUserMyWall(db, usrId, workspaceid)
                })
                Promise.all(result).then(resp => {
                    let success = [];
                    let fail = [];
                    let i = 0;
                    do {
                        if (resp[i].error) {
                            fail = [...fail, { id: resp[i].userId }]
                            i++;
                        } else {
                            if (params && params.istype === 'app_permission') {
                                success = [...success, { convId: resp[i].convId, id: resp[i].userId }]
                                messageService.pushMessage(resp[i].userId, `${resp[i].convId}`, workspaceid,
                                    params, db)
                                i++;
                            } else {
                                success = [...success, { convId: resp[i].convId, id: resp[i].userId }]
                                i++;
                            }

                        }
                    } while (i < resp.length) {
                        resolve({ success: success, fail: fail });
                        return;
                    }
                }).catch(convErr => {
                    console.log(convErr, 'convErr')
                    console.log("Error while conersation fetching")
                    reject(convErr);
                    return;
                })
            } else {
                console.log("userids required")
                reject(false);
                return;
            }
        })
    },

    getConversation: (req, res) => {
        if (!(req.headers.authorization && req.params.convid)) {
            res.status(400).send({ error: true, message: "Expected authorization and convId", status_code: 101 })
        } else {
            let userData = req.user_info;
            let userid = userData.id
            let workspaceid = userData.workspaces[0].id;
            conversationsModel.getOne(req.db, req.params.convid)
                .then(conversations => {
                    if (conversations == null) {
                        res.status(404).send({ error: true, message: "Conversation not found", result: conversations, status_code: 100 })
                    } else if (!conversations.members.includes(parseInt(req.headers.userid))) {
                        res.status(404).send({ error: true, message: "Conversation not found!", result: {}, status_code: 100 })
                    } else {

                        if (!conversations.isOneToOne) {
                            teamService.getTeamData(req.headers.authorization, parseInt(workspaceid), req.params.convid, userData).then(teamDataResp => {
                                console.log(teamDataResp, 'teamDataResp')
                                if (teamDataResp.team_user_preferences.length > 0) {
                                    addMember = (teamDataResp.team_user_preferences[0].add_member !== undefined) ? teamDataResp.team_user_preferences[0].add_member : 0;
                                    addGuest = (teamDataResp.team_user_preferences[0].add_guest !== undefined) ? teamDataResp.team_user_preferences[0].add_guest : 0;
                                    addApp = (teamDataResp.team_user_preferences[0].add_app !== undefined) ? teamDataResp.team_user_preferences[0].add_app : 0;
                                } else {
                                    addMember = 0;
                                    addGuest = 0;
                                    addApp = 0;
                                }
                                conversations['name'] = teamDataResp.name;
                                conversations['description'] = teamDataResp.description;
                                conversations['teamType'] = teamDataResp.type;
                                conversations['bucket_name'] = teamDataResp.bucket_name;
                                conversations['team_id'] = teamDataResp.id;
                                conversations['addMember'] = addMember;
                                conversations['addGuest'] = addGuest;
                                conversations['addApp'] = addApp;
                                conversations['isActive'] = (!conversations.hasOwnProperty('isActive') || conversations.isActive === null) ? 1 : conversations.isActive
                                res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
                            }).catch(teamRes => {
                                res.status(500).send({ error: true, message: "Error finding conversation", result: teamRes, status_code: 160 })
                            })
                        } else {
                            res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })

                        }
                    }

                }).catch(err => {
                    console.log("ERROR conversationController => finding conversation", err)
                    res.status(500).send({ error: true, message: "Error finding conversation", result: err, status_code: 160 })
                })
        }
    },

    deleteConversation: (req, res) => {
        if (!(req.headers.authorization && req.params.convid)) {
            res.status(400).send({ error: true, message: "Expected authorization and convId", status_code: 101 })
        } else {
            conversationsModel.delete(req.db, req.params.convid)
                .then(conversations => {
                    // console.log("Successfully deleted conversation")
                    res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
                }).catch(err => {
                    console.log("ERROR while deleting conversation")
                    res.status(400).send({ error: true, message: "Error while listing", result: err, status_code: 160 })
                })
        }
    },

    sendDeltasToConversationMembers: (convId, conversation = null, delta) => {
        if (conversation) {
            let users = conversation.members;
            users.forEach(user => {
                delta.user = String(user);
                console.log('conversationsController:sendDeltasToConversationMembers => delta ', delta)
                notificationSvc.notifyUser(delta);
            });
            return;
        } else {
            conversationsModel.getOne('db', convId)
                .then(conversation => {
                    if (conversation) {
                        let users = conversation.members;
                        users.forEach(user => {
                            delta.user = String(user);
                            console.log('conversationsController:sendDeltasToConversationMembers => delta ', delta)
                            notificationSvc.notifyUser(delta);
                        });
                        return;
                    } else {
                        console.log('conversationsController:sendDeltasToConversationMembers => ERROR conversation not found');
                    }

                })
                .catch(error => {
                    console.log('conversationsController:sendDeltasToConversationMembers => ERROR finding conversation ', error);
                });
        }
    },
    updateConversation: (req, res) => {
        if (!(req.headers.authorization && req.params.convid && req.headers.teamid && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, convId and teamId", status_code: 101 })
        } else if (!(req.body.members || req.body.name || req.body.description || req.body.teamType || req.body.invitationType || (req.body.isActive !== undefined) || req.body.pendingMembers ||
            (req.body.addMember !== undefined) || (req.body.addGuest !== undefined) || (req.body.addApp !== undefined))) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            // let userData = req.user_info;
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            let updateObj = {};
            if (req.body.members) { updateObj.members = req.body.members; }
            if (req.body.name) { updateObj.name = req.body.name; }
            if (req.body.description) { updateObj.description = req.body.description; }
            if (req.body.teamType) { updateObj.teamType = req.body.teamType; }
            if (req.body.invitationType) { updateObj.invitationType = req.body.invitationType; }
            if (req.body.admins) { updateObj.admins = req.body.admins; }
            if (req.body.guests) { updateObj.guests = req.body.guests; }
            if (req.body.isActive !== undefined || req.body.isActive !== null) { updateObj.isActive = req.body.isActive }
            if (req.body.pendingMembers) { updateObj.pendingMembers = req.body.pendingMembers; }
            if (req.body.addMember !== undefined || req.body.addMember !== null) { updateObj.addMember = req.body.addMember; }
            if (req.body.addGuest !== undefined || req.body.addGuest !== null) { updateObj.addGuest = req.body.addGuest; }
            if (req.body.addApp !== undefined || req.body.addApp !== null) { updateObj.addApp = req.body.addApp; }
            updateObj.convId = req.params.convid;

            // console.log(updateObj, 'updateObj')
            // //This is a downright awful hack for a quick fix. Fix it once a fully functional notification svc is up.
            // //Notice how I am sending two notifications??
            // let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: updateObj };
            // conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
            // // notificationService.push(req.db, req.params.convid, userid, "UpdateConversation", [], delta)
            // // 
            let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: updateObj };
            if (req.body.members) {
                conversationsModel.getOne('db', req.params.convid)
                    .then(conversation => {
                        let removedUser = null;
                        if (conversation) {
                            if (conversation.members.length > req.body.members.length) {
                                conversation.members.forEach(user => {
                                    if (!req.body.members.includes(user)) {
                                        removedUser = user;
                                    }
                                })
                                delta.user = String(removedUser);
                                notificationSvc.notifyUser(delta);
                            }
                            conversationsModel.update(req.db, req.params.convid, updateObj)
                                .then(conversations => {
                                    console.log("Successfully updated conversation")
                                    if (req.body.is_member_add && req.body.preference_users.length > 0) {
                                        conversationsController.getMywallConvIds(req.db, req.body.preference_users, workspaceid)
                                            .then(response => {
                                                const event = {
                                                    "type": "messenger.team_invite",
                                                    "user": String(userid),
                                                    "workspace": String(workspaceid),
                                                    "users": response.success,
                                                    "teamId": String(req.headers.teamid),
                                                    "teamName": req.body.name,
                                                    "teamConvId": req.params.convid
                                                }
                                                botService.newBotEvent(event);
                                            })
                                    }
                                    updateObj.convId = req.params.convid;
                                    conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
                                    const resp = {
                                        modifiedCount: conversations.modifiedCount,
                                        matchedCount: conversations.matchedCount
                                    }
                                    res.status(200).send({ error: false, message: "Success", result: resp, status_code: 100 })
                                }).catch(err => {
                                    console.log("Error updating conversation", err)
                                    res.status(500).send({ error: true, message: "Error updating conversation", result: err, status_code: 160 })
                                })

                        } else {
                            console.log('conversationsController:updateConversation => ERROR conversation not found');
                        }

                    })
                    .catch(error => {
                        console.log('conversationsController:updateConversation => ERROR finding conversation ', error);
                    });
            } else {
                conversationsModel.update(req.db, req.params.convid, updateObj)
                    .then(conversations => {
                        console.log("Successfully updated conversation")
                        if (req.body.is_member_add && req.body.preference_users.length > 0) {
                            conversationsController.getMywallConvIds(req.db, req.body.preference_users, workspaceid)
                                .then(response => {
                                    const event = {
                                        "type": "messenger.team_invite",
                                        "user": String(userid),
                                        "workspace": String(workspaceid),
                                        "users": response.success,
                                        "teamId": String(req.headers.teamid),
                                        "teamName": req.body.name,
                                        "teamConvId": req.params.convid
                                    }
                                    botService.newBotEvent(event);
                                })

                        }
                        updateObj.convId = req.params.convid;
                        conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
                        // notificationService.push(req.db, req.params.convid, userid, "UpdateConversation", [], delta)
                        const resp = {
                            modifiedCount: conversations.modifiedCount,
                            matchedCount: conversations.matchedCount
                        }
                        res.status(200).send({ error: false, message: "Success", result: resp, status_code: 100 })
                    }).catch(err => {
                        console.log("Error updating conversation", err)
                        res.status(500).send({ error: true, message: "Error updating conversation", result: err, status_code: 160 })
                    })
            }

        }
    },

    // works for team inactive
    updateTeamConversation: (req, res) => {
        if (!(req.headers.authorization && req.params.teamId)) {
            res.status(400).send({ error: true, message: "Expected authorization and teamId", status_code: 101 })
        } else if (!(req.body.members || req.body.admins || req.body.invitationType)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            let updateObj = {};
            if (req.body.members) { updateObj['members'] = req.body.members; }
            if (req.body.admins) { updateObj['admins'] = req.body.admins; }
            if (req.body.invitationType) { updateObj['invitationType'] = req.body.invitationType; }
            if (req.body.pendingMembers) { updateObj['pendingMembers'] = req.body.pendingMembers; }
            let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: updateObj }
            // notificationService.push(req.db, req.params.convid, userid, "UpdateConversation", [], delta)
            conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
            conversationsModel.update(req.db, req.params.convid, updateObj)
                .then(conversations => {
                    console.log("Successfully updated conversation")
                    updateObj.convId = req.params.convid
                    let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: updateObj }
                    conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
                    // notificationService.push(req.db, req.params.convid, userid, "UpdateConversation", [], delta)
                    res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
                }).catch(err => {
                    console.log("ERROR updating conversation", updateObj, err)
                    res.status(500).send({ error: true, message: "Error updating conversation", result: err, status_code: 160 })
                })
        }
    },
    createGuest: (req, res) => {
        if (!(req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected userId and workspaceId", status_code: 101 })
        } else {
            console.log('user_id & workspace_id', req.headers.userid, req.headers.workspaceid)
            //return false;
            let name = req.headers.userid + `-` + req.headers.userid;
            //find and create conversations
            conversationsModel.getOneConv(req.db, req.headers.userid, req.headers.workspaceid).then(convRes => {
                console.log(name, 'name ==')
                if (convRes.length == 0) {
                    console.log('get resp', convRes)
                    let conObj = {
                        "members": [parseInt(req.headers.userid)],
                        "pendingMembers": [],
                        "guests": [parseInt(req.headers.userid)],
                        "name": name,
                        "admins": [parseInt(req.headers.userid)],
                        "description": "",
                        "isOneToOne": true,
                        "isMyWall": true,
                        "teamType": 'private',
                        "invitationType": 1,
                        "pinnedMessages": [],
                        "threads": [],
                        "workspaceId": parseInt(req.headers.workspaceid),
                        "lastUpdated": new Date(),
                        "apps": (req.body.apps) ? req.body.apps : [],
                        "timestamp": new Date(),
                        "lastMessageNumber": 0
                    }
                    conversationsModel.insert(req.db, conObj).then(conversations => {
                        console.log('insert resp', conversations)
                        res.status(200).send({ error: false, message: "Success insert", result: conversations, status_code: 100 })
                    }).catch(convErr => {
                        console.log('insert resp err', convErr)
                        res.status(500).send({ error: false, message: "Falied", result: convErr, status_code: 110 })
                    })
                } else {
                    res.status(200).send({ error: false, message: "Success search", result: convRes, status_code: 100 })
                }

            }).catch(error => {
                res.status(500).send({ error: false, message: "Error while finding", result: error, status_code: 110 })
            })

        }

    },

    updateGuestConversation: (req, res) => {
        if (!(req.params.convid && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected userid, workspaceid and convId", status_code: 101 })
        } else if (!(req.body.members || req.body.name || req.body.description || req.body.teamType || req.body.invitationType || req.body.guests)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            // let userData = req.user_info;
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            let updateObj = {};
            if (req.body.members) { updateObj['members'] = req.body.members; }
            if (req.body.name) { updateObj['name'] = req.body.name; }
            if (req.body.description) { updateObj['description'] = req.body.description; }
            if (req.body.teamType) { updateObj['teamType'] = req.body.teamType; }
            if (req.body.invitationType) { updateObj['invitationType'] = req.body.invitationType; }
            if (req.body.guests) { updateObj['guests'] = req.body.guests; }

            console.log(updateObj, 'updateObj')
            let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: updateObj }
            conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
            // notificationService.push(req.db, req.params.convid, userid, "UpdateConversation", [], delta)
            // res.status(200).send({ error: false, message: "Success", result: conversations, status_code: 100 })
            conversationsModel.update(req.db, req.params.convid, updateObj)
                .then(conversations => {
                    console.log("Successfully updated conversation")
                    updateObj.convId = req.params.convid
                    let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: updateObj }
                    conversationsController.sendDeltasToConversationMembers(req.params.convid, null, delta);
                    // notificationService.push(req.db, req.params.convid, userid, "UpdateConversation", [], delta)
                    res.status(200).send({ error: false, message: "Success", result: null, status_code: 100 })
                }).catch(err => {
                    console.log("Error updating conversation", err)
                    res.status(500).send({ error: true, message: "Error updating conversation", result: err, status_code: 160 })
                })
        }
    },

    updateInactiveConversation: (req, res) => {
        console.log('updateInactiveConversation', req.body)
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        } else if (!((req.body.isActive !== undefined))) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            let userid = req.headers.userid;
            let workspaceid = req.headers.workspaceid;
            let updateObj = {};
            console.log(req.body.isActive, 'req.body.isActive')
            if (req.body.isActive !== undefined || req.body.isActive !== null) { updateObj['isActive'] = req.body.isActive }
            console.log(updateObj, 'updateObj')
            conversationsModel.updateIsActive(req.db, parseInt(userid), parseInt(workspaceid), updateObj)
                .then(conversations => {
                    console.log("Successfully updated conversation")
                    conversationsModel.getOnetoOneConv(req.db, parseInt(userid), parseInt(workspaceid))
                        .then(getConvs => {
                            // console.log(getConvs, 'User conversations')
                            let conv_ids = [];
                            getConvs.map(conv_id => {
                                conv_ids.push(conv_id._id)
                                let delta = { type: "messenger.update_conversation", workspace: workspaceid, data: conv_id }
                                // notificationService.push(req.db, conv_id._id, userid, "UpdateConversation", [], delta)
                                conversationsController.sendDeltasToConversationMembers(conv_id._id, null, delta);
                            })
                            console.log(conv_ids, 'conv_ids')
                            res.status(200).send({ error: false, message: "Success", result: getConvs, status_code: 100 })
                        }).catch(error => {
                            res.status(500).send({ error: true, message: "Error while searching", result: error, status_code: 160 })
                        })
                }).catch(err => {
                    console.log("Error updating conversation", err)
                    res.status(500).send({ error: true, message: "Error updating conversation while inactiving", result: err, status_code: 160 })
                })
        }
    },
    getUsersConversations: (req, res) => {
        if (!(req.headers.authorization && req.body.userIds)) {
            res.status(400).send({ error: true, message: "Expected authorization and userIds", status_code: 101 })
        } else {
            let UserId = parseInt(req.headers.userid);
            let workspaceid = req.headers.workspaceid;
            // let where_obj = {isOneToOne:true};
            let userIds = req.body.userIds;

            let orArray = [];
            if (userIds.indexOf(UserId) === -1) {
                userIds.push()
            }
            for (let userId of userIds) {
                orArray = [...orArray, { members: [userId] }]
            }
            let where_obj = { isOneToOne: true, workspaceId: parseInt(workspaceid), $or: orArray };
            conversationsModel.getAllConv(req.db, where_obj).then(getConvs => {

                res.status(200).send({ error: false, message: "Success", result: getConvs, status_code: 100 })
            }).catch(error => {
                res.status(500).send({ error: true, message: "Error while getting conversations", result: error, status_code: 160 })
            })

        }
    },

    getUsersOneOnOneConversations: (req, res) => {
        if (!(req.headers.authorization && req.body.userIds)) {
            res.status(400).send({ error: true, message: "Expected authorization and userIds", status_code: 101 })
        } else {
            let UserId = parseInt(req.headers.userid);
            let workspaceid = req.headers.workspaceid;
            let userIds = req.body.userIds;
            // let where_obj = {isOneToOne:true};
            let orArray = [];
            if (userIds.indexOf(UserId) === -1) {
                userIds.push()
            }
            for (let userId of userIds) {
                if (parseInt(UserId) !== parseInt(userId)) {
                    // This won't work. Check bulk messages api
                    orArray = [...orArray, { name: `${UserId}-${userId}` }]
                }
            }
            let where_obj = { isOneToOne: true, workspaceId: parseInt(workspaceid), $or: orArray };
            conversationsModel.getAllConv(req.db, where_obj).then(getConvs => {

                res.status(200).send({ error: false, message: "Success", result: getConvs, status_code: 100 })
            }).catch(error => {
                res.status(500).send({ error: true, message: "Error while getting conversations", result: error, status_code: 160 })
            })

        }
    },

    myWallInit: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
        } else {
            userObj = {
                "userId": parseInt(req.headers.userid),
                "starredMessages": [],
                "pinnedConversations": [],
                "lastSeen": new Date(),
                "fcmKeys": []
            }
            console.log(userObj, 'userObj')
            usersModel.getOne(req.db, userObj.userId).then(getUser => {
                console.log(getUser, 'getUser')
                if (getUser) {
                    conversationsModel.getOneConv(req.db, req.headers.userid, req.headers.workspaceid).then(convRes => {
                        // console.log(name, 'name ==')
                        let name = req.headers.userid + `-` + req.headers.userid;
                        console.log('get resp', convRes)
                        if (convRes.length == 0) {

                            conObj = {
                                "members": [parseInt(req.headers.userid)],
                                "pendingMembers": [],
                                "guests": [],
                                "name": name,
                                "admins": [parseInt(req.headers.userid)],
                                "description": "",
                                "isOneToOne": true,
                                "isMyWall": true,
                                "teamType": 'private',
                                "invitationType": '',
                                "pinnedMessages": [],
                                "threads": [],
                                "workspaceId": parseInt(req.headers.workspaceid),
                                "lastUpdated": new Date(),
                                "apps": (req.body.apps) ? req.body.apps : [],
                                "timestamp": new Date(),
                                "lastMessageNumber": 0,
                                "isActive": 1
                            }
                            conversationsModel.insert(req.db, conObj).then(conversations => {
                                // console.log('insert resp', conversations)
                                res.status(200).send({ error: false, message: "Success insert", result: conversations.ops[0], status_code: 100 })
                            }).catch(convErr => {
                                console.log('insert resp err', convErr)
                                res.status(500).send({ error: false, message: "Falied", result: convErr, status_code: 110 })
                            })
                        } else {
                            res.status(500).send({ error: false, message: "Success search", result: convRes, status_code: 100 })
                        }
                    }).catch(error => {
                        res.status(500).send({ error: false, message: "Error while finding", result: error, status_code: 110 })
                    })
                } else {
                    usersModel.insert(req.db, userObj)
                        .then(userRes => {
                            let name = req.headers.userid + `-` + req.headers.userid;
                            conversationsModel.getOneConv(req.db, req.headers.userid, req.headers.workspaceid).then(convRes => {
                                console.log(name, 'name ==')
                                if (convRes.length == 0) {
                                    console.log('get resp', convRes)
                                    conObj = {
                                        "members": [parseInt(req.headers.userid)],
                                        "pendingMembers": [],
                                        "guests": [],
                                        "name": name,
                                        "admins": [parseInt(req.headers.userid)],
                                        "description": "",
                                        "isOneToOne": true,
                                        "isMyWall": true,
                                        "teamType": 'private',
                                        "invitationType": '',
                                        "pinnedMessages": [],
                                        "threads": [],
                                        "workspaceId": parseInt(req.headers.workspaceid),
                                        "lastUpdated": new Date(),
                                        "apps": (req.body.apps) ? req.body.apps : [],
                                        "timestamp": new Date(),
                                        "lastMessageNumber": 0,
                                        "isActive": 1
                                    }
                                    conversationsModel.insert(req.db, conObj).then(conversations => {
                                        // console.log('insert resp', conversations)
                                        res.status(200).send({ error: false, message: "Success insert", result: conversations.ops[0], status_code: 100 })
                                    }).catch(convErr => {
                                        console.log('insert resp err', convErr)
                                        res.status(500).send({ error: false, message: "Falied", result: convErr, status_code: 110 })
                                    })
                                } else {
                                    res.status(500).send({ error: false, message: "Success search", result: convRes, status_code: 100 })
                                }
                            }).catch(error => {
                                res.status(500).send({ error: false, message: "Error while finding", result: error, status_code: 110 })
                            })
                            //res.status(200).send({ error: false, message: "Success", result: userRes, status_code: 100 })
                        }).catch(errors => {
                            console.log("Error inserting user : ", errors)
                            res.status(500).send({ error: true, message: "Error while inserting", result: errors, status_code: 160 })
                        })
                }
            }).catch(err => {
                res.status(500).send({ error: true, message: "Error while user data", result: err, status_code: 160 })

            })
        }
    },

    createOneToOneConv: (req, res) => {
        console.log('createOneToOneConv')
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
        }
        else if (!(req.body.userId)) {
            res.status(400).send({ error: true, message: "Expected body params", status_code: 101 })
        } else {
            let userData = req.user_info;
            let userid = userData.id
            let workspaceid = userData.workspaces[0].id;
            let name = `${req.body.userId}-${req.headers.userid}`;
            conversationsModel.getOnetoOneConvByMembers(req.db, workspaceid, [userid, req.body.userId], [req.body.userId, userid]).then(conversations => {
                if (conversations) {
                    res.status(500).send({ error: false, message: "Conversation already exist", result: conversations, status_code: 100 })
                } else {
                    conObj = {
                        "members": [userid, req.body.userId],
                        "pendingMembers": [],
                        "guests": [],
                        "name": name,
                        "admins": [userid, req.body.userId],
                        "description": "",
                        "isOneToOne": true,
                        "teamType": 'private',
                        "invitationType": '',
                        "pinnedMessages": [],
                        "threads": [],
                        "workspaceId": workspaceid,
                        "lastUpdated": new Date(),
                        "apps": (req.body.apps) ? req.body.apps : [],
                        "timestamp": new Date(),
                        "lastMessageNumber": 0,
                        "isActive": 1
                    }
                    conversationsModel.insert(req.db, conObj).then(conversations => {
                        // console.log('insert resp', conversations)
                        let delta = { type: "messenger.new_conversation", workspace: workspaceid, data: conversations.ops[0] }
                        // notificationService.push(req.db, conversations.ops[0]._id, userid, "NewConversation", [], delta)
                        conversationsController.sendDeltasToConversationMembers(conversations.ops[0]._id, conversations.ops[0], delta);
                        res.status(200).send({ error: false, message: "Success insert", result: conversations, status_code: 100 })

                    }).catch(convErr => {
                        console.log('insert resp err', convErr)
                        res.status(500).send({ error: false, message: "Falied", result: convErr, status_code: 110 })
                    })
                }
            }).catch(err => {
                console.log('get conv info resp err', err)
                res.status(500).send({ error: false, message: "Falied", result: err, status_code: 110 })
            })

        }
    },

}



module.exports = { conversationsController };