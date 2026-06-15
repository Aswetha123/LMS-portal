import React from 'react';

export default function GlobalLoader({ visible }) {
  if (!visible) return null;
  
  return (
    <div 
      id="global-loader" 
      className="modal-overlay" 
      style={{ display: 'flex', background: 'rgba(31, 41, 55, 0.75)', zIndex: 9999 }}
    >
      <div style={{ textAlign: 'center', color: 'white' }}>
        <i 
          className="fa-solid fa-circle-notch fa-spin fa-3x" 
          style={{ color: 'var(--primary-purple)', marginBottom: '16px' }}
        ></i>
        <h3 style={{ fontFamily: 'var(--font-family)', fontWeight: 700, fontSize: '20px' }}>
          Processing Request...
        </h3>
        <p style={{ 
          fontSize: '13px', 
          color: 'var(--accent-purple-light)', 
          marginTop: '8px', 
          maxWidth: '320px', 
          marginLeft: 'auto', 
          marginRight: 'auto', 
          lineHeight: 1.5 
        }}>
          Connecting to the service. Please wait...
        </p>
      </div>
    </div>
  );
}
