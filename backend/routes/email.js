const express = require('express');
const router = express.Router();
const { generateEmailDraft, generateEmailsFromPresets } = require('../services/aiService');
const { sendEmail } = require('../services/emailService');
const { updatePipeline } = require('../services/pipelineService');

/**
 * @route POST /api/email/draft
 * @desc Generate personalized emails via AI based on investor info
 * @access Public
 */
router.post('/draft', async (req, res) => {
  try {
    const { investor, founderData, tone, calendlyLink } = req.body;

    // Generate personalized email using AI
    const emailDraft = await generateEmailDraft({
      investor,
      founderData,
      tone: tone || 'formal', // formal, friendly, high-energy
      calendlyLink
    });

    res.json({
      success: true,
      data: emailDraft,
      message: 'Email draft generated successfully'
    });
  } catch (error) {
    console.error('Error generating email draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate email draft',
      error: error.message
    });
  }
});

/**
 * @route POST /api/email/presets
 * @desc Return 5 preset styles, refined/personalized by AI when available
 * @access Public
 */
router.post('/presets', async (req, res) => {
  try {
    const { investor, founderData, calendlyLink, tone } = req.body || {};
    const result = await generateEmailsFromPresets({ investor, founderData, calendlyLink, tone });
    res.json({
      success: true,
      data: result,
      message: 'Email presets generated successfully'
    });
  } catch (error) {
    console.error('Error generating email presets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate email presets',
      error: error.message
    });
  }
});

/**
 */
router.post('/presets', async (req, res) => {
  try {
    const { investor, founderData, calendlyLink, tone } = req.body || {};
    const result = await generateEmailsFromPresets({ investor, founderData, calendlyLink, tone });
    res.json({
      success: true,
      data: result,
      message: 'Email presets generated successfully'
    });
  } catch (error) {
    console.error('Error generating email presets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate email presets',
      error: error.message
    });
  }
});

/**
router.post('/presets', async (req, res) => {
  try {
    const { investor, founderData, calendlyLink, tone } = req.body || {};
    const result = await generateEmailsFromPresets({ investor, founderData, calendlyLink, tone });
    res.json({
      success: true,
      data: result,
      message: 'Email presets generated successfully'
    });
  } catch (error) {
    console.error('Error generating email presets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate email presets',
      error: error.message
    });
  }
});

/**
 * @route POST /api/email/send
 * @desc Send emails using Nodemailer and log success/failure
 * @access Public
 */
router.post('/send', async (req, res) => {
  try {
    const { 
      to, 
      subject, 
      content, 
      founderEmail, 
      investorId,
      trackingId 
    } = req.body;

    // Send email via Nodemailer
    const emailResult = await sendEmail({
      to,
      from: founderEmail,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });

    // Update pipeline status
    if (emailResult.success) {
      await updatePipeline({
        investorId,
        status: 'contacted',
        timestamp: new Date(),
        trackingId
      });
    }

    res.json({
      success: emailResult.success,
      data: {
        messageId: emailResult.messageId,
        status: emailResult.success ? 'sent' : 'failed',
        investorId
      },
      message: emailResult.success ? 'Email sent successfully' : 'Email sending failed'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * @route POST /api/email/bulk-send
 * @desc Send multiple emails to investors
 * @access Public
 */
router.post('/bulk-send', async (req, res) => {
  try {
    const { emails, founderEmail } = req.body;
    const results = [];

    const validEmails = Array.isArray(emails) ? emails.filter(e => e && e.to && typeof e.to === 'string' && e.to.includes('@')) : [];
    const skipped = (Array.isArray(emails) ? emails.length : 0) - validEmails.length;
    if (validEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients provided',
        data: { results: [], summary: { total: 0, successful: 0, failed: 0, skipped } }
      });
    }

    // Send emails in batches to avoid rate limiting
    for (const emailData of validEmails) {
      try {
        const result = await sendEmail({
          to: emailData.to,
          from: founderEmail,
          subject: emailData.subject,
          html: emailData.content,
          text: emailData.content.replace(/<[^>]*>/g, '')
        });

        results.push({
          investorId: emailData.investorId,
          success: result.success,
          messageId: result.messageId
        });

        // Update pipeline for each email
        if (result.success) {
          await updatePipeline({
            investorId: emailData.investorId,
            status: 'contacted',
            timestamp: new Date()
          });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          investorId: emailData.investorId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
          skipped
        }
      },
      message: `Bulk email completed: ${successCount} sent, ${failureCount} failed${skipped ? `, ${skipped} skipped` : ''}`
    });
  } catch (error) {
    console.error('Error in bulk email send:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk emails',
      error: error.message
    });
  }
});

/**
 * @route POST /api/email/follow-up
 * @desc Generate and send follow-up emails
 * @access Public
 */
router.post('/follow-up', async (req, res) => {
  try {
    const { investorId, previousEmail, founderData, daysSinceLastContact } = req.body;

    // Generate follow-up email using AI
    const followUpDraft = await generateEmailDraft({
      investor: { id: investorId },
      founderData,
      isFollowUp: true,
      previousEmail,
      daysSinceLastContact
    });

    res.json({
      success: true,
      data: followUpDraft,
      message: 'Follow-up email draft generated successfully'
    });
  } catch (error) {
    console.error('Error generating follow-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up email',
      error: error.message
    });
  }
});

module.exports = router;
