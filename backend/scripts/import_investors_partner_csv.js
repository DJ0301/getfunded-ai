#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function makeLocation(city, state, country) {
  const parts = [city, state, country].map((x) => (x || '').trim()).filter(Boolean);
  return parts.join(', ');
}

function normalizeWebsite(url) {
  if (!url) return '';
  const u = String(url).trim();
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return `http://${u}`;
}

function main() {
  const csvPath = process.argv[2];
  const outPath = process.argv[3] || path.join(__dirname, '..', 'data', 'investors.json');
  const limit = parseInt(process.argv[4] || '500', 10);

  if (!csvPath) {
    console.error('Usage: node scripts/import_investors_partner_csv.js <input.csv> [output.json] [limit=500]');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);

  // Expected columns seen: Partner,First,Last,Title,Email,EMAIL SENT,Notes,Phone,Address_1,Address_2,City,State,Zip,Country,Phone,Website,Fax
  const idx = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));

  function get(row, key) {
    const i = idx[key.toLowerCase()];
    return i !== undefined ? row[i] : '';
  }

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const firm = get(row, 'Partner') || get(row, 'Firm') || '';
    const first = get(row, 'First');
    const last = get(row, 'Last');
    const name = [first, last].filter(Boolean).join(' ').trim();
    const role = get(row, 'Title');
    const email = get(row, 'Email');
    const website = get(row, 'Website');
    const city = get(row, 'City');
    const state = get(row, 'State');
    const country = get(row, 'Country');
    const location = makeLocation(city, state, country);

    if (!name && !email) continue; // skip unusable rows

    data.push({
      name,
      firm,
      role,
      email,
      linkedIn: '',
      portfolioHighlights: [],
      investmentThesis: '',
      sectors: [],
      stages: [],
      checkSize: '',
      location,
      website: normalizeWebsite(website)
    });

    if (data.length >= limit) break;
  }

  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Imported ${data.length} investors → ${outPath}`);
}

if (require.main === module) {
  main();
}
