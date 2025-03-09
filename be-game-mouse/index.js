const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

let rooms = {};

function generateMoleSequence(length = 30) {
    let sequence = [];
    for (let i = 0; i < length; i++) {
        sequence.push(Math.floor(Math.random() * 4)); 
    }
    return sequence;
}

io.on('connection', (socket) => {
    console.log('Người chơi kết nối:', socket.id);

    socket.on('createRoom', (playerName) => {
        const roomId = Math.random().toString(36).substring(7);
        rooms[roomId] = { 
            players: [{ id: socket.id, name: playerName, score: 0 }],
            gameStarted: false,
            moleSequence: generateMoleSequence()
        };
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, players: rooms[roomId].players });
    });

    socket.on('joinRoom', (roomId, playerName) => {
        if (!rooms[roomId]) {
            socket.emit('error', { message: 'Phòng không tồn tại' });
            return;
        }
        if (rooms[roomId].players.length >= 2) {
            socket.emit('error', { message: 'Phòng đã đầy' });
            return;
        }
        rooms[roomId].players.push({ id: socket.id, name: playerName, score: 0 });
        socket.join(roomId);
        rooms[roomId].gameStarted = true;

        io.to(roomId).emit('startGame', { 
            roomId, 
            players: rooms[roomId].players,
            moleSequence: rooms[roomId].moleSequence
        });
    });

    socket.on('whack', (roomId) => {
        const room = rooms[roomId];
        if (!room || !room.players) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        player.score += 1;
        io.to(roomId).emit('updateScore', { roomId, players: room.players });
    });

    socket.on('endGame', (roomId) => {
        if (!rooms[roomId]) return;

        const sortedPlayers = [...rooms[roomId].players].sort((a, b) => b.score - a.score);

        io.to(roomId).emit('gameOver', { roomId, players: sortedPlayers });
    });

    socket.on('restartGame', (roomId) => {
        if (!rooms[roomId]) return;

        rooms[roomId].moleSequence = generateMoleSequence();
        rooms[roomId].players.forEach(player => player.score = 0);

        io.to(roomId).emit('startGame', { 
            roomId, 
            players: rooms[roomId].players,
            moleSequence: rooms[roomId].moleSequence
        });
    });

    socket.on('disconnect', () => {
        console.log('Người chơi ngắt kết nối:', socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit('updateScore', { roomId, players: room.players });
                }
                break;
            }
        }
    });
});

server.listen(3673, () => console.log('Server chạy ở port 3673'));
