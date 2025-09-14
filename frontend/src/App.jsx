import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import InvestorTargeting from './components/InvestorTargeting';
import InvestorSourcing from './components/InvestorSourcing';
import OutreachPrep from './components/OutreachPrep';
import Pipeline from './components/Pipeline';
import Layout from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import './App.css';
import './styles/glassmorphism.css';
import './styles/typography.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [founderData, setFounderData] = useState(null);
  const [investorStrategy, setInvestorStrategy] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [sheetUrl, setSheetUrl] = useState('');

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={
              founderData ? <Navigate to="/app/dashboard" /> : <LandingPage onGetStarted={() => window.location.href = '/onboarding'} />
            } />
            <Route path="/onboarding" element={
              <Onboarding setFounderData={setFounderData} />
            } />
            <Route path="/app" element={<Layout />}>
              <Route path="dashboard" element={
                <Dashboard 
                  founderData={founderData}
                  investorStrategy={investorStrategy}
                  investors={investors}
                  sheetUrl={sheetUrl}
                />
              } />
              <Route path="targeting" element={
                <InvestorTargeting 
                  founderData={founderData}
                  setInvestorStrategy={setInvestorStrategy}
                />
              } />
              <Route path="sourcing" element={
                <InvestorSourcing 
                  founderData={founderData}
                  investorStrategy={investorStrategy}
                  setInvestors={setInvestors}
                  setSheetUrl={setSheetUrl}
                />
              } />
              <Route path="outreach" element={
                <OutreachPrep 
                  founderData={founderData}
                  investors={investors}
                />
              } />
              <Route path="pipeline" element={
                <Pipeline 
                  founderData={founderData}
                  investors={investors}
                />
              } />
            </Route>
        </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
