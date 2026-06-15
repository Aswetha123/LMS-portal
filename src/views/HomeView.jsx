import React, { useState, useEffect } from 'react';
import API from '../api';

function classifyDepartment(dept) {
  if (!dept) return 'non-technical';
  const name = (dept.name || '').toLowerCase();
  const desc = (dept.description || '').toLowerCase();
  
  const nonTechKeywords = ['non-technical', 'non technical', 'nontech', 'non-tech', 'creative', 'soft skills', 'management', 'business'];
  if (nonTechKeywords.some(keyword => name.includes(keyword) || desc.includes(keyword))) {
    return 'non-technical';
  }

  const techKeywords = [
    'engineering', 'technical', 'tech', 'developer', 'code', 
    'programming', 'software', 'backend', 'frontend', 
    'full stack', 'fullstack', 'data', 'science', 'math', 
    'algorithms', 'computers'
  ];
  const isTech = techKeywords.some(keyword => name.includes(keyword) || desc.includes(keyword));
  return isTech ? 'technical' : 'non-technical';
}

export default function HomeView({ onNavigate, setCategoryFilter }) {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, depts, evs] = await Promise.all([
          API.getCategories().catch(() => []),
          API.getDepartments().catch(() => []),
          API.userGetEvents().catch(() => [])
        ]);

        // Group/filter categories based on classified departments
        const deptMap = {};
        depts.forEach(d => {
          deptMap[d._id] = classifyDepartment(d);
        });

        const classifiedCats = cats.map(c => {
          const deptId = typeof c.departmentId === 'object' ? c.departmentId._id : c.departmentId;
          return {
            ...c,
            group: deptMap[deptId] || 'non-technical'
          };
        });

        setCategories(classifiedCats.slice(0, 4));
        setEvents(evs.slice(0, 4));
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCategoryClick = (group) => {
    setCategoryFilter(group);
    onNavigate('courses');
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-heading">Learn New <span>Skills Online</span></h1>
            <p className="hero-description">
              Unlock your true learning potential with SkillSphere. Join our platform, study at your own pace, and acquire industry-ready technical certifications under expert guidance.
            </p>
            <button className="btn btn-primary hero-btn" onClick={() => onNavigate('courses')}>
              Explore Courses
            </button>
          </div>
          <div className="hero-image-wrapper">
            <div style={{ 
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', 
              width: '100%', 
              aspectRatio: 1.5, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              padding: '24px', 
              position: 'relative' 
            }}>
              <i className="fa-solid fa-laptop-code" style={{ fontSize: '6rem', textShadow: '0 4px 20px rgba(0,0,0,0.25)' }}></i>
              <h3 style={{ marginTop: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>SkillSphere Platform</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', marginTop: '8px' }}>Interactive Courses & Certifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories Preview */}
      <div className="section gray-section">
        <div className="container">
          <h2 className="section-title">Featured Categories</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary-purple)' }}></i>
            </div>
          ) : (
            <div className="grid grid-4" id="home-categories-grid">
              {categories.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No categories found.
                </div>
              ) : (
                categories.map(cat => {
                  const hash = (cat.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const gradients = [
                    'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                    'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  ];
                  const selectedGradient = gradients[hash % gradients.length];
                  
                  return (
                    <div 
                      key={cat._id} 
                      className="category-card-preview" 
                      onClick={() => handleCategoryClick(cat.group)}
                      style={{ cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div className="card-img" style={{ background: selectedGradient, height: '120px', display: 'flex', alignItems: 'center', justify: 'center', color: 'white', fontSize: '2.5rem' }}>
                        <i className="fa-solid fa-tag"></i>
                      </div>
                      <div className="card-content" style={{ padding: '20px' }}>
                        <div className="hierarchy-card-type" style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', color: 'var(--primary-purple)', fontWeight: 'bold' }}>
                          {cat.group === 'technical' ? 'Technical' : 'Non-Technical'}
                        </div>
                        <h3 className="card-title" style={{ fontSize: '1.1rem', margin: '6px 0' }}>{cat.name}</h3>
                        <p className="card-desc" style={{ fontSize: '12px', height: '36px', overflow: 'hidden' }}>{cat.description || 'Explore courses in this division.'}</p>
                        <span className="category-preview-link">Browse Library &rarr;</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
          <div className="preview-view-all">
            <button className="btn btn-primary" onClick={() => onNavigate('courses')}>
              View All Categories
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events Preview */}
      <div className="section">
        <div className="container">
          <h2 className="section-title">Upcoming Events</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary-purple)' }}></i>
            </div>
          ) : (
            <div className="grid grid-4" id="home-events-grid">
              {events.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No upcoming events scheduled.
                </div>
              ) : (
                events.map(ev => (
                  <div key={ev._id} className="card" style={{ textAlign: 'left' }}>
                    <div className="card-img" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', height: '120px', display: 'flex', alignItems: 'center', justify: 'center', color: 'white', fontSize: '2.5rem' }}>
                      <i className="fa-solid fa-calendar-check"></i>
                    </div>
                    <div className="card-content" style={{ padding: '20px' }}>
                      <div className="event-date">
                        <span className="date-icon">📅</span> {ev.date ? ev.date.split('T')[0] : 'Date TBD'}
                      </div>
                      <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{ev.name || ev.title || 'Untitled Event'}</h3>
                      <p className="card-desc" style={{ fontSize: '12px', height: '36px', overflow: 'hidden' }}>{ev.description || 'Join our expert-led sessions.'}</p>
                      <button className="btn btn-outline btn-sm card-btn" onClick={() => onNavigate('events')} style={{ marginTop: '12px' }}>
                        Learn More
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
