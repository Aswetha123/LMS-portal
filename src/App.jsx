import React, { useState, useEffect } from 'react';
import API from './api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DevPlaybook from './components/DevPlaybook';
import NotificationContainer from './components/NotificationContainer';
import GlobalLoader from './components/GlobalLoader';
import VerifyPendingBanner from './components/VerifyPendingBanner';
import ChangePasswordModal from './components/ChangePasswordModal';

// Views
import HomeView from './views/HomeView';
import CoursesView from './views/CoursesView';
import DashboardView from './views/DashboardView';
import PlayerView from './views/PlayerView';
import CertificatesView from './views/CertificatesView';
import EventsView from './views/EventsView';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import ForceChangePasswordView from './views/ForceChangePasswordView';

import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Active course selection trackers
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Modals state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Theme state & auto/system switcher
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lms_theme') || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = systemPrefersDark ? 'dark' : 'light';
      }
      
      if (activeTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();
    localStorage.setItem('lms_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Notification helper
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleLogout = () => {
    API.clearToken();
    setUser(null);
    setSelectedCourse(null);
    setSelectedEnrollment(null);
    setActiveView('home');
    showNotification('Logged out successfully', 'success');
  };

  // Clear session on fresh load (mirroring state.jsx vanilla behavior)
  useEffect(() => {
    API.clearToken();
    setUser(null);
    setActiveView('home');

    // Setup session expiration listeners from API handler
    const handleSessionExpired = () => {
      setUser(null);
      setActiveView('login');
      showNotification('Session expired. Please sign in again.', 'warning');
    };
    window.addEventListener('lms-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('lms-session-expired', handleSessionExpired);
    };
  }, []);

  return (
    <div id="app-root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Header Navigation Bar */}
      <Navbar 
        activeView={activeView} 
        user={user} 
        onNavigate={setActiveView} 
        onLogout={handleLogout} 
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Verification Pending Banner */}
      <VerifyPendingBanner visible={user && !user.isVerified} />

      {/* Main Content Area */}
      <main id="app-main" className="app-main" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header Dashboard Role details */}
        {['student-dashboard', 'course-player', 'certificates', 'courses', 'events'].includes(activeView) && user && (
          <header id="app-header" className="app-header" style={{ display: 'flex' }}>
            <h1 className="page-title" id="page-title">
              {activeView === 'student-dashboard' && 'My Student Dashboard'}
              {activeView === 'course-player' && 'Course Player'}
              {activeView === 'certificates' && 'My Certifications'}
              {activeView === 'courses' && 'Courses Catalog'}
              {activeView === 'events' && 'Events Hub'}
            </h1>
            <div className="header-actions">
              <span className="badge badge-primary" id="header-role-badge">
                Role: {user.role === 'admin' ? 'Admin' : 'User'}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setChangePasswordModalOpen(true)}
                title="Change Password"
              >
                <i className="fa-solid fa-key"></i> Pass
              </button>
            </div>
          </header>
        )}

        <div id="content-area" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {activeView === 'home' && (
            <HomeView 
              onNavigate={setActiveView} 
              setCategoryFilter={setCategoryFilter} 
            />
          )}

          {activeView === 'courses' && (
            <CoursesView 
              user={user}
              onNavigate={setActiveView}
              setSelectedCourse={setSelectedCourse}
              setSelectedEnrollment={setSelectedEnrollment}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              showNotification={showNotification}
              setLoading={setLoading}
            />
          )}

          {activeView === 'login' && (
            <LoginView 
              onLoginSuccess={setUser}
              onNavigate={setActiveView}
              showNotification={showNotification}
              setLoading={setLoading}
            />
          )}

          {activeView === 'signup' && (
            <SignupView onNavigate={setActiveView} />
          )}

          {activeView === 'change-password-force' && (
            <ForceChangePasswordView 
              onLogout={handleLogout}
              onNavigate={setActiveView}
              showNotification={showNotification}
              setLoading={setLoading}
            />
          )}

          {activeView === 'student-dashboard' && (
            <DashboardView 
              onNavigate={setActiveView}
              setSelectedCourse={setSelectedCourse}
              setSelectedEnrollment={setSelectedEnrollment}
              showNotification={showNotification}
              setLoading={setLoading}
            />
          )}

          {activeView === 'course-player' && (
            <PlayerView 
              selectedCourse={selectedCourse}
              selectedEnrollment={selectedEnrollment}
              onNavigate={setActiveView}
              showNotification={showNotification}
              setLoading={setLoading}
            />
          )}

          {activeView === 'certificates' && (
            <CertificatesView 
              user={user}
              showNotification={showNotification}
            />
          )}

          {activeView === 'events' && (
            <EventsView 
              user={user}
              onNavigate={setActiveView}
              showNotification={showNotification}
              setLoading={setLoading}
            />
          )}
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Change password modal popup */}
      <ChangePasswordModal 
        visible={changePasswordModalOpen} 
        onClose={() => setChangePasswordModalOpen(false)} 
        showNotification={showNotification}
        setLoading={setLoading}
      />

      {/* Toast notifications */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
      />

      {/* Global processing loader indicator */}
      <GlobalLoader visible={loading} />

      {/* Developer Playbook drawer panel */}
      <DevPlaybook 
        user={user} 
        showNotification={showNotification} 
        setLoading={setLoading} 
        onLogout={handleLogout} 
      />

    </div>
  );
}
