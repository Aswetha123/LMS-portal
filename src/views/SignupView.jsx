import React from 'react';

export default function SignupView({ onNavigate }) {
  return (
    <section id="view-signup" className="section" style={{ display: 'block' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="auth-card" style={{ maxWidth: '500px' }}>
          <div className="auth-header" style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-user-lock" style={{ fontSize: '3rem', color: 'var(--primary-purple)', marginBottom: '16px' }}></i>
            <h2>Account Registration</h2>
            <p style={{ marginTop: '8px' }}>Registration is managed strictly by the platform administrator.</p>
          </div>

          <div style={{ 
            backgroundColor: 'var(--secondary-purple)', 
            border: '1px solid var(--accent-purple-light)', 
            padding: '20px', 
            borderRadius: 'var(--border-radius-lg)', 
            margin: '24px 0', 
            fontSize: '14px', 
            color: 'var(--text-dark)', 
            lineHeight: '1.6' 
          }}>
            <strong>How to get access:</strong>
            <ol style={{ marginLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>The Learning Administrator will create your account credentials.</li>
              <li>You will receive an invite email containing a temporary password and a verification link.</li>
              <li>Paste the verification token into the verification portal to activate your account.</li>
            </ol>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('login')} style={{ width: '100%' }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
