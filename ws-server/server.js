import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Enable CORS for internal API and WebSocket
const corsOptions = {
    origin: '*', // Trong môi trường thực tế, nên giới hạn origin
    methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
    cors: corsOptions
});

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
    console.error("FATAL ERROR: SECRET_KEY is not set in environment variables.");
    process.exit(1);
}
const PORT = process.env.PORT || 3000;


io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, SECRET_KEY);        
        socket.userId = parseInt(decoded.sub, 10);
        
        if (isNaN(socket.userId)) {
            return next(new Error('Authentication error: Invalid user ID'));
        }
        
        next();
    } catch (err) {
        console.error('Socket authentication failed:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket] User ${socket.userId} connected (Socket ID: ${socket.id})`);


    const userRoom = `private-user-${socket.userId}`;
    socket.join(userRoom);
    console.log(`[Socket] User ${socket.userId} joined room: ${userRoom}`);
    socket.on('subscribe_channel', (data) => {
        const channelName = data.channel;
        if (channelName && channelName.startsWith('private-conversation-')) {
            socket.join(channelName);
            console.log(`[Socket] User ${socket.userId} subscribed to channel: ${channelName}`);
        }
    });

    socket.on('unsubscribe_channel', (data) => {
        const channelName = data.channel;
        if (channelName) {
            socket.leave(channelName);
            console.log(`[Socket] User ${socket.userId} unsubscribed from channel: ${channelName}`);
        }
    });

    // Khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`[Socket] User ${socket.userId} disconnected`);
    });
});

app.post('/internal/broadcast', (req, res) => {
    const { room, event, data } = req.body;

    if (!room || !event) {
        return res.status(400).json({ error: 'Missing room or event' });
    }

    console.log(`[Broadcast] Event '${event}' to room '${room}'`);
    
    // Phát sóng sự kiện tới phòng tương ứng
    io.to(room).emit(event, data);

    res.json({ success: true, message: `Event ${event} broadcasted to ${room}` });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Socket.IO Server is running on port ${PORT}`);
});
