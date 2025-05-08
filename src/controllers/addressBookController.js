const AddressBook = require('../models/addressBook');
const User = require('../models/User');

// @desc    Create new address book entry
// @route   POST /api/address-book
// @access  Private
exports.createAddressBook = async (req, res) => {
    try {
        // Get user from Firebase auth token
        const firebaseUser = req.user;
        console.log('Firebase user:', firebaseUser);
        // Find user in our database
        const user = await User.findOne({ firebaseUid: firebaseUser.firebaseUid });
        console.log('User:', user);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressBook = new AddressBook({
            ...req.body,
            user: user._id
        });

        const savedAddressBook = await addressBook.save();
        res.status(201).json(savedAddressBook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all address book entries for a user
// @route   GET /api/address-book
// @access  Private
exports.getAddressBooks = async (req, res) => {
    try {
        const firebaseUser = req.user;
        const user = await User.findOne({ firebaseUid: firebaseUser.firebaseUid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressBooks = await AddressBook.find({ user: user._id });
        res.json(addressBooks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single address book entry
// @route   GET /api/address-book/:id
// @access  Private
exports.getAddressBook = async (req, res) => {
    try {
        const firebaseUser = req.user;
        const user = await User.findOne({ firebaseUid: firebaseUser.firebaseUid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressBook = await AddressBook.findOne({
            _id: req.params.id,
            user: user._id
        });

        if (!addressBook) {
            return res.status(404).json({ message: 'Address book entry not found' });
        }

        res.json(addressBook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update address book entry
// @route   PUT /api/address-book/:id
// @access  Private
exports.updateAddressBook = async (req, res) => {
    try {
        const firebaseUser = req.user;
        const user = await User.findOne({ firebaseUid: firebaseUser.firebaseUid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressBook = await AddressBook.findOneAndUpdate(
            { _id: req.params.id, user: user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!addressBook) {
            return res.status(404).json({ message: 'Address book entry not found' });
        }

        res.json(addressBook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete address book entry
// @route   DELETE /api/address-book/:id
// @access  Private
exports.deleteAddressBook = async (req, res) => {
    try {
        const firebaseUser = req.user;
        const user = await User.findOne({ firebaseUid: firebaseUser.firebaseUid });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressBook = await AddressBook.findOneAndDelete({
            _id: req.params.id,
            user: user._id
        });

        if (!addressBook) {
            return res.status(404).json({ message: 'Address book entry not found' });
        }

        res.json({ message: 'Address book entry removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 