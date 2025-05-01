const stripe = require('../config/stripe');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Create a customer in Stripe if not exists
// @route   POST /api/payments/create-customer
// @access  Private
const createStripeCustomer = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // If user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
        res.json({ 
            customerId: user.stripeCustomerId,
            message: 'Customer already exists' 
        });
        return;
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
            userId: user.id
        }
    });

    // Update user with Stripe customer ID
    user.stripeCustomerId = customer.id;
    await user.save();

    res.status(201).json({ 
        customerId: customer.id,
        message: 'Stripe customer created successfully' 
    });
});

// @desc    Setup intent for adding a payment method
// @route   POST /api/payments/setup-intent
// @access  Private
const createSetupIntent = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (!user.stripeCustomerId) {
        res.status(400);
        throw new Error('Please create a customer first');
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
        customer: user.stripeCustomerId,
        payment_method_types: ['card'],
    });

    res.json({
        clientSecret: setupIntent.client_secret
    });
});

// @desc    Get all payment methods for a customer
// @route   GET /api/payments/payment-methods
// @access  Private
const getPaymentMethods = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (!user.stripeCustomerId) {
        res.status(400);
        throw new Error('No Stripe customer found');
    }

    const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
    });

    res.json(paymentMethods.data);
});

// @desc    Set default payment method for a customer
// @route   POST /api/payments/set-default-payment-method
// @access  Private
const setDefaultPaymentMethod = asyncHandler(async (req, res) => {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
        res.status(400);
        throw new Error('Payment method ID is required');
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (!user.stripeCustomerId) {
        res.status(400);
        throw new Error('No Stripe customer found');
    }

    // Update the customer's default payment method
    await stripe.customers.update(
        user.stripeCustomerId,
        { invoice_settings: { default_payment_method: paymentMethodId } }
    );

    res.json({ 
        success: true,
        message: 'Default payment method updated successfully' 
    });
});

// @desc    Process payment for a booking
// @route   POST /api/payments/charge
// @access  Private
const createCharge = asyncHandler(async (req, res) => {
    const { bookingId, amount, paymentMethodId, description } = req.body;

    if (!bookingId || !amount || !description) {
        res.status(400);
        throw new Error('Booking ID, amount, and description are required');
    }

    if (amount <= 0) {
        res.status(400);
        throw new Error('Amount must be greater than 0');
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (!user.stripeCustomerId) {
        res.status(400);
        throw new Error('No Stripe customer found');
    }

    try {
        // If paymentMethodId is provided, use it; otherwise use the default payment method
        const paymentOptions = paymentMethodId 
            ? { payment_method: paymentMethodId } 
            : {};

        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Stripe requires amount in cents
            currency: 'usd',
            customer: user.stripeCustomerId,
            description: `Booking ID: ${bookingId} - ${description}`,
            metadata: {
                bookingId,
                userId: user.id
            },
            ...paymentOptions,
            confirm: true, // Auto confirm the payment
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            }
        });

        // Update the booking's payment status if payment was successful
        if (paymentIntent.status === 'succeeded') {
            console.log('Payment succeeded, updating booking payment status');
            
            // Find and update the booking
            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    paymentIntentId: paymentIntent.id,
                    paymentMethodId: paymentMethodId,
                    paymentStatus: 'paid',
                    isPaid: true,
                    paidAt: new Date()
                },
                { new: true }
            );
            
            console.log('Updated booking payment status:', updatedBooking.paymentStatus, 'isPaid:', updatedBooking.isPaid);
        } else {
            console.log('Payment not succeeded:', paymentIntent.status);
        }

        res.status(201).json({
            success: true,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            message: 'Payment processed successfully'
        });
    } catch (error) {
        console.error('Payment failed:', error);
        res.status(400);
        throw new Error(`Payment failed: ${error.message}`);
    }
});

// @desc    Delete a payment method
// @route   DELETE /api/payments/payment-methods/:id
// @access  Private
const deletePaymentMethod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        res.status(400);
        throw new Error('Payment method ID is required');
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (!user.stripeCustomerId) {
        res.status(400);
        throw new Error('No Stripe customer found');
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    
    if (paymentMethod.customer !== user.stripeCustomerId) {
        res.status(403);
        throw new Error('Not authorized to delete this payment method');
    }

    // Detach the payment method from the customer
    await stripe.paymentMethods.detach(id);

    res.json({
        success: true,
        message: 'Payment method deleted successfully'
    });
});

module.exports = {
    createStripeCustomer,
    createSetupIntent,
    getPaymentMethods,
    setDefaultPaymentMethod,
    createCharge,
    deletePaymentMethod
}; 