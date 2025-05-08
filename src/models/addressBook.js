const mongoose = require('mongoose');

const addressBookSchema = new mongoose.Schema({
    address: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    deliveryNotes: {
        type: String,
        trim: true
    },
    contacts: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AddressBook', addressBookSchema); 