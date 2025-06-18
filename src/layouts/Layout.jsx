import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Invoices', href: '/invoices', icon: 'invoices' },
    { name: 'Clients', href: '/clients', icon: 'clients' },
  ];

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getIcon = (iconName) => {
    const icons = {
      dashboard: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
      invoices: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      clients: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    };
    return icons[iconName] || icons.dashboard;
  };
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-row">
            <div className="header-left">
              <Link to="/dashboard" className="flex items-center">
                <h1 className="page-title">Invoice App</h1>
              </Link>
              {/* Navigation */}
              <nav className="nav-desktop">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link${isActivePath(item.href) ? ' active' : ''}`}
                  >
                    {getIcon(item.icon)}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="header-right">
              <div className="user-info">
                {currentUser?.photoURL && (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="user-avatar"
                  />
                )}
                <div className="user-welcome">
                  Welcome, <span className="user-name">
                    {currentUser?.displayName || currentUser?.email}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Navigation */}
        <div className="nav-mobile">
          <nav className="nav-mobile-inner">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link${isActivePath(item.href) ? ' active' : ''}`}
              >
                {getIcon(item.icon)}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
