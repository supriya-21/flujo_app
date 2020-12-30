const { conversationsModel } = require('../../models/conversationsModel');
const { teamService } = require('../../services/teamService');
const { mongoSvc } = require('../../services/mongoSvc')

const conversationsFunctions = {
    getConversations: (req) => {
        return new Promise((resolve, reject) => {
            mongoSvc.getDbClient().then(db => {
                conversationsModel.getAll(db, parseInt(req.headers.userid), parseInt(req.headers.workspaceid))
                    .then(conversations => {
                        if (conversations.length > 0) {
                            // console.log("Successfully obtained conversations")
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
                                teamService.getTeams(req.headers.authorization, parseInt(req.headers.workspaceid), teamConvIds).then(dataResp => {
                                    var finalObj = [];
                                    conversations.map(convrs => {
                                        if (!convrs.isOneToOne) {
                                            dataResp.some(teams => {
                                                if (convrs._id == teams.conversation_id) {
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
                                                        "isActive": (!convrs.hasOwnProperty('isActive') || convrs.isActive === null) ? 1 : convrs.isActive
                                                    }]
                                                }
                                            })
                                        } else {
                                            finalObj = [...finalObj, convrs]
                                        }
                                    })
                                    resolve({
                                        message: "Success",
                                        result: { "conversations": finalObj, "total": finalObj.length },
                                        status_code: 100, status: 200, error: false
                                    });
                                    return;
                                }).catch(teamErr => {
                                    // console.log(teamErr)
                                    reject({
                                        error: true,
                                        message: "Error getting from teams!", 
                                        result: teamErr, status_code: 160, status: 500
                                    });
                                    return;
                                })
                            } else {
                                resolve({ message: "Success", result: { "conversations": conversations, "total": conversations.length, }, status_code: 100, status: 200, error: false });
                                return;
                            }
                        } else {
                            resolve({ message: "No conversation found!", result: { "conversations": conversations, "total": conversations.length }, status_code: 100, error: false, status: 200 });
                            return;
                        }
                    }).catch(err => {
                        // console.log("Error getting conversations", err)
                        reject({ error: true, message: "Error getting conversations", result: err, status_code: 160, status: 500 });
                        return;
                    })
            })
        });
    }
}

module.exports = { conversationsFunctions }