const stripe = require('../config/stripe');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Team = require('../models/Team');
const Booking = require('../models/Booking');
const notificationService = require('../services/notificationService');

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

// @desc    Get all payment methods for a team
// @route   GET /api/payments/team-payment-methods
// @access  Private
const getTeamPaymentMethods = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    if (!user.team) {
        res.status(400);
        throw new Error('User is not part of a team');
    }
    
    // Get the team and its members
    const team = await Team.findById(user.team)
        .populate('members.user')
        .populate('owner');
    
    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }
    
    // Get all team members with Stripe customer IDs
    const teamMembers = [
        team.owner,
        ...team.members.map(member => member.user)
    ].filter(member => member && member.stripeCustomerId);
    
    // Fetch payment methods for all team members
    const paymentMethodsPromises = teamMembers.map(async (member) => {
        const methods = await stripe.paymentMethods.list({
            customer: member.stripeCustomerId,
            type: 'card',
        });
        
        return methods.data.map(method => ({
            ...method,
            ownerName: member.name || member.email,
            ownerEmail: member.email,
            isAdmin: member.isAdmin
        }));
    });
    
    const allPaymentMethods = await Promise.all(paymentMethodsPromises);
    
    // Flatten the array and sort to show admin payment methods first
    const paymentMethods = allPaymentMethods
        .flat()
        .sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));
    
    res.json(paymentMethods);
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
    const { bookingId, amount, description } = req.body;

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
    
    let stripeCustomerId = null;
    let paymentMethodId = null;
    
    // Function to get payment method from a customer
    const getCustomerPaymentMethod = async (customerId) => {
        const methods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });
        return methods.data[0]; // Get the first available payment method
    };

    // First try user's own payment method
    if (user.stripeCustomerId) {
        const userPaymentMethod = await getCustomerPaymentMethod(user.stripeCustomerId);
        if (userPaymentMethod) {
            stripeCustomerId = user.stripeCustomerId;
            paymentMethodId = userPaymentMethod.id;
            console.log('Using user\'s own payment method:', paymentMethodId);
        }
    }

    // If no user payment method and user is in a team, try team members' payment methods
    if (!paymentMethodId && user.team) {
        console.log('Looking for team payment methods');
        const team = await Team.findById(user.team)
            .populate('owner')
            .populate('members.user');

        if (team) {
            // First try team owner's payment method
            if (team.owner && team.owner.stripeCustomerId) {
                const ownerPaymentMethod = await getCustomerPaymentMethod(team.owner.stripeCustomerId);
                if (ownerPaymentMethod) {
                    stripeCustomerId = team.owner.stripeCustomerId;
                    paymentMethodId = ownerPaymentMethod.id;
                    console.log('Using team owner\'s payment method:', paymentMethodId);
                }
            }

            // If still no payment method, try other team members
            if (!paymentMethodId) {
                for (const member of team.members) {
                    if (member.user && member.user.stripeCustomerId) {
                        const memberPaymentMethod = await getCustomerPaymentMethod(member.user.stripeCustomerId);
                        if (memberPaymentMethod) {
                            stripeCustomerId = member.user.stripeCustomerId;
                            paymentMethodId = memberPaymentMethod.id;
                            console.log('Using team member\'s payment method:', paymentMethodId);
                            break;
                        }
                    }
                }
            }
        }
    }
    
    if (!stripeCustomerId || !paymentMethodId) {
        res.status(400);
        throw new Error('No payment method available in the team. Please add a payment method or contact your team admin.');
    }

    try {
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            customer: stripeCustomerId,
            payment_method: paymentMethodId,
            description: `Booking ID: ${bookingId} - ${description}`,
            metadata: {
                bookingId,
                userId: user.id
            },
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            }
        });

        // Update the booking's payment status if payment was successful
        if (paymentIntent.status === 'succeeded') {
            console.log('Payment succeeded, updating booking payment status');
            
            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    paymentIntentId: paymentIntent.id,
                    paymentMethodId: paymentMethodId,
                    paymentStatus: 'paid',
                    isPaid: true,
                    paidAt: new Date(),
                    orderStatus: 'processing'
                },
                { new: true }
            );
            
            console.log('Updated booking payment status:', updatedBooking.paymentStatus);
        }

        // Send notification about payment
        const io = req.app.get('io');
        await notificationService.sendPaymentNotification({
            userId: req.user.id,
            amount: amount,
            status: paymentIntent.status
        }, io);

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

