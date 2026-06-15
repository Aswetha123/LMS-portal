import React, { useState, useEffect, useCallback } from 'react';
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

function getValId(field) {
  if (!field) return null;
  return typeof field === 'object' ? field._id : field;
}

export default function CoursesView({ 
  user, 
  onNavigate, 
  setSelectedCourse, 
  setSelectedEnrollment, 
  categoryFilter, 
  setCategoryFilter,
  showNotification,
  setLoading 
}) {
  const [levelStack, setLevelStack] = useState([{ level: 'root', name: 'Courses', id: null }]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  
  // View states
  const [treeViewActive, setTreeViewActive] = useState(false);
  const [gridItems, setGridItems] = useState([]);
  
  // Syllabus Tree details
  const [treeTrackName, setTreeTrackName] = useState('');
  const [treeTrackId, setTreeTrackId] = useState('');
  const [treeCourses, setTreeCourses] = useState([]);
  const [treeProgress, setTreeProgress] = useState(0);
  const [isTreeEnrolled, setIsTreeEnrolled] = useState(false);
  const [enrollmentsMap, setEnrollmentsMap] = useState({});
  const [activeEnrollmentsList, setActiveEnrollmentsList] = useState([]);
  
  // Loaded syllabus contents
  const [syllabusModules, setSyllabusModules] = useState([]);
  const [openModules, setOpenModules] = useState({});
  const [openSubModules, setOpenSubModules] = useState({});
  const [treeFinalAssignments, setTreeFinalAssignments] = useState([]);
  
  // Right detail panel state
  const [selectedItem, setSelectedItem] = useState(null); // video or assignment
  const [selectedItemType, setSelectedItemType] = useState(''); // 'video' or 'assignment'
  const [selectedSubModule, setSelectedSubModule] = useState(null); // parent submodule
  const [selectedCompleted, setSelectedCompleted] = useState(false);
  const [assignmentText, setAssignmentText] = useState('');

  // Classification group helper
  const currentLevel = levelStack[levelStack.length - 1];

  // Helper to resolve enrollments map
  const fetchUserEnrollments = useCallback(async () => {
    if (!user) return {};
    try {
      const enrollments = await API.getMyEnrollments();
      const map = {};
      if (Array.isArray(enrollments)) {
        enrollments.forEach(en => {
          const cid = getValId(en.courseId);
          if (cid) map[cid] = en;
        });
      }
      return map;
    } catch (e) {
      console.error(e);
      return {};
    }
  }, [user]);

  // Main navigation function inside the hierarchy
  const navigateHierarchy = useCallback(async (parentId, targetType, parentName) => {
    setLoadingCurriculum(true);
    setTreeViewActive(false);
    setSelectedItem(null);
    setSelectedItemType('');

    // Maintain levelStack correctly
    setLevelStack(prev => {
      const exists = prev.some(item => item.id === parentId && item.level === targetType);
      if (exists) {
        // Truncate to this level
        const idx = prev.findIndex(item => item.id === parentId && item.level === targetType);
        return prev.slice(0, idx + 1);
      } else {
        return [...prev, { level: targetType, name: parentName, id: parentId }];
      }
    });

    try {
      if (targetType === 'category') {
        const [cats, depts] = await Promise.all([
          API.getCategories(),
          API.getDepartments()
        ]);
        const deptIds = depts.filter(d => classifyDepartment(d) === parentId).map(d => d._id);
        const filteredCats = cats.filter(c => deptIds.includes(getValId(c.departmentId)));
        setGridItems(filteredCats.map(c => ({ ...c, type: 'category', nextType: 'domain' })));

      } else if (targetType === 'domain') {
        const domains = await API.getDomains(parentId);
        setGridItems(domains.map(d => ({ ...d, type: 'domain', nextType: 'track' })));

      } else if (targetType === 'track') {
        const tracks = await API.getTracks(parentId);
        setGridItems(tracks.map(t => ({ ...t, type: 'track', nextType: 'course' })));

      } else if (targetType === 'course') {
        const courses = await API.getCourses(parentId);
        setTreeTrackName(parentName);
        setTreeTrackId(parentId);
        setTreeCourses(courses);
        setTreeViewActive(true);
        await loadSyllabusTree(courses, parentName, parentId);
      }
    } catch (err) {
      showNotification('Error loading hierarchy: ' + err.message, 'danger');
    } finally {
      setLoadingCurriculum(false);
    }
  }, [showNotification]);

  // Load syllabus tree details
  const loadSyllabusTree = async (courses, trackName, trackId) => {
    let enrollMap = {};
    let isEnrolled = false;
    let trackProgressVal = 0;
    let activeEnrollments = [];

    if (user) {
      try {
        enrollMap = await fetchUserEnrollments();
        activeEnrollments = courses.map(c => enrollMap[c._id]).filter(Boolean);
        isEnrolled = activeEnrollments.length > 0;
        
        // Auto-enroll in missing track courses if partially enrolled
        if (isEnrolled && activeEnrollments.length < courses.length) {
          const missingCourses = courses.filter(c => !enrollMap[c._id]);
          await Promise.all(missingCourses.map(c => API.enrollInCourse(c._id).catch(() => {})));
          
          enrollMap = await fetchUserEnrollments();
          activeEnrollments = courses.map(c => enrollMap[c._id]).filter(Boolean);
        }

        if (isEnrolled && activeEnrollments.length > 0) {
          trackProgressVal = Math.round(activeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / activeEnrollments.length);
        }
      } catch (e) {
        console.error('Error fetching tree enrollments:', e);
      }
    }

    setEnrollmentsMap(enrollMap);
    setActiveEnrollmentsList(activeEnrollments);
    setIsTreeEnrolled(isEnrolled);
    setTreeProgress(trackProgressVal);

    // Fetch modules, submodules, final assignments, and details concurrently
    try {
      const allFinalAssignments = [];
      const courseDataList = await Promise.all(courses.map(async (c) => {
        const enroll = enrollMap[c._id] || { progress: 0, completedSubModules: [] };
        const [mods, finalAssigns] = await Promise.all([
          API.getModules(c._id).catch(() => []),
          API.getFinalAssignments(c._id).catch(() => [])
        ]);
        
        const modsDetailed = await Promise.all(mods.map(async (m) => {
          const [submodules, assignments] = await Promise.all([
            API.getSubModules(m._id).catch(() => []),
            API.getAssignments(m._id).catch(() => [])
          ]);

          // Fetch videos for each submodule
          const submodulesWithVideos = await Promise.all(submodules.map(async (sm) => {
            const videos = await API.getVideos(sm._id).catch(() => []);
            const isCompleted = enroll.completedSubModules && enroll.completedSubModules.includes(sm._id);
            return {
              ...sm,
              videos,
              isCompleted
            };
          }));

          const assignmentsDetailed = assignments.map(a => {
            const isCompleted = enroll.completedSubModules && enroll.completedSubModules.includes(a._id);
            return {
              ...a,
              isCompleted
            };
          });

          return {
            ...m,
            submodules: submodulesWithVideos,
            assignments: assignmentsDetailed
          };
        }));

        modsDetailed.sort((a, b) => (a.order || 0) - (b.order || 0));

        const finalAssignsDetailed = finalAssigns.map(fa => {
          const isCompleted = enroll.completedSubModules && enroll.completedSubModules.includes(fa._id);
          return {
            ...fa,
            isCompleted,
            courseId: c._id
          };
        });
        allFinalAssignments.push(...finalAssignsDetailed);

        return { course: c, modules: modsDetailed };
      }));

      // Flatten modules across courses in the track
      const allModules = [];
      courseDataList.forEach(data => {
        allModules.push(...data.modules);
      });
      setSyllabusModules(allModules);
      setTreeFinalAssignments(allFinalAssignments);

      // Auto-open modules
      const initialOpen = {};
      allModules.forEach(m => {
        initialOpen[m._id] = true;
      });
      setOpenModules(initialOpen);

      // Auto-open submodules
      const initialSubOpen = {};
      allModules.forEach(m => {
        m.submodules.forEach(sm => {
          initialSubOpen[sm._id] = true;
        });
      });
      setOpenSubModules(initialSubOpen);

    } catch (err) {
      showNotification('Error loading syllabus: ' + err.message, 'danger');
    }
  };

  const handleEnrollClick = async () => {
    if (!user) {
      showNotification('Please log in to enroll in courses!', 'warning');
      onNavigate('login');
      return;
    }

    if (isTreeEnrolled) {
      // Go directly to Course Player view
      setSelectedCourse({ _id: 'virtual-' + treeTrackId, name: treeTrackName, isVirtual: true, courses: treeCourses });
      setSelectedEnrollment({ _id: 'virtual-enroll-' + treeTrackId, isVirtual: true, enrollments: activeEnrollmentsList });
      onNavigate('course-player');
    } else {
      // Enroll in all track courses
      setLoading(true);
      try {
        await Promise.all(treeCourses.map(c => API.enrollInCourse(c._id).catch(() => {})));
        showNotification('Enrolled in course track successfully!', 'success');
        // Reload the tree view
        await loadSyllabusTree(treeCourses, treeTrackName, treeTrackId);
      } catch (err) {
        showNotification('Enrollment failed: ' + err.message, 'danger');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVideoSelect = (video, submodule, isCompleted) => {
    setSelectedItem(video);
    setSelectedItemType('video');
    setSelectedSubModule(submodule);
    setSelectedCompleted(isCompleted);
  };

  const handleAssignmentSelect = (assignment, isCompleted) => {
    setSelectedItem(assignment);
    setSelectedItemType('assignment');
    setSelectedSubModule(null);
    setSelectedCompleted(isCompleted);
    setAssignmentText('');
  };

  const toggleVideoCompletion = async () => {
    if (!isTreeEnrolled) return;
    
    // Find matching course enrollment that owns this submodule
    let parentCourseId = null;
    if (selectedSubModule) {
      const parentModule = syllabusModules.find(m => m.submodules.some(sm => sm._id === selectedSubModule._id));
      if (parentModule) {
        parentCourseId = getValId(parentModule.courseId);
      }
    }
    if (!parentCourseId) {
      parentCourseId = treeCourses[0]?._id; // fallback
    }

    const enrollment = activeEnrollmentsList.find(e => getValId(e.courseId) === parentCourseId) || activeEnrollmentsList[0];
    
    if (!enrollment) {
      showNotification('No active enrollment found!', 'danger');
      return;
    }

    setLoading(true);
    try {
      await API.updateEnrollmentProgress(enrollment._id, selectedSubModule._id);
      showNotification('Progress updated successfully!', 'success');
      // Reload tree
      await loadSyllabusTree(treeCourses, treeTrackName, treeTrackId);
      setSelectedCompleted(!selectedCompleted);
    } catch (e) {
      showNotification(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async () => {
    if (!assignmentText.trim()) {
      showNotification('Please enter a submission answer!', 'warning');
      return;
    }

    let enrollment = null;
    if (selectedItem.courseId) {
      const targetCourseId = getValId(selectedItem.courseId);
      enrollment = activeEnrollmentsList.find(e => getValId(e.courseId) === targetCourseId);
    } else if (selectedItem.moduleId) {
      const mod = syllabusModules.find(m => m._id === selectedItem.moduleId);
      if (mod) {
        const targetCourseId = getValId(mod.courseId);
        enrollment = activeEnrollmentsList.find(e => getValId(e.courseId) === targetCourseId);
      }
    }
    
    if (!enrollment) {
      const parentCourseId = treeCourses[0]?._id;
      enrollment = activeEnrollmentsList.find(e => getValId(e.courseId) === parentCourseId) || activeEnrollmentsList[0];
    }

    if (!enrollment) {
      showNotification('No active enrollment found!', 'danger');
      return;
    }

    setLoading(true);
    try {
      await API.updateEnrollmentProgress(enrollment._id, selectedItem._id);
      showNotification('Assignment submitted and progress updated successfully!', 'success');
      setAssignmentText('');
      setSelectedCompleted(true);
      await loadSyllabusTree(treeCourses, treeTrackName, treeTrackId);
    } catch (e) {
      showNotification(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Helper to load root level
  const loadRoot = useCallback(() => {
    setTreeViewActive(false);
    setSelectedItem(null);
    setSelectedItemType('');
    setLevelStack([{ level: 'root', name: 'Courses', id: null }]);
  }, []);

  // Sync category filter from home clicks
  useEffect(() => {
    if (categoryFilter) {
      const filter = categoryFilter;
      setCategoryFilter(null); // consume it
      const name = filter === 'technical' ? 'Technical' : 'Non-Technical';
      setLevelStack([{ level: 'root', name: 'Courses', id: null }]);
      navigateHierarchy(filter, 'category', name);
    } else if (levelStack.length === 1 && levelStack[0].level === 'root') {
      // populate root items
      setGridItems([
        {
          _id: 'technical',
          name: 'Technical',
          type: 'root',
          nextType: 'category',
          description: 'Explore web development, software engineering, algorithms, cyber security, cloud platforms, and core engineering tracks.',
          gradient: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)',
          icon: 'fa-laptop-code'
        },
        {
          _id: 'non-technical',
          name: 'Non-Technical',
          type: 'root',
          nextType: 'category',
          description: 'Explore UX/UI design research, visual prototyping, project management, communications, business strategy, and soft skills.',
          gradient: 'linear-gradient(135deg, #311042 0%, #ec4899 100%)',
          icon: 'fa-compass-drafting'
        }
      ]);
    }
  }, [categoryFilter, levelStack, navigateHierarchy, setCategoryFilter, loadRoot]);

  const handleCrumbClick = (idx) => {
    if (idx === levelStack.length - 1) return;
    const target = levelStack[idx];
    if (target.level === 'root') {
      loadRoot();
    } else {
      // Navigate hierarchy back to this point
      navigateHierarchy(target.id, target.level, target.name);
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
    <section id="view-courses" className="section" style={{ display: 'block' }}>
      <div className="container">
        <h1 className="section-title">Courses Catalog</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1.1rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Navigate through our structured learning curriculum to discover courses, modules, videos, and assessments.
        </p>

        <div className="structure-explorer-card">
          {/* Breadcrumbs Path Tracker */}
          <div className="structure-controls" style={{ marginBottom: '24px' }}>
            <div className="hierarchy-crumbs" id="courses-crumbs" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {levelStack.map((crumb, idx) => {
                const isLast = idx === levelStack.length - 1;
                return (
                  <React.Fragment key={idx}>
                    <span 
                      className={`crumb-item ${isLast ? 'active' : ''}`} 
                      onClick={() => handleCrumbClick(idx)}
                      style={{ cursor: isLast ? 'default' : 'pointer' }}
                    >
                      {crumb.name}
                    </span>
                    {!isLast && (
                      <span className="crumb-separator">
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Loading spinner */}
          {loadingCurriculum ? (
            <div id="courses-loader" style={{ textAlign: 'center', padding: '60px 0', display: 'block' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{ color: 'var(--primary-purple)', marginBottom: '16px' }}></i>
              <h3 style={{ fontFamily: 'var(--font-family)', fontWeight: 700, color: 'var(--text-dark)' }}>Loading Curriculum...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Fetching items from the database. Please wait...</p>
            </div>
          ) : (
            <>
              {/* Cards Grid for Step-by-Step Navigation */}
              {!treeViewActive && (
                <div id="courses-grid-wrapper" style={{ display: 'block' }}>
                  <div className="grid grid-3" id="courses-grid">
                    {gridItems.length === 0 ? (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-folder-open fa-2x" style={{ marginBottom: '10px', display: 'block', opacity: 0.5 }}></i>
                        No items found in this section.
                      </div>
                    ) : (
                      gridItems.map(it => {
                        const hash = (it.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const gradients = [
                          'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                          'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                          'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        ];
                        const selectedGradient = it.gradient || gradients[hash % gradients.length];
                        
                        let icon = 'fa-folder';
                        if (it.type === 'category') icon = 'fa-tag';
                        else if (it.type === 'domain') icon = 'fa-layer-group';
                        else if (it.type === 'track') icon = 'fa-route';
                        else if (it.icon) icon = it.icon;

                        return (
                          <div 
                            key={it._id} 
                            className="card node-card click-navigate-btn" 
                            style={{ cursor: 'pointer', textAlign: 'left' }}
                            onClick={() => navigateHierarchy(it._id, it.nextType, it.name)}
                          >
                            <div className="card-img" style={{ background: selectedGradient, height: '100px', display: 'flex', alignItems: 'center', justify: 'center', color: 'white', fontSize: '2.2rem' }}>
                              <i className={`fa-solid ${icon}`}></i>
                            </div>
                            <div className="card-content" style={{ padding: '16px' }}>
                              <div className="hierarchy-card-type" style={{ textTransform: 'capitalize' }}>{it.type === 'root' ? 'Curriculum Group' : it.type}</div>
                              <h3 className="hierarchy-card-title" style={{ fontSize: '15px', marginBottom: '6px' }}>{it.name}</h3>
                              <p className="hierarchy-card-desc" style={{ fontSize: '12px', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '38px' }}>
                                {it.description || 'No description provided.'}
                              </p>
                              <button className="btn btn-outline btn-sm" style={{ width: '100%', pointerEvents: 'none' }}>
                                Explore {it.nextType}s
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Syllabus Tree view */}
              {treeViewActive && (
                <div id="courses-tree-view-wrapper" style={{ display: 'block', marginTop: '20px' }}>
                  <div className="course-player-container" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-gray)', overflow: 'hidden', padding: 0, margin: 0 }}>
                    {/* Left tree sidebar */}
                    <div className="player-sidebar" style={{ border: 'none', borderRight: '1px solid var(--border-gray)', borderRadius: 0, boxShadow: 'none' }}>
                      <div className="player-sidebar-header" style={{ background: 'rgba(255,255,255,0.6)' }}>
                        <h3 id="catalog-tree-course-name" style={{ fontSize: '15px', marginBottom: '8px', fontWeight: 700, color: 'var(--text-dark)' }}>
                          {treeTrackName} Complete Course
                        </h3>
                        {isTreeEnrolled && (
                          <div className="progress-section" id="catalog-tree-progress-section" style={{ display: 'flex', marginBottom: '12px', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-track">
                              <div id="catalog-tree-progressbar" className="progress-bar" style={{ width: `${treeProgress}%` }}></div>
                            </div>
                            <span className="progress-percentage" id="catalog-tree-progress-text">{treeProgress}%</span>
                          </div>
                        )}
                        <div id="catalog-tree-enroll-container">
                          <button 
                            className={`btn ${isTreeEnrolled ? 'btn-secondary' : 'btn-primary'} btn-sm`} 
                            style={{ width: '100%' }}
                            onClick={handleEnrollClick}
                          >
                            {isTreeEnrolled ? (
                              <><i className="fa-solid fa-play"></i> Resume Player ({treeProgress}%)</>
                            ) : (
                              <><i className="fa-solid fa-plus"></i> Enroll in Course</>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="player-sections" id="catalog-tree-syllabus-list">
                        {syllabusModules.length === 0 ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
                            No syllabus modules loaded.
                          </div>
                        ) : (
                          syllabusModules.map(m => {
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
                                              className={`submodule-item ${selectedItem?._id === v._id ? 'active' : ''}`}
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
                                          className={`submodule-item ${selectedItem?._id === a._id ? 'active' : ''}`}
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

                                  {m.submodules.length === 0 && m.assignments.length === 0 && (
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px' }}>No items inside.</div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Level 2 Course Final Assignments */}
                        {treeFinalAssignments.length > 0 && (
                          <div className="module-section" style={{ borderTop: '1px dashed var(--border-gray)', marginTop: '16px', paddingTop: '16px' }}>
                            <div className="module-header" style={{ background: 'rgba(217, 119, 6, 0.05)', borderColor: '#d97706' }}>
                              <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                                <i className="fa-solid fa-graduation-cap" style={{ marginRight: '8px' }}></i>
                                Final Assignments
                              </span>
                            </div>
                            <div className="submodule-list" style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
                              {treeFinalAssignments.map(fa => (
                                <div 
                                  key={fa._id} 
                                  className={`submodule-item ${selectedItem?._id === fa._id ? 'active' : ''}`}
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
                    
                    {/* Right preview panel */}
                    <div className="player-main" style={{ padding: '24px', flexGrow: 1 }}>
                      <div className="video-container" id="catalog-tree-content-viewer" style={{ boxShadow: 'none', border: '1px solid var(--border-gray)', backgroundColor: 'white' }}>
                        {!selectedItem ? (
                          <div className="video-placeholder">
                            <div className="video-placeholder-icon"><i class="fa-solid fa-book-open-reader"></i></div>
                            <h3>Select a syllabus topic from the tree</h3>
                            <p>Click modules and items to view details, watch lectures, and complete assignments.</p>
                          </div>
                        ) : !isTreeEnrolled ? (
                          <div className="video-placeholder" style={{ background: 'rgba(31, 41, 55, 0.05)', padding: '40px', textAlign: 'center', border: '1px dashed var(--border-gray)', borderRadius: 'var(--border-radius-md)' }}>
                            <div className="video-placeholder-icon" style={{ color: selectedItemType === 'video' ? 'var(--primary-purple)' : '#d97706' }}>
                              <i className="fa-solid fa-lock"></i>
                            </div>
                            <h3>🔒 Lesson Content Locked</h3>
                            <p style={{ marginBottom: '16px' }}>Enroll in the course to unlock learning material, video lectures, and assignments.</p>
                            <button className="btn btn-primary" onClick={handleEnrollClick}>Enroll Now</button>
                          </div>
                        ) : selectedItemType === 'video' ? (
                          getYoutubeEmbedUrl(selectedItem.videoUrl) ? (
                            <iframe 
                              className="video-player-frame" 
                              src={getYoutubeEmbedUrl(selectedItem.videoUrl)} 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen 
                              title={selectedItem.title}
                              style={{ width: '100%', height: '380px', border: 'none', borderRadius: 'var(--border-radius-md)' }}
                            ></iframe>
                          ) : (
                            <video 
                              className="video-player-frame" 
                              src={selectedItem.videoUrl} 
                              controls 
                              style={{ width: '100%', height: '380px', borderRadius: 'var(--border-radius-md)' }}
                            ></video>
                          )
                        ) : (
                          // Assignment submission panel
                          <div className="video-placeholder" style={{ background: 'rgba(217,119,6,0.02)', border: '1px dashed #d97706', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="video-placeholder-icon" style={{ color: '#d97706' }}><i className="fa-solid fa-scroll"></i></div>
                            <h3>Submit Assignment Solution</h3>
                            <p style={{ marginBottom: '16px' }}>Upload or paste your assignment solution text below.</p>
                            <textarea 
                              className="input-control" 
                              placeholder="Paste your answer or submission details here..." 
                              value={assignmentText}
                              onChange={(e) => setAssignmentText(e.target.value)}
                              style={{ width: '80%', maxWidth: '500px', height: '100px', padding: '10px', marginBottom: '12px', fontFamily: 'inherit' }}
                            ></textarea>
                            <button className="btn btn-primary" onClick={submitAssignment}>Submit Assignment</button>
                          </div>
                        )}
                      </div>

                      {selectedItem && (
                        <div className="glass-card" id="catalog-tree-content-card" style={{ marginTop: '20px', boxShadow: 'none', border: '1px solid var(--border-gray)', display: 'block' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <h2 id="catalog-tree-content-title" style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>
                                {selectedItem.title}
                              </h2>
                              <span id="catalog-tree-content-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {selectedItemType === 'video' ? (
                                  <><i className="fa-solid fa-video" style={{ color: 'var(--primary-purple)' }}></i> Video: <strong>{selectedItem.title}</strong> ({selectedItem.duration || 'N/A'})</>
                                ) : (
                                  <><i className="fa-solid fa-file-signature" style={{ color: '#d97706' }}></i> Assignment: <strong>{selectedItem.title}</strong></>
                                )}
                              </span>
                            </div>
                            <div id="catalog-tree-completion-toggle-container">
                              {isTreeEnrolled ? (
                                selectedItemType === 'video' ? (
                                  <button 
                                    className={`btn ${selectedCompleted ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                    onClick={toggleVideoCompletion}
                                  >
                                    {selectedCompleted ? <><i className="fa-solid fa-xmark"></i> Mark Incomplete</> : <><i className="fa-solid fa-check"></i> Mark Completed</>}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {selectedCompleted ? (
                                      <span style={{ color: '#10b981', fontWeight: 'bold' }}><i className="fa-solid fa-check-double"></i> Submitted</span>
                                    ) : 'Pending Submit'}
                                  </span>
                                )
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  <i className="fa-solid fa-lock"></i> Enroll to mark completed
                                </span>
                              )}
                            </div>
                          </div>
                          <div id="catalog-tree-content-desc" style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
                            {selectedItemType === 'video' 
                              ? 'Watch the video lesson. Toggle completion on this module topic once you have understood the concepts.'
                              : (selectedItem.description || 'Complete the assignment questions and submit them to your instructor.')
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
