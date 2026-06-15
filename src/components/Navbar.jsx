import React, { useState } from 'react';

export default function Navbar({ activeView, user, onNavigate, onLogout, theme, onThemeChange }) {
  const [menuActive, setMenuActive] = useState(false);

  const handleLinkClick = (e, targetView) => {
    e.preventDefault();
    setMenuActive(false);
    onNavigate(targetView);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#" className="navbar-logo" onClick={(e) => handleLinkClick(e, 'home')}>
          <span className="logo-icon">S</span>
          SkillSphere
        </a>

        <button 
          className="navbar-toggle" 
          onClick={() => setMenuActive(!menuActive)}
          aria-label="Toggle navigation"
        >
          <span className={`bar ${menuActive ? 'open' : ''}`}></span>
          <span className={`bar ${menuActive ? 'open' : ''}`}></span>
          <span className={`bar ${menuActive ? 'open' : ''}`}></span>
        </button>

        <ul className={`navbar-links ${menuActive ? 'active' : ''}`} id="navbar-menu">
          <li className="navbar-item">
            <a 
              href="#" 
              className={`navbar-link ${activeView === 'home' ? 'active' : ''}`} 
              onClick={(e) => handleLinkClick(e, 'home')}
            >
              Home
            </a>
          </li>
          <li className="navbar-item">
            <a 
              href="#" 
              className={`navbar-link ${['courses', 'course-details'].includes(activeView) ? 'active' : ''}`} 
              onClick={(e) => handleLinkClick(e, 'courses')}
            >
              Courses
            </a>
          </li>
          <li className="navbar-item">
            <a 
              href="#" 
              className={`navbar-link ${['events', 'event-details'].includes(activeView) ? 'active' : ''}`} 
              onClick={(e) => handleLinkClick(e, 'events')}
            >
              Events
            </a>
          </li>
          
          {/* Public Navigation Links */}
          {!user && (
            <>
              <li className="navbar-item">
                <a 
                  href="#" 
                  className={`navbar-link ${activeView === 'login' ? 'active' : ''}`} 
                  onClick={(e) => handleLinkClick(e, 'login')}
                >
                  Login
                </a>
              </li>
              <li className="navbar-item">
                <a 
                  href="#" 
                  className={`navbar-link navbar-signup-btn ${activeView === 'signup' ? 'active' : ''}`} 
                  onClick={(e) => handleLinkClick(e, 'signup')}
                >
                  Signup
                </a>
              </li>
            </>
          )}
          
          {/* Logged In Navigation Links */}
          {user && (
            <>
              <li className="navbar-item">
                <a 
                  href="#" 
                  className={`navbar-link ${activeView === 'student-dashboard' ? 'active' : ''}`} 
                  onClick={(e) => handleLinkClick(e, 'student-dashboard')}
                >
                  Dashboard
                </a>
              </li>
              <li className="navbar-item">
                <a 
                  href="#" 
                  className={`navbar-link ${activeView === 'certificates' ? 'active' : ''}`} 
                  onClick={(e) => handleLinkClick(e, 'certificates')}
                >
                  My Certificates
                </a>
              </li>
              <li className="navbar-item">
                <a 
                  href="#" 
                  className="navbar-link" 
                  onClick={(e) => { e.preventDefault(); setMenuActive(false); onLogout(); }}
                >
                  Logout
                </a>
              </li>
            </>
          )}
          
          {/* Theme Selector Dropdown */}
          <li className="navbar-item theme-selector-item">
            <div className="theme-switcher-dropdown">
              <button className="theme-toggle-btn" aria-label="Select Theme" type="button">
                {theme === 'light' && <i className="fa-solid fa-sun"></i>}
                {theme === 'dark' && <i className="fa-solid fa-moon"></i>}
                {theme === 'system' && <i className="fa-solid fa-circle-half-stroke"></i>}
                <span className="theme-btn-text">
                  {theme === 'light' && 'Light'}
                  {theme === 'dark' && 'Dark'}
                  {theme === 'system' && 'System'}
                </span>
              </button>
              <div className="theme-dropdown-menu">
                <button 
                  type="button"
                  className={`theme-dropdown-item ${theme === 'light' ? 'active' : ''}`} 
                  onClick={() => onThemeChange('light')}
                >
                  <i className="fa-solid fa-sun"></i> Light
                </button>
                <button 
                  type="button"
                  className={`theme-dropdown-item ${theme === 'dark' ? 'active' : ''}`} 
                  onClick={() => onThemeChange('dark')}
                >
                  <i className="fa-solid fa-moon"></i> Dark
                </button>
                <button 
                  type="button"
                  className={`theme-dropdown-item ${theme === 'system' ? 'active' : ''}`} 
                  onClick={() => onThemeChange('system')}
                >
                  <i className="fa-solid fa-circle-half-stroke"></i> System
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
}
