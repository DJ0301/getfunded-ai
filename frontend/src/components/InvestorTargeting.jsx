import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import './InvestorTargeting.css';

function InvestorTargeting({ founderData, setInvestorStrategy }) {
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState('');
  const [showClarification, setShowClarification] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  React.useEffect(() => {
    if (founderData) {
      generateStrategy();
    }
  }, [founderData]);

  const generateStrategy = async (previousRejection = null) => {
    setLoading(true);
    try {
      console.log('[Targeting] founderData before request', founderData);
      const response = await api.post('/investor/strategy', {
        founderData,
        previousRejection,
        clarification: clarification || undefined
      });
      console.log('[Targeting] /investor/strategy response', response.data);
      setStrategy(response.data.data);
      setShowClarification(false);
      setClarification('');
    } catch (error) {
      console.error('[Targeting] Error generating strategy:', error);
      alert('Failed to generate investor strategy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    setInvestorStrategy(strategy);
    navigate('/sourcing');
  };

  const handleReject = () => {
    setShowClarification(true);
  };

  const handleRegenerateWithClarification = () => {
    if (clarification.trim()) {
      generateStrategy(strategy);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Generating your personalized investor strategy...</p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="loading-container">
        <p>No strategy generated yet.</p>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
          Start Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="targeting-container">
      <motion.div 
        className="targeting-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-header">
          <h2 className="card-title">Your Investor Targeting Strategy</h2>
          <button 
            className="btn-icon"
            onClick={() => generateStrategy()}
            title="Regenerate strategy"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            className="btn btn-secondary"
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowDebug((v) => !v)}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>

        <div className="strategy-sections">
          {showDebug && (
            <div className="strategy-section" style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <h3>Debug Data</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ founderData, strategy }, null, 2)}</pre>
            </div>
          )}
          <div className="strategy-section">
            <h3>Recommended Sectors</h3>
            <div className="tag-list">
              {strategy.sectors?.map((sector, idx) => (
                <span key={idx} className="tag">{sector}</span>
              ))}
            </div>
          </div>

          <div className="strategy-section">
            <h3>Geographic Focus</h3>
            <p>{strategy.geographicFocus || 'Global'}</p>
          </div>

          <div className="strategy-section">
            <h3>Investment Stages</h3>
            <div className="tag-list">
              {strategy.stages?.map((stage, idx) => (
                <span key={idx} className="tag">{stage}</span>
              ))}
            </div>
          </div>

          <div className="strategy-section">
            <h3>Investor Types</h3>
            <div className="tag-list">
              {strategy.investorTypes?.map((type, idx) => (
                <span key={idx} className="tag">{type}</span>
              ))}
            </div>
          </div>

          <div className="strategy-section">
            <h3>Check Size Range</h3>
            <p>{strategy.checkSizeRange || 'Varies by investor'}</p>
          </div>

          <div className="strategy-section">
            <h3>Key Value Propositions</h3>
            <ul className="value-props">
              {strategy.valuePropositions?.map((prop, idx) => (
                <li key={idx}>{prop}</li>
              ))}
            </ul>
          </div>
        </div>

        {showClarification && (
          <motion.div 
            className="clarification-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <h3>What would you like to change?</h3>
            <textarea
              className="form-textarea"
              placeholder="E.g., I want to focus more on B2B SaaS investors, or I prefer West Coast investors..."
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
              rows={4}
            />
            <button 
              className="btn btn-primary"
              onClick={handleRegenerateWithClarification}
              disabled={!clarification.trim()}
            >
              Regenerate Strategy
            </button>
          </motion.div>
        )}

        <div className="action-buttons">
          <button 
            className="btn btn-danger"
            onClick={handleReject}
          >
            <X size={20} />
            Reject & Refine
          </button>
          <button 
            className="btn btn-success"
            onClick={handleAccept}
          >
            <Check size={20} />
            Accept & Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default InvestorTargeting;
