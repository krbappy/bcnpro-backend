const User = require('../models/User');

// @desc    Create or update user
// @route   POST /api/users
// @access  Public
const createOrUpdateUser = async (req, res) => {
    try {
        const { email, name, phone, company, firebaseUid } = req.body;

        let user = await User.findOne({ firebaseUid });

        if (user) {
            // Update existing user
            user.email = email || user.email;
            user.name = name || user.name;
            user.phone = phone || user.phone;
            user.company = company || user.company;

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

// @desc    Get user by Firebase UID
// @route   GET /api/users/:firebaseUid
// @access  Public
const getUser = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:firebaseUid
// @access  Public
const updateUser = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { email, name, phone, company } = req.body;

        user.email = email || user.email;
        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.company = company || user.company;

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createOrUpdateUser,
    getUser,
    updateUser
}; 