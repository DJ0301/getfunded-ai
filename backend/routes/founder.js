const express = require('express');
const router = express.Router();
const { processFounderInput } = require('../services/aiService');
const { validateFounderInput } = require('../middleware/validation');

/**
 * @route POST /api/founder/input
 * @desc Receive and process founder Q&A inputs
 * @access Public
 */
router.post('/input', validateFounderInput, async (req, res) => {
  try {
    const {
      startupName,
      description,
      stage,
      tractionMetrics,
      fundraisingTarget,
      preferredInvestorType,
      founderEmail,
      calendlyLink
    } = req.body;

    // Process founder input with AI to generate insights
    const processedData = await processFounderInput({
      startupName,
      description,
      stage,
      tractionMetrics,
      fundraisingTarget,
      preferredInvestorType,
      founderEmail,
      calendlyLink
    });

    res.json({
      success: true,
      data: processedData,
      message: 'Founder information processed successfully'
    });
  } catch (error) {
    console.error('Error processing founder input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process founder input',
      error: error.message
    });
  }
});

/**
 * @route GET /api/founder/profile/:id
 * @desc Get founder profile data
 * @access Public
 */
router.get('/profile/:id', async (req, res) => {
  try {
    // In production, this would fetch from database
    // For now, using session/temporary storage
    const profileId = req.params.id;
    
    res.json({
      success: true,
      data: {
        id: profileId,
        // Profile data would be fetched here
      }
    });
  } catch (error) {
    console.error('Error fetching founder profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch founder profile',
      error: error.message
    });
  }
});

module.exports = router;