// @desc    Check available payment methods for user and team
// @route   GET /api/payments/check-payment-method
// @access  Private
const checkPaymentMethod = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let paymentMethodInfo = {
        hasPaymentMethod: false,
        paymentMethodDetails: null,
        teamPaymentAvailable: false,
        message: ''
    };

    // Check user's own payment method
    if (user.stripeCustomerId) {
        const userPaymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });

        if (userPaymentMethods.data.length > 0) {
            const method = userPaymentMethods.data[0];
            paymentMethodInfo.hasPaymentMethod = true;
            paymentMethodInfo.paymentMethodDetails = {
                last4: method.card.last4,
                brand: method.card.brand,
                expiryMonth: method.card.exp_month,
                expiryYear: method.card.exp_year,
                owner: 'self'
            };
            paymentMethodInfo.message = 'User has their own payment method';
        }
    }

    // If no user payment method and user is in a team, check team members
    if (!paymentMethodInfo.hasPaymentMethod && user.team) {
        const team = await Team.findById(user.team)
            .populate('owner')
            .populate('members.user');

        if (team) {
            // Check team owner's payment method
            if (team.owner && team.owner.stripeCustomerId) {
                const ownerPaymentMethods = await stripe.paymentMethods.list({
                    customer: team.owner.stripeCustomerId,
                    type: 'card',
                });

                if (ownerPaymentMethods.data.length > 0) {
                    const method = ownerPaymentMethods.data[0];
                    paymentMethodInfo.teamPaymentAvailable = true;
                    paymentMethodInfo.paymentMethodDetails = {
                        last4: method.card.last4,
                        brand: method.card.brand,
                        expiryMonth: method.card.exp_month,
                        expiryYear: method.card.exp_year,
                        owner: 'team_owner',
                        ownerName: team.owner.name || team.owner.email
                    };
                    paymentMethodInfo.message = 'Team owner payment method available';
                }
            }

            // If no owner payment method, check other team members
            if (!paymentMethodInfo.teamPaymentAvailable) {
                for (const member of team.members) {
                    if (member.user && member.user.stripeCustomerId) {
                        const memberPaymentMethods = await stripe.paymentMethods.list({
                            customer: member.user.stripeCustomerId,
                            type: 'card',
                        });

                        if (memberPaymentMethods.data.length > 0) {
                            const method = memberPaymentMethods.data[0];
                            paymentMethodInfo.teamPaymentAvailable = true;
                            paymentMethodInfo.paymentMethodDetails = {
                                last4: method.card.last4,
                                brand: method.card.brand,
                                expiryMonth: method.card.exp_month,
                                expiryYear: method.card.exp_year,
                                owner: 'team_member',
                                ownerName: member.user.name || member.user.email
                            };
                            paymentMethodInfo.message = 'Team member payment method available';
                            break;
                        }
                    }
                }
            }
        }
    }

    if (!paymentMethodInfo.hasPaymentMethod && !paymentMethodInfo.teamPaymentAvailable) {
        paymentMethodInfo.message = 'No payment method available. Please add a payment method or contact your team admin.';
    }

    res.json(paymentMethodInfo);
});

module.exports = {
    createStripeCustomer,
    createSetupIntent,
    getPaymentMethods,
    getTeamPaymentMethods,
    setDefaultPaymentMethod,
    createCharge,
    deletePaymentMethod,
    checkPaymentMethod
}; 