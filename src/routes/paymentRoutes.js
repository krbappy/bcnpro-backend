const express = require('express');
const router = express.Router();
const { 
    createStripeCustomer,
    createSetupIntent,
    getPaymentMethods,
    getTeamPaymentMethods,
    setDefaultPaymentMethod,
    createCharge,
    deletePaymentMethod,
    checkPaymentMethod
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Routes for managing Stripe customers and payment methods
router.post('/create-customer', createStripeCustomer);
router.post('/setup-intent', createSetupIntent);
router.get('/payment-methods', getPaymentMethods);
router.get('/team-payment-methods', getTeamPaymentMethods);
router.get('/check-payment-method', checkPaymentMethod);
router.post('/set-default-payment-method', setDefaultPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);

// Route for processing payments
router.post('/charge', createCharge);

module.exports = router; 