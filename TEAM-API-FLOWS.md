# Team API Flows

This document outlines the common API flows for team operations in the BCN App.

## 1. Creating and Managing a Team

### Flow 1: Creating a Team
1. **User creates a team**
   - `POST /api/teams`
   - Body: `{ "name": "Team Name" }`
   - The user automatically becomes the team owner and admin

2. **User views their team information**
   - `GET /api/teams/my-team`
   - Shows team details including members

### Flow 2: Inviting Team Members
1. **Team owner/admin invites a user**
   - `POST /api/teams/:id/invite`
   - Body: `{ "email": "user@example.com", "name": "User Name" }`
   - System sends an invitation email with a link

2. **Invited user accepts the invitation**
   - User clicks the invitation link in the email
   - Frontend collects the user's email and the team ID from the URL parameters
   - `POST /api/teams/:id/accept-invitation`
   - Body: `{ "email": "user@example.com" }`
   - User now appears as an accepted member in the team

### Flow 3: Managing Team Members
1. **Team owner/admin removes a team member**
   - `DELETE /api/teams/:id/members/:userId`
   - Member is removed from the team
   - Member's team reference is removed

2. **Team owner deletes the team**
   - `DELETE /api/teams/:id`
   - Team is deleted
   - All members' team references are removed

## 2. User Journey Examples

### Example 1: New Team Creation and Member Invitation

#### Step 1: Create a Team
**Request:**
```http
POST /api/teams
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "Marketing Team"
}
```

**Response:**
```json
{
  "_id": "team123",
  "name": "Marketing Team",
  "owner": "user123",
  "members": [
    {
      "user": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "role": "admin",
      "invitationStatus": "accepted"
    }
  ],
  "createdAt": "2023-05-01T12:00:00Z"
}
```

#### Step 2: Invite a Team Member
**Request:**
```http
POST /api/teams/team123/invite
Authorization: Bearer [token]
Content-Type: application/json

{
  "email": "jane@example.com",
  "name": "Jane Smith"
}
```

**Response:**
```json
{
  "message": "Invitation sent successfully"
}
```

#### Step 3: User Accepts Invitation
**Request:**
```http
POST /api/teams/team123/accept-invitation
Content-Type: application/json

{
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "message": "Invitation accepted successfully"
}
```

### Example 2: Team Management

#### Step 1: View Team Information
**Request:**
```http
GET /api/teams/my-team
Authorization: Bearer [token]
```

**Response:**
```json
{
  "_id": "team123",
  "name": "Marketing Team",
  "owner": {
    "_id": "user123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "user": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "role": "admin",
      "invitationStatus": "accepted"
    },
    {
      "user": {
        "_id": "user456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "role": "member",
      "invitationStatus": "accepted"
    }
  ],
  "createdAt": "2023-05-01T12:00:00Z"
}
```

#### Step 2: Remove a Team Member
**Request:**
```http
DELETE /api/teams/team123/members/user456
Authorization: Bearer [token]
```

**Response:**
```json
{
  "message": "Team member removed successfully"
}
```

## 3. Special Scenarios

### Scenario 1: Inviting a User Who Doesn't Exist Yet
1. The system sends an invitation email to the provided email
2. When the user clicks the invitation link, they are prompted to sign up first
3. After signing up, the frontend should call the accept-invitation endpoint with their email
4. The user will be automatically added to the team

### Scenario 2: Team Owner Leaves
The team owner cannot be removed from the team. To transfer ownership:
1. First, make another user an admin
2. Then implement a specific endpoint for ownership transfer (not currently available)
3. Once ownership is transferred, the original owner can be demoted or removed

### Scenario 3: User Already in Another Team
Currently, users can only be part of one team at a time. If a user is invited to another team:
1. They must first leave their current team (be removed by an admin or team owner)
2. Only then can they accept an invitation to a new team

## 4. Security Considerations

- Always verify user permissions before modifying team data
- Team owners and admins can only manage their own teams
- Regular members can view but not modify team settings
- Email verification is important for invitation security 