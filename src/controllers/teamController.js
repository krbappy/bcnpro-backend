const Team = require('../models/Team');
const User = require('../models/User');
const { sendTeamInvitation } = require('../utils/emailService');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        
        // Get the authenticated user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user already belongs to a team
        if (user.team) {
            return res.status(400).json({ message: 'You already belong to a team' });
        }
        
        // Create new team
        const team = await Team.create({
            name,
            owner: user._id,
            members: [{ user: user._id, role: 'admin', invitationStatus: 'accepted' }]
        });
        
        // Update user's team reference and make them admin
        user.team = team._id;
        user.isAdmin = true;
        await user.save();
        
        res.status(201).json(team);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Private
const getTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members.user', 'name email');
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        // Check if user is a member of this team
        const isMember = team.members.some(member => 
            member.user._id.toString() === req.user.id
        );
        
        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to access this team' });
        }
        
        res.json(team);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user's team
// @route   GET /api/teams/my-team
// @access  Private
const getMyTeam = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || !user.team) {
            return res.status(404).json({ message: 'You do not belong to any team' });
        }
        
        const team = await Team.findById(user.team)
            .populate('owner', 'name email')
            .populate('members.user', 'name email');
        
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        res.json(team);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Invite a user to team
// @route   POST /api/teams/:id/invite
// @access  Private (Admin only)
const inviteToTeam = async (req, res) => {
    try {
        const { email, name } = req.body;
        console.log('Starting invitation process for:', { email, name });
        
        // Get the team
        const team = await Team.findById(req.params.id);
        if (!team) {
            console.log('Team not found:', req.params.id);
            return res.status(404).json({ message: 'Team not found' });
        }
        console.log('Found team:', { name: team.name, id: team._id });
        
        // Check if requester is the team owner or admin
        const requester = await User.findById(req.user.id);
        const isAdmin = team.members.some(member => 
            member.user.equals(req.user.id) && member.role === 'admin'
        );
        
        if (!team.owner.equals(req.user.id) && !isAdmin) {
            console.log('Not authorized:', { isAdmin, teamOwner: team.owner, requesterId: req.user.id });
            return res.status(403).json({ message: 'Not authorized to invite members' });
        }
        
        // Check if the user already exists in the system
        let user = await User.findOne({ email });
        console.log('User lookup result:', user ? { id: user._id, email: user.email } : 'not found');
        
        // Generate invitation link
        const invitationLink = `${process.env.FRONTEND_URL}/team-invitation?teamId=${team._id}&email=${email}`;
        
        if (user) {
            // Check if user is already a member
            const existingMember = team.members.find(member => 
                member.user.toString() === user._id.toString()
            );
            
            if (existingMember) {
                console.log('User is already a member:', existingMember);
                return res.status(400).json({ 
                    message: `User is already a member with status: ${existingMember.invitationStatus}` 
                });
            }
            
            console.log('Adding existing user to team members');
            
            // Add user to team members array
            team.members.push({
                user: user._id,
                role: 'member',
                invitationStatus: 'pending'
            });
            
            // Update user's status
            user.invitationStatus = 'pending';
            user.team = team._id;
            
            try {
                // Save both documents
                await Promise.all([
                    user.save(),
                    team.save()
                ]);
                
                console.log('Successfully added user to team');
            } catch (err) {
                console.error('Error saving team/user:', err);
                throw new Error('Failed to add user to team');
            }
        }
        
        try {
            // Send invitation email
            await sendTeamInvitation({
                email,
                name: name || email,
                teamName: team.name,
                inviterName: requester.name || requester.email,
                invitationLink
            });
            console.log('Invitation email sent successfully');
        } catch (err) {
            console.error('Error sending invitation email:', err);
            // If the user was added to the team but email failed, we still want to return success
            if (user) {
                return res.status(200).json({ 
                    message: 'User added to team but invitation email failed to send' 
                });
            }
            throw new Error('Failed to send invitation email');
        }
        
        res.status(200).json({ 
            message: user ? 'User added to team and invitation sent' : 'Invitation sent successfully'
        });
    } catch (error) {
        console.error('Error in inviteToTeam:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Accept team invitation
// @route   POST /api/teams/:id/accept-invitation
// @access  Public
const acceptInvitation = async (req, res) => {
    try {
        const { email } = req.body;
        const teamId = req.params.id;
        console.log('Starting invitation acceptance process:', {
            email,
            teamId
        });
        
        // Get the team
        const team = await Team.findById(teamId)
            .populate('members.user', 'email')
            .populate('owner', 'email');
            
        if (!team) {
            console.log('Team not found with ID:', teamId);
            return res.status(404).json({ message: 'Team not found' });
        }
        
        console.log('Found team:', {
            name: team.name,
            owner: team.owner.email,
            memberCount: team.members.length,
            members: team.members.map(m => ({
                email: m.user?.email,
                status: m.invitationStatus,
                role: m.role
            }))
        });
        
        // Get the user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Found user:', {
            email: user.email,
            id: user._id,
            currentTeam: user.team,
            currentStatus: user.invitationStatus
        });
        
        // Check if the user has a pending invitation
        const memberIndex = team.members.findIndex(member => 
            member.user._id.toString() === user._id.toString()
        );
        
        console.log('Member search result:', {
            foundMember: memberIndex !== -1,
            memberIndex,
            availableMemberIds: team.members.map(m => m.user._id.toString())
        });
        
        if (memberIndex === -1) {
            console.log('No team membership found for user');
            return res.status(400).json({ message: 'No pending invitation found' });
        }
        
        const member = team.members[memberIndex];
        console.log('Found member details:', {
            role: member.role,
            status: member.invitationStatus
        });
        
        if (member.invitationStatus !== 'pending') {
            console.log('Invitation status is not pending:', member.invitationStatus);
            return res.status(400).json({ 
                message: `Invitation status is ${member.invitationStatus}, not pending` 
            });
        }
        
        // Update invitation status
        team.members[memberIndex].invitationStatus = 'accepted';
        user.invitationStatus = 'accepted';
        user.team = team._id;  // Ensure team is set
        
        console.log('Saving updates:', {
            teamId: team._id,
            userId: user._id,
            newStatus: 'accepted'
        });
        
        // Save both documents
        await Promise.all([
            team.save(),
            user.save()
        ]);
        
        console.log('Invitation accepted successfully');
        res.status(200).json({ message: 'Invitation accepted successfully' });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remove team member
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Admin only)
const removeTeamMember = async (req, res) => {
    try {
        console.log('Attempting to remove member:', { teamId: req.params.id, userId: req.params.userId });
        
        // Get the team
        const team = await Team.findById(req.params.id);
        if (!team) {
            console.log('Team not found:', req.params.id);
            return res.status(404).json({ message: 'Team not found' });
        }
        
        console.log('Current team members:', JSON.stringify(team.members, null, 2));
        
        // Check if requester is the team owner or admin
        const isAdmin = team.members.some(member => 
            member.user.equals(req.user.id) && member.role === 'admin'
        );
        
        if (!team.owner.equals(req.user.id) && !isAdmin) {
            console.log('Not authorized:', { 
                isAdmin, 
                isOwner: team.owner.equals(req.user.id),
                requesterId: req.user.id 
            });
            return res.status(403).json({ message: 'Not authorized to remove members' });
        }
        
        // Check if trying to remove the owner
        if (team.owner.toString() === req.params.userId) {
            console.log('Attempted to remove team owner');
            return res.status(400).json({ message: 'Cannot remove the team owner' });
        }
        
        // Find the member in the team
        const memberToRemove = team.members.find(member => 
            member.user.toString() === req.params.userId
        );
        
        if (!memberToRemove) {
            console.log('Member not found in team. User ID:', req.params.userId);
            console.log('Available member IDs:', team.members.map(m => m.user.toString()));
            return res.status(404).json({ message: 'Member not found in team' });
        }
        
        console.log('Found member to remove:', memberToRemove);
        
        // Remove the member from the team
        team.members = team.members.filter(member => 
            member.user.toString() !== req.params.userId
        );
        
        // Save team first
        await team.save();
        console.log('Member removed from team');
        
        // Update the removed user's team reference
        const removedUser = await User.findById(req.params.userId);
        if (removedUser) {
            // Set team to undefined instead of null
            removedUser.team = undefined;
            // Set invitationStatus to undefined instead of null
            removedUser.invitationStatus = undefined;
            
            // Use save with validateBeforeSave: false to skip validation
            await removedUser.save({ validateBeforeSave: false });
            console.log('Updated removed user status');
        }
        
        res.status(200).json({ message: 'Team member removed successfully' });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Owner only)
const deleteTeam = async (req, res) => {
    try {
        // Get the team
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        // Check if requester is the team owner
        if (team.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this team' });
        }
        
        // Update all team members to remove team reference
        await User.updateMany(
            { team: team._id },
            { $set: { team: null, invitationStatus: null } }
        );
        
        // Delete the team
        await Team.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createTeam,
    getTeam,
    getMyTeam,
    inviteToTeam,
    acceptInvitation,
    removeTeamMember,
    deleteTeam
}; 