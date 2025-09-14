const express = require('express');
const router = express.Router();
const { getPipelineData, updatePipeline } = require('../services/pipelineService');

/**
 * @route GET /api/pipeline/:founderId
 * @desc Get pipeline data for a founder
 * @access Public
 */
router.get('/:founderId', async (req, res) => {
  try {
    const { founderId } = req.params;
    
    const pipelineData = await getPipelineData(founderId);
    
    res.json({
      success: true,
      data: pipelineData,
      message: 'Pipeline data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pipeline data',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/pipeline/update
 * @desc Update pipeline status based on email status and Calendly bookings
 * @access Public
 */
router.put('/update', async (req, res) => {
  try {
    const { investorId, status, metadata } = req.body;
    
    // Update pipeline status
    // Status options: contacted, replied, booked, not_interested
    const result = await updatePipeline({
      investorId,
      status,
      metadata,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Pipeline updated successfully'
    });
  } catch (error) {
    console.error('Error updating pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pipeline',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pipeline/webhook/calendly
 * @desc Webhook endpoint for Calendly events
 * @access Public
 */
router.post('/webhook/calendly', async (req, res) => {
  try {
    const { event, payload } = req.body;
    
    // Handle Calendly webhook events
    if (event === 'invitee.created') {
      // Meeting booked
      const email = payload.email;
      await updatePipeline({
        investorEmail: email,
        status: 'booked',
        metadata: {
          meetingTime: payload.event.start_time,
          calendlyEventId: payload.event.uuid
        },
        timestamp: new Date()
      });
    } else if (event === 'invitee.canceled') {
      // Meeting cancelled
      const email = payload.email;
      await updatePipeline({
        investorEmail: email,
        status: 'contacted',
        metadata: {
          cancelledAt: new Date(),
          calendlyEventId: payload.event.uuid
        },
        timestamp: new Date()
      });
    }
    
    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing Calendly webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

/**
 * @route POST /api/pipeline/webhook/email
 * @desc Webhook endpoint for email events (opens, clicks, replies)
 * @access Public
 */
router.post('/webhook/email', async (req, res) => {
  try {
    const { event, investorId, metadata } = req.body;
    
    // Handle email webhook events
    if (event === 'replied') {
      await updatePipeline({
        investorId,
        status: 'replied',
        metadata,
        timestamp: new Date()
      });
    }
    
    res.json({ success: true, message: 'Email webhook processed' });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process email webhook',
      error: error.message
    });
  }
});

module.exports = router;
