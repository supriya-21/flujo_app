const axios = require('axios');



const botService = {
    newBotEvent: (event) => {
        console.log("botService:newBotEvent => Event to bot")
        return new Promise((resolve, reject) => {
            const auth = `type=backend_token;token=${process.env.BACKEND_TOKEN};workspace=${event.workspace}`;
            const BOT_URL = process.env.BASE_URL + "flujobot/api/v1/events"
            const instance = axios.create({
                headers: {
                    authorization: auth,
                    userid: String(event.user)
                }
            });
            instance.post(BOT_URL, event).then((response) => {
                console.log("botService:newBotEvent => Bot event triggered")
                resolve({ bot_delivered: true });
            }).catch(error => {
                console.log("botService:newBotEvent => ERROR ", error)
                reject();
            })
        })
    }

}

module.exports = { botService }