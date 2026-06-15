import React, { useState, useEffect } from 'react';
import API from '../api';

function getValId(field) {
  if (!field) return null;
  return typeof field === 'object' ? field._id : field;
}

export default function PlayerView({ 
  selectedCourse, 
  selectedEnrollment, 
  onNavigate, 
  showNotification, 
  setLoading 
}) {
  const [modules, setModules] = useState([]);
  const [openModules, setOpenModules] = useState({});
  const [openSubModules, setOpenSubModules] = useState({});
  const [finalAssignments, setFinalAssignments] = useState([]);
  const [progress, setProgress] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  
  // Right detail panel states
  const [activeItem, setActiveItem] = useState(null); // video or assignment
  const [activeItemType, setActiveItemType] = useState(''); // 'video' or 'assignment'
  const [activeSubModule, setActiveSubModule] = useState(null); // parent submodule
  const [itemCompleted, setItemCompleted] = useState(false);
  const [submissionText, setSubmissionText] = useState('');

  // Course specifications
  const courseId = selectedCourse ? selectedCourse._id : null;
  const isVirtual = selectedCourse ? selectedCourse.isVirtual : false;
  const courseTitle = selectedCourse ? selectedCourse.name : 'Course';

  const loadPlayerData = async () => {
    if (!selectedCourse) return;
    
    try {
      let activeEnrollments = [];
      let coursesList = [];

      const allEnrolls = await API.getMyEnrollments();
      if (isVirtual) {
        coursesList = selectedCourse.courses || [];
        const courseIds = coursesList.map(c => c._id);
        activeEnrollments = allEnrolls.filter(e => courseIds.includes(getValId(e.courseId)));
      } else {
        coursesList = [selectedCourse];
        activeEnrollments = allEnrolls.filter(e => getValId(e.courseId) === courseId);
      }

      setEnrollments(activeEnrollments);

      if (activeEnrollments.length > 0) {
        const avgProgress = Math.round(activeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / activeEnrollments.length);
        setProgress(avgProgress);
      }

      // Compile modules & final assignments
      const compiledModules = [];
      const compiledFinalAssignments = [];
      for (const c of coursesList) {
        const enroll = activeEnrollments.find(e => getValId(e.courseId) === c._id) || { progress: 0, completedSubModules: [] };
        const [mods, finalAssigns] = await Promise.all([
          API.getModules(c._id).catch(() => []),
          API.getFinalAssignments(c._id).catch(() => [])
        ]);
        
        for (const m of mods) {
          const [submodules, assignments] = await Promise.all([
            API.getSubModules(m._id).catch(() => []),
            API.getAssignments(m._id).catch(() => [])
          ]);

          const detailedSubmodules = await Promise.all(submodules.map(async (sm) => {
            const videos = await API.getVideos(sm._id).catch(() => []);
            const isCompleted = enroll.completedSubModules && enroll.completedSubModules.includes(sm._id);
            return {
              ...sm,
              videos,
              isCompleted
            };
          }));

          const detailedAssignments = assignments.map(a => {
            const isCompleted = enroll.completedSubModules && enroll.completedSubModules.includes(a._id);
            return {
              ...a,
              isCompleted
            };
          });

          compiledModules.push({
            ...m,
            enrollId: enroll._id,
            submodules: detailedSubmodules,
            assignments: detailedAssignments
          });
        }
        
        const detailedFinalAssigns = finalAssigns.map(fa => {
          const isCompleted = enroll.completedSubModules && enroll.completedSubModules.includes(fa._id);
          return {
            ...fa,
            enrollId: enroll._id,
            isCompleted
          };
        });
        compiledFinalAssignments.push(...detailedFinalAssigns);
      }

      compiledModules.sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(compiledModules);
      setFinalAssignments(compiledFinalAssignments);

      // Auto-open modules
      const initialOpen = {};
      compiledModules.forEach(m => {
        initialOpen[m._id] = true;
      });
      setOpenModules(initialOpen);
      
      // Auto-open submodules
      const initialSubOpen = {};
      compiledModules.forEach(m => {
        m.submodules.forEach(sm => {
          initialSubOpen[sm._id] = true;
        });
      });
      setOpenSubModules(initialSubOpen);

    } catch (err) {
      showNotification('Error loading player modules: ' + err.message, 'danger');
    }
  };

  useEffect(() => {
    loadPlayerData();
  }, [selectedCourse, selectedEnrollment]);

  const handleCancelEnrollment = async () => {
    if (!window.confirm("Are you sure you want to cancel this course enrollment? Your progress will be lost.")) {
      return;
    }

    setLoading(true);
    try {
      // Cancel all enrollments
      await Promise.all(enrollments.map(e => API.cancelEnrollment(e._id).catch(() => {})));
      showNotification('Enrollment cancelled.', 'info');
      onNavigate('student-dashboard');
    } catch (err) {
      showNotification(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleEarnCertificate = async () => {
    setLoading(true);
    try {
      // Generate certificate for the primary course
      const firstCourseId = isVirtual ? selectedCourse.courses[0]?._id : courseId;
      if (!firstCourseId) throw new Error('No course ID found for certificate generation.');
      
      await API.generateCertificate(firstCourseId);
      showNotification('Certificate generated successfully!', 'success');
      onNavigate('certificates');
    } catch (err) {
      showNotification(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video, submodule, isCompleted) => {
    setActiveItem(video);
    setActiveItemType('video');
    setActiveSubModule(submodule);
    setItemCompleted(isCompleted);
  };

  const handleAssignmentSelect = (assignment, isCompleted) => {
    setActiveItem(assignment);
    setActiveItemType('assignment');
    setActiveSubModule(null);
    setItemCompleted(isCompleted);
    setSubmissionText('');
  };

  const toggleVideoComplete = async () => {
    // Find course enrollment that owns this submodule
    const enrollId = modules.find(m => m.submodules.some(sm => sm._id === activeSubModule._id))?.enrollId;
    if (!enrollId) return;

    setLoading(true);
    try {
      await API.updateEnrollmentProgress(enrollId, activeSubModule._id);
      showNotification('Progress updated successfully!', 'success');
      await loadPlayerData();
      setItemCompleted(!itemCompleted);
    } catch (e) {
      showNotification(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const submitAssignmentText = async () => {
    if (!submissionText.trim()) {
      showNotification('Please enter a submission answer!', 'warning');
      return;
    }

    let enrollId = activeItem.enrollId;
    if (!enrollId) {
      enrollId = modules.find(m => m.assignments.some(a => a._id === activeItem._id))?.enrollId;
    }
    if (!enrollId) {
      const targetCourseId = getValId(activeItem.courseId);
      if (targetCourseId) {
        enrollId = enrollments.find(e => getValId(e.courseId) === targetCourseId)?._id;
      }
    }
    if (!enrollId) {
      enrollId = enrollments[0]?._id;
    }

    if (!enrollId) {
      showNotification('No active enrollment found for submission!', 'danger');
      return;
    }

    setLoading(true);
    try {
      await API.updateEnrollmentProgress(enrollId, activeItem._id);
      showNotification('Assignment submitted and progress updated successfully!', 'success');
      setSubmissionText('');
      setItemCompleted(true);
      await loadPlayerData();
    } catch (e) {
      showNotification(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbedUrl = (videoUrl) => {
    let embedUrl = videoUrl;
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('youtube.com/embed/')) {
      if (!videoUrl.includes('/embed/')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = videoUrl.match(regExp);
        if (match && match[2].length === 11) {
          embedUrl = `https://www.youtube.com/embed/${match[2]}`;
        }
      }
    }
    return embedUrl;
  };

  return (
    <div>
      <div className="container" style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('student-dashboard')}>
          <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCancelEnrollment}>
            <i className="fa-solid fa-ban"></i> Cancel Course
          </button>
          {progress === 100 && (
            <button className="btn btn-primary btn-sm" onClick={handleEarnCertificate}>
              <i className="fa-solid fa-graduation-cap"></i> Earn Certificate
            </button>
          )}
        </div>
      </div>

      <div className="course-player-container">
        {/* Left accordion syllabus */}
        <div className="player-sidebar">
          <div className="player-sidebar-header">
            <h3 style={{ fontSize: '15px', marginBottom: '8px', fontWeight: 700 }}>{courseTitle}</h3>
            <div className="progress-section">
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-percentage">{progress}%</span>
            </div>
          </div>
          <div className="player-sections">
            {modules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No modules loaded yet.</p>
            ) : (
              modules.map(m => {
                const isCollapsed = !openModules[m._id];
                
                let displayName = m.name;
                if (displayName.toLowerCase().endsWith(' module')) {
                  displayName = displayName.substring(0, displayName.length - 7);
                }

                return (
                  <div key={m._id} className="module-section">
                    <div 
                      className="module-header" 
                      onClick={() => setOpenModules(prev => ({ ...prev, [m._id]: !prev[m._id] }))}
                    >
                      <span>{displayName}</span>
                      <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`} style={{ fontSize: '11px' }}></i>
                    </div>
                    <div className="submodule-list" style={{ display: isCollapsed ? 'none' : 'flex' }}>
                      {/* Level 2 SubModules Accordions */}
                      {m.submodules.map(sm => {
                        const isSubCollapsed = !openSubModules[sm._id];
                        return (
                          <div key={sm._id} className="submodule-section" style={{ width: '100%', borderLeft: '2px solid rgba(124, 58, 237, 0.2)', marginLeft: '8px', paddingLeft: '8px', marginBottom: '8px' }}>
                            <div 
                              className="submodule-header"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenSubModules(prev => ({ ...prev, [sm._id]: !prev[sm._id] }));
                              }}
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '6px 8px', 
                                cursor: 'pointer',
                                borderRadius: 'var(--border-radius-sm)',
                                background: 'rgba(255, 255, 255, 0.2)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-dark)'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-folder-open" style={{ color: 'var(--primary-purple)', fontSize: '12px' }}></i>
                                {sm.name}
                              </span>
                              <i className={`fa-solid ${isSubCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`} style={{ fontSize: '9px' }}></i>
                            </div>
                            
                            <div 
                              className="videos-list" 
                              style={{ 
                                display: isSubCollapsed ? 'none' : 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                marginTop: '4px',
                                paddingLeft: '12px'
                              }}
                            >
                              {sm.videos.map(v => (
                                <div 
                                  key={v._id} 
                                  className={`submodule-item ${activeItem?._id === v._id ? 'active' : ''}`}
                                  onClick={() => handleVideoSelect(v, sm, sm.isCompleted)}
                                  style={{ padding: '6px 8px', fontSize: '12px' }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fa-solid fa-play-circle" style={{ color: 'var(--primary-purple)', fontSize: '13px' }}></i>
                                    {v.title}
                                  </span>
                                  <i 
                                    className={sm.isCompleted ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'} 
                                    style={{ color: sm.isCompleted ? '#10b981' : 'var(--text-muted)' }}
                                  ></i>
                                </div>
                              ))}
                              {sm.videos.length === 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '4px' }}>No videos in this submodule.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Level 2 Module Assignments */}
                      {m.assignments.length > 0 && (
                        <div style={{ width: '100%', marginTop: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#d97706', paddingLeft: '8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Module Assignments
                          </div>
                          {m.assignments.map(a => (
                            <div 
                              key={a._id} 
                              className={`submodule-item ${activeItem?._id === a._id ? 'active' : ''}`}
                              onClick={() => handleAssignmentSelect(a, a.isCompleted)}
                              style={{ padding: '6px 8px', fontSize: '12px', marginLeft: '8px' }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-file-signature" style={{ color: '#d97706', fontSize: '13px' }}></i>
                                {a.title}
                              </span>
                              <i 
                                className={a.isCompleted ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'} 
                                style={{ color: a.isCompleted ? '#10b981' : 'var(--text-muted)' }}
                              ></i>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Level 2 Course Final Assignments */}
            {finalAssignments.length > 0 && (
              <div className="module-section" style={{ borderTop: '1px dashed var(--border-gray)', marginTop: '16px', paddingTop: '16px' }}>
                <div className="module-header" style={{ background: 'rgba(217, 119, 6, 0.05)', borderColor: '#d97706' }}>
                  <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                    <i className="fa-solid fa-graduation-cap" style={{ marginRight: '8px' }}></i>
                    Final Assignments
                  </span>
                </div>
                <div className="submodule-list" style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
                  {finalAssignments.map(fa => (
                    <div 
                      key={fa._id} 
                      className={`submodule-item ${activeItem?._id === fa._id ? 'active' : ''}`}
                      onClick={() => handleAssignmentSelect(fa, fa.isCompleted)}
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-trophy" style={{ color: '#d97706', fontSize: '13px' }}></i>
                        {fa.title}
                      </span>
                      <i 
                        className={fa.isCompleted ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'} 
                        style={{ color: fa.isCompleted ? '#10b981' : 'var(--text-muted)' }}
                      ></i>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right content player panel */}
        <div className="player-main">
          <div className="video-container" id="player-content-viewer">
            {!activeItem ? (
              <div className="video-placeholder">
                <div className="video-placeholder-icon"><i className="fa-solid fa-book-open-reader"></i></div>
                <h3>Select a sub-module from the syllabus</h3>
                <p>Click modules and items to view material, play videos, and complete tasks.</p>
              </div>
            ) : activeItemType === 'video' ? (
              getYoutubeEmbedUrl(activeItem.videoUrl) ? (
                <iframe 
                  className="video-player-frame" 
                  src={getYoutubeEmbedUrl(activeItem.videoUrl)} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  title={activeItem.title}
                  style={{ width: '100%', height: '380px', border: 'none', borderRadius: 'var(--border-radius-md)' }}
                ></iframe>
              ) : (
                <video 
                  className="video-player-frame" 
                  src={activeItem.videoUrl} 
                  controls 
                  style={{ width: '100%', height: '380px', borderRadius: 'var(--border-radius-md)' }}
                ></video>
              )
            ) : (
              // Assignment workspace
              <div className="video-placeholder" style={{ background: 'rgba(217,119,6,0.02)', border: '1px dashed #d97706', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="video-placeholder-icon" style={{ color: '#d97706' }}><i className="fa-solid fa-scroll"></i></div>
                <h3>Submit Assignment Solution</h3>
                <p style={{ marginBottom: '16px' }}>Upload or paste your assignment solution text below.</p>
                <textarea 
                  className="input-control" 
                  placeholder="Paste your answer or submission details here..." 
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  style={{ width: '80%', maxWidth: '500px', height: '100px', padding: '10px', marginBottom: '12px', fontFamily: 'inherit' }}
                ></textarea>
                <button className="btn btn-primary" onClick={submitAssignmentText}>Submit Assignment</button>
              </div>
            )}
          </div>

          {/* content descriptions and toggles */}
          {activeItem && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem' }}>{activeItem.title}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {activeItemType === 'video' ? (
                      <><i className="fa-solid fa-video" style={{ color: 'var(--primary-purple)', marginRight: '4px' }}></i> Video tutorial ({activeItem.duration || 'N/A'})</>
                    ) : (
                      <><i className="fa-solid fa-file-signature" style={{ color: '#d97706', marginRight: '4px' }}></i> Assignment task (Max marks: {activeItem.maxMarks || 100})</>
                    )}
                  </span>
                </div>
                <div>
                  {activeItemType === 'video' ? (
                    <button 
                      className={`btn ${itemCompleted ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                      onClick={toggleVideoComplete}
                    >
                      {itemCompleted ? <><i className="fa-solid fa-xmark"></i> Mark Incomplete</> : <><i className="fa-solid fa-check"></i> Mark Completed</>}
                    </button>
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: itemCompleted ? '#10b981' : 'var(--text-muted)' }}>
                      {itemCompleted ? (
                        <span><i className="fa-solid fa-circle-check"></i> Solution Submitted</span>
                      ) : 'Status: Pending Submit'}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                {activeItemType === 'video' 
                  ? 'Watch the video lesson. Toggle completion on this module topic once you have understood the concepts.'
                  : (activeItem.description || 'Complete the assignment questions and submit them to your instructor.')
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
