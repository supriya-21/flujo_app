const axios = require('axios');

const tokenVerificationService = {
    userVerifyAndData: (req, res, next) => {
        // console.log("Token Verification for ", req.method, req.url)
        // console.log(req.headers.authorization, 'token')
        if (!req.headers.authorization) {
            res.status(403).send({ error: true, message: "Authorization required.", status_code: 160 })
        } else {
            let tkn_splt = req.headers.authorization.split(';');
            // console.log(tkn_splt, 'tkn_splt')
            if (tkn_splt.length > 0) {
                let tknfind = tkn_splt.find(value => /^token=/.test(value));
                let wsfind = tkn_splt.find(value => /^workspace=/.test(value));
                if (tkn_splt.includes(`type=user_token`)) { // cognito token checking
                    if (tknfind && wsfind) {
                        let token = tknfind.split(`token=`)[1];
                        let workspace_id = parseInt(wsfind.split(`workspace=`)[1]);
                        tokenVerificationService.userVerifywithReg(req.headers.authorization).then(uResp => {
                            req.user_info = uResp;
                            req.headers.workspaceid = String(workspace_id);
                            req.headers.userid = String(uResp.id);
                            next();
                            //res.status(200).send({ error: true, message: "token", status_code: 101, result: { tknfind, wsfind, token, workspace_id, uResp } })
                        }).catch(uErr => {
                            // Error should specify if wrong token, expired token, or internal system error. 
                            res.status(uErr.type).send({ error: true, message: uErr.message });
                        })
                    } else {
                        res.status(403).send({ error: true, message: "Badly formatted token: Expected token and workspace", status_code: 101, result: { tknfind, wsfind } })
                    }
                } else if (tkn_splt.includes(`type=backend_token`)) { // backend token checking
                    let token_bknd = tknfind.split(`token=`)[1];
                    if (token_bknd === process.env.BACKEND_TOKEN) {
                        console.log('backend tokens matched');
                        req.user_info = {
                            id: req.headers.userid,
                            workspaces: [{ id: req.headers.workspaceid }]
                        };
                        next();
                    } else {
                        res.status(403).send({ error: true, message: "Badly formatted token: backend token mismatched.", status_code: 160 })

                    }

                } else if (tkn_splt.includes(`type=client_token`)) { //client token checking
                    // will implemets once accecess token and client token 
                    console.log('client_token')
                } else {
                    console.log('Token type not set')
                    res.status(403).send({ error: true, message: "Badly formatted token: Token type not set.", status_code: 101 });
                }
            } else {
                res.status(403).send({ error: true, message: "Badly formatted token: Expected token, workspace and token type.", status_code: 101 });
            }
        }
    },
    userVerifywithReg: (authorization) => {
        return new Promise(async (resolve, reject) => {

            try {
                let url = process.env.COGNITO_REPO_URL + 'token/verify/user';
                console.log(url, 'url')
                axios.get(url, {
                    headers: {
                        Authorization: authorization //the Authorization is a variable which holds the token
                    }
                }).then(response => {
                    resolve(response.data.result);
                }).catch(error => {
                    console.log(error, 'user verify error')
                    reject({ error: true, type: 403, message: error.response.data.message });
                });
            } catch (err) {
                console.log(err, 'verification api error')
                reject({ error: true, type: 403, message: "User verification error." });

            }
        })
    },

    serverToServerVerify: (req, res, next) => {
        try {
            if (!req.headers.authorization) {
                res.status(403).send({ error: true, message: "Authorization required.", status_code: 160 })
            } else {
                let tkn_splt = req.headers.authorization.split(';');
                const tknfind = tkn_splt.find(value => /^token=/.test(value));
                // let wsfind = tkn_splt.find(value => /^workspace=/.test(value));
                if (tkn_splt.includes(`type=backend_token`)) { // backend token checking
                    let token_bknd = tknfind.split(`token=`)[1];
                    if (token_bknd === process.env.BACKEND_TOKEN) {
                        console.log('backend tokens matched');
                        next();
                    } else {
                        res.status(403).send({ error: true, message: "Badly formatted token: backend token mismatched.", status_code: 160 })
                    }

                } else {
                    console.log('Token type not set')
                    res.status(403).send({ error: true, message: "Badly formatted token: Token type not set.", status_code: 101 });
                }
            }
        } catch (error) {
            res.status(403).send({ error: true, message: "User verification error.", status_code: 101, result: error });

        }
    },

    // userWorkspaceChecking: (accessToken, workspace_id) => {
    //     // console.log(accessToken, workspace_id, 'userWorkspaceChecking')
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             var incomingToken = await jwt.decode(accessToken, { complete: true });
    //             if (incomingToken) {
    //                 usersModel.findOne({
    //                     where:
    //                     {
    //                         [Op.and]:
    //                             Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), {
    //                                 [Op.eq]: incomingToken.payload.email.toLowerCase()
    //                             })
    //                     },
    //                     include: [{
    //                         model: workspacesModel,
    //                         where: { id: workspace_id },
    //                         through: { user_status: 'Active' },
    //                         required: true
    //                     }],
    //                 }).then(uwResp => {
    //                     // console.log(uwResp, 'resp')
    //                     if (uwResp !== null) {
    //                         //console.log(resp, 'resp')
    //                         cognitoVerificationServices.isValidToken(accessToken).then(vResp => {
    //                             // console.log(vResp, 'verfication success');
    //                             resolve(uwResp)
    //                         }).catch(vErr => {
    //                             console.log(vErr)
    //                             // Error should be more descriptive.  
    //                             // If network error then 500. 
    //                             // If token verification failed, 403.
    //                             reject({ error: true, type: 403, message: 'Token verification failed.' });
    //                         })
    //                     } else {
    //                         reject({ error: true, type: 403, message: 'User does not exist for given workspace.' });
    //                     }
    //                 }).catch(error1 => {
    //                     console.log(error1, 'error1')
    //                     reject({ error: true, type: 500, message: 'Database operation failed. Try again.' });
    //                 });
    //             } else {
    //                 reject({ error: true, type: 403, message: 'Can not decode access token.' });
    //             }
    //         } catch (error2) {
    //             console.log(error2, 'error2')
    //             reject({ error: true, type: 403, message: 'Can not decode access token.' });
    //         }
    //     })
    // }
}
module.exports = { tokenVerificationService }