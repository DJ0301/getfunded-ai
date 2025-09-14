import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Rocket, Target, Users, Mail, TrendingUp, 
  ExternalLink, CheckCircle, ArrowRight 
} from 'lucide-react';
import './Dashboard.css';

function Dashboard({ founderData, investorStrategy, investors, sheetUrl }) {
  const navigate = useNavigate();

  const steps = [
    {
      id: 'onboarding',
      title: 'Founder Information',
      description: 'Tell us about your startup',
      icon: Rocket,
      completed: !!founderData,
      route: '/onboarding'
    },
    {
      id: 'targeting',
      title: 'Investor Targeting',
      description: 'Define your ideal investor profile',
      icon: Target,
      completed: !!investorStrategy,
      route: '/targeting'
    },
    {
      id: 'sourcing',
      title: 'Investor Sourcing',
      description: 'Find matching investors',
      icon: Users,
      completed: investors && investors.length > 0,
      route: '/sourcing'
    },
    {
      id: 'outreach',
      title: 'Email Outreach',
      description: 'Personalized email campaigns',
      icon: Mail,
      completed: false,
      route: '/outreach'
    },
    {
      id: 'pipeline',
      title: 'Pipeline Management',
      description: 'Track your progress',
      icon: TrendingUp,
      completed: false,
      route: '/pipeline'
    }
  ];

  return (
    <div className="dashboard-container">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="dashboard-title">
          Welcome to GetFunded.ai
        </h1>
        <p className="dashboard-subtitle">
          {founderData ? 
            `Let's get ${founderData.startupName} funded!` : 
            'Your automated fundraising journey starts here'
          }
        </p>
      </motion.div>

      {founderData && (
        <motion.div 
          className="startup-info-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="startup-header">
            <h2>{founderData.startupName}</h2>
            <span className={`stage-badge stage-${founderData.stage?.toLowerCase().replace(/\s+/g, '-')}`}>
              {founderData.stage}
            </span>
          </div>
          <p className="startup-description">{founderData.description}</p>
          <div className="startup-metrics">
            <div className="metric">
              <span className="metric-label">Target Raise:</span>
              <span className="metric-value">{founderData.fundraisingTarget}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Investor Type:</span>
              <span className="metric-value">{founderData.preferredInvestorType}</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="progress-section">
        <h2 className="section-title">Your Fundraising Journey</h2>
        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                className={`step-card ${step.completed ? 'completed' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(step.route)}
              >
                <div className="step-icon">
                  <Icon size={24} />
                  {step.completed && (
                    <CheckCircle className="check-icon" size={16} />
                  )}
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <ArrowRight className="step-arrow" size={20} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {sheetUrl && (
        <motion.div 
          className="quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <a 
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-card"
            >
              <ExternalLink size={20} />
              <span>Open Investor Sheet</span>
            </a>
            <button 
              className="action-card"
              onClick={() => navigate('/outreach')}
            >
              <Mail size={20} />
              <span>Send Emails</span>
            </button>
            <button 
              className="action-card"
              onClick={() => navigate('/pipeline')}
            >
              <TrendingUp size={20} />
              <span>View Pipeline</span>
            </button>
          </div>
        </motion.div>
      )}

      {investors && investors.length > 0 && (
        <motion.div 
          className="stats-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="section-title">Overview</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{investors.length}</span>
              <span className="stat-label">Investors Sourced</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Emails Sent</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Responses</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">0</span>
              <span className="stat-label">Meetings Booked</span>
            </div>
          </div>
        </motion.div>
      )}

      {!founderData && (
        <motion.div 
          className="cta-section"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Ready to raise funding on autopilot?</h2>
          <p>Complete a quick onboarding to get started with AI-powered investor outreach</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/onboarding')}
          >
            Get Started <Rocket size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;
