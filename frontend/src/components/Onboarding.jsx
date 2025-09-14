import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import api from '../utils/api';
import './Onboarding.css';

function Onboarding({ setFounderData }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [formData, setFormData] = useState({
    startupName: '',
    description: '',
    stage: '',
    tractionMetrics: '',
    fundraisingTarget: '',
    preferredInvestorType: '',
    founderName: '',
    founderEmail: '',
    calendlyLink: ''
  });
  const [capturedFields, setCapturedFields] = useState({});
  const fileInputRef = useRef(null);

  const questions = [
    {
      id: 'startupName',
      question: "Hi there! 👋 I'm your AI fundraising assistant. Let's get started by learning about your startup. What's your startup's name?",
      type: 'text',
      placeholder: 'Enter your startup name...'
    },
    {
      id: 'description',
      question: 'Now tell me about your startup. What problem are you solving and how?',
      type: 'textarea',
      placeholder: 'Describe what your startup does, your value proposition, and target market...'
    },
    {
      id: 'stage',
      question: 'What stage is your startup currently at?',
      type: 'select',
      options: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+']
    },
    {
      id: 'tractionMetrics',
      question: 'Excellent! Now, what are your key traction metrics? This helps investors understand your progress.',
      type: 'textarea',
      placeholder: 'E.g., $50K MRR, 1000+ customers, 30% MoM growth...'
    },
    {
      id: 'fundraisingTarget',
      question: 'How much funding are you looking to raise in this round?',
      type: 'text',
      placeholder: 'E.g., $500K - $1M'
    },
    {
      id: 'preferredInvestorType',
      question: 'What type of investors are you most interested in connecting with?',
      type: 'select',
      options: ['Angel Investors', 'Venture Capital', 'Corporate VCs', 'Accelerators', 'All of the above']
    },
    {
      id: 'founderName',
      question: "What is your name? We'll use it in emails (e.g., 'I'm Alex, founder of ...').",
      type: 'text',
      placeholder: 'Your full name'
    },
    {
      id: 'founderEmail',
      question: 'Perfect! What\'s the best email to reach you at?',
      type: 'email',
      placeholder: 'founder@startup.com'
    },
    {
      id: 'calendlyLink',
      question: 'Last question - do you have a Calendly or Cal.com link for scheduling meetings? (This is optional but recommended)',
      type: 'text',
      placeholder: 'https://calendly.com/yourname'
    }
  ];

  // Initialize with welcome message (guarded for React StrictMode)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setTimeout(() => {
      addAIMessage(questions[0].question);
    }, 500);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addAIMessage = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'ai', text, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay for realism
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: Date.now() }]);
  };

  const handleInputChange = (value) => {
    setCurrentInput(value);
  };

  const handleSelectOption = (option) => {
    setCurrentInput(option);
    handleSendMessage(option);
  };

  const extractInformationFromText = (text) => {
    const extracted = {};
    
    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(text);
      if (typeof jsonData === 'object') {
        // Map common JSON keys to our form fields
        const keyMappings = {
          'name': 'startupName',
          'startup_name': 'startupName',
          'company': 'startupName',
          'company_name': 'startupName',
          'description': 'description',
          'about': 'description',
          'overview': 'description',
          'stage': 'stage',
          'funding_stage': 'stage',
          'traction': 'tractionMetrics',
          'metrics': 'tractionMetrics',
          'traction_metrics': 'tractionMetrics',
          'revenue': 'tractionMetrics',
          'users': 'tractionMetrics',
          'funding': 'fundraisingTarget',
          'raise': 'fundraisingTarget',
          'fundraising_target': 'fundraisingTarget',
          'target': 'fundraisingTarget',
          'investor_type': 'preferredInvestorType',
          'investors': 'preferredInvestorType',
          'founder': 'founderName',
          'founder_name': 'founderName',
          'name_of_founder': 'founderName',
          'email': 'founderEmail',
          'founder_email': 'founderEmail',
          'contact': 'founderEmail',
          'calendly': 'calendlyLink',
          'calendar': 'calendlyLink',
          'scheduling': 'calendlyLink'
        };
        
        const assignIf = (field, val) => {
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            extracted[field] = String(val);
          }
        };

        // Flatten top-level keys
        Object.entries(jsonData).forEach(([key, value]) => {
          const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, '_');
          const mappedKey = keyMappings[normalizedKey] || keyMappings[key.toLowerCase()];

          if (mappedKey && value && typeof value !== 'object') {
            assignIf(mappedKey, value);
          }

      // Extract founder name (e.g., "I'm Alex", "I am Alex Kumar", "My name is Alex")
      if (!extracted.founderName) {
        const founderPatterns = [
          /\b(?:i'm|i am)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/,
          /\bmy\s+name\s+is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/i
        ];
        for (const p of founderPatterns) {
          const m = text.match(p);
          if (m && m[1]) { extracted.founderName = m[1].trim(); break; }
        }
      }

          // Handle nested known objects
          if (normalizedKey === 'company' && value && typeof value === 'object') {
            // Prefer company.name for startup
            if (value.name) assignIf('startupName', value.name);
            // Optionally capture description/industry as description fallback
            if (!extracted.description && (value.mission || value.overview)) {
              assignIf('description', value.mission || value.overview);
            }
          }

          if (normalizedKey === 'fundraising' && value && typeof value === 'object') {
            const ask = value.current_ask || value.ask || {};
            const amtUsd = ask.amount_usd || ask.usd || ask.amount || undefined;
            const amtInr = ask.amount_inr || ask.inr || undefined;
            if (amtUsd) assignIf('fundraisingTarget', `$${amtUsd}`);
            else if (amtInr) assignIf('fundraisingTarget', `${amtInr} INR`);
          }

          if (normalizedKey === 'financials' && value && typeof value === 'object') {
            const parts = [];
            // Prefer real traction metrics over model descriptions
            if (value.current_revenue_usd !== undefined && value.current_revenue_usd !== null) {
              const rev = Number(value.current_revenue_usd);
              if (!Number.isNaN(rev) && rev > 0) parts.push(`Revenue: $${rev.toLocaleString()}`);
            }
            if (value.mrr_usd !== undefined) {
              const mrr = Number(value.mrr_usd);
              if (!Number.isNaN(mrr) && mrr > 0) parts.push(`MRR: $${mrr.toLocaleString()}`);
            }
            if (value.arr_usd !== undefined) {
              const arr = Number(value.arr_usd);
              if (!Number.isNaN(arr) && arr > 0) parts.push(`ARR: $${arr.toLocaleString()}`);
            }
            if (value.users || value.maus || value.daus) {
              if (value.users) parts.push(`Users: ${value.users}`);
              if (value.maus) parts.push(`MAU: ${value.maus}`);
              if (value.daus) parts.push(`DAU: ${value.daus}`);
            }
            if (value.gmv_usd) parts.push(`GMV: $${value.gmv_usd}`);
            if (value.waitlist) parts.push(`Waitlist: ${value.waitlist}`);
            if (parts.length && !extracted.tractionMetrics) assignIf('tractionMetrics', parts.join(', '));
          }
        });
      }
    } catch (e) {
      // Not JSON, try to extract from natural language
      const lowerText = text.toLowerCase();
      
      // Extract startup name (look for patterns like "My startup is called X" or "X is my company")
      const namePatterns = [
        /(?:startup|company|business)\s+(?:is\s+)?(?:called|named)\s+([^.,\n]+)/i,
        /([^.,\n]+)\s+is\s+(?:my|our)\s+(?:startup|company|business)/i,
        /(?:we|i)\s+(?:are|am)\s+building\s+([^.,\n]+)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          extracted.startupName = match[1].trim();
          break;
        }
      }
      
      // Extract stage
      const stageKeywords = ['pre-seed', 'seed', 'series a', 'series b', 'series c'];
      for (const stage of stageKeywords) {
        if (lowerText.includes(stage)) {
          extracted.stage = stage.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          break;
        }
      }
      
      // Extract funding amount
      const fundingPatterns = [
        /(?:raising|raise|looking for|seeking|need)\s+(?:about\s+)?[\$]?([0-9]+(?:[.,][0-9]+)?[kmb]?)/i,
        /[\$]([0-9]+(?:[.,][0-9]+)?[kmb]?)\s+(?:round|funding|raise)/i
      ];
      
      for (const pattern of fundingPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          extracted.fundraisingTarget = '$' + match[1];
          break;
        }
      }
      
      // Extract email
      const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        extracted.founderEmail = emailMatch[1];
      }
      
      // Extract traction metrics (revenue/MRR/ARR, MAU/DAU/users, tx, GMV, waitlist)
      const metrics = [];
      const num = (s) => s?.replace(/[,\s]/g, '');
      const findAll = (regex) => {
        const arr = [];
        let m; const r = new RegExp(regex, 'gi');
        while ((m = r.exec(text)) !== null) arr.push(m);
        return arr;
      };

      // Revenue/MRR/ARR like: $100k revenue, $50k MRR, $1M ARR
      const revs = findAll(/\$\s*([0-9][0-9,\.]*?)\s*(revenue|mrr|arr)\b/);
      revs.forEach((m) => {
        const amount = num(m[1]);
        const label = m[2].toUpperCase();
        if (amount) metrics.push(`${label}: $${amount}`);
      });

      // Users/MAU/DAU
      const users = findAll(/\b([0-9][0-9,\.]*)\s*(users|user|maus?|daus?)\b/);
      users.forEach((m) => {
        const amount = num(m[1]);
        const label = m[2].toUpperCase();
        if (amount) metrics.push(`${label.replace(/S$/,'')}: ${amount}`);
      });

      // Transactions (tx/mo etc)
      const txs = findAll(/\b([0-9][0-9,\.]*)\s*(tx|transactions?)\b/);
      txs.forEach((m) => {
        const amount = num(m[1]);
        if (amount) metrics.push(`Tx: ${amount}`);
      });

      // GMV
      const gmvs = findAll(/\$\s*([0-9][0-9,\.]*)\s*(gmv)\b/);
      gmvs.forEach((m) => {
        const amount = num(m[1]);
        if (amount) metrics.push(`GMV: $${amount}`);
      });

      // Waitlist
      const waits = findAll(/\b([0-9][0-9,\.]*)\s*(wait\s?-?list|waitlist)\b/);
      waits.forEach((m) => {
        const amount = num(m[1]);
        if (amount) metrics.push(`Waitlist: ${amount}`);
      });

      if (metrics.length > 0) {
        extracted.tractionMetrics = metrics.join(', ');
      }
    }
    
    return extracted;
  };

  // Format value for detected chips (avoid [object Object])
  const formatValueForChip = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  };

  // Prefer extracted value for the current field; clean conversational prefixes
  const getValueForQuestion = (questionId, rawText, extractedInfo) => {
    const text = rawText.trim();
    // If extraction produced a specific field value, prefer it
    if (extractedInfo && extractedInfo[questionId]) {
      return extractedInfo[questionId].trim();
    }

    if (questionId === 'startupName') {
      // Remove common prefixes like greetings and phrases
      let cleaned = text
        .replace(/^hi[,!\s]*/i, '')
        .replace(/^hello[,!\s]*/i, '')
        .replace(/^(my|our)\s+(startup|company|business)('?s)?\s+(name\s+is|is\s+called|is\s+named)\s+/i, '')
        .replace(/^(it\s+is\s+|it's\s+)/i, '')
        .trim();
      // Stop at punctuation that likely ends the name
      cleaned = cleaned.split(/[.,\n]/)[0].trim();
      return cleaned || text;
    }

    return text;
  };

  const validateInput = (input, questionId) => {
    const trimmed = input.trim();
    
    switch (questionId) {
      case 'startupName':
        if (trimmed.length < 2) return "That seems quite short for a startup name. Could you provide the full name of your startup?";
        if (trimmed.toLowerCase() === 'hi' || trimmed.toLowerCase() === 'hello') return "I appreciate the greeting! But I'd love to know your actual startup name. What is it called?";
        break;
      case 'description':
        if (trimmed.length < 20) return "That's a great start! Could you tell me a bit more about what your startup does and what problem it solves?";
        break;
      case 'tractionMetrics':
        if (trimmed.length < 10) return "Could you share some specific numbers or metrics? For example, revenue, users, growth rate, or any other key metrics you're tracking?";
        break;
      case 'fundraisingTarget':
        if (!trimmed.match(/[\d$kmb]/i)) return "I'd love to know the specific amount you're looking to raise. Could you share a number or range?";
        break;
      case 'founderName':
        if (trimmed.length < 2) return "What's your name? We'll use it in the email greeting.";
        break;
      case 'founderEmail':
        if (!trimmed.includes('@') || !trimmed.includes('.')) return "That doesn't look like a valid email address. Could you double-check and provide your email?";
        break;
    }
    return null;
  };

  const findNextMissingQuestion = (currentFormData) => {
    const requiredFields = ['startupName', 'description', 'stage', 'tractionMetrics', 'fundraisingTarget', 'preferredInvestorType', 'founderName', 'founderEmail'];
    
    for (let i = 0; i < questions.length; i++) {
      const questionId = questions[i].id;
      if (requiredFields.includes(questionId) && !currentFormData[questionId]) {
        return i;
      }
    }
    return questions.length - 1; // Return last question (calendlyLink) if all required fields are filled
  };

  const handleSendMessage = async (messageText = currentInput) => {
    if (!messageText.trim() && questions[currentStep].id !== 'calendlyLink') return;

    const currentQuestionId = questions[currentStep].id;
    
    // Validate input for current question
    const validationError = validateInput(messageText, currentQuestionId);
    if (validationError) {
      addUserMessage(messageText);
      setCurrentInput('');
      setTimeout(() => {
        addAIMessage(validationError);
      }, 1000);
      return;
    }

    // Add user message
    addUserMessage(messageText);
    
    // Extract information from the message
    const extractedInfo = extractInformationFromText(messageText);

    // Update form data with current answer and any extracted information
    const valueForCurrent = getValueForQuestion(currentQuestionId, messageText, extractedInfo);
    const updatedFormData = {
      ...formData,
      [currentQuestionId]: valueForCurrent,
      ...extractedInfo
    };
    setFormData(updatedFormData);
    // Track captured fields for UI chips (merge cumulative)
    if (Object.keys(extractedInfo).length > 0) {
      setCapturedFields(prev => ({ ...prev, ...extractedInfo }));
    }
    setCurrentInput('');

    // Create acknowledgment message
    let acknowledgment = "";
    const extractedFields = Object.keys(extractedInfo);
    
    if (extractedFields.length > 1) {
      acknowledgment = "Excellent! I can see you've provided comprehensive information. ";
      const extractedFieldNames = extractedFields.map(field => {
        const fieldLabels = {
          startupName: 'startup name',
          description: 'description',
          stage: 'funding stage',
          tractionMetrics: 'traction metrics',
          fundraisingTarget: 'fundraising target',
          preferredInvestorType: 'investor preferences',
          founderName: 'founder name',
          founderEmail: 'email',
          calendlyLink: 'scheduling link'
        };
        return fieldLabels[field];
      }).filter(Boolean);
      
      if (extractedFieldNames.length > 0) {
        acknowledgment += `I've captured your ${extractedFieldNames.join(', ')}. `;
      }
    } else {
      const acknowledgments = {
        startupName: `Great! ${getValueForQuestion('startupName', messageText, extractedInfo)} sounds like an interesting startup. `,
        description: "Thanks for sharing that detailed description! ",
        stage: `Perfect! ${getValueForQuestion('stage', messageText, extractedInfo)} is an exciting stage. `,
        tractionMetrics: "Impressive metrics! That shows great progress. ",
        fundraisingTarget: `Got it! ${getValueForQuestion('fundraisingTarget', messageText, extractedInfo)} is a solid target. `,
        preferredInvestorType: `Excellent choice! ${getValueForQuestion('preferredInvestorType', messageText, extractedInfo)} can be very valuable partners. `,
        founderName: `Nice to meet you! I'll use ${getValueForQuestion('founderName', messageText, extractedInfo)} in your emails. `,
        founderEmail: "Perfect! I have your contact information. ",
        calendlyLink: messageText.trim() ? "Great! Having a scheduling link will make it easier for investors to book meetings with you. " : "No problem! You can always add a scheduling link later. "
      };
      acknowledgment = acknowledgments[currentQuestionId] || "Thank you for that information! ";
    }

    // Find next question that needs to be asked
    const nextQuestionIndex = findNextMissingQuestion(updatedFormData);
    
    // Check if we have all required information
    const requiredFields = ['startupName', 'description', 'stage', 'tractionMetrics', 'fundraisingTarget', 'preferredInvestorType', 'founderName', 'founderEmail'];
    const allRequiredFilled = requiredFields.every(field => updatedFormData[field]);
    
    if (allRequiredFilled) {
      setLoading(true);
      try {
        // Add final acknowledgment
        setTimeout(() => {
          addAIMessage(acknowledgment + "Perfect! I have all the information I need. Let me analyze your startup and create a personalized investor targeting strategy for you. This will just take a moment... ");
        }, 1000);

        const response = await api.post('/founder/input', updatedFormData);
        setFounderData(response.data.data);
        
        setTimeout(() => {
          navigate('/targeting');
        }, 4000);
      } catch (error) {
        console.error('Error submitting founder data:', error);
        addAIMessage("I'm sorry, there was an error processing your information. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (nextQuestionIndex > currentStep) {
      // Skip to the next missing question
      const skippedQuestions = nextQuestionIndex - currentStep - 1;
      if (skippedQuestions > 0) {
        acknowledgment += `Since you've provided some additional details, I can skip ahead. `;
      }
      
      setTimeout(() => {
        addAIMessage(acknowledgment + questions[nextQuestionIndex].question);
      }, 1500);
      setCurrentStep(nextQuestionIndex);
    } else {
      // Move to next question normally
      const nextStep = currentStep + 1;
      setTimeout(() => {
        addAIMessage(acknowledgment + questions[nextStep].question);
      }, 1500);
      setCurrentStep(nextStep);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && questions[currentStep].type !== 'textarea') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <div className="onboarding-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`message ${message.type}`}
              >
                <div className="message-avatar">
                  {message.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="message-bubble">
                  <p>{message.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="message ai"
            >
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-bubble">
                <div className="loading">
                  <div className="spinner"></div>
                  AI is typing...
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length > 0 && !loading && (
          <div className="input-section">
            {Object.keys(capturedFields).length > 0 && (
              <div className="detected-fields">
                <div className="detected-title">Detected from your last input:</div>
                <div className="detected-chips">
                  {Object.entries(capturedFields).map(([key, value]) => {
                    const labels = {
                      startupName: 'Startup',
                      description: 'Description',
                      stage: 'Stage',
                      tractionMetrics: 'Traction',
                      fundraisingTarget: 'Target',
                      preferredInvestorType: 'Investors',
                      founderName: 'Founder',
                      founderEmail: 'Email',
                      calendlyLink: 'Calendly'
                    };
                    const label = labels[key] || key;
                    const text = formatValueForChip(value);
                    const preview = text.length > 36 ? text.slice(0, 33) + '…' : text;
                    return (
                      <span key={key} className="chip" title={`${label}: ${text}`}>
                        <span className="chip-key">{label}:</span> {preview}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {currentQuestion.type === 'select' ? (
              <div className="input-group">
                <label className="input-label">Choose an option:</label>
                <div className="select-options">
                  {currentQuestion.options.map(option => (
                    <button
                      key={option}
                      className="btn btn-secondary"
                      onClick={() => handleSelectOption(option)}
                      style={{ margin: '0.25rem', padding: '0.75rem 1rem' }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="input-group">
                <div className="input-row">
                  {currentQuestion.type === 'textarea' ? (
                    <textarea
                      className="form-textarea"
                      placeholder={currentQuestion.placeholder}
                      value={currentInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <input
                      type={currentQuestion.type}
                      className="form-input"
                      placeholder={currentQuestion.placeholder}
                      value={currentInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      autoFocus
                    />
                  )}
                  <button
                    className="btn btn-primary send-button"
                    onClick={() => handleSendMessage()}
                    disabled={!currentInput.trim() && currentQuestion.id !== 'calendlyLink'}
                  >
                    <Send size={20} />
                  </button>
                  <button
                    className="btn btn-secondary upload-button"
                    type="button"
                    title="Upload JSON/CSV/TXT"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload
                  </button>
                  <input
                    type="file"
                    accept=".json,.csv,.txt,application/json,text/csv,text/plain"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      try {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const text = await f.text();
                        // If JSON, pretty print; otherwise use as-is
                        let payload = text;
                        try {
                          if (/json$/i.test(f.name)) {
                            const obj = JSON.parse(text);
                            payload = JSON.stringify(obj, null, 2);
                          }
                        } catch {}
                        handleInputChange(payload);
                        // Auto-send after a tick to let state update
                        setTimeout(() => handleSendMessage(), 50);
                      } catch (err) {
                        console.error('Upload parse error:', err);
                      } finally {
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                  />
                </div>
                <div className="input-tips" style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
                  Tip: Press Enter to send (Shift+Enter for a new line). You can paste your entire JSON/CSV/text here or click Upload to import a file.
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  </div>
);
}
export default Onboarding;
