const express = require('express');
const router = express.Router();
const {
    createOrUpdateUser,
    getUser,
    updateUser,
    getUserFromToken
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', createOrUpdateUser);
router.get('/me', protect, getUserFromToken);
router.get('/:email', getUser);
router.put('/:email', updateUser);

module.exports = router; 