const Booking = require('../models/Booking');
const User = require('../models/User');
const { calculateDeliveryPrice } = require('../utils/priceCalculator');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        console.log('Received booking data:', JSON.stringify(req.body, null, 2));
        
        const bookingData = req.body;
        
        // User is already authenticated via middleware
        const user = req.user;
        console.log('Found user:', user.id);
        
        // Create booking with user reference and all other data
        const booking = new Booking({
            user: user.id,
            ...bookingData
        });

        // Calculate the price for this delivery
        booking.price = bookingData.totalAmount;

        // Log any validation errors
        booking.validateSync();
        if (booking.errors) {
            console.error('Validation errors:', booking.errors);
        }

        const createdBooking = await booking.save();
        console.log('Booking created with ID:', createdBooking._id);
        res.status(201).json(createdBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(400).json({ 
            message: error.message,
            errors: error.errors 
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
    try {
        const bookingData = req.body;
        
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // If the booking is already paid, prevent certain changes
        if (booking.isPaid) {
            const fieldsNotAllowedToChange = [
                'price', 'currency', 'paymentStatus', 'paymentIntentId', 
                'paymentMethodId', 'isPaid', 'paidAt'
            ];
            
            fieldsNotAllowedToChange.forEach(field => {
                if (field in bookingData) {
                    delete bookingData[field];
                }
            });
        } else {
            // Recalculate price if the booking details have changed
            const tempBooking = { ...booking.toObject(), ...bookingData };
            const price = calculateDeliveryPrice(tempBooking);
            bookingData.price = price;
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            bookingData,
            { new: true, runValidators: true }
        );

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update booking payment status after successful payment
// @route   PATCH /api/bookings/:id/payment-status
// @access  Private
const updateBookingPaymentStatus = async (req, res) => {
    try {
        console.log('Updating payment status for booking:', req.params.id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { paymentIntentId, paymentMethodId, paymentStatus } = req.body;
        
        console.log('Authenticated user ID:', req.user.id);
        
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            console.log('Booking not found for user');
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        console.log('Found booking:', booking._id, 'Current payment status:', booking.paymentStatus, 'Current isPaid:', booking.isPaid);

        const updateData = {
            paymentIntentId,
            paymentMethodId,
            paymentStatus
        };

        // If payment is successful, mark booking as paid
        if (paymentStatus === 'paid') {
            console.log('Payment status is paid, updating isPaid to true');
            updateData.isPaid = true;
            updateData.paidAt = new Date();
        }
        
        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        console.log('Updated booking - payment status:', updatedBooking.paymentStatus, 'isPaid:', updatedBooking.isPaid);

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking payment status:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all bookings for a user
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id });
        res.json(bookings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        await Booking.deleteOne({ _id: booking._id });
        res.json({ message: 'Booking removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    updateBooking,
    getBooking,
    getBookings,
    deleteBooking,
    updateBookingPaymentStatus
}; 