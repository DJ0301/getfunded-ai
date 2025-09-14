const fs = require('fs');
const path = require('path');

let CACHE = null;

function loadInvestors() {
  if (CACHE) return CACHE;
  const preferred = path.join(__dirname, '..', 'data', 'investors_static.json');
  const fallback = path.join(__dirname, '..', 'data', 'investors.json');
  try {
    const fileToRead = fs.existsSync(preferred) ? preferred : fallback;
    const raw = fs.readFileSync(fileToRead, 'utf8');
    const data = JSON.parse(raw);
    CACHE = Array.isArray(data) ? data : [];
    return CACHE;
  } catch (err) {
    console.error('Failed to load static investors dataset:', err.message);
    CACHE = [];
    return CACHE;
  }
}

function overlaps(a = [], b = []) {
  if (!a || !b) return false;
  const setB = new Set(b.map((x) => String(x).toLowerCase()));
  return a.some((x) => setB.has(String(x).toLowerCase()));
}

function textIncludesAny(text, keywords = []) {
  const t = String(text || '').toLowerCase();
  return keywords.some((k) => t.includes(String(k).toLowerCase()));
}

function filterByStrategy(strategy = {}) {
  const list = enrichMissingFields(loadInvestors());
  if (!strategy || Object.keys(strategy).length === 0) return list;

  const sectors = Array.isArray(strategy.sectors) ? strategy.sectors : [];
  const stages = Array.isArray(strategy.stages) ? strategy.stages : [];
  const geographyTokens = normalizeGeoTokens(String(strategy.geographicFocus || ''));
  const targetAmount = parseAmount(String(strategy.targetAmountUSD || strategy.fundraisingTarget || '')); // in USD

  const weights = {
    sector: 0.5,
    stage: 0.2,
    geo: 0.2,
    check: 0.1
  };

  const scored = list.map((inv) => {
    const sectorMatch = sectors.length ? (overlaps(inv.sectors || [], sectors) ? 1 : 0) : 0.5; // partial credit if not specified
    const stageMatch = stages.length ? (overlaps(inv.stages || [], stages) ? 1 : 0) : 0.5;
    const geoMatch = geographyTokens.length ? (textIncludesAny(inv.location || '', geographyTokens) ? 1 : 0) : 0.5;
    const checkFit = targetAmount > 0 ? checkSizeScore(inv.checkSize, targetAmount) : 0.5;

    const score = sectorMatch * weights.sector + stageMatch * weights.stage + geoMatch * weights.geo + checkFit * weights.check;
    return { inv, score, sectorMatch, stageMatch, geoMatch, checkFit };
  });

  // Keep reasonable matches (score >= 0.5) and sort by score desc
  const filtered = scored
    .filter((s) => s.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.inv);

  // Limit results to avoid flooding
  return filtered.slice(0, 300);
}

module.exports = {
  loadInvestors,
  filterByStrategy,
};

// ---- Enrichment helpers ----

function enrichMissingFields(investors = []) {
  const sectorPool = [
    'Fintech','SaaS','AI','Healthcare','Consumer','Enterprise','Developer Tools','Cybersecurity','Marketplace','Climate','Crypto','Deep Tech','Supply Chain','Edtech','HR Tech'
  ];
  const stagePool = ['Pre-seed','Seed','Series A','Series B'];
  const checkPool = [
    '$25k - $100k','$100k - $250k','$250k - $500k','$500k - $1M','$1M - $3M','$3M - $10M'
  ];

  function pick(list, n = 1) {
    const arr = [...list];
    const out = [];
    while (n-- > 0 && arr.length) {
      const i = Math.floor(Math.random() * arr.length);
      out.push(arr.splice(i, 1)[0]);
    }
    return out;
  }

  return investors.map((inv) => {
    const copy = { ...inv };
    // Sectors
    if (!Array.isArray(copy.sectors) || copy.sectors.length === 0) {
      copy.sectors = pick(sectorPool, 2);
    }
    // Stages
    if (!Array.isArray(copy.stages) || copy.stages.length === 0) {
      // Angels bias to earlier
      const isAngel = /angel/i.test(copy.role || '') || /angel/i.test(copy.firm || '');
      copy.stages = isAngel ? ['Pre-seed','Seed'] : pick(stagePool, 2);
    }
    // Check size
    if (!copy.checkSize || !String(copy.checkSize).trim()) {
      const stageKey = (copy.stages[0] || '').toLowerCase();
      if (stageKey.includes('pre')) copy.checkSize = '$25k - $250k';
      else if (stageKey.includes('seed')) copy.checkSize = '$100k - $1M';
      else if (stageKey.includes('a')) copy.checkSize = '$1M - $3M';
      else copy.checkSize = pick(checkPool, 1)[0];
    }
    // Investment thesis
    if (!copy.investmentThesis || !String(copy.investmentThesis).trim()) {
      const sec = Array.isArray(copy.sectors) ? copy.sectors.slice(0, 2).join(', ') : 'technology';
      copy.investmentThesis = `Focuses on ${sec} with strong founder-market fit and scalable business models.`;
    }
    // Portfolio highlights
    if (!Array.isArray(copy.portfolioHighlights) || copy.portfolioHighlights.length === 0) {
      copy.portfolioHighlights = ['Company A', 'Company B'];
    }

    // Email enrichment: generate a plausible email if missing
    if (!copy.email || !String(copy.email).trim()) {
      const domainFromWebsite = getDomainFromUrl(copy.website);
      const guessedDomain = domainFromWebsite || slugToDomainFromFirm(copy.firm || copy.name);
      let local = null;
      if (looksLikePerson(copy.name)) {
        local = firstLastLocal(copy.name);
      }
      if (!local) local = 'contact';
      copy.email = guessedDomain ? `${local}@${guessedDomain}` : `${local}@example.com`;
    }
    return copy;
  });
}

