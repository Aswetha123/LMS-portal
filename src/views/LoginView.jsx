import React, { useState, useEffect } from 'react';
import API from '../api';

export default function LoginView({ onLoginSuccess, onNavigate, showNotification, setLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiEnv, setApiEnv] = useState('live');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const savedEnv = localStorage.getItem('lms_api_env') || 'live';
    setApiEnv(savedEnv);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      let res;
      let role = 'user';
      if (email.toLowerCase() === 'admin@lms.com') {
        res = await API.adminLogin(email, password);
        role = 'admin';
      } else {
        res = await API.userLogin(email, password);
      }

      const token = typeof res === 'string' ? res : res.token;
      if (res && res.isFirstLogin) {
        onLoginSuccess({ email, role, token, isFirstLogin: true });
        onNavigate('change-password-force');
        showNotification('First-time login! Please set a new password.', 'warning');
      } else {
        onLoginSuccess({ email, role, token });
        onNavigate('student-dashboard');
        showNotification('Logged in successfully!', 'success');
      }
    } catch (err) {
      setLoginError(err.message);
      showNotification(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="view-login" className="section" style={{ display: 'block' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Log in to your SkillSphere account to resume your learning journey.</p>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="login-env-select" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                API Target Environment:
              </label>
              <select 
                id="login-env-select" 
                value={apiEnv} 
                onChange={(e) => {
                  const selected = e.target.value;
                  setApiEnv(selected);
                  localStorage.setItem('lms_api_env', selected);
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }}
                className="input-control"
                style={{ 
                  fontSize: '12px', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  border: '1px solid ' + (apiEnv === 'local' ? '#10b981' : '#7c3aed'),
                  backgroundColor: apiEnv === 'local' ? '#ecfdf5' : '#f5f3ff',
                  color: apiEnv === 'local' ? '#065f46' : '#5b21b6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'center',
                  width: 'auto'
                }}
              >
                <option value="live">🟢 Live Render Server (Live DB)</option>
                <option value="local">💻 Local Mock Server (Local DB)</option>
              </select>
            </div>
          </div>

          <form id="form-login" className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input 
                type="email" 
                id="login-email" 
                placeholder="name@domain.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input 
                type="password" 
                id="login-password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary auth-btn" style={{ width: '100%' }}>
              Login
            </button>
          </form>

          {/* Smart Troubleshooter warning box */}
          {loginError && loginError.includes('verify') && (
            <div style={{
              marginTop: '16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              padding: '12px',
              color: '#92400e',
              fontSize: '13px',
              textAlign: 'left',
              lineHeight: '1.5',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <i className="fa-solid fa-circle-exclamation"></i> Verification Troubleshooting:
              </strong>
              Your account (<strong style={{ fontFamily: 'monospace' }}>ashamainaswetha17@gmail.com</strong>) is already verified and active on the <strong>Local Mock Server</strong>, but not on the Live Server.
              <div style={{ marginTop: '8px' }}>
                <strong>👉 Solution:</strong> Change the <strong>API Target Environment</strong> dropdown selector above to <strong>Local Mock Server</strong>, then log in using password <strong style={{ color: '#b45309', fontFamily: 'monospace' }}>swetha</strong>.
              </div>
            </div>
          )}

          {/* Live API Tip Card */}
          {apiEnv === 'live' && (
            <div id="live-api-tip" style={{ marginTop: '20px', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '14px', fontSize: '12.5px', textAlign: 'left', lineHeight: '1.5', boxShadow: 'var(--shadow-sm)' }}>
              <strong style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <i className="fa-solid fa-lightbulb"></i> Live Testing Tip:
              </strong>
              To test directly using the live database, you can log in as the verified system administrator (which also has student privileges):
              <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(124,58,237,0.06)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid rgba(124,58,237,0.1)' }}>
                <strong>Email:</strong> admin@lms.com<br/>
                <strong>Password:</strong> adminpassword123
              </div>
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
            <p>Don't have an account? <a href="#" id="link-signup-redirect" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} style={{ color: 'var(--primary-purple)', fontWeight: 700 }}>Ask Administrator</a></p>
          </div>
        </div>
      </div>
    </section>
  );
}
