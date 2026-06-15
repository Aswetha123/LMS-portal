import React, { useState, useEffect } from 'react';
import API from '../api';

function getValId(field) {
  if (!field) return null;
  return typeof field === 'object' ? field._id : field;
}

export default function DashboardView({ 
  onNavigate, 
  setSelectedCourse, 
  setSelectedEnrollment, 
  showNotification, 
  setLoading 
}) {
  const [metrics, setMetrics] = useState({ enrolled: 0, completed: 0, events: 0 });
  const [enrolledTracks, setEnrolledTracks] = useState([]);
  const [events, setEvents] = useState([]);
  const [latestCert, setLatestCert] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [enrollments, evs, allTracks, allCourses] = await Promise.all([
          API.getMyEnrollments(),
          API.userGetMyEvents(),
          API.getTracks().catch(() => []),
          API.getCourses().catch(() => [])
        ]);

        // De-duplicate enrollments by track
        const deDuplicatedEnrollments = [];
        const trackGroups = {};

        enrollments.forEach(en => {
          const cid = getValId(en.courseId);
          const course = allCourses.find(c => c._id === cid);
          if (!course) return;

          const tid = getValId(course.trackId);
          const track = allTracks.find(t => t._id === tid);
          const trackName = track ? track.name : 'Course';

          if (!trackGroups[tid]) {
            trackGroups[tid] = {
              trackId: tid,
              trackName: trackName,
              courseName: `${trackName} Complete Course`,
              instructor: course.instructor || 'Staff',
              enrollments: [],
              courses: []
            };
          }
          trackGroups[tid].enrollments.push(en);
          
          if (!trackGroups[tid].courses.some(c => c._id === course._id)) {
            trackGroups[tid].courses.push(course);
          }
        });

        Object.keys(trackGroups).forEach(tid => {
          const group = trackGroups[tid];
          const avgProgress = Math.round(group.enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / group.enrollments.length);
          deDuplicatedEnrollments.push({
            _id: 'virtual-enroll-' + tid,
            trackId: tid,
            courseName: group.courseName,
            instructor: group.instructor,
            progress: avgProgress,
            isComplete: avgProgress === 100,
            courses: group.courses,
            enrollments: group.enrollments,
            trackName: group.trackName
          });
        });

        setEnrolledTracks(deDuplicatedEnrollments);
        setEvents(evs);

        // Update metrics
        setMetrics({
          enrolled: deDuplicatedEnrollments.length,
          completed: deDuplicatedEnrollments.filter(e => e.isComplete).length,
          events: evs.length
        });

        // Load latest certificate
        try {
          const certs = await API.getMyCertificates();
          if (certs.length > 0) {
            setLatestCert(certs[certs.length - 1]);
          }
        } catch (e) {
          console.error('Certificates loading failed:', e);
        }

      } catch (err) {
        showNotification('Error loading dashboard: ' + err.message, 'danger');
      } finally {
        setLoadingDashboard(false);
      }
    }
    loadDashboardData();
  }, [showNotification]);

  const handlePlayCourse = (track) => {
    setSelectedCourse({ _id: 'virtual-' + track.trackId, name: track.trackName, isVirtual: true, courses: track.courses });
    setSelectedEnrollment({ _id: 'virtual-enroll-' + track.trackId, isVirtual: true, enrollments: track.enrollments });
    onNavigate('course-player');
  };

  return (
    <div>
      {/* Metrics Widgets */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><i className="fa-solid fa-graduation-cap"></i></div>
          <div className="metric-info">
            <span className="metric-value">{metrics.enrolled}</span>
            <span className="metric-label">Enrolled Courses</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#10b981', backgroundColor: '#ecfdf5' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.completed}</span>
            <span className="metric-label">Completed Courses</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: '#f59e0b', backgroundColor: '#fffbeb' }}>
            <i className="fa-solid fa-calendar-days"></i>
          </div>
          <div className="metric-info">
            <span className="metric-value">{metrics.events}</span>
            <span className="metric-label">Registered Events</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tables */}
      <div className="dashboard-grid">
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <i className="fa-solid fa-play" style={{ color: 'var(--primary-purple)', marginRight: '8px' }}></i> 
            My Enrolled Courses
          </h3>
          
          {loadingDashboard ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--primary-purple)' }}></i>
            </div>
          ) : enrolledTracks.length === 0 ? (
            <div id="user-enrollment-list">
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dimmed)' }}>
                You haven't enrolled in any courses yet.{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('courses'); }} style={{ color: 'var(--primary-purple)', fontWeight: 'bold' }}>
                  Browse library
                </a>
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Instructor</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledTracks.map(en => (
                    <tr key={en._id}>
                      <td style={{ fontWeight: 600 }}>{en.courseName}</td>
                      <td>{en.instructor}</td>
                      <td>
                        <div className="progress-section" style={{ margin: 0, width: '140px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-track" style={{ flexGrow: 1 }}>
                            <div className="progress-bar" style={{ width: `${en.progress}%` }}></div>
                          </div>
                          <span className="progress-percentage">{en.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${en.isComplete ? 'success' : 'primary'}`} style={{ color: 'white', backgroundColor: en.isComplete ? '#10b981' : '#7c3aed', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {en.isComplete ? 'Completed' : 'Learning'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handlePlayCourse(en)}>
                          <i className="fa-solid fa-play"></i> {en.isComplete ? 'Review' : 'Resume'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-bullhorn" style={{ color: 'var(--primary-purple)', marginRight: '8px' }}></i> 
              Upcoming Events
            </h3>
            <div id="user-dash-events-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingDashboard ? (
                <div>Loading events...</div>
              ) : events.length === 0 ? (
                <p style={{ color: 'var(--text-dimmed)', fontSize: '13px' }}>No upcoming registered events.</p>
              ) : (
                events.slice(0, 3).map(ev => (
                  <div key={ev._id} style={{ background: 'rgba(124,58,237,0.03)', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-gray)' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{ev.name || ev.title || 'Untitled Event'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span><i className="fa-solid fa-clock"></i> {ev.date ? ev.date.split('T')[0] : 'TBD'}</span>
                      <span><i className="fa-solid fa-location-dot"></i> {ev.location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-gray)', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-award" style={{ color: 'var(--primary-purple)', marginRight: '8px' }}></i> 
              Latest Certificate
            </h3>
            <div id="user-dash-cert-display">
              {latestCert ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--primary-purple)' }}>
                    <i className="fa-solid fa-certificate"></i> {latestCert.courseId?.name || 'Course Certificate'}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onNavigate('certificates')} style={{ width: '100%' }}>
                    View All Certificates
                  </button>
                </div>
              ) : (
                <p style={{ color: 'var(--text-dimmed)', fontSize: '13px' }}>Finish courses at 100% to generate certificates.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
