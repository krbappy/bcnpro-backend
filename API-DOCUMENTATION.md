# BCN App API Documentation - Team Management

## Base URL
`https://api.bcnapp.com` (Production)
`http://localhost:5000` (Development)

## Authentication
Most endpoints require authentication using Firebase Authentication. Include the token in the header:
```
Authorization: Bearer YOUR_FIREBASE_TOKEN
```

## Team Endpoints

### Create a Team
**Endpoint:** `POST /api/teams`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Team Name"
}
```

**Response:** `201 Created`
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Team Name",
  "owner": "60d21b4667d0d8992e610c80",
  "members": [
    {
      "user": {
        "_id": "60d21b4667d0d8992e610c80",
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

**Error Responses:**
- `400 Bad Request`: User already belongs to a team
- `404 Not Found`: User not found

---

### Get User's Team
**Endpoint:** `GET /api/teams/my-team`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Team Name",
  "owner": {
    "_id": "60d21b4667d0d8992e610c80",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "user": {
        "_id": "60d21b4667d0d8992e610c80",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "role": "admin",
      "invitationStatus": "accepted"
    },
    {
      "user": {
        "_id": "60d21b4667d0d8992e610c81",
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

**Error Responses:**
- `404 Not Found`: User does not belong to any team or team not found

---

### Get Team by ID
**Endpoint:** `GET /api/teams/:id`

**Authentication:** Required (Must be a team member)

**URL Parameters:**
- `id`: Team ID

**Response:** `200 OK`
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Team Name",
  "owner": {
    "_id": "60d21b4667d0d8992e610c80",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "user": {
        "_id": "60d21b4667d0d8992e610c80",
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

**Error Responses:**
- `403 Forbidden`: Not authorized to access this team
- `404 Not Found`: Team not found

---

### Invite User to Team
**Endpoint:** `POST /api/teams/:id/invite`

**Authentication:** Required (Must be team owner or admin)

**URL Parameters:**
- `id`: Team ID

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User"  // Optional
}
```

**Response:** `200 OK`
```json
{
  "message": "Invitation sent successfully"
}
```

**Error Responses:**
- `400 Bad Request`: User is already a member of this team
- `403 Forbidden`: Not authorized to invite members
- `404 Not Found`: Team not found

---

### Accept Team Invitation
**Endpoint:** `POST /api/teams/:id/accept-invitation`

**Authentication:** Not required

**URL Parameters:**
- `id`: Team ID

**Request Body:**
```json
{
  "email": "invited@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Invitation accepted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: No pending invitation found
- `404 Not Found`: Team or user not found

---

### Remove Team Member
**Endpoint:** `DELETE /api/teams/:id/members/:userId`

**Authentication:** Required (Must be team owner or admin)

**URL Parameters:**
- `id`: Team ID
- `userId`: User ID to remove

**Response:** `200 OK`
```json
{
  "message": "Team member removed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot remove the team owner
- `403 Forbidden`: Not authorized to remove members
- `404 Not Found`: Team not found

---

### Delete Team
**Endpoint:** `DELETE /api/teams/:id`

**Authentication:** Required (Must be team owner)

**URL Parameters:**
- `id`: Team ID

**Response:** `200 OK`
```json
{
  "message": "Team deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized to delete this team
- `404 Not Found`: Team not found

## Team Member Roles and Permissions

### Owner
- Can perform all team operations
- Cannot be removed from the team
- Can delete the team

### Admin
- Can invite new members
- Can remove members (except the owner)
- Cannot delete the team

### Member
- Can view team information
- Cannot add or remove members
- Cannot modify team settings or payment methods 