const Groq = require('groq-sdk');

// Initialize Groq client with fallback
let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  } else {
    console.warn('⚠️ GROQ_API_KEY not found. AI features will use mock data.');
  }
} catch (error) {
  console.error('Failed to initialize Groq client:', error.message);
}

/**
 * Process founder input and generate initial insights
 * Uses Mixtral-8x7B for chat interactions
 */
async function processFounderInput(founderData) {
  try {
    if (!groq) {
      // Return mock data when Groq is not available
      return {
        ...founderData,
        insights: {
          keyStrengths: ["Strong product-market fit", "Experienced team", "Growing market"],
          potentialChallenges: ["Competition", "Scaling challenges", "Market timing"],
          recommendedInvestorProfile: "Early-stage VCs with sector expertise",
          suggestedPitchImprovements: ["Strengthen traction metrics", "Clarify go-to-market strategy"]
        },
        processedAt: new Date().toISOString()
      };
    }

    const prompt = `
    Analyze this startup information and provide key insights:
    
    Startup: ${founderData.startupName}
    Description: ${founderData.description}
    Stage: ${founderData.stage}
    Traction: ${founderData.tractionMetrics}
    Fundraising Target: ${founderData.fundraisingTarget}
    Preferred Investor Type: ${founderData.preferredInvestorType}
    
    Provide:
    1. Key strengths of the startup
    2. Potential challenges
    3. Recommended investor profile
    4. Suggested pitch improvements
    
    Format as JSON.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert fundraising advisor. Provide actionable insights in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const insights = JSON.parse(completion.choices[0].message.content);
    
    return {
      ...founderData,
      insights,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing founder input with AI:', error);
    // Return mock data on error
    return {
      ...founderData,
      insights: {
        keyStrengths: ["Strong product-market fit", "Experienced team"],
        potentialChallenges: ["Market competition", "Scaling challenges"],
        recommendedInvestorProfile: "Sector-focused VCs",
        suggestedPitchImprovements: ["Strengthen metrics", "Clarify strategy"]
      },
      processedAt: new Date().toISOString()
    };
  }
}

/**
 * Generate investor strategy based on founder data
 * Handles rejections and clarifications dynamically
 */
async function generateInvestorStrategy({ founderData, previousRejection, clarification }) {
  try {
    console.log('🔎 [AI] generateInvestorStrategy input', {
      founderData,
      previousRejection,
      clarification
    });
    if (!groq) {
      // Return mock strategy when Groq is not available
      const mock = sanitizeStrategy({
        sectors: ["SaaS", "Fintech", "Enterprise Software"],
        geographicFocus: inferGeoFromFounder(founderData) || "Global",
        stages: [founderData?.stage || "Seed", "Series A"],
        investorTypes: ["Venture Capital", "Angel Investors"],
        checkSizeRange: founderData?.fundraisingTarget || "$500K - $2M",
        valuePropositions: [
          "Strong product-market fit with growing user base",
          "Experienced team with domain expertise",
          "Large addressable market opportunity"
        ]
      });
      console.log('🧪 [AI] generateInvestorStrategy mock output', mock);
      return mock;
    }

    let prompt = `
    Based on this startup profile, recommend the ideal investor strategy:
    
    Startup: ${founderData.startupName}
    Description: ${founderData.description}
    Stage: ${founderData.stage}
    Traction: ${founderData.tractionMetrics}
    Target: ${founderData.fundraisingTarget}
    `;

    if (previousRejection) {
      prompt += `
      
      The founder rejected the previous recommendation: ${JSON.stringify(previousRejection)}
      Clarification provided: ${clarification}
      
      Please provide an updated strategy based on this feedback.
      `;
    }

    prompt += `
    
    Provide a detailed investor targeting strategy including:
    1. Recommended sectors (3-5)
    2. Geographic focus (primary and secondary markets)
    3. Investment stages to target
    4. Investor types (VC, Angel, Corporate, etc.)
    5. Check size range
    6. Key value propositions for investors
    
    Format as JSON.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in venture capital and investor relations. Provide strategic investor targeting recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });
    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);
    const clean = sanitizeStrategy(parsed);
    console.log('✅ [AI] generateInvestorStrategy output', clean);
    return clean;
  } catch (error) {
    console.error('Error generating investor strategy:', error);
    // Return mock strategy on error
    const fallback = sanitizeStrategy({
      sectors: ["Technology", "SaaS", "B2B Software"],
      geographicFocus: inferGeoFromFounder(founderData) || "Global",
      stages: [founderData?.stage || "Seed"],
      investorTypes: ["Venture Capital", "Angel Investors"],
      checkSizeRange: founderData?.fundraisingTarget || "$1M - $5M",
      valuePropositions: [
        "Strong market opportunity",
        "Experienced founding team",
        "Proven traction metrics"
      ]
    });
    console.log('🛟 [AI] generateInvestorStrategy fallback output', fallback);
    return fallback;
  }
}

