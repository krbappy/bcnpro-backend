const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const firebaseAdmin = require('./config/firebase');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
    origin: ['https://bcnpro.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: ['https://bcnpro.vercel.app', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
});

// Store io instance globally
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log('Handshake query:', socket.handshake.query);

    if (userId) {
        socket.join(userId);
        console.log(`User ${userId} connected`);
    }

    socket.on('disconnect', () => {
        if (userId) {
            console.log(`User ${userId} disconnected`);
        }
    });
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Root route for server test
app.get('/', (req, res) => {
    res.json({
        message: 'Server is running successfully',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/address-book', require('./routes/addressBookRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 