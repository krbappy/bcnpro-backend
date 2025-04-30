const asyncHandler = require('express-async-handler');
const admin = require('firebase-admin');
const User = require('../models/User');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    // Check if auth header exists and has the right format
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token with Firebase
            const decodedToken = await admin.auth().verifyIdToken(token);
            
            // Find the user by their email instead of Firebase UID
            const user = await User.findOne({ email: decodedToken.email });
            
            if (!user) {
                res.status(401);
                throw new Error('User not found');
            }
            
            // Set user in request
            req.user = {
                id: user._id,
                email: user.email,
                firebaseUid: user.firebaseUid
            };
            
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, invalid token');
        }
    }
    
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect }; 