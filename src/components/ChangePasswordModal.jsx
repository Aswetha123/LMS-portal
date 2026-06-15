import React, { useState } from 'react';
import API from '../api';

export default function ChangePasswordModal({ visible, onClose, showNotification, setLoading }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match!', 'danger');
      return;
    }

    setLoading(true);
    try {
      await API.userChangePassword(newPassword);
      showNotification('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      showNotification(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-change-password-user" className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Change Account Password</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <form id="form-change-password-user" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user-new-password">New Password</label>
            <input 
              type="password" 
              id="user-new-password" 
              placeholder="Enter new password" 
              required 
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-confirm-password">Confirm Password</label>
            <input 
              type="password" 
              id="user-confirm-password" 
              placeholder="Re-enter password" 
              required 
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
}
