const { notificationSvc } = require('../../services/notificationSvc');
const { userVerifyService } = require('../../services/userVerifyService');

const clientPushController = {
    /**
     * After security merge should use only with backend token  
     * based on event type can subscribe from client 
     * */
    pushDelta: (req, res) => {
        try {
            let delta = {};
            delta.data = req.body.data;
            delta.type = req.body.type;
            delta.workspace = req.body.workspace;
            var users = [];
            if (!(req.body.users && Array.isArray(req.body.users) && req.body.users.length > 0)) {
                users.push(req.body.user)
            } else {
                users = req.body.users;
            }
            var deltaIds = []
            users.forEach(user => {
                delta.user = user;
                console.log("clientPushController:pushDelta => Trying to send delta", delta);
                notificationSvc.notifyUser(delta);
                deltaIds.push(delta.event_id);
            });
            res.status(200).send({
                error: false,
                message: `Trying to send deltas: ${deltaIds}. Delivery is not guarenteed.`,
                deltaids: deltaIds,
                status_code: 100
            });
            return;
        } catch (error) {
            console.log("clientPushController:pushDelta => Failed to send delta", error)
            res.status(500).send({
                error: true,
                message: "clientPushController:pushDelta => Failed to send delta"
            });
            return;
        }
    },

    pushToWorkspace: (req, res) => {
        try {
            let deltaIds = []
            let delta = {};
            delta.data = req.body.data;
            delta.type = req.body.type;
            delta.workspace = req.body.workspace;
            userVerifyService.getWorkspaceUsers('', req.body.user, delta.workspace)
                .then(usersResp => {
                    usersResp.users.forEach(user => {
                        delta.user = user.id;
                        // console.log("clientPushController:pushToWorkspace => Trying to send delta", delta);
                        notificationSvc.notifyUser(delta);
                        deltaIds.push(delta.event_id);
                    });
                })
                .catch(error => {
                    console.log("clientPushController:pushToWorkspace => Failed to get users list", error)
                    res.status(500).send({
                        error: true,
                        message: "clientPushController:pushToWorkspace => Failed to get users list"
                    });
                    return;
                })
                .finally(() => {
                    res.status(200).send({
                        error: false,
                        message: `Trying to send deltas: ${deltaIds}. Delivery is not guarenteed.`,
                        deltaids: deltaIds,
                        status_code: 100
                    });
                    return;
                });
        } catch (error) {
            console.log("clientPushController:pushToWorkspace => Failed to send delta", error)
            res.status(500).send({
                error: true,
                message: "clientPushController:pushToWorkspace => Failed to send delta"
            });
            return;
        }
    }
};

module.exports = { clientPushController };
