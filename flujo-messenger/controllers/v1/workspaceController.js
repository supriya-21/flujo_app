global.fetch = require('node-fetch');
const { usersModel } = require('../../models/usersModel');
const { conversationsModel } = require('../../models/conversationsModel');
const { userVerifyService } = require('../../services/userVerifyService');
const { notificationService } = require('../../services/notificationService');
const { teamService } = require('../../services/teamService');


const workspaceController = {
    getWorkspace: (req, res) => {
        if (!(req.headers.authorization && req.headers.userid && req.headers.workspaceid)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId and workspaceId", status_code: 101 })
        } else {
            let workspace = { 
                "workspaceId": "1", 
                "conversations": { 
                    "convId": "1",
                    "name": "Soorej", 
                    "messages": [
                        { 
                            "mesgId": 1, 
                            "msg": "hello there" 
                        }, 
                        { 
                            "mesgId": 2,
                            "msg": "general kenobi" 
                        }
                    ] 
                } 
            }
            res.status(200).send({ message: "Sorry mate, you need a permit for this call. Here is a dummy for you to play with", result: workspace, status_code: 100, error: false })
        }
    }

}

module.exports = { workspaceController };