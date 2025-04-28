const express = require('express');
const router = express.Router();
const {
    createOrUpdateUser,
    getUser,
    updateUser
} = require('../controllers/userController');

router.post('/', createOrUpdateUser);
router.get('/:firebaseUid', getUser);
router.put('/:firebaseUid', updateUser);

module.exports = router; 