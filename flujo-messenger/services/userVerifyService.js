var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
const axios = require('axios');

const userVerifyService = {
    isValidUser: (accessToken) => { //verifing the user token
        return new Promise(async (resolve, reject) => {
            try {
                var url = `https://cognito-idp.${process.env.USERPOOL_REGION}.amazonaws.com/${process.env.USERPOOL_ID}/.well-known/jwks.json`;
                //console.log(url, 'url')
                const incomingToken = await jwt.decode(accessToken, { complete: true })
                //console.log(incomingToken, 'incomingToken')
                if (incomingToken) {
                    axios.get(url)
                        .then(function (response) {
                            var _kid = incomingToken.header.kid;
                            //console.log(_kid, '_kid')

                            //console.log(response.data.keys, 'response.data.keys')
                            // key = {}
                            var ids = response.data.keys.reduce((ids, obj) => {
                                if (obj.kid === _kid) {
                                    ids.push(obj);
                                }
                                return ids;
                            }, []);
                            // console.log(ids, 'ids')
                            var pem = jwkToPem(ids[0]);
                            //console.log(pem, 'pem')
                            jwt.verify(accessToken, pem, { algorithms: [incomingToken.header.alg] }, function (err, decodedToken) {
                                if (err) {
                                    //console.log(err, 'err1')
                                    reject(err)
                                }
                                else {
                                    //console.log(decodedToken, 'decodedToken')
                                    resolve(true)
                                }
                            })
                        })
                        .catch(function (errors) {
                            //console.log(errors, 'error')
                            reject(errors);
                        });
                } else {
                    reject(true)
                }

            } catch (error) {
                //console.log(error, 'error')
                reject(error);
            }
        });
    },

    /* verifing the user token 
     * get user with associated data
     */
    isValidUserWithData: (accessToken, userId, workspaceId) => { //verifing the user token
        return new Promise(async (resolve, reject) => {
            try {
                // userVerifyService.isValidUser(accessToken).then(rep => {
                let url = process.env.COGNITO_REPO_URL + 'token/verify/user';
                console.log(url, 'url')
                axios.get(url, {
                    headers: {
                        Authorization: accessToken //the Authorization is a variable which holds the token
                    }
                }).then(userResp => {
                    //console.log(userResp.data.result.users, 'userResp')
                    resolve(userResp.data.result)
                }).catch(userErr => {
                    console.log("UserVerificationService: (ERROR): ", userErr)
                    reject(userErr)
                })
                // }).catch(error => {
                //     console.log("UserVerificationService: (ERROR): ", error)
                //     reject(error)
                // })

            } catch (error) {
                console.log("UserVerificationService: (ERROR): ", error)
                reject(error);
            }
        });
    },

    /* verifing the user token 
     * get workspace users data
     */
    getWorkspaceUsers: (accessToken, userId, workspaceId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let backend_token = `type=backend_token;token=${process.env.BACKEND_TOKEN}`;
                let infourl = process.env.COGNITO_REPO_URL + 'workspace/users/data';
                let infoparams = { "user_id": parseInt(userId), "workspace_id": parseInt(workspaceId) }
                axios.post(infourl, infoparams, { headers: { Authorization: backend_token } })
                    .then(userResp => {
                        resolve(userResp.data.result)
                    }).catch(userErr => {
                        console.log('userVerifyService:getWorkspaceUsers => ERROR 1: ', userErr)
                        reject(userErr)
                    });
            } catch (error) {
                console.log('userVerifyService:getWorkspaceUsers => ERROR 2: ', error)
                reject(error);
            }
        });
    },

    getUserConvObj: (data, userId, workspaceId) => {
        console.log(data, userId, workspaceId, 'data, userId, workspaceId')
        return new Promise(async (resolve, reject) => {
            try {
                var convObj = [];
                var users = data.users;
                var i = 0;
                do {
                    convObj = [...convObj, {
                        "members": (parseInt(userId) === parseInt(users[i].id)) ? [parseInt(userId)] : [parseInt(userId), parseInt(users[i].id)],
                        "pendingMembers": [],
                        "guests": [],
                        "name": String(users[i].id) + '-' + String(userId),
                        "admins": (parseInt(userId) === parseInt(users[i].id)) ? [parseInt(userId)] : [parseInt(userId), parseInt(users[i].id)],
                        "description": '',
                        "isOneToOne": true,
                        "isMyWall": (parseInt(userId) === parseInt(users[i].id)),
                        "teamType": 'private',
                        "invitationType": '',
                        "pinnedMessages": [],
                        "threads": [],
                        "workspaceId": parseInt(workspaceId),
                        "lastUpdated": new Date(),
                        "apps": [],
                        "timestamp": new Date(),
                        "lastMessageNumber": 0,
                        "isActive": 1
                    }];
                    i++;
                } while (i < users.length) {
                    resolve(convObj);
                }
            } catch (error) {
                reject(error);
            }
        });
    },
}

module.exports = { userVerifyService }
