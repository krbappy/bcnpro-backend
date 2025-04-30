const Booking = require('../models/Booking');
const User = require('../models/User');
const { calculateDeliveryPrice } = require('../utils/priceCalculator');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
    try {
        console.log('Received booking data:', JSON.stringify(req.body, null, 2));
        
        const { firebaseUid, ...bookingData } = req.body;
        
        // Find user by Firebase UID
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Found user:', user._id);
        
        // Create booking with user reference and all other data
        const booking = new Booking({
            user: user._id,
            ...bookingData
        });

        // Calculate the price for this delivery
        const price = calculateDeliveryPrice(booking);
        booking.price = price;

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
// @access  Public
const updateBooking = async (req, res) => {
    try {
        const { firebaseUid, ...bookingData } = req.body;
        
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: user._id
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
// @access  Public
const updateBookingPaymentStatus = async (req, res) => {
    try {
        const { firebaseUid, paymentIntentId, paymentMethodId, paymentStatus } = req.body;
        
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: user._id
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const updateData = {
            paymentIntentId,
            paymentMethodId,
            paymentStatus
        };

        // If payment is successful, mark booking as paid
        if (paymentStatus === 'paid') {
            updateData.isPaid = true;
            updateData.paidAt = new Date();
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking payment status:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Public
const getBooking = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.query.firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: user._id
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
// @access  Public
const getBookings = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.query.firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const bookings = await Booking.find({ user: user._id });
        res.json(bookings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Public
const deleteBooking = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.body.firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            user: user._id
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