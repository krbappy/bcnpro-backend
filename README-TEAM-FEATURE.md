# Team Feature Implementation

This document provides an overview of the team feature implementation in the BCN App.

## Overview

The team feature allows users to:
- Create teams
- Invite members via email
- Accept team invitations
- Manage team members (add/remove)
- Access team resources

## Models

### User Model Updates
The User model has been updated with the following fields:
- `isAdmin`: Boolean indicating if the user is a team admin
- `team`: Reference to the Team model
- `invitationStatus`: Status of team invitation (pending/accepted/rejected)

### Team Model
A new Team model has been created with the following structure:
- `name`: Team name
- `owner`: Reference to the User model (team creator)
- `members`: Array of objects containing:
  - `user`: Reference to the User model
  - `role`: User role in the team (admin/member)
  - `invitationStatus`: Status of the invitation

## API Endpoints

### Teams
- `POST /api/teams`: Create a new team
- `GET /api/teams/my-team`: Get user's team information
- `GET /api/teams/:id`: Get team details by ID
- `DELETE /api/teams/:id`: Delete a team (owner only)

### Team Members
- `POST /api/teams/:id/invite`: Invite a user to join a team
- `POST /api/teams/:id/accept-invitation`: Accept a team invitation
- `DELETE /api/teams/:id/members/:userId`: Remove a team member

## Email Notifications

The system uses MailerSend to send email notifications for:
- Team invitations
- Invitation reminders
- Team updates

## Permissions

- Team owners can:
  - Manage all team settings
  - Invite members
  - Remove members
  - Delete the team

- Team admins can:
  - Invite members
  - Remove members (except the owner)
  - Access all team resources

- Team members can:
  - Access team resources
  - View team information
  - Cannot modify team settings or payment methods

## Configuration

1. Set up MailerSend:
   - Sign up for a MailerSend account
   - Add your domain and verify it
   - Create an API key
   - Add the API key to your `.env` file as `MAILERSEND_API_KEY`
   - Set the sender email and name in the `.env` file
   - Install the MailerSend package: `npm install mailersend --save`
   - If you encounter installation issues, the system will use a mock email service that logs emails to the console

2. Update your frontend:
   - Add team management screens
   - Implement invitation acceptance flow
   - Update user permissions based on team role

## Implementation Details

The team feature uses MongoDB relationships to maintain team associations. When a user is invited:
1. An email is sent with a special invitation link
2. If they don't have an account, they sign up first
3. The invitation is automatically associated with their account
4. Once accepted, they gain access to team resources

Team owners and admins have the ability to remove members at any time. 