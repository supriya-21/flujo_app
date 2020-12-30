const { usersModel } = require('../../models/usersModel');


const deviceController = {
    newDevice: (req, res) => {
        // if (!(req.headers.userid && req.headers.workspaceid)) {
        //     res.status(400).send({ error: true, message: "Expected userid in headers", status_code: 101 })
        // } else {
        //     usersModel.getOne(req.db, parseInt(req.headers.userid))
        //         .then(user => {
        //             if (!(req.body.device)) {
        //                 res.status(400).send({ error: true, message: "Require device in body", result: {}, status_code: 160 })
        //             }
        //             else {
        //                 if (user.devices) {
        //                     user.devices.push({ device: req.body.device, workspace: req.headers.workspaceid })
        //                 } else {
        //                     user.devices = [{ device: req.body.device, workspace: req.headers.workspaceid }]
        //                 }
        //                 user.devices = user.devices.filter((device, index, self) => self.findIndex(t => t.workspace === device.workspace && t.device === device.device) === index)
        //                 console.log(user)
        //                 usersModel.update(req.db, user["userId"], user).
        //                     then(result => {
        //                         console.log("Successfully inserted Device id")
        //                         res.status(200).send({ error: false, message: "Successfully inserted Device id", status_code: 100, result: {} })
        //                     }).
        //                     catch(err => {
        //                         console.log("Unable to add device keys to users db", err)
        //                         res.status(500).send({ error: true, message: "Unable to add device keys to users db", result: err, status_code: 160 })
        //                     })
        //             }
        //         }).catch(err => {
        //             console.log("Unable to find user.", err)
        //             res.status(500).send({ error: true, message: "Unable to find user", result: err, status_code: 160 })
        //         })

        // }
        res.status(200).send({ error: false, message: "Successfully inserted Device id", status_code: 100, result: {} })

    },

    deleteDevice: (req, res) => {
        // if (!(req.headers.userid)) {
        //     res.status(400).send({ error: true, message: "Expected userId", status_code: 101 })
        // } else {
            let userData = req.user_info;
            let userid = userData.id
            let workspaceid = userData.workspaces[0].id;
            usersModel.getOne(req.db, parseInt(userid))
                .then(user => {
                    console.log(req.params.device)
                    user.devices = user.devices.filter((ele) => {
                        return ele.device !== req.params.device || ele.workspace !== workspaceid;
                    });
                    // user.device = []
                    console.log(user)
                    usersModel.update(req.db, user["userId"], user).
                        then(result => {
                            console.log("Successfully deleted FCM keys")
                            res.status(200).send({ error: false, message: "Success", status_code: 100, result: {} })
                        }).
                        catch(err => {
                            console.log("Unable to delete keys of users db", err)
                            res.status(500).send({ error: true, message: "Unable to delete keys of user", result: err, status_code: 160 })
                        })

                }).catch(err => {
                    console.log("Unable to find user.", err)
                    res.status(500).send({ error: true, message: "Unable to find user", result: err, status_code: 160 })
                })

        }
    // }

};

module.exports = { deviceController };
