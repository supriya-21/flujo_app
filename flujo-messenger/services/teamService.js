const axios = require('axios');
const teamService = {

    /* verifing the user token 
     * get user with associated data
     */
    createTeam: (accessToken, bodyObj) => { //verifing the user token
        return new Promise(async (resolve, reject) => {
            try {
                let backend_token = `type=backend_token;token=${process.env.BACKEND_TOKEN}`;
                let team_url = process.env.COGNITO_REPO_URL + 'teams/create';
                console.log(team_url, 'team_url')
                axios.post(team_url, bodyObj, { headers: { Authorization: backend_token } })
                    .then(userResp => {
                        console.log(userResp, 'userResp')
                        if (!userResp.data.error) {
                            resolve(userResp.data)
                        } else {
                            reject(userResp.data)
                        }
                        //console.log(userResp.data.result.users, 'userResp')

                    }).catch(userErr => {
                        //console.log(userErr, 'userErr')
                        reject(userErr)
                    })


            } catch (error) {
                //console.log(error, 'error')
                reject(error);
            }
        });
    },
    getTeamData: (accessToken, workspaceId, teamConvId, userInfo) => { //verifing the user token
       // console.log(accessToken, workspaceId, teamConvIds, 'accessToken, workspaceId, teamConvIds')
        return new Promise(async (resolve, reject) => {
            try {
                let backend_token = `type=backend_token;token=${process.env.BACKEND_TOKEN}`;
                let team_url = process.env.COGNITO_REPO_URL + 'teams/details/conversationid';
                var bodyObj = { workspace_id: workspaceId, conversation_id : teamConvId, user_info: userInfo }
                // console.log(team_url, 'team_url')
                // console.log(bodyObj, 'bodyObj')
                axios.post(team_url, bodyObj, { headers: { Authorization: backend_token } })
                    .then(teamResp => {
                        //console.log(teamResp.data, 'teamResp')
                        if (!teamResp.data.error) {
                            resolve(teamResp.data.result)
                        } else {
                            reject(teamResp.data.message)
                        }
                        //console.log(userResp.data.result.users, 'userResp')

                    }).catch(userErr => {
                        //console.log(userErr, 'userErr')
                        reject(userErr.error)
                    })

            } catch (error) {
                //console.log(error, 'error')
                reject(error);
            }
        });
    },
    getTeams: (accessToken, workspaceId, teamConvIds) => { //verifing the user token
        return new Promise(async (resolve, reject) => {
            try {
                let backend_token = `type=backend_token;token=${process.env.BACKEND_TOKEN}`;
                let team_url = process.env.COGNITO_REPO_URL + 'teams/details/byconversations';
                var bodyObj = { workspace_id: workspaceId, conversation_ids: teamConvIds }
                axios.post(team_url, bodyObj, { headers: { Authorization: accessToken } })
                    .then(teamResp => {
                        if (!teamResp.data.error) {
                            resolve(teamResp.data.result)
                        } else {
                            console.log("teamService:getTeams => ERROR: Team details error on accounts/teams/details/byconversations");
                            console.log(`teamService:getTeams => ERROR: workspace ${workspaceId} teamConvIds: ${teamConvIds}`);
                            reject("teamService:getTeams => ERROR: Team details error on accounts/teams/details/byconversations")
                        }
                    }).catch(userErr => {
                        console.log("teamService:getTeams => ERROR: AXIOS call error", userErr);
                        console.log(`teamService:getTeams => ERROR: workspace ${workspaceId} teamConvIds: ${teamConvIds}`);
                        reject("teamService:getTeams => ERROR: AXIOS call error");
                    })

            } catch (error) {
                console.log("teamService:getTeams => ERROR: ", error);
                console.log(`teamService:getTeams => ERROR: workspace ${workspaceId} teamConvIds: ${teamConvIds}`);
                reject("teamService:getTeams => ERROR");
            }
        });
    },
    // getPreferencedUser: (accessToken, workspaceId, members, teamType, user_id) => { //verifing the user token
    //     // console.log(accessToken, workspaceId, teamConvIds, 'accessToken, workspaceId, teamConvIds')
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let team_url = process.env.COGNITO_REPO_URL + 'users/teampreference';
    //             var bodyObj = { workspace_id: workspaceId, user_ids: members, teamType: teamType, created_by: user_id }
    //             console.log(team_url, 'team_url')
    //             // console.log(bodyObj, 'bodyObj')
    //             axios.post(team_url, bodyObj, { headers: { Authorization: backend_token } })
    //                 .then(teamResp => {
    //                     console.log(teamResp.data, 'teamResp')
    //                     if (!teamResp.data.error) {
    //                         resolve(teamResp.data.result)
    //                     } else {
    //                         reject(teamResp.data.message)
    //                     }
    //                     //console.log(userResp.data.result.users, 'userResp')

    //                 }).catch(userErr => {
    //                     console.log(userErr, 'userErr')
    //                     reject(userErr.error)
    //                 })

    //         } catch (error) {
    //             //console.log(error, 'error')
    //             reject(error);
    //         }
    //     });
    // },
    getPreferencedUser: (accessToken, workspaceId, members, teamType, user_id) => { //verifing the user token
        // console.log(accessToken, workspaceId, teamConvIds, 'accessToken, workspaceId, teamConvIds')
         return new Promise(async (resolve, reject) => {
             try {
                 let backend_token = `type=backend_token;token=${process.env.BACKEND_TOKEN}`;
                 let team_url = process.env.COGNITO_REPO_URL + 'users/teampreference';
                 var bodyObj = { workspace_id: workspaceId, user_ids : members, teamType: teamType, created_by: user_id}
                  console.log(team_url, 'team_url')
                 // console.log(bodyObj, 'bodyObj')
                 axios.post(team_url, bodyObj, { headers: { Authorization: backend_token } })
                     .then(teamResp => {
                         console.log(teamResp.data, 'teamResp')
                         if (!teamResp.data.error) {
                             resolve(teamResp.data.result)
                         } else {
                             reject(teamResp.data.message)
                         }
                         //console.log(userResp.data.result.users, 'userResp')
 
                     }).catch(userErr => {
                         console.log(userErr, 'userErr')
                         reject(userErr.error)
                     })
 
             } catch (error) {
                 //console.log(error, 'error')
                 reject(error);
             }
         });
     },
}
module.exports = { teamService }

