# Team Feature Testing Guide

This guide explains how to test the team feature functionality in the BCN App without having the MailerSend service fully configured.

## Setup for Testing

### 1. Configuration

The current implementation includes a mock email service that allows testing without the actual MailerSend integration. Emails will be logged to the console instead of being sent.

Add the following to your `.env` file:

```
# Team and Email Configuration
FRONTEND_URL=http://localhost:3000
MAILERSEND_API_KEY=your_mock_key_for_testing
EMAIL_FROM_ADDRESS=test@example.com
EMAIL_FROM_NAME=BCN Test
```

### 2. Testing Team Creation

1. Create a team as a user
2. Verify the user becomes the team owner
3. Check that the team appears in the user's profile

### 3. Testing Team Invitations

Since emails won't actually be sent with the mock service, you'll need to manually capture the invitation URLs from server logs:

1. Invite a user to a team
2. Look for the console output showing the email details
3. Copy the invitation link from the logs
4. Use this link to simulate a user clicking the email link
5. Complete the invitation acceptance flow

Example console output to look for:
```
========= EMAIL WOULD BE SENT =========
{
  "to": "newuser@example.com",
  "toName": "New User",
  "subject": "Invitation to join Marketing Team",
  "html": "...",
  "text": "...",
  "from": {
    "email": "test@example.com",
    "name": "BCN Test"
  }
}
======================================
```

### 4. Testing Team Management

Test the following scenarios:
- Team owner adding an admin
- Admin inviting a member
- Team owner removing a member
- Admin removing a member
- Team owner deleting the team

### 5. Switching to Real Email Service

When you're ready to use the real MailerSend service:

1. Install the MailerSend package:
   ```
   npm install mailersend --save
   ```

2. Edit `src/utils/emailService.js`:
   - Uncomment the real implementation
   - Comment out or remove the mock implementation

3. Update your `.env` file with real MailerSend credentials:
   ```
   MAILERSEND_API_KEY=your_real_api_key
   EMAIL_FROM_ADDRESS=your_verified_sender@yourdomain.com
   EMAIL_FROM_NAME=Your Company Name
   ```

## Common Issues and Troubleshooting

### Module Not Found Error
If you see `Error: Cannot find module 'mailersend'`, the mock email service is being used automatically.

### Email Not Being Sent
With the mock implementation, emails won't actually be sent. Instead, they'll be logged to the console.

### Invitation Link Not Working
Make sure you're using the correct team ID and email in the invitation acceptance request. 