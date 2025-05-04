const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

// Initialize MailerSend with API key from environment variables
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Default sender configuration
const defaultSender = new Sender('bcnapp@test-86org8eemkkgew13.mlsender.net');

/**
 * Send an email using MailerSend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.toName - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.fromEmail - Sender email (optional)
 * @param {string} options.fromName - Sender name (optional)
 * @returns {Promise} - Promise that resolves with the email sending result
 */
const sendEmail = async ({ to, toName, subject, html, text, fromEmail, fromName }) => {
  try {
    const sender = fromEmail && fromName ? 
      new Sender(fromEmail, fromName) : defaultSender;

    const recipients = [
      new Recipient(to, toName || to)
    ];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setReplyTo(sender)
      .setSubject(subject)
      .setHtml(html)
      .setText(text || html.replace(/<[^>]*>/g, ''));

    const response = await mailerSend.email.send(emailParams);
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a team invitation email
 * @param {Object} options - Invitation options
 * @param {string} options.email - Invitee email
 * @param {string} options.name - Invitee name
 * @param {string} options.teamName - Team name
 * @param {string} options.inviterName - Name of the person sending the invitation
 * @param {string} options.invitationLink - Link to accept the invitation
 * @returns {Promise} - Promise that resolves with the email sending result
 */
const sendTeamInvitation = async ({ email, name, teamName, inviterName, invitationLink }) => {
  const subject = `Invitation to join ${teamName} team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Team Invitation</h2>
      <p>Hello ${name || email},</p>
      <p>${inviterName} has invited you to join the ${teamName} team.</p>
      <p>To accept this invitation and gain access to the team's resources, please click the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${invitationLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Accept Invitation
        </a>
      </p>
      <p>If you don't have an account yet, you'll be guided through the sign-up process.</p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
      <p>Thank you,<br>The BCN App Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject,
    html,
    text: `Hello ${name || email}, ${inviterName} has invited you to join the ${teamName} team. To accept this invitation, please visit: ${invitationLink}`
  });
};

module.exports = {
  sendEmail,
  sendTeamInvitation
}; 