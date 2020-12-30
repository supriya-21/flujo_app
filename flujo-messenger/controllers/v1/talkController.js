const { notificationSvc } = require('../../services/notificationSvc');
const sha1 = require('sha1');



const talkController = {
    startOneToOneConference: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization, userId, and workspaceId", status_code: 101 })
        }
        if (!(req.body.user && req.body.workspace && req.body.conference)) {
            res.status(400).send({ error: true, message: "Expected user, workspace, and conferenceLink in body", status_code: 101 })
        }
        let userData = req.user_info;
        let userid = userData.id;
        let workspaceid = userData.workspaces[0].id;
        let delta = {
            type: "messenger.new_call",
            workspace: req.body.workspace,
            user: String(req.body.user),
            event_ts: Date.now(),
            data: {
                caller: String(userid),
                callerWorkspace: String(workspaceid),
                conference: req.body.conference
            },
            relevance: 'Immediate'
        }
        delta.event_id = sha1(JSON.stringify(delta)).slice(0, 13)
        notificationSvc.notifyUser(delta);
        res.status(200).send({ message: "Invite send", error: false })
    },

    endOneToOneConference: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        }
        if (!(req.body.user && req.body.workspace && req.body.conference)) {
            res.status(400).send({ error: true, message: "Expected user, workspace, and conferenceLink in body", status_code: 101 })
        }
        let userData = req.user_info;
        let userid = userData.id;
        let workspaceid = userData.workspaces[0].id;
        const delta = {
            type: "messenger.end_call",
            workspace: req.body.workspace,
            user: req.body.user,
            data: {
                caller: String(userid),
                callerWorkspace: String(workspaceid),
                conference: req.body.conference
            }
        }
        notificationSvc.notifyUser(delta)
        res.status(200).send({ message: "Invite send", error: false })
    },
    ignoreOneToOneConference: (req, res) => {
        if (!(req.headers.authorization)) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        }
        if (!(req.body.user && req.body.workspace && req.body.conference)) {
            res.status(400).send({ error: true, message: "Expected user, workspace, and conferenceLink in body", status_code: 101 })
        }
        let userData = req.user_info;
        let userid = userData.id;
        let workspaceid = userData.workspaces[0].id;
        const delta = {
            type: "messenger.ignore_call",
            workspace: req.body.workspace,
            user: req.body.user,
            data: {
                caller: String(userid),
                callerWorkspace: String(workspaceid),
                conference: req.body.conference
            }
        }
        notificationSvc.notifyUser(delta);
        res.status(200).send({ message: "Ignore sent", error: false })
    },

    answerOneToOneConference: (req, res) => {
        if (!(req.headers.authorization )) {
            res.status(400).send({ error: true, message: "Expected authorization", status_code: 101 })
        }
        if (!(req.body.user && req.body.workspace && req.body.conference)) {
            res.status(400).send({ error: true, message: "Expected user, workspace, and conferenceLink in body", status_code: 101 })
        }
        let userData = req.user_info;
        let userid = userData.id;
        let workspaceid = userData.workspaces[0].id;
        const delta = {
            type: "messenger.answer_call",
            workspace: req.body.workspace,
            user: req.body.user,
            data: {
                caller: String(userid),
                callerWorkspace: String(workspaceid),
                conference: req.body.conference
            }
        }
        notificationSvc.notifyUser(delta);
        res.status(200).send({ message: "Answer sent", error: false })
    },

}

module.exports = { talkController };