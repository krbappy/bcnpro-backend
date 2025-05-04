const Booking = require('../models/Booking');
const User = require('../models/User');
const { calculateDeliveryPrice } = require('../utils/priceCalculator');
const Team = require('../models/Team');

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

// @desc    Get all bookings for a user and their team
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
    try {
        console.log('Fetching bookings for user:', req.user.id);
        
        // Get the user with their team info
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let bookings = [];
        
        // If user is part of a team
        if (user.team) {
            console.log('User is part of team:', user.team);
            
            // Get the team to check roles
            const team = await Team.findById(user.team)
                .populate('members.user');
            
            if (team) {
                // Get all team member IDs
                const teamMemberIds = team.members.map(member => member.user._id);
                console.log('Team member IDs:', teamMemberIds);
                
                // Fetch all bookings from team members
                bookings = await Booking.find({
                    user: { $in: teamMemberIds }
                }).populate('user', 'name email');
                
                console.log(`Found ${bookings.length} team bookings`);
            }
        } else {
            // If user is not part of a team, just get their bookings
            console.log('User is not part of a team, fetching personal bookings');
            bookings = await Booking.find({ user: req.user.id })
                .populate('user', 'name email');
        }
        
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
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

// @desc    Update booking order status
// @route   PATCH /api/bookings/:id/order-status
// @access  Private
const updateBookingOrderStatus = async (req, res) => {
    try {
        console.log('Updating order status for booking:', req.params.id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const { orderStatus } = req.body;
        
        if (!orderStatus) {
            return res.status(400).json({ message: 'Order status is required' });
        }
        
        // Validate order status
        const validStatuses = ['pending', 'processing', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({ 
                message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }
        
        console.log('Authenticated user ID:', req.user.id);
        
        const booking = await Booking.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!booking) {
            console.log('Booking not found for user');
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        console.log('Found booking:', booking._id, 'Current order status:', booking.orderStatus);

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { orderStatus },
            { new: true }
        );
        
        console.log('Updated booking - new order status:', updatedBooking.orderStatus);

        res.json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking order status:', error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    updateBooking,
    getBooking,
    getBookings,
    deleteBooking,
    updateBookingPaymentStatus,
    updateBookingOrderStatus
}; 