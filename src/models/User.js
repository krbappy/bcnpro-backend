const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    company: {
        type: String,
        required: false
    },
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    stripeCustomerId: {
        type: String,
        required: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: false
    },
    invitationStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', null],
        required: false,
        default: null
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User; 