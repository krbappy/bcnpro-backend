const express = require('express');
const router = express.Router();
const {
    createBooking,
    updateBooking,
    getBooking,
    getBookings,
    deleteBooking
} = require('../controllers/bookingController');

router.route('/')
    .post(createBooking)
    .get(getBookings);

router.route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(deleteBooking);

module.exports = router; 