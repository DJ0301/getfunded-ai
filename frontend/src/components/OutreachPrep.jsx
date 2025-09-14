import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Send, Edit2, Copy, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import './OutreachPrep.css';
import Toast from './Toast';

function OutreachPrep({ founderData, investors }) {
  const navigate = useNavigate();
  const [selectedInvestors, setSelectedInvestors] = useState([]);
  const [emailDrafts, setEmailDrafts] = useState({});
  const [tone, setTone] = useState('formal');
  const [styleKey, setStyleKey] = useState('straightforward_founder');
  const [presetsByEmail, setPresetsByEmail] = useState({}); // { email: [{key,subject,content,refined}] }
  const [selectedStyleByEmail, setSelectedStyleByEmail] = useState({}); // { email: key }
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingEmail, setEditingEmail] = useState(null);
  const [sentEmails, setSentEmails] = useState([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMsg(message);
    setToastType(type);
    setToastOpen(true);
  };

  useEffect(() => {
    // Select first 5 investors by default
    if (investors && investors.length > 0) {
      const withEmails = investors.filter(inv => !!inv.email);
      setSelectedInvestors(withEmails.slice(0, 5).map(inv => inv.email));
    }
  }, [investors]);

  const generateEmailDrafts = async () => {
    setLoading(true);
    const drafts = {};
    
    try {
      for (const investor of investors.filter(inv => !!inv.email && selectedInvestors.includes(inv.email))) {
        // Fetch presets (5 variants) refined by AI
        const response = await api.post('/email/presets', {
          investor,
          founderData,
          tone,
          calendlyLink: founderData?.calendlyLink
        });
        const variants = response.data?.data?.variants || response.data?.data?.variants || response.data?.variants || [];
        setPresetsByEmail(prev => ({ ...prev, [investor.email]: variants }));

        // Determine chosen style: respect per-investor selection, else global style, else random if surprise
        let chosenKey = selectedStyleByEmail[investor.email] || styleKey;
        if (chosenKey === 'surprise_me') {
          const idx = Math.floor(Math.random() * variants.length);
          drafts[investor.email] = variants[idx];
          setSelectedStyleByEmail(prev => ({ ...prev, [investor.email]: variants[idx]?.key }));
        } else {
          const found = variants.find(v => v.key === chosenKey) || variants[0];
          drafts[investor.email] = found;
          setSelectedStyleByEmail(prev => ({ ...prev, [investor.email]: found?.key }));
        }
      }
      setEmailDrafts(drafts);
    } catch (error) {
      console.error('Error generating email drafts:', error);
      showToast('Failed to generate email drafts. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestorToggle = (email) => {
    setSelectedInvestors(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleEditEmail = (email, content) => {
    setEmailDrafts(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        content
      }
    }));
    setEditingEmail(null);
  };

  const handleSendEmails = async () => {
    setSending(true);
    const emailsToSend = [];
    
    let skippedNoEmail = 0;
    for (const email of Object.keys(emailDrafts)) {
      if (!email) { skippedNoEmail++; continue; }
      if (selectedInvestors.includes(email) && !sentEmails.includes(email)) {
        const investor = investors.find(inv => inv.email === email);
        emailsToSend.push({
          to: email,
          subject: emailDrafts[email].subject,
          content: emailDrafts[email].content,
          investorId: investor.email,
        });
      }
    }

    try {
      const response = await api.post('/email/bulk-send', {
        emails: emailsToSend,
        founderEmail: founderData.founderEmail
      });
      
      const successfulEmails = response.data.data.results
        .filter(r => r.success)
        .map(r => r.investorId);
      
      setSentEmails(prev => [...prev, ...successfulEmails]);
      
      let msg = `Successfully sent ${successfulEmails.length} emails!`;
      if (skippedNoEmail > 0) msg += ` Skipped ${skippedNoEmail} with missing email.`;
      showToast(msg, 'success');
      
      if (successfulEmails.length > 0) {
        navigate('/pipeline');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      showToast('Failed to send emails. Please check your email configuration.', 'error');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Email copied to clipboard.', 'info');
  };

  if (!investors || investors.length === 0) {
    return (
      <div className="loading-container">
        <p>Please source investors first.</p>
        <button className="btn btn-primary" onClick={() => navigate('/sourcing')}>
          Go to Sourcing
        </button>
      </div>
    );
  }

  return (
    <div className="outreach-container">
      <motion.div 
        className="outreach-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-header">
          <h2 className="card-title">Prepare Investor Outreach</h2>
          <div className="tone-selector" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div>
              <label>Email Tone:</label>
              <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value)}
                className="form-select"
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="high-energy">High Energy</option>
              </select>
            </div>
            <div>
              <label>Style:</label>
              <select 
                value={styleKey} 
                onChange={(e) => setStyleKey(e.target.value)}
                className="form-select"
              >
                <option value="straightforward_founder">Straightforward & Founder-Focused</option>
                <option value="data_driven_impact">Data-Driven & Impact-Oriented</option>
                <option value="visionary_story">Visionary & Storytelling</option>
                <option value="short_direct">Short, Direct & No-Fluff</option>
                <option value="curiosity_hook">Curiosity-Driven / Hook</option>
                <option value="surprise_me">Surprise me</option>
              </select>
            </div>
          </div>
        </div>

        <div className="investor-selection">
          <h3>Select Investors to Contact</h3>
          <div className="investor-list">
            {investors.map((investor) => (
              <div key={investor.email} className="investor-item">
                <label className="investor-checkbox">
                  <input
                    type="checkbox"
                    checked={!!investor.email && selectedInvestors.includes(investor.email)}
                    onChange={() => handleInvestorToggle(investor.email)}
                    disabled={!investor.email}
                  />
                  <span className="investor-info">
                    <strong>{investor.name}</strong> - {investor.firm}
                    {!investor.email && (
                      <span className="chip" style={{ marginLeft: 8 }} title="No email available; cannot send">
                        Missing email
                      </span>
                    )}
                    {sentEmails.includes(investor.email) && (
                      <span className="sent-badge">
                        <CheckCircle size={16} /> Sent
                      </span>
                    )}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="action-section">
          <button 
            className="btn btn-primary"
            onClick={generateEmailDrafts}
            disabled={loading || selectedInvestors.length === 0}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <Mail size={20} />
                Generate Email Drafts
              </>
            )}
          </button>
        </div>

        {Object.keys(emailDrafts).length > 0 && (
          <div className="email-drafts">
            <h3>Email Previews</h3>
            {Object.entries(emailDrafts).map(([email, draft]) => {
              const investor = investors.find(inv => inv.email === email);
              if (!selectedInvestors.includes(email)) return null;
              
              return (
                <motion.div 
                  key={email}
                  className="email-draft-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="draft-header">
                    <div>
                      <h4>{investor.name} - {investor.firm}</h4>
                      <p className="draft-email">To: {email}</p>
                      <p className="draft-subject">Subject: {draft.subject}</p>
                      <div className="personalization-tokens" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 6 }}>
                        {investor.investmentThesis && (
                          <span className="chip"><strong>Thesis:</strong> {truncate(investor.investmentThesis, 80)}</span>
                        )}
                        {Array.isArray(investor.portfolioHighlights) && investor.portfolioHighlights[0] && (
                          <span className="chip"><strong>Notable:</strong> {investor.portfolioHighlights[0]}</span>
                        )}
                        {Array.isArray(investor.sectors) && investor.sectors[0] && (
                          <span className="chip"><strong>Sectors:</strong> {investor.sectors.slice(0,2).join(', ')}</span>
                        )}
                        {investor.location && (
                          <span className="chip"><strong>Geo:</strong> {investor.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="draft-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => copyToClipboard(draft.content)}
                        title="Copy to clipboard"
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => setEditingEmail(email)}
                        title="Edit email"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="per-investor-style" style={{ margin: '8px 0' }}>
                    <label>Style:</label>{' '}
                    <select
                      className="form-select"
                      value={selectedStyleByEmail[email] || styleKey}
                      onChange={(e) => {
                        const key = e.target.value;
                        setSelectedStyleByEmail(prev => ({ ...prev, [email]: key }));
                        const variants = presetsByEmail[email] || [];
                        if (key === 'surprise_me') {
                          const idx = Math.floor(Math.random() * variants.length);
                          setEmailDrafts(prev => ({ ...prev, [email]: variants[idx] || prev[email] }));
                        } else {
                          const found = variants.find(v => v.key === key);
                          if (found) setEmailDrafts(prev => ({ ...prev, [email]: found }));
                        }
                      }}
                    >
                      <option value="straightforward_founder">Straightforward & Founder-Focused</option>
                      <option value="data_driven_impact">Data-Driven & Impact-Oriented</option>
                      <option value="visionary_story">Visionary & Storytelling</option>
                      <option value="short_direct">Short, Direct & No-Fluff</option>
                      <option value="curiosity_hook">Curiosity-Driven / Hook</option>
                      <option value="surprise_me">Surprise me</option>
                    </select>
                  </div>
                  
                  {editingEmail === email ? (
                    <div className="draft-editor">
                      <textarea
                        className="form-textarea"
                        value={draft.content}
                        onChange={(e) => setEmailDrafts(prev => ({
                          ...prev,
                          [email]: { ...draft, content: e.target.value }
                        }))}
                        rows={10}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => setEditingEmail(null)}
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="draft-content">
                      <pre>{draft.content}</pre>
                    </div>
                  )}
                  
                  {sentEmails.includes(email) && (
                    <div className="sent-indicator">
                      <CheckCircle size={20} />
                      Email Sent Successfully
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        {Object.keys(emailDrafts).length > 0 && (
          <div className="send-section">
            <button 
              className="btn btn-success btn-large"
              onClick={handleSendEmails}
              disabled={sending || selectedInvestors.filter(e => !sentEmails.includes(e)).length === 0}
            >
              {sending ? (
                <>
                  <div className="spinner" />
                  Sending Emails...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send {selectedInvestors.filter(e => !sentEmails.includes(e)).length} Emails
                </>
              )}
            </button>
            <p className="send-note">
              Emails will be sent from: {founderData?.founderEmail}
            </p>
          </div>
        )}
      </motion.div>
      <Toast open={toastOpen} onClose={() => setToastOpen(false)} message={toastMsg} type={toastType} />
    </div>
  );
}

export default OutreachPrep;

// Helpers
function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