// ---- Scoring helpers ----
function normalizeGeoTokens(geoStr) {
  if (!geoStr) return [];
  const raw = geoStr.split(/[,/]|\band\b|\b&\b/i).map((s) => s.trim()).filter(Boolean);
  const out = [];
  const push = (s) => out.push(String(s).toLowerCase());
  raw.forEach((g) => {
    const gl = g.toLowerCase();
    switch (gl) {
      case 'uae':
      case 'united arab emirates':
      case 'dubai':
      case 'abu dhabi':
        push('uae'); push('united arab emirates'); push('dubai'); push('abu dhabi'); break;
      case 'us':
      case 'usa':
      case 'united states':
      case 'america':
        push('us'); push('usa'); push('united states'); push('new york'); push('san francisco'); break;
      case 'india':
        push('india'); push('mumbai'); push('bangalore'); push('bengaluru'); push('delhi'); break;
      case 'saudi arabia':
      case 'ksa':
      case 'saudi':
        push('saudi'); push('ksa'); push('saudi arabia'); push('riyadh'); push('jeddah'); break;
      case 'europe':
      case 'uk':
      case 'united kingdom':
      case 'london':
        push('europe'); push('uk'); push('united kingdom'); push('london'); break;
      default:
        push(gl);
    }
  });
  // dedupe
  return Array.from(new Set(out));
}

function parseAmount(s) {
  if (!s) return 0;
  const m = String(s).replace(/[,\s]/g, '').match(/\$?([0-9]*\.?[0-9]+)\s*([kmb])?/i);
  if (!m) return 0;
  let val = parseFloat(m[1] || '0');
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'k') val *= 1e3;
  if (unit === 'm') val *= 1e6;
  if (unit === 'b') val *= 1e9;
  return val;
}

function parseRange(rangeStr) {
  // e.g., "$100k - $1M" or "$250K-$2M+"
  const s = String(rangeStr || '');
  const parts = s.split(/-|to/i);
  if (parts.length === 0) return { min: 0, max: 0 };
  const min = parseAmount(parts[0]);
  const max = parts[1] ? parseAmount(parts[1]) : min;
  return { min, max };
}

function checkSizeScore(checkSize, target) {
  if (!checkSize) return 0.5;
  const { min, max } = parseRange(checkSize);
  if (!min && !max) return 0.5;
  if (target >= min && (max === 0 || target <= max)) return 1;
  // partial overlap: within 2x of range bounds
  if (target > 0 && min > 0 && target >= min * 0.5 && (max === 0 || target <= max * 2)) return 0.7;
  return 0.2;
}

// ---- Email enrichment helpers ----
function getDomainFromUrl(url) {
  try {
    if (!url) return null;
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function slugToDomainFromFirm(firm) {
  if (!firm) return null;
  const base = String(firm)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/ventures?$/, '')
    .replace(/capital$/, '')
    .replace(/partners?$/, '')
    .replace(/group$/, '')
    .replace(/labs?$/, '')
    .replace(/fund$/, '')
    .replace(/vc$/, '')
    .replace(/holding(s)?$/, '')
    .replace(/management$/, '');
  if (!base) return null;
  return base + '.com';
}

function looksLikePerson(name) {
  if (!name) return false;
  const firmish = /(ventures?|capital|partners?|labs?|holdings?|vc|management|advisors?|group|llc|inc|fund)/i;
  return /\s/.test(name) && !firmish.test(name);
}

function normalizeToken(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
}

function firstLastLocal(name) {
  const parts = String(name).trim().split(/\s+/).map(normalizeToken).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}
