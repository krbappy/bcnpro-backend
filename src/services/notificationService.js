const Notification = require('../models/Notification');

const notificationTypes = {
    BOOKING: 'booking',
    PAYMENT: 'payment',
    TEAM: 'team',
    ORDER_STATUS: 'order_status'
};

const notificationService = {
    async sendNotification({ userId, message, type }, io) {
        try {
            console.log('Creating notification:', { userId, message, type });
            
            // Validate required fields
            if (!userId) {
                console.error('Missing userId in notification');
                return null;
            }
            
            if (!type || !Object.values(notificationTypes).includes(type)) {
                console.error(`Invalid notification type: ${type}`);
                // Default to system type if invalid
                type = 'system';
            }
            
            const notification = await Notification.create({
                userId,
                message: message || 'New notification',
                type
            });

            console.log('Notification created:', notification);

            if (io) {
                console.log('Emitting notification to room:', userId.toString());
                io.to(userId.toString()).emit('new_notification', notification);
            } else {
                console.log('No io instance provided, notification not emitted');
            }

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            // Log but don't throw the error to prevent disrupting the main process
            return null;
        }
    },

    // Booking related notifications
    async sendBookingNotification({ userId, bookingId, status }, io) {
        console.log('Sending booking notification:', { userId, bookingId, status });
        
        const messages = {
            created: 'New delivery booking has been created',
            confirmed: 'Your delivery booking has been confirmed',
            cancelled: 'Your delivery booking has been cancelled',
            completed: 'Your delivery has been completed'
        };

        return this.sendNotification({
            userId,
            message: messages[status] || 'Booking status updated',
            type: notificationTypes.BOOKING
        }, io);
    },

    // Payment related notifications
    async sendPaymentNotification({ userId, amount, status }, io) {
        console.log('Sending payment notification:', { userId, amount, status });
        
        const messages = {
            success: `Payment of $${amount} has been processed successfully`,
            failed: `Payment of $${amount} has failed`,
            pending: `Payment of $${amount} is pending`
        };

        return this.sendNotification({
            userId,
            message: messages[status] || 'Payment status updated',
            type: notificationTypes.PAYMENT
        }, io);
    },

    // Team related notifications
    async sendTeamNotification({ userId, teamName, action }, io) {
        console.log('Sending team notification:', { userId, teamName, action });
        
        // Validate parameters
        if (!userId) {
            console.error('Missing userId in team notification');
            return null;
        }
        
        if (!teamName) {
            console.error('Missing teamName in team notification');
            teamName = 'your team';
        }
        
        const messages = {
            created: `You have been added to team "${teamName}"`,
            member_added: `New member has been added to team "${teamName}"`,
            member_removed: `A member has been removed from team "${teamName}"`,
            updated: `Team "${teamName}" has been updated`
        };

        return this.sendNotification({
            userId,
            message: messages[action] || 'Team status updated',
            type: notificationTypes.TEAM
        }, io);
    },

    // Order status notifications
    async sendOrderStatusNotification({ userId, orderId, status }, io) {
        console.log('Sending order status notification:', { userId, orderId, status });
        
        const messages = {
            processing: 'Your order is being processed',
            in_transit: 'Your order is in transit',
            delivered: 'Your order has been delivered',
            cancelled: 'Your order has been cancelled'
        };

        return this.sendNotification({
            userId,
            message: messages[status] || 'Order status updated',
            type: notificationTypes.ORDER_STATUS
        }, io);
    },

    async getUserNotifications(userId) {
        try {
            console.log('Fetching notifications for user:', userId);
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);
            console.log('Found notifications:', notifications.length);
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    async markAsRead(notificationId, userId) {
        try {
            console.log('Marking notification as read:', { notificationId, userId });
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { seen: true },
                { new: true }
            );
            
            if (!notification) {
                console.log('Notification not found');
                throw new Error('Notification not found');
            }
            
            console.log('Notification marked as read:', notification);
            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }
};

module.exports = notificationService; 