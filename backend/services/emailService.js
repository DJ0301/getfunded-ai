const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // For development only
  }
});

/**
 * Verify SMTP connection configuration
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return false;
  }
}

/**
 * Send email using Nodemailer
 * Fully functional email sending with error handling and logging
 */
async function sendEmail({ to, from, subject, html, text, cc, bcc, attachments }) {
  try {
    // Verify connection before sending
    const isConnected = await verifyConnection();
    if (!isConnected) {
      throw new Error('SMTP connection not available');
    }

    // Email options
    const mailOptions = {
      from: from || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback to stripped HTML
      cc,
      bcc,
      attachments,
      headers: {
        'X-Mailer': 'GetFunded.ai',
        'X-Priority': '3'
      }
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Email sending failed:', {
      to,
      subject,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: error.message,
      to,
      subject
    };
  }
}

/**
 * Send bulk emails with rate limiting
 * Processes emails in batches to avoid overwhelming the SMTP server
 */
async function sendBulkEmails(emails, options = {}) {
  const { batchSize = 5, delayMs = 2000 } = options;
  const results = [];
  
  // Process emails in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Send batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map(email => sendEmail(email))
    );
    
    results.push(...batchResults.map((result, index) => ({
      ...batch[index],
      ...result
    })));
    
    // Add delay between batches
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Create email template for investor outreach
 */
function createEmailTemplate(content, founderData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #4F46E5;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .content {
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 0.9em;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4F46E5;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 15px 0;
    }
    .signature {
      margin-top: 25px;
    }
  </style>
</head>
<body>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>Sent via GetFunded.ai - Automated Fundraising Platform</p>
    ${founderData?.startupName ? `<p>${founderData.startupName}</p>` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Track email open rates (pixel tracking)
 * Note: This requires a tracking server to be implemented
 */
function addTrackingPixel(html, trackingId) {
  const trackingUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/email/track/${trackingId}`;
  const pixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="">`;
  return html.replace('</body>', `${pixel}</body>`);
}

/**
 * Initialize email service on startup
 */
async function initializeEmailService() {
  console.log('📧 Initializing email service...');
  const isConnected = await verifyConnection();
  
  if (!isConnected) {
    console.warn('⚠️ Email service not configured properly. Please check SMTP settings in .env file');
    console.warn('   Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }
  
  return isConnected;
}

module.exports = {
  sendEmail,
  sendBulkEmails,
  createEmailTemplate,
  addTrackingPixel,
  initializeEmailService,
  verifyConnection
};
