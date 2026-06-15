import React, { useState, useEffect } from 'react';
import API from '../api';

export default function DevPlaybook({ user, showNotification, setLoading, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('user-flow');
  const [apiEnv, setApiEnv] = useState('live');
  
  // Admin Create User inputs
  const [createName, setCreateName] = useState('Test Student');
  const [createEmail, setCreateEmail] = useState('student_test@example.com');
  const [createOutput, setCreateOutput] = useState('');
  
  // Verify User inputs
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyOutput, setVerifyOutput] = useState('');

  useEffect(() => {
    const savedEnv = localStorage.getItem('lms_api_env') || 'live';
    setApiEnv(savedEnv);
  }, []);

  const handleEnvChange = (e) => {
    const selected = e.target.value;
    setApiEnv(selected);
    localStorage.setItem('lms_api_env', selected);
    onLogout();
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleCreateUser = async () => {
    if (!user || user.role !== 'admin') {
      showNotification('Please log in as Admin (admin@lms.com) first!', 'warning');
      setCreateOutput('Error: You must be logged in as Admin to create a user.');
      return;
    }

    if (!createName || !createEmail) {
      showNotification('Name and email are required!', 'warning');
      return;
    }

    setLoading(true);
    setCreateOutput('Creating user...');
    try {
      const res = await API.adminCreateUser(createName, createEmail);
      showNotification('User created successfully!', 'success');
      
      const isHashed = res.password && res.password.startsWith('$2b$');
      const pwDisplay = isHashed 
        ? `Hashed PW (bcrypt): ${res.password.substring(0, 15)}... (Plaintext sent to email)`
        : `Temporary Password: <strong style="color:var(--primary-purple); font-size:13px;">${res.password}</strong>`;
        
      const isVerified = res.isVerified;
      const verifyDisplay = isVerified
        ? `Status: <span style="color:green; font-weight:700;">Verified (Active - No action needed!)</span>`
        : `Verification Token:\n<span style="font-size:11.5px; color:#555; word-break:break-all;">${res.verificationToken}</span>\n<p style="margin-top:6px; color:var(--text-muted); font-size:11px;">(Token is hashed on live database. On local mock server, users are immediately active!)</p>`;

      setCreateOutput(`<strong>Success!</strong>\nID: ${res._id}\nEmail: ${res.email}\n${pwDisplay}\n${verifyDisplay}`);
      setVerifyToken(res.verificationToken || '');
    } catch (err) {
      showNotification(err.message, 'danger');
      setCreateOutput(`<span style="color:red;">Error: ${err.message}</span>`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    if (!verifyToken) {
      showNotification('Verification token is required!', 'warning');
      return;
    }

    setLoading(true);
    setVerifyOutput('Verifying email...');
    try {
      await API.userVerifyEmail(verifyToken);
      showNotification('Email verified successfully!', 'success');
      setVerifyOutput('<span style="color:green; font-weight:700;">Success: Email verified successfully! You can now log in.</span>');
    } catch (err) {
      showNotification(err.message, 'danger');
      setVerifyOutput(`<span style="color:red;">Error: ${err.message}</span>`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button 
        id="btn-guide-trigger" 
        className="guide-trigger-btn"
        onClick={() => setIsOpen(true)}
      >
        <i className="fa-solid fa-circle-question"></i> dev playbook
      </button>

      {/* Slide-out Drawer */}
      <div id="guide-drawer" className={`guide-drawer ${isOpen ? 'open' : ''}`}>
        <div className="guide-header">
          <h3>🚀 Dev Testing Playbook</h3>
          <button 
            id="btn-guide-close" 
            className="guide-close"
            onClick={() => setIsOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="guide-body">
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            background: 'var(--secondary-purple)', 
            borderRadius: 'var(--border-radius-sm)', 
            border: '1px solid ' + 'var(--accent-purple-light)' 
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              color: 'var(--text-dark)', 
              display: 'block', 
              marginBottom: '6px' 
            }}>
              <i className="fa-solid fa-server"></i> API Target Environment:
            </span>
            <select 
              id="dev-api-env-select" 
              className="input-control" 
              style={{ fontSize: '12px', padding: '6px', width: '100%', boxSizing: 'border-box' }}
              value={apiEnv}
              onChange={handleEnvChange}
            >
              <option value="live">Live Render Server (https://brillon-tasks-1.onrender.com)</option>
              <option value="local">Local Mock Server (http://localhost:5000)</option>
            </select>
          </div>

          <div className="guide-tabs">
            <span 
              className={`guide-tab ${activeTab === 'user-flow' ? 'active' : ''}`}
              onClick={() => setActiveTab('user-flow')}
            >
              User Flow
            </span>
            <span 
              className={`guide-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Tools
            </span>
            <span 
              className={`guide-tab ${activeTab === 'api-spec' ? 'active' : ''}`}
              onClick={() => setActiveTab('api-spec')}
            >
              API Spec
            </span>
          </div>

          {/* Tab Content: User Flow */}
          {activeTab === 'user-flow' && (
            <div className="guide-tab-content">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Follow these steps to verify and test the user dashboard:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="guide-step-card">
                  <span className="guide-step-number">Step 1</span>
                  <span className="guide-step-title">Get Credentials</span>
                  <span className="guide-step-desc">
                    Log in using the live administrator credentials (which has full student permissions):
                  </span>
                  <div className="guide-code-box">admin@lms.com / adminpassword123</div>
                  <span className="guide-step-desc" style={{ marginTop: '8px' }}>
                    Or use the <strong>Admin Tools</strong> tab (on the Local Mock environment) to create a new student, retrieve the generated credentials, and log in instantly without email verification!
                  </span>
                </div>
                <div className="guide-step-card">
                  <span className="guide-step-number">Step 2</span>
                  <span className="guide-step-title">Browse Courses & Enroll</span>
                  <span className="guide-step-desc">
                    Go to the <strong>Courses</strong> tab on the Navbar, navigate through categories, select details, and click "Enroll Now" to join!
                  </span>
                </div>
                <div className="guide-step-card">
                  <span className="guide-step-number">Step 3</span>
                  <span className="guide-step-title">Watch Videos & Track Progress</span>
                  <span className="guide-step-desc">
                    On your student <strong>Dashboard</strong>, select resume to open the player. Watch tutorials and select "Mark Completed" on sub-modules to update progress.
                  </span>
                </div>
                <div className="guide-step-card">
                  <span className="guide-step-number">Step 4</span>
                  <span className="guide-step-title">Complete & Earn Certificate</span>
                  <span className="guide-step-desc">
                    Once progress hits 100%, click "Earn Certificate" in the Course Player header, then download it from the <strong>My Certificates</strong> tab.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Admin Tools */}
          {activeTab === 'admin' && (
            <div className="guide-tab-content">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Create and verify student accounts on the live server (requires admin login first):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="guide-step-card">
                  <span className="guide-step-title" style={{ marginBottom: '8px' }}>1. Create Student User</span>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Student Name" 
                    value={createName} 
                    onChange={(e) => setCreateName(e.target.value)}
                    style={{ fontSize: '12px', marginBottom: '6px', padding: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input 
                    type="email" 
                    className="input-control" 
                    placeholder="Student Email" 
                    value={createEmail} 
                    onChange={(e) => setCreateEmail(e.target.value)}
                    style={{ fontSize: '12px', marginBottom: '8px', padding: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleCreateUser} style={{ width: '100%' }}>
                    Create User
                  </button>
                  <div 
                    dangerouslySetInnerHTML={{ __html: createOutput }}
                    style={{ fontSize: '11px', marginTop: '8px', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--primary-purple)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}
                  ></div>
                </div>
                
                <div className="guide-step-card">
                  <span className="guide-step-title" style={{ marginBottom: '8px' }}>2. Verify Student Email</span>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Verification Token" 
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    style={{ fontSize: '12px', marginBottom: '8px', padding: '6px', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleVerifyUser} style={{ width: '100%' }}>
                    Verify Email
                  </button>
                  <div 
                    dangerouslySetInnerHTML={{ __html: verifyOutput }}
                    style={{ fontSize: '11px', marginTop: '8px', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--primary-purple)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: API Reference */}
          {activeTab === 'api-spec' && (
            <div className="guide-tab-content">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Live Render Backend API (brillon-tasks-1.onrender.com/api/v1):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div><strong>POST</strong> `/api/v1/user/login`</div>
                <div><strong>PUT</strong> `/api/v1/user/change-password`</div>
                <div><strong>GET</strong> `/api/v1/user/verify-email/:token`</div>
                <div><strong>POST</strong> `/api/v1/enrollments`</div>
                <div><strong>PUT</strong> `/api/v1/enrollments/:id/progress`</div>
                <div><strong>POST</strong> `/api/v1/certificates/generate`</div>
                <div><strong>GET</strong> `/api/v1/certificates/me`</div>
                <div><strong>GET</strong> `/api/v1/user/events`</div>
                <div><strong>POST</strong> `/api/v1/user/events/register/:eventId`</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
