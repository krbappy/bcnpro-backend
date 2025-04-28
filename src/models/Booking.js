const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: false
    },
    length: {
        type: String,
        required: false
    },
    width: {
        type: String,
        required: false
    },
    height: {
        type: String,
        required: false
    },
    weight: {
        type: String,
        required: false
    },
    quantity: {
        type: String,
        required: false
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    id: String,
    poNumber: {
        type: String,
        required: false
    },
    orderNumber: {
        type: String,
        required: false
    },
    bolNumber: {
        type: String,
        required: false
    },
    items: [orderItemSchema],
    isOpen: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: [Number]
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    company: String,
    notes: String,
    saveToAddressBook: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stops: [Number],
    selectedAddresses: {
        type: Map,
        of: addressSchema
    },
    routeDistance: {
        meters: Number,
        displayValue: String
    },
    vehicleType: String,
    deliveryTiming: {
        date: String,
        timeWindow: String,
        isValid: {
            type: Boolean,
            default: true
        }
    },
    orderDetails: {
        weight: String,
        size: String
    },
    orders: [orderSchema],
    totalWeight: String,
    additionalInfo: String,
    contactInfo: {
        type: Map,
        of: contactInfoSchema
    }
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking; 