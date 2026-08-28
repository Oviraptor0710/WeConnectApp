import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// Browser chỉ được kết nối từ các origin đã cấu hình. Internal API còn có
// shared secret riêng và không phụ thuộc CORS để bảo mật.
const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin is not allowed'));
    },
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
const INTERNAL_SECRET = process.env.WS_INTERNAL_SECRET || SECRET_KEY;
const PORT = process.env.PORT || 3000;

function hasValidInternalSecret(request) {
    const supplied = request.get('X-Internal-Secret') || '';
    const expected = INTERNAL_SECRET || '';
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    return suppliedBuffer.length === expectedBuffer.length
        && suppliedBuffer.length > 0
        && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
}


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

    // Khi client ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`[Socket] User ${socket.userId} disconnected`);
    });
});

app.post('/internal/broadcast', (req, res) => {
    if (!hasValidInternalSecret(req)) {
        return res.status(401).json({ error: 'Invalid internal secret' });
    }

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
