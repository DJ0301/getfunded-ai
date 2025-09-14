const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'investors_static.json');
const BACKUP = path.join(__dirname, '..', 'data', 'investors_static.backup.json');

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
  const base = firm
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

function isPersonName(name) {
  if (!name) return false;
  // Heuristic: contains a space and not firm-ish keywords
  const firmish = /(ventures?|capital|partners?|labs?|holdings?|vc|management|advisors?|group|llc|inc|fund)/i;
  return name.includes(' ') && !firmish.test(name);
}

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
}

function localPartFromName(name) {
  const parts = name.trim().split(/\s+/).map(normalize).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`; // first.last
}

function chooseFallbackLocal() {
  return 'contact'; // could also try hello/info
}

function main() {
  const raw = fs.readFileSync(SRC, 'utf-8');
  let data;
  try { data = JSON.parse(raw); } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(data)) {
    console.error('Expected an array in investors_static.json');
    process.exit(1);
  }

  // Backup first
  try {
    if (!fs.existsSync(BACKUP)) fs.writeFileSync(BACKUP, raw, 'utf-8');
  } catch (e) {
    console.warn('Backup failed (continuing):', e.message);
  }

  let updated = 0;
  const out = data.map((inv) => {
    const copy = { ...inv };
    const hasEmail = copy.email && String(copy.email).trim().length > 0;
    if (hasEmail) return copy;

    const domainFromWebsite = getDomainFromUrl(copy.website);
    const guessedDomain = domainFromWebsite || slugToDomainFromFirm(copy.firm || copy.name);

    let local = null;
    if (isPersonName(copy.name)) {
      local = localPartFromName(copy.name);
    }
    if (!local) local = chooseFallbackLocal();

    if (guessedDomain) {
      copy.email = `${local}@${guessedDomain}`;
    } else {
      // absolute fallback
      copy.email = `${local}@example.com`;
    }

    updated += 1;
    return copy;
  });

  fs.writeFileSync(SRC, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`Updated ${updated} investor emails. Backup at ${BACKUP}`);
}

main();
