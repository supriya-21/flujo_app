const redis = require('redis')
// const socketManager = require('.notificationSvc')

let redisClient = redis.createClient({
    port: 6379,               // replace with your port
    host: process.env.REDIS,        // replace with your hostanme or IP address
    // optional, if using SSL
    // use `fs.readFile[Sync]` or another
    // TO DO: Add authentication.
})


const PRESENCE_PERSISTENCE = 10; //In seconds
const TYPING_PERSISTENCE = 2;

const presenceManager = {
    getPresenceOfUser:  (user, socket) => {
        // Return presence of user queried for.
        // Add a check for workspace too if you care abut that info
        let prefix = process.env.ORIGIN + "-msngr-presc-"
        redisClient.get(prefix + String(user), (error, result) => {
            if (!error) {
                if (result === null) {
                    socket.emit("messenger.user_presence", { user: user, presence: "away" })
                }
                else {
                    socket.emit("messenger.user_presence", { user: user, presence: result })
                }
            }
        })
    },

    setPresence: (user, workspace, presence) => {
        // console.log(`presenceAndTypingSvc:presenceManager => set presence status for user: ${user}, workspace: ${workspace}, presence: ${presence}`)
        // status = { workspace: delta.workspace, status: delta.status }
        let prefix = process.env.ORIGIN + "-msngr-presc-"
        redisClient.set(prefix + String(user), presence, 'EX', PRESENCE_PERSISTENCE)
    },

}

const typingManager = {
    getStatusOfConversation: (conv, socket) => {
        // Return presence of user queried for.
        // Add a check for workspace too if you care abut that info
        let prefix = process.env.ORIGIN + "-msngr-typing-"
        redisClient.get(prefix + String(conv), (error, result) => {
            if (!error) {
                socket.emit("messenger.conv_typing", { conv: conv, typing: result })
            }
        })
    },

    setStatusOfConversation: (conv, user) => {
        // console.log(`presenceAndTypingSvc:typingManager => set typing status for conv: ${conv}, user: ${user}`)
        // status = { workspace: delta.workspace, status: delta.status }
        let prefix = process.env.ORIGIN + "-msngr-typing-"
        redisClient.set(prefix + String(conv), user, 'EX', TYPING_PERSISTENCE)
    },

}



module.exports = { presenceManager, typingManager }