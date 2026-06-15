import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* About Section */}
          <div className="footer-section">
            <h3 className="footer-title">About SkillSphere</h3>
            <p className="footer-text">
              SkillSphere is a beginner-friendly e-learning platform committed to making education accessible, engaging, and professional. Learn key modern skills online from anywhere, anytime.
            </p>
          </div>

          {/* Social Links Section */}
          <div className="footer-section">
            <h3 className="footer-title">Social Links</h3>
            <ul className="footer-links">
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-link">🔵 Facebook</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-link">🐦 Twitter (X)</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-link">💼 LinkedIn</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-link">📸 Instagram</a></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact">
              <li className="footer-contact-item">
                <span className="contact-icon">📧</span> support@skillsphere.com
              </li>
              <li className="footer-contact-item">
                <span className="contact-icon">📞</span> +1 (555) 019-2834
              </li>
              <li className="footer-contact-item">
                <span className="contact-icon">📍</span> 123 Learning Lane, EdTech City
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright divider */}
        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} SkillSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
