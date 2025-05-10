const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { protect } = require('../middleware/authMiddleware');

// Get user's notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark notification as read
router.patch('/:id/read', protect, async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        res.json(notification);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

module.exports = router; 