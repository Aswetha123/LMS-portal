import React, { useState } from 'react';
import API from '../api';

export default function ForceChangePasswordView({ onLogout, onNavigate, showNotification, setLoading }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match!', 'danger');
      return;
    }

    setLoading(true);
    try {
      await API.userChangePassword(newPassword);
      showNotification('Password changed successfully! Please log in with your new password.', 'success');
      onLogout();
      onNavigate('login');
    } catch (err) {
      showNotification(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="view-change-password-force" className="section" style={{ display: 'block' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="auth-card">
          <div className="auth-header">
            <h2 style={{ color: 'var(--primary-purple)' }}>Setup New Password</h2>
            <p>This is your first login. You must update your password before proceeding.</p>
          </div>
          
          <form id="form-force-password" className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="force-new-password">New Password</label>
              <input 
                type="password" 
                id="force-new-password" 
                placeholder="Min 6 characters" 
                required 
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="force-confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="force-confirm-password" 
                placeholder="Re-enter password" 
                required 
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Save & Proceed
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