/**
 * Source investors based on strategy
 * In production, this would integrate with Crunchbase, AngelList, LinkedIn APIs
 */
async function sourceInvestors(strategy) {
  try {
    if (!groq) {
      // Return mock investors when Groq is not available
      return generateMockInvestors(strategy);
    }

    const prompt = `
    Generate a list of 20 realistic investor profiles matching this strategy:
    ${JSON.stringify(strategy)}
    
    For each investor, provide:
    - name
    - firm
    - role
    - email (use format: firstname.lastname@firm.com)
    - linkedIn (use format: linkedin.com/in/firstname-lastname)
    - portfolioHighlights (2-3 relevant investments)
    - investmentThesis (brief, 1-2 sentences)
    - sectors (array)
    - stages (array)
    - checkSize
    - location
    
    Make the investors realistic and relevant to the strategy.
    Format as JSON array.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a database of venture capital investors. Generate realistic investor profiles that match the given criteria.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return result.investors || result;
  } catch (error) {
    console.error('Error sourcing investors:', error);
    return generateMockInvestors(strategy);
  }
}

// Generate mock investors for demo/fallback
function generateMockInvestors(strategy) {
  const mockInvestors = [
    {
      name: "Sarah Chen",
      firm: "Accel Partners",
      role: "Partner",
      email: "sarah.chen@accel.com",
      linkedIn: "linkedin.com/in/sarah-chen-vc",
      portfolioHighlights: ["Slack", "Dropbox", "Atlassian"],
      investmentThesis: "Focuses on enterprise software with strong product-market fit",
      sectors: ["SaaS", "Enterprise Software"],
      stages: ["Series A", "Series B"],
      checkSize: "$5M - $15M",
      location: "Palo Alto, CA"
    },
    {
      name: "Michael Rodriguez",
      firm: "Sequoia Capital",
      role: "Principal",
      email: "michael.rodriguez@sequoiacap.com",
      linkedIn: "linkedin.com/in/michael-rodriguez-sequoia",
      portfolioHighlights: ["Stripe", "Zoom", "WhatsApp"],
      investmentThesis: "Invests in transformative technology companies with global potential",
      sectors: ["Fintech", "Communication", "B2B"],
      stages: ["Seed", "Series A"],
      checkSize: "$1M - $10M",
      location: "Menlo Park, CA"
    },
    {
      name: "Emily Watson",
      firm: "Andreessen Horowitz",
      role: "General Partner",
      email: "emily.watson@a16z.com",
      linkedIn: "linkedin.com/in/emily-watson-a16z",
      portfolioHighlights: ["Coinbase", "Airbnb", "Lyft"],
      investmentThesis: "Backs bold entrepreneurs building the future of technology",
      sectors: ["Crypto", "Marketplace", "Consumer"],
      stages: ["Series A", "Series B", "Series C"],
      checkSize: "$10M - $50M",
      location: "San Francisco, CA"
    }
  ];

  // Add more investors based on strategy
  const additionalInvestors = Array.from({ length: 17 }, (_, i) => ({
    name: `Investor ${i + 4}`,
    firm: `VC Firm ${i + 4}`,
    role: i % 2 === 0 ? "Partner" : "Principal",
    email: `investor${i + 4}@vcfirm${i + 4}.com`,
    linkedIn: `linkedin.com/in/investor-${i + 4}`,
    portfolioHighlights: ["Company A", "Company B"],
    investmentThesis: "Focused on early-stage technology companies",
    sectors: strategy.sectors || ["Technology"],
    stages: strategy.stages || ["Seed"],
    checkSize: strategy.checkSizeRange || "$1M - $5M",
    location: "Various"
  }));

  return [...mockInvestors, ...additionalInvestors];
}

/**
 * Generate personalized email draft for investor outreach
 * Uses LLaMA for high-quality email generation
 */
async function generateEmailDraft({ investor, founderData, tone, calendlyLink, isFollowUp, previousEmail, daysSinceLastContact }) {
  try {
    if (!groq) {
      // Return mock email when Groq is not available
      return {
        subject: `Partnership opportunity with ${founderData.startupName}`,
        content: `Hi ${deriveRecipient(investor)},

I hope this email finds you well. I'm reaching out because I noticed your investment in ${investor.portfolioHighlights?.[0] || 'innovative companies'} and believe ${founderData.startupName} would be a great fit for your portfolio.

We're a ${founderData.stage} ${founderData.description}. Our key traction includes: ${founderData.tractionMetrics}.

I'd love to share more about our ${founderData.fundraisingTarget} raise and discuss how we align with your investment thesis.

${calendlyLink ? `Feel free to book a time that works for you: ${calendlyLink}` : 'Would you be available for a brief call this week?'}

Best regards,
Founder of ${founderData.startupName}`,
        investor: investor,
        generatedAt: new Date().toISOString()
      };
    }

    let prompt = '';
    
    if (isFollowUp) {
      prompt = `
      Generate a follow-up email to an investor who hasn't responded.
      
      Days since last contact: ${daysSinceLastContact}
      Previous email summary: ${previousEmail}
      
      Keep it brief, friendly, and add value.
      `;
    } else {
      prompt = `
      Generate a personalized cold outreach email to this investor:
      
      Investor: ${investor.name} at ${investor.firm}
      Role: ${investor.role}
      Investment Thesis: ${investor.investmentThesis}
      Portfolio: ${investor.portfolioHighlights?.join(', ')}
      
      From Founder:
      Startup: ${founderData.startupName}
      Description: ${founderData.description}
      Stage: ${founderData.stage}
      Traction: ${founderData.tractionMetrics}
      
      Tone: ${tone}
      ${calendlyLink ? `Include this Calendly link for booking: ${calendlyLink}` : ''}
      
      Requirements:
      - Personalized opening referencing investor's portfolio or thesis
      - Brief, compelling pitch (2-3 sentences)
      - Clear traction points
      - Specific ask (meeting or call)
      - Professional signature
      
      Keep it under 150 words.
      `;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert at writing compelling investor outreach emails. Write in a ${tone} tone.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500
    });

    const emailContent = completion.choices[0].message.content;
    
    // Generate subject line
    const subjectCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Generate a compelling email subject line for investor outreach. Keep it under 50 characters.'
        },
        {
          role: 'user',
          content: `Generate a subject line for this email: ${emailContent.substring(0, 200)}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 50
    });

    return {
      subject: subjectCompletion.choices[0].message.content.trim().replace(/["']/g, ''),
      content: emailContent,
      investor: investor,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating email draft:', error);
    // Return mock email on error
    return {
      subject: `Partnership opportunity with ${founderData.startupName}`,
      content: `Hi ${deriveRecipient(investor)},

I hope this finds you well. I'm reaching out regarding ${founderData.startupName}, which I believe aligns with your investment focus.

We're ${founderData.description} with strong traction: ${founderData.tractionMetrics}.

I'd love to discuss our ${founderData.fundraisingTarget} raise with you.

${calendlyLink ? `Book a time: ${calendlyLink}` : 'Available for a call this week?'}

Best regards,
${founderData.startupName} Team`,
      investor: investor,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  processFounderInput,
  generateInvestorStrategy,
  sourceInvestors,
  generateEmailDraft,
  generatePresetEmailDrafts,
  generateEmailsFromPresets
};

// Return five preset email variants (subject + content) without calling AI
function generatePresetEmailDrafts({ investor = {}, founderData = {}, calendlyLink }) {
  const name = deriveRecipient(investor) || 'there';
  const startup = founderData.startupName || 'Our startup';
  const target = founderData.fundraisingTarget || founderData.targetAmountUSD || '$750K';
  const description = founderData.description || 'cross-border payments platform';
  const partners = inferPartners(founderData) || 'key liquidity partners';
  const hookMarket = inferMarketStat(founderData) || '$100B+';
  const signoff = founderData.founderName || founderData.founder || 'Founder';
  const calendlyLine = calendlyLink ? `\n\nFeel free to pick a time that works for you: ${calendlyLink}` : '';

  const variants = [
    {
      key: 'straightforward_founder',
      subject: `Introducing ${startup} – Seamless Cross-Border Payments`,
      content:
`Hi ${name},

I’m ${signoff}, founder of ${startup}. We’re building a next-gen platform for instant crypto-to-INR payments, enabling NRIs to send money to India with minimal fees and zero settlement friction. Our focus is on compliant, scalable infrastructure leveraging USDT liquidity pools and partnerships with ${partners}.

We’re raising ${target} to expand our team, integrate AI for transaction insights, and scale our cross-border operations. I’d love to briefly connect and share how ${startup} is shaping the future of remittances.${calendlyLine}

Are you available for a 15-minute chat next week?

Best regards,
${signoff}`
    },
    {
      key: 'data_driven_impact',
      subject: `Reducing Remittance Friction for ${hookMarket} Market`,
      content:
`Hi ${name},

Remittances to India exceed ${hookMarket} annually, yet traditional channels take days and charge 3–5% in fees. At ${startup}, we enable instant, low-fee crypto-to-INR transfers with full regulatory compliance.

We’ve partnered with major liquidity providers (${partners}) and operate on a 0.5% transaction fee model. We’re raising ${target} to scale operations and add AI-driven insights for remittance optimization.${calendlyLine}

Would you be open to a quick intro call to explore ${startup}?

Best,
${signoff}`
    },
    {
      key: 'visionary_story',
      subject: `Reimagining How Money Flows Between Countries`,
      content:
`Hi ${name},

Cross-border payments haven’t changed in decades — slow, opaque, and expensive. ${startup} is changing that. We allow instant crypto-to-INR transfers and plan to expand into tokenized investments for NRIs (real estate, private credit).

We’re seeking ${target} to scale our tech, expand our team, and grow adoption. I’d love to share our story and vision for transforming remittances.${calendlyLine}

Would you be available for a 15-minute chat next week?

Warm regards,
${signoff}`
    },
    {
      key: 'short_direct',
      subject: `${startup} – Cross-Border Payments Opportunity`,
      content:
`Hi ${name},

I’m ${signoff}, founder of ${startup}. We enable instant, low-cost crypto-to-INR transfers, solving inefficiencies in global remittances.

We’re raising ${target} to grow our team, scale operations, and integrate AI-driven insights. Can we schedule a short call to discuss?${calendlyLine}

Thanks,
${signoff}`
    },
    {
      key: 'curiosity_hook',
      subject: `What if sending money abroad was instant?`,
      content:
`Hi ${name},

Most cross-border payments take days and incur high fees. At ${startup}, we’ve built a platform where NRIs can send money to India instantly via crypto — fully compliant and low cost.

We’re raising ${target} to expand our team, optimize liquidity flows, and build AI tools for smarter remittances. I’d love to show a quick demo and get your thoughts.${calendlyLine}

Are you free for a 15-minute intro call this week?

Best,
${signoff}`
    }
  ];

  return { variants };
}

function inferPartners(founderData = {}) {
  const txt = `${founderData.description || ''} ${founderData.tractionMetrics || ''}`.toLowerCase();
  const hits = [];
  if (txt.includes('bridge')) hits.push('Bridge');
  if (txt.includes('alpyne')) hits.push('Alpyne');
  if (txt.includes('fireblocks')) hits.push('Fireblocks');
  if (txt.includes('cobo')) hits.push('Cobo');
  return hits.length ? hits.join(' & ') : null;
}

function inferMarketStat(founderData = {}) {
  const txt = `${founderData.description || ''}`.toLowerCase();
  if (/(india|nri|remittance)/.test(txt)) return '$100B';
  return '$100B+';
}

// Heuristic to choose the correct greeting addressee
function deriveRecipient(investor = {}) {
  const firm = investor.firm?.trim();
  const name = investor.name?.trim();
  // If 'name' looks like a person (has a space and doesn't look like a firm keyword), use first name
  if (name) {
    const firmish = /(ventures?|capital|partners?|labs?|holdings?|vc|management|advisors?|group|llc|inc|fund)/i;
    if (!firmish.test(name)) {
      const first = name.split(/\s+/)[0];
      if (first) return first;
    }
  }
  // Try infer from email local-part
  const email = investor.email || investor.investorEmail || '';
  if (email.includes('@')) {
    const local = email.split('@')[0];
    const token = local.split(/[._-]/)[0];
    if (token && token.length >= 2 && /[a-z]/i.test(token)) {
      return token.charAt(0).toUpperCase() + token.slice(1);
    }
  }
  // Fall back to firm team
  if (firm) return `${firm} team`;
  return 'there';
}

// Helpers to sanitize/normalize strategy outputs
function sanitizeStrategy(s = {}) {
  const arr = (x) => (Array.isArray(x) ? x : (x ? [x] : []));
  const trimArr = (xs) => arr(xs).map((v) => String(v).trim()).filter(Boolean);
  const obj = {
    sectors: trimArr(s.sectors),
    geographicFocus: s.geographicFocus && String(s.geographicFocus).trim() || 'Global',
    stages: trimArr(s.stages),
    investorTypes: trimArr(s.investorTypes),
    checkSizeRange: s.checkSizeRange && String(s.checkSizeRange).trim() || '',
    valuePropositions: trimArr(s.valuePropositions)
  };
  return obj;
}

function inferGeoFromFounder(founderData = {}) {
  const t = `${founderData.description || ''} ${founderData.tractionMetrics || ''}`.toLowerCase();
  if (/(india|inr|mumbai|bangalore|bengaluru|delhi)/.test(t)) return 'India';
  if (/(uae|dubai|abu dhabi|united arab emirates|aed)/.test(t)) return 'United Arab Emirates';
  if (/(us|usa|united states|new york|san francisco|usd)/.test(t)) return 'United States';
  return null;
}

// Use presets as style guides and have AI refine/personalize each style
async function generateEmailsFromPresets({ investor = {}, founderData = {}, calendlyLink, tone }) {
  const { variants } = generatePresetEmailDrafts({ investor, founderData, calendlyLink });
  const results = [];
  for (const v of variants) {
    try {
      if (!groq) {
        // Fallback: return the preset itself if AI is unavailable
        results.push({ key: v.key, subject: v.subject, content: v.content, refined: false });
        continue;
      }

      const guide = v.content;
      const sys = `You are an expert at writing concise, high-conversion investor outreach emails. Maintain the style indicated by the provided guide. Keep under 150 words unless the guide is longer. Greeting rule: if a point-of-contact person name exists, greet with 'Hi <first name>,'. Otherwise, greet with 'Hi <firm> team,'. Never greet with 'Hi <firm name>,' plain.`;
      const user = `STYLE GUIDE (for reference):\n---\n${guide}\n---\n\nInvestor details (personalize respectfully):\n${JSON.stringify({
        name: investor.name,
        firm: investor.firm,
        role: investor.role,
        sectors: investor.sectors,
        stages: investor.stages,
        thesis: investor.investmentThesis,
        portfolioHighlights: investor.portfolioHighlights
      })}\n\nFounder details:\n${JSON.stringify({
        startupName: founderData.startupName,
        description: founderData.description,
        stage: founderData.stage,
        tractionMetrics: founderData.tractionMetrics,
        fundraisingTarget: founderData.fundraisingTarget,
        calendlyLink
      })}\n\nTone: ${tone || 'formal'}\nRemember: Respect the greeting rule.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 700,
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      const subject = parsed.subject || v.subject;
      const content = parsed.content || v.content;
      results.push({ key: v.key, subject, content, refined: true });
    } catch (e) {
      // Graceful fallback to preset
      results.push({ key: v.key, subject: v.subject, content: v.content, refined: false, error: e.message });
    }
  }
  return { variants: results };
}
