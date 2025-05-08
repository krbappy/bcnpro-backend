const express = require('express');
const router = express.Router();
const {
    createAddressBook,
    getAddressBooks,
    getAddressBook,
    updateAddressBook,
    deleteAddressBook
} = require('../controllers/addressBookController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and require authentication
router.use(protect);

router.route('/')
    .post(createAddressBook)
    .get(getAddressBooks);

router.route('/:id')
    .get(getAddressBook)
    .put(updateAddressBook)
    .delete(deleteAddressBook);

module.exports = router; 