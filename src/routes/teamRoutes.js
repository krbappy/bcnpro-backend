const express = require('express');
const {
    createTeam,
    getTeam,
    getMyTeam,
    inviteToTeam,
    acceptInvitation,
    removeTeamMember,
    deleteTeam,
    updateTeam,
    getAllTeams
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected routes (require authentication)
router.post('/', protect, createTeam);
router.get('/', protect, getAllTeams);
router.get('/my-team', protect, getMyTeam);
router.get('/:id', protect, getTeam);
router.post('/:id/invite', protect, inviteToTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id/members/:userId', protect, removeTeamMember);
router.delete('/:id', protect, deleteTeam);

// Public routes (no authentication required)
router.post('/:id/accept-invitation', acceptInvitation);

module.exports = router; 