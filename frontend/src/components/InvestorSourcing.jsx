import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Download, Users, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import './InvestorSourcing.css';

function InvestorSourcing({ founderData, investorStrategy, setInvestors, setSheetUrl }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sourced, setSourced] = useState(false);
  const [investorList, setInvestorList] = useState([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');

  useEffect(() => {
    if (investorStrategy && !sourced) {
      sourceInvestors();
    }
  }, [investorStrategy]);

  const sourceInvestors = async () => {
    setLoading(true);
    try {
      const response = await api.post('/investor/sourcing', {
        strategy: investorStrategy,
        founderData,
        source: 'static'
      });
      
      const { investors, sheetUrl } = response.data.data;
      setInvestorList(investors);
      setGoogleSheetUrl(sheetUrl);
      setInvestors(investors);
      setSheetUrl(sheetUrl);
      setSourced(true);
    } catch (error) {
      console.error('Error sourcing investors:', error);
      alert('Failed to source investors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setSourced(false);
    await sourceInvestors();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Sourcing relevant investors based on your strategy...</p>
        <p className="loading-subtitle">This may take a moment as we analyze investor profiles</p>
      </div>
    );
  }

  if (!investorStrategy) {
    return (
      <div className="loading-container">
        <p>Please complete investor targeting first.</p>
        <button className="btn btn-primary" onClick={() => navigate('/targeting')}>
          Go to Targeting
        </button>
      </div>
    );
  }

  return (
    <div className="sourcing-container">
      <motion.div 
        className="sourcing-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-header">
          <div>
            <h2 className="card-title">Investor Sourcing Results</h2>
            <p className="card-subtitle">Found {investorList.length} investors matching your criteria</p>
          </div>
          <button className="btn-icon" onClick={handleRefresh} title="Refresh investors">
            <RefreshCw size={20} />
          </button>
        </div>

        {googleSheetUrl && (
          <div className="sheet-link-container">
            <div className="sheet-link-card">
              <div className="sheet-icon">
                <ExternalLink size={24} />
              </div>
              <div className="sheet-info">
                <h3>Your Investor Database</h3>
                <p>All investors have been added to a Google Sheet for easy tracking</p>
                <a 
                  href={googleSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="sheet-url"
                >
                  {googleSheetUrl}
                </a>
              </div>
              <a 
                href={googleSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Open Sheet <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )}

        <div className="investors-preview">
          <h3>Top Investors Preview</h3>
          <div className="investor-grid">
            {investorList.slice(0, 6).map((investor, idx) => (
              <motion.div 
                key={idx}
                className="investor-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="investor-header">
                  <h4>{investor.name}</h4>
                  <span className="investor-role">{investor.role}</span>
                </div>
                <p className="investor-firm">{investor.firm}</p>
                
                <div className="investor-details">
                  <div className="detail-item">
                    <span className="detail-label">Focus:</span>
                    <span className="detail-value">
                      {Array.isArray(investor.sectors) ? investor.sectors.slice(0, 2).join(', ') : investor.sectors}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stage:</span>
                    <span className="detail-value">
                      {Array.isArray(investor.stages) ? investor.stages[0] : investor.stages}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check:</span>
                    <span className="detail-value">{investor.checkSize}</span>
                  </div>
                </div>

                <div className="investor-thesis">
                  <p>{investor.investmentThesis}</p>
                </div>

                {investor.linkedIn && (
                  <a 
                    href={investor.linkedIn.startsWith('http') ? investor.linkedIn : `https://${investor.linkedIn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-link"
                  >
                    View LinkedIn Profile
                  </a>
                )}
              </motion.div>
            ))}
          </div>
          
          {investorList.length > 6 && (
            <p className="more-investors">
              + {investorList.length - 6} more investors in your Google Sheet
            </p>
          )}
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/targeting')}
          >
            Adjust Strategy
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/outreach')}
          >
            Prepare Outreach <Users size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default InvestorSourcing;
