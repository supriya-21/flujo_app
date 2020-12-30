const { usersModel } = require('../../models/usersModel');
const { notificationSvc } = require('../../services/notificationSvc');
const sha1 = require('sha1');


const usersController = {
    editList: (list, value, op) => {
        const index = list.indexOf(value);
        if (op === 'add') {
            if (index < 0) {
                list.push(value);
                return true;
            }
        } else if (op === 'remove') {
            if (index > -1) {
                list.splice(index, 1);
                return true;
            }
        }
        return false;
    },
    updateUser: (req, res) => {
        if (!(req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected userId, workspaceId", status_code: 101 })
        } else if (!(req.body.starredMessages || req.body.pinnedConversations || req.body.hideConversations || req.body.muteConversations || req.body.peopleRecentMax || req.body.teamsRecentMax || req.body.reminders)) {
            res.status(400).send({ error: true, message: "No changes found", status_code: 101 })
        } else {
            usersModel.getOne('db', parseInt(req.headers.userid))
                .then(currentUserObj => {
                    let updateObj = {};
                    updateObj.devices = []; // Cleanup user object
                    let updated = false;

                    if ('starredMessages' in req.body) {
                        let conversationMatched = false;
                        if (!Array.isArray(currentUserObj.starredMessages)) {currentUserObj.starredMessages = []}
                            currentUserObj.starredMessages.forEach(conversation => {
                                if (conversation.convId === req.body.starredMessages.conversation) {
                                    conversationMatched = true;
                                    if (usersController.editList(conversation.msgs,
                                        req.body.starredMessages.message,
                                        req.body.starredMessages.operation)) {
                                        updateObj.starredMessages = currentUserObj.starredMessages;
                                        updated = true;
                                    } else {
                                        console.log('v2:usersController:updateUser => WARN No changes');
                                    }
                                }
                            });
                        if (!conversationMatched) {
                            if (req.body.starredMessages.operation === 'add') {
                                currentUserObj.starredMessages.push({
                                    convId: req.body.starredMessages.conversation,
                                    msgs: [req.body.starredMessages.message]
                                });
                                updateObj.starredMessages = currentUserObj.starredMessages;
                                updated = true;
                            }
                        }
                    }

                    if ('pinnedConversations' in req.body) {
                        if (!Array.isArray(currentUserObj.pinnedConversations)) {currentUserObj.pinnedConversations = []}
                        if (usersController.editList(currentUserObj.pinnedConversations,
                            req.body.pinnedConversations.conversation,
                            req.body.pinnedConversations.operation)) {
                            updateObj.pinnedConversations = currentUserObj.pinnedConversations;
                            updated = true;
                        } else {
                            console.log('v2:usersController:updateUser => WARN No changes');
                        }
                    }

                    if ('hideConversations' in req.body) {
                        if (Array.isArray(currentUserObj.hideConversations)) {
                            currentUserObj.hideConversations = {};
                            updateObj.hideConversations = currentUserObj.hideConversations;
                            updated = true;
                        }
                        if (!('teams' in currentUserObj.hideConversations)) {
                            currentUserObj.hideConversations.teams = [];
                            updateObj.hideConversations = currentUserObj.hideConversations;
                            updated = true;
                        }
                        if (!('people' in currentUserObj.hideConversations)) {
                            currentUserObj.hideConversations.people = [];
                            updateObj.hideConversations = currentUserObj.hideConversations;
                            updated = true;
                        }
                        if (req.body.hideConversations.type === 'teams') {
                            if (usersController.editList(currentUserObj.hideConversations.teams,
                                req.body.hideConversations.conversation,
                                req.body.hideConversations.operation)) {
                                updateObj.hideConversations = currentUserObj.hideConversations;
                                updated = true;
                            } else {
                                console.log('v2:usersController:updateUser => WARN No changes');
                            }
                        } else if (req.body.hideConversations.type === 'people') {
                            if (usersController.editList(currentUserObj.hideConversations.people,
                                req.body.hideConversations.conversation,
                                req.body.hideConversations.operation)) {
                                updateObj.hideConversations = currentUserObj.hideConversations;
                                updated = true;
                            } else {
                                console.log('v2:usersController:updateUser => WARN No changes');
                            }
                        }
                    }

                    if ('muteConversations' in req.body) {
                        if (!Array.isArray(currentUserObj.muteConversations)) {currentUserObj.muteConversations = []}
                        if (usersController.editList(currentUserObj.muteConversations,
                            req.body.muteConversations.conversation,
                            req.body.muteConversations.operation)) {
                            updateObj.muteConversations = currentUserObj.muteConversations;
                            updated = true;
                        } else {
                            console.log('v2:usersController:updateUser => WARN No changes');
                        }
                    }


                    if (updated) {
                        usersModel.update('db', parseInt(req.headers.userid), updateObj)
                            .then(conversations => {
                                let delta = {
                                    workspace: req.headers.workspaceid,
                                    user: req.headers.userid,
                                    data: updateObj,
                                    type: 'messenger.update_user_me',
                                }
                                delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13);
                                notificationSvc.notifyUser(delta);
                                res.status(200).send({
                                    error: false, message: "Success",
                                    result: {
                                        modifiedCount: conversations.modifiedCount,
                                        matchedCount: conversations.matchedCount,
                                        delta: delta
                                    },
                                    status_code: 100
                                });
                            }).catch(err => {
                                console.log("v2:usersController:updateUser => ERROR updating user", err)
                                res.status(500).send({
                                    error: true,
                                    message: "v2:usersController:updateUser => ERROR updating user",
                                    result: {}, status_code: 160
                                });
                            });
                    } else {
                        console.log('v2:usersController:updateUser => ERROR No update required',);
                        res.status(200).send({
                            error: false,
                            message: "v2:usersController:updateUser => ERROR No update required",
                            result: {}
                        });
                    }
                })
                .catch(err => {
                    console.log('v2:usersController:updateUser => ERROR could not fetch user ', err);
                    res.status(500).send({
                        error: true,
                        message: "v2:usersController:updateUser => ERROR could not fetch user",
                        result: {}, status_code: 160
                    });
                });
        }
    },

}

module.exports = { usersController };