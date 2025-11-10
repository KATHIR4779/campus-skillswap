const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Check if email configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service not properly configured. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }
  
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - Campus SkillSwap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>Peer-to-Peer Learning Platform</p>
          </div>
          <div class="content">
            <h2>Welcome ${data.name}!</h2>
            <p>Thank you for registering with Campus SkillSwap. To complete your registration and start learning/teaching skills, please verify your email address.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
            <p>This link will expire in 24 hours for security reasons.</p>
          </div>
          <div class="footer">
            <p>If you didn't create an account with Campus SkillSwap, you can safely ignore this email.</p>
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset - Campus SkillSwap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>We received a request to reset your password for your Campus SkillSwap account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
            <p><strong>Important:</strong> This link will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  sessionRequest: (data) => ({
    subject: 'New Session Request - Campus SkillSwap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .session-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>New Session Request</p>
          </div>
          <div class="content">
            <h2>Hello ${data.teacherName}!</h2>
            <p>You have received a new session request from ${data.studentName}.</p>
            <div class="session-info">
              <h3>Session Details:</h3>
              <p><strong>Skill:</strong> ${data.skillTitle}</p>
              <p><strong>Date:</strong> ${data.scheduledDate}</p>
              <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Credits:</strong> ${data.credits}</p>
              ${data.requestMessage ? `<p><strong>Message:</strong> ${data.requestMessage}</p>` : ''}
            </div>
            <p>Please log in to your account to approve or decline this request.</p>
            <a href="${data.dashboardUrl}" class="button">View Request</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  sessionReminder: (data) => ({
    subject: 'Session Reminder - Campus SkillSwap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .session-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>Session Reminder</p>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>This is a reminder that you have a session ${data.timeUntilSession}.</p>
            <div class="session-info">
              <h3>Session Details:</h3>
              <p><strong>Skill:</strong> ${data.skillTitle}</p>
              <p><strong>Date:</strong> ${data.scheduledDate}</p>
              <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">Join Session</a></p>` : ''}
            </div>
            <p>Please make sure you're prepared and arrive on time!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  sessionCompletionRequest: (data) => ({
    subject: 'Session Completion Confirmation Request - Campus SkillSwap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Completion Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .session-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 10px 20px 0; }
          .button-danger { background: #e74c3c; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>Session Completion Confirmation</p>
          </div>
          <div class="content">
            <h2>Hello ${data.teacherName}!</h2>
            <p>${data.studentName} has requested confirmation that your session has been successfully completed.</p>
            <div class="session-info">
              <h3>Session Details:</h3>
              <p><strong>Skill:</strong> ${data.skillTitle}</p>
              <p><strong>Date:</strong> ${data.scheduledDate}</p>
              <p><strong>Time:</strong> ${data.startTime}</p>
            </div>
            <p>Please log in to your dashboard to confirm or reject this completion request.</p>
            <p><strong>Important:</strong> Once you confirm, the time credits will be transferred from the learner to you, and the session will be marked as completed.</p>
            <a href="${data.dashboardUrl}" class="button">Review Request</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  sessionCompletionConfirmed: (data) => ({
    subject: 'Session Completed - Please Rate Your Experience',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f39c12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>Session Completed</p>
          </div>
          <div class="content">
            <h2>Congratulations ${data.studentName}!</h2>
            <p>Your teacher ${data.teacherName} has confirmed that your ${data.skillTitle} session has been successfully completed!</p>
            <p>The time credits have been transferred, and we'd love to hear about your experience.</p>
            <p>Please take a moment to rate your session and provide feedback about your teacher. Your review helps other students make informed decisions.</p>
            <a href="${data.dashboardUrl}" class="button">Rate Your Session</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  sessionCompletionRejected: (data) => ({
    subject: 'Session Completion Request Update - Campus SkillSwap',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Session Completion Request Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus SkillSwap</h1>
            <p>Session Completion Request Update</p>
          </div>
          <div class="content">
            <h2>Hello ${data.studentName}!</h2>
            <p>Your teacher ${data.teacherName} has reviewed your completion request for the ${data.skillTitle} session.</p>
            <div class="info-box">
              <h3>Request Status: Not Confirmed</h3>
              <p><strong>Reason:</strong> ${data.rejectionReason}</p>
            </div>
            <p>Please contact your teacher to discuss the session status. You may need to reschedule or complete additional requirements.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Campus SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async ({ email, subject, template, data = {} }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Email will not be sent.');
      console.log('To enable email functionality, please configure EMAIL_USER and EMAIL_PASS in your .env file');
      return { success: false, message: 'Email service not configured' };
    }

    const transporter = createTransporter();

    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Prepare email data
    const emailData = emailTemplate(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Campus SkillSwap" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: emailData.subject || subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const emailData of emails) {
    const result = await sendEmail(emailData);
    results.push({ email: emailData.email, ...result });
    
    // Add delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Cannot test email configuration.');
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  testEmailConfig,
  emailTemplates
};
