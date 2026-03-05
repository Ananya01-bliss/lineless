const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for Socket.IO
        methods: ['GET', 'POST']
    }
});

// Middleware
// Middleware
app.use(cors()); // Allow all origins for development
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lineless')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('join-organization', (orgId) => {
        socket.join(`org-${orgId}`);
        console.log(`Client ${socket.id} joined organization ${orgId}`);
    });

    socket.on('join-service', (serviceId) => {
        socket.join(`service-${serviceId}`);
        console.log(`Client ${socket.id} joined service ${serviceId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/services', require('./routes/services'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Lineless API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };
