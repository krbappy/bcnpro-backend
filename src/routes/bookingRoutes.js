const express = require('express');
const router = express.Router();
const {
    createBooking,
    updateBooking,
    getBooking,
    getBookings,
    deleteBooking,
    updateBookingPaymentStatus
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all booking routes
router.use(protect);

router.route('/')
    .post(createBooking)
    .get(getBookings);

router.route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(deleteBooking);

// Payment status update route
router.route('/:id/payment-status')
    .patch(updateBookingPaymentStatus);

module.exports = router; 