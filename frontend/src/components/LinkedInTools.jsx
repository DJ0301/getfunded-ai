import React, { useMemo, useState } from 'react';
import { ExternalLink, Search, Link as LinkIcon } from 'lucide-react';
import './InvestorSourcing.css';

function buildLIQuery({ founderData, strategy }) {
  const tokens = [];
  if (strategy?.sectors?.length) tokens.push(strategy.sectors.slice(0, 2).join(' '));
  if (strategy?.stages?.length) tokens.push(strategy.stages[0]);
  if (founderData?.startupName) tokens.push(founderData.startupName);
  if (founderData?.description) tokens.push(founderData.description.split(/[,.]/)[0]);
  return encodeURIComponent(tokens.filter(Boolean).join(' '));
}

function LinkedInTools({ founderData, investors = [], investorStrategy }) {
  const [query, setQuery] = useState('');
  const defaultQuery = useMemo(() => buildLIQuery({ founderData, strategy: investorStrategy }), [founderData, investorStrategy]);
  const effectiveQuery = query.trim() || defaultQuery;

  const openLinkedInSearch = () => {
    const url = `https://www.linkedin.com/search/results/people/?keywords=${effectiveQuery}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openFirmSearch = (firm) => {
    const url = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(firm)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openPersonSearch = (name, firm) => {
    const q = encodeURIComponent(`${name || ''} ${firm || ''}`.trim());
    const url = `https://www.linkedin.com/search/results/people/?keywords=${q}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="targeting-container">
      <div className="targeting-card" style={{ padding: 24 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 className="card-title">LinkedIn Tools</h2>
        </div>

        <div className="strategy-sections">
          <div className="strategy-section">
            <h3>Quick Search</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                placeholder="Search people on LinkedIn (auto-filled from your profile)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={openLinkedInSearch}>
                <Search size={18} /> Search
              </button>
            </div>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              Using: {decodeURIComponent(effectiveQuery)}
            </p>
          </div>

          <div className="strategy-section">
            <h3>Your Investor List (Quick Actions)</h3>
            <div className="investor-list">
              {investors.map((inv) => (
                <div key={`${inv.email || inv.name}-${inv.firm}`} className="investor-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{inv.name}</strong> — {inv.firm}
                    {inv.location ? <span style={{ marginLeft: 8, color: '#6b7280' }}>({inv.location})</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {inv.linkedIn ? (
                      <a href={(inv.linkedIn.startsWith('http') ? '' : 'https://') + inv.linkedIn}
                         className="btn btn-secondary" target="_blank" rel="noreferrer">
                        <ExternalLink size={16} /> Profile
                      </a>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => openPersonSearch(inv.name, inv.firm)}>
                        <Search size={16} /> Find Person
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => openFirmSearch(inv.firm)}>
                      <LinkIcon size={16} /> Find Company
                    </button>
                  </div>
                </div>
              ))}
              {investors.length === 0 && (
                <p style={{ color: '#6b7280' }}>No investors yet. Go to Sourcing to add some.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LinkedInTools;
