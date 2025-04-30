const User = require('../models/User');

// @desc    Create or update user
// @route   POST /api/users
// @access  Public
const createOrUpdateUser = async (req, res) => {
    try {
        const { email, name, phone, company, firebaseUid } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            // Update existing user
            user.name = name || user.name;
            user.phone = phone || user.phone;
            user.company = company || user.company;
            user.firebaseUid = firebaseUid || user.firebaseUid;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            // Create new user
            const newUser = await User.create({
                email,
                name,
                phone,
                company,
                firebaseUid
            });
            res.status(201).json(newUser);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user by email
// @route   GET /api/users/:email
// @access  Public
const getUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:email
// @access  Public
const updateUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, phone, company, firebaseUid } = req.body;

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.company = company || user.company;
        user.firebaseUid = firebaseUid || user.firebaseUid;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user from auth token
// @route   GET /api/users/me
// @access  Private
const getUserFromToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createOrUpdateUser,
    getUser,
    updateUser,
    getUserFromToken
}; 