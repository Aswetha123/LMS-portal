import React, { useState, useEffect } from 'react';
import API from '../api';

export default function EventsView({ user, onNavigate, showNotification, setLoading: setGlobalLoading }) {
  const [allEvents, setAllEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const all = await API.userGetEvents();
      setAllEvents(all);
      
      if (user) {
        try {
          const my = await API.userGetMyEvents();
          setMyEvents(my);
        } catch (e) {
          console.warn("Could not load registered events:", e);
        }
      }
    } catch (err) {
      if (user) {
        showNotification('Failed to fetch events: ' + err.message, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  const handleRegisterEvent = async (eventId) => {
    if (!user) {
      onNavigate('login');
      return;
    }

    setLoading(true);
    try {
      await API.userRegisterEvent(eventId);
      showNotification('Registered for event successfully!', 'success');
      await loadEvents();
    } catch (err) {
      showNotification('Registration failed: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const myIds = new Set(myEvents.map(e => e._id));

  return (
    <section id="view-events" className="section" style={{ display: 'block' }}>
      <div className="container">
        <h1 className="section-title">Events Hub</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Participate in live coding contests, webinars, workshops, and career development seminars.
        </p>
        
        <div className="dashboard-grid">
          {/* Left Side: Available Public Events */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px' }}>
              <i className="fa-solid fa-globe"></i> Available Public Events
            </h3>
            
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Fetching events...</p>
            ) : allEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No public events available.
              </p>
            ) : (
              <div id="user-events-available-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allEvents.map(ev => {
                  const isRegistered = myIds.has(ev._id);
                  return (
                    <div 
                      key={ev._id} 
                      className="card" 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexDirection: 'row', 
                        padding: '16px 24px' 
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ marginBottom: '4px', fontSize: '15px' }}>{ev.name || ev.title || 'Untitled Event'}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', maxWidth: '500px' }}>
                          {ev.description || ''}
                        </p>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                          <span>
                            <i className="fa-solid fa-calendar"></i> Date: <strong>{ev.date ? ev.date.split('T')[0] : 'N/A'}</strong>
                          </span>
                          <span>
                            <i className="fa-solid fa-location-dot"></i> Location: <strong>{ev.location}</strong>
                          </span>
                        </div>
                      </div>
                      <div>
                        {!user ? (
                          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('login')}>
                            <i className="fa-solid fa-right-to-bracket"></i> Login to Register
                          </button>
                        ) : isRegistered ? (
                          <button className="btn btn-secondary btn-sm" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                            <i className="fa-solid fa-check" style={{ color: '#10b981' }}></i> Registered
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => handleRegisterEvent(ev._id)}>
                            <i className="fa-solid fa-ticket"></i> Register
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Right Side: Registered Events */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px' }}>
              <i className="fa-solid fa-ticket"></i> Registered Events
            </h3>
            
            <div id="user-events-registered-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!user ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  Please{' '}
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); onNavigate('login'); }} 
                    style={{ color: 'var(--primary-purple)', fontWeight: 700 }}
                  >
                    log in
                  </a>{' '}
                  to view your registered events.
                </p>
              ) : loading ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading registered events...</p>
              ) : myEvents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  You are not registered for any events.
                </p>
              ) : (
                myEvents.map(ev => (
                  <div 
                    key={ev._id} 
                    style={{ 
                      background: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      padding: '14px', 
                      borderRadius: 'var(--border-radius-md)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                        {ev.name || ev.title || 'Untitled Event'}
                      </h4>
                      <span className="badge badge-success" style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                        Registered
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#15803d', marginBottom: '8px' }}>{ev.description || ''}</p>
                    <div style={{ fontSize: '11px', color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
                      <span><i className="fa-solid fa-calendar"></i> {ev.date ? ev.date.split('T')[0] : 'N/A'}</span>
                      <span><i className="fa-solid fa-location-dot"></i> {ev.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
