import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Target, Users, Mail, TrendingUp, Rocket } from 'lucide-react';
import './Layout.css';

function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/targeting', icon: Target, label: 'Targeting' },
    { path: '/sourcing', icon: Users, label: 'Sourcing' },
    { path: '/outreach', icon: Mail, label: 'Outreach' },
    { path: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
    { path: '/dashboard', icon: Rocket, label: 'Dashboard' }
  ];

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <Rocket className="logo-icon" />
            <span>GetFunded.ai</span>
          </Link>
          <div className="nav-links">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
