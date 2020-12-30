const { userVerifyService } = require('./userVerifyService');

const redis = {
    host: process.env.REDIS, 
    port: 6379
  };
const io = require('socket.io-emitter')(redis);  // Socket emitter

const origin = process.env.ORIGIN;
const socketSvc = {
    authenticateSocket: (socket) => {
        return new Promise(async (resolve, reject) => {
            console.log(`socketSvc:authenticateSocket => Trying to authenticate new socket: ${socket.id}`)
            socket.emit('auth?', { status: "All good here, identify yourself", key: process.env.VERSION_KEY });
            await socket.on('auth', async (data) => {
                userVerifyService. //This function does not check against user/workspace. Rewrite or add a new function. PLEASE.
                    isValidUserWithData(data.token, data.user, data.workspace).then(status => {
                        console.log(`socketSvc:authenticateSocket => Token OK for Socket id: ${socket.id}, user: ${data.user}, workspace: ${data.workspace}`);
                        socket.user = data.user;
                        socket.workspace = data.workspace;
                        socket.socketVersion = data.socketVersion?parseInt(data.socketVersion):null;
                        socket.join(socketSvc.generateRoomKey(socket.user,socket.workspace ));
                        socket.emit('accept', { status: 'Good', message: "All good, welcome to flujo" });
                        resolve({
                            status: true,
                            data
                        });
                        return;
                    }).catch(error => {
                        console.log(`socketSvc:authenticateSocket => Token BAD for Socket id: ${socket.id}, user: ${data.user}, workspace: ${data.workspace}. Error: `, error);
                        socket.emit('reject', { status: 'ExpiredToken', message: "Token is invalid or expired" });
                        resolve({
                            status: false
                        });
                        return;
                        // TO DO: This should be taken care of, separate invalid from expired.
                    })
            })
        })
    },

    postDelta: (delta) => {
        socketSvc.post(delta, socketSvc.generateRoomKey(delta.user, delta.workspace), 'flujo.delta');
    },

    post: (data, room, type) => {
        io.to(room).emit(type, data);
    },

    generateRoomKey: (user, workspace) => {
        return `${origin}:${user}:${workspace}`;
    }
    
}

module.exports = { socketSvc }