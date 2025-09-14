#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  // Basic CSV parser supporting quoted commas
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { // escaped quote
        cur += '"';
        i++; // skip next
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
  return result.map(s => s.trim());
}

function toArray(val) {
  if (!val) return [];
  return String(val).split('|').map(s => s.trim()).filter(Boolean);
}

function main() {
  const csvPath = process.argv[2];
  const outPath = process.argv[3] || path.join(__dirname, '..', 'data', 'investors.json');
  if (!csvPath) {
    console.error('Usage: node scripts/import_investors_from_csv.js <input.csv> [output.json]');
    process.exit(1);
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseCSVLine(lines[0]);

  const required = ['name','firm','role','email','linkedIn','portfolioHighlights','investmentThesis','sectors','stages','checkSize','location'];
  for (const r of required) {
    if (!header.includes(r)) {
      console.error(`Missing required header: ${r}`);
      process.exit(1);
    }
  }

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => obj[h] = row[idx] || '');
    data.push({
      name: obj.name,
      firm: obj.firm,
      role: obj.role,
      email: obj.email,
      linkedIn: obj.linkedIn,
      portfolioHighlights: toArray(obj.portfolioHighlights),
      investmentThesis: obj.investmentThesis,
      sectors: toArray(obj.sectors),
      stages: toArray(obj.stages),
      checkSize: obj.checkSize,
      location: obj.location
    });
  }

  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Imported ${data.length} investors → ${outPath}`);
}

if (require.main === module) {
  main();
}
