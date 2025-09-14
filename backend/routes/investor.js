const express = require('express');
const router = express.Router();
const { generateInvestorStrategy, sourceInvestors } = require('../services/aiService');
const { filterByStrategy } = require('../services/staticInvestors');
const { createOrUpdateSheet } = require('../services/googleSheetsService');

// Heuristic inference for strategy fields based on founder data (module scope)
function inferStrategyFromFounder(founderData = {}, currentStrategy = {}) {
  const desc = `${founderData?.description || ''} ${founderData?.tractionMetrics || ''}`.toLowerCase();
  const inferred = {};

  // Geo inference from corridor keywords and currencies
  const geoMatches = new Set();
  const addGeo = (g) => geoMatches.add(g);

  const geoMap = [
    { keys: ['india', 'inr', 'mumbai', 'bangalore', 'bengaluru', 'delhi'], label: 'India' },
    { keys: ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'aed'], label: 'United Arab Emirates' },
    { keys: ['us', 'usa', 'united states', 'new york', 'san francisco', 'usd'], label: 'United States' },
    { keys: ['saudi', 'ksa', 'riyadh', 'jeddah'], label: 'Saudi Arabia' },
    { keys: ['europe', 'eu', 'london', 'uk', 'united kingdom'], label: 'Europe' }
  ];

  geoMap.forEach(({ keys, label }) => {
    if (keys.some(k => desc.includes(k))) addGeo(label);
  });

  if (!currentStrategy?.geographicFocus && geoMatches.size > 0) {
    inferred.geographicFocus = Array.from(geoMatches).join(', ');
  }

  // Sector inference
  const sectorSet = new Set(currentStrategy?.sectors || []);
  const ensureSector = (s) => sectorSet.add(s);

  if (/(payments|remittance|invoice|payroll|settlement|onramp|offramp|kyc|aml|wallet|usdt|stablecoin|cross[-\s]?border)/.test(desc)) {
    ensureSector('Fintech');
    ensureSector('Payments');
  }
  if (/(api|platform|saas|b2b)/.test(desc)) ensureSector('SaaS');

  if (sectorSet.size && (!currentStrategy?.sectors || currentStrategy.sectors.length === 0)) {
    inferred.sectors = Array.from(sectorSet);
  }

  return inferred;
}

/**
 * @route POST /api/investor/strategy
 * @desc Generate AI-recommended sectors/geographies/stages
 * @access Public
 */
router.post('/strategy', async (req, res) => {
  try {
    const { founderData, previousRejection, clarification } = req.body;
    console.log('📥 [/strategy] request', { founderData, previousRejection, clarification });

    // Generate investor strategy using AI
    let strategy = await generateInvestorStrategy({
      founderData,
      previousRejection,
      clarification
    });

    // Merge inferred fallback to avoid empty UI
    const inferred = inferStrategyFromFounder(founderData, strategy);
    strategy = {
      ...strategy,
      sectors: (strategy.sectors && strategy.sectors.length) ? strategy.sectors : (inferred.sectors || []),
      geographicFocus: strategy.geographicFocus || inferred.geographicFocus || 'Global',
      stages: (strategy.stages && strategy.stages.length) ? strategy.stages : (founderData?.stage ? [founderData.stage] : []),
      investorTypes: (strategy.investorTypes && strategy.investorTypes.length) ? strategy.investorTypes : ['Venture Capital', 'Angel Investors'],
      checkSizeRange: strategy.checkSizeRange || founderData?.fundraisingTarget || ''
    };

    console.log('📤 [/strategy] response', strategy);

    res.json({
      success: true,
      data: strategy,
      message: 'Investor strategy generated successfully'
    });
  } catch (error) {
    console.error('Error generating investor strategy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate investor strategy',
      error: error.message
    });
  }
});

/**
 * @route POST /api/investor/sourcing
 * @desc Fetch investor data and populate Google Sheet
 * @access Public
 */
router.post('/sourcing', async (req, res) => {
  try {
    const { strategy = {}, founderData = {}, source } = req.body || {};
    const sourceParam = (req.query.source || source || '').toString().toLowerCase();
    // Infer missing strategy fields from founderData (description, etc.)
    const inferred = inferStrategyFromFounder(founderData, strategy);
    const effectiveStrategy = { ...strategy, ...inferred };

    // Source investors based on strategy
    const investors = sourceParam === 'static'
      ? filterByStrategy(effectiveStrategy)
      : await sourceInvestors(effectiveStrategy);

    // Create or update Google Sheet with investor data (only if creds are present)
    let sheetResult = null;
    const hasSheetsCreds = !!(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
    if (hasSheetsCreds) {
      try {
        sheetResult = await createOrUpdateSheet({
          founderName: founderData.startupName || founderData.founderName || founderData.email || 'Founder',
          investors,
          strategy: effectiveStrategy
        });
      } catch (sheetErr) {
        console.error('Google Sheets creation failed, continuing without sheet:', sheetErr?.message || sheetErr);
      }
    }

    res.json({
      success: true,
      data: {
        investors,
        sheetUrl: sheetResult?.sheetUrl || null,
        sheet: sheetResult || null,
        totalCount: investors.length
      },
      message: sheetResult ? 'Investors sourced and sheet created successfully' : 'Investors sourced. Google Sheet could not be created; please verify Google credentials.'
    });
  } catch (error) {
    console.error('Error sourcing investors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to source investors',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/investor/update/:sheetId
 * @desc Update investor data in Google Sheet
 * @access Public
 */
router.put('/update/:sheetId', async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { investors } = req.body;

    // Update Google Sheet with new investor data
    const result = await createOrUpdateSheet({
      sheetId,
      investors,
      update: true
    });

    res.json({
      success: true,
      data: result,
      message: 'Investor sheet updated successfully'
    });
  } catch (error) {
    console.error('Error updating investor sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update investor sheet',
      error: error.message
    });
  }
});

module.exports = router;
