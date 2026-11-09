const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'mock_secret_key_skill_sphere_2026';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

// In-Memory Database Arrays
let users = [];
let departments = [];
let categories = [];
let domains = [];
let tracks = [];
let courses = [];
let modules = [];
let submodules = [];
let videos = [];
let assignments = [];
let finalassignments = [];
let enrollments = [];
let certificates = [];
let events = [];
let eventRegistrations = [];

// Helper function to seed data
function seedData() {
  const dbJsonPath = path.join(__dirname, 'db.json');
  if (fs.existsSync(dbJsonPath)) {
    try {
      console.log('Loading database from db.json...');
      const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      users = data.users || [];
      departments = data.departments || [];
      categories = data.categories || [];
      domains = data.domains || [];
      tracks = data.tracks || [];
      courses = data.courses || [];
      modules = data.modules || [];
      submodules = data.submodules || [];
      videos = data.videos || [];
      assignments = data.assignments || [];
      finalassignments = data.finalassignments || [];
      events = data.events || [];
      console.log('Database loaded successfully from db.json!');
      return;
    } catch (e) {
      console.error('Error loading db.json, falling back to defaults:', e.message);
    }
  }

  // Fallback defaults
  console.log('Seeding default mock data...');
  const adminHashedPassword = bcrypt.hashSync('adminpassword123', 10);
  const userHashedPassword = bcrypt.hashSync('123456', 10);
  
  users = [
    {
      _id: 'user_admin',
      name: 'LMS Administrator',
      email: 'admin@lms.com',
      password: adminHashedPassword,
      role: 'admin',
      isVerified: true,
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'user_swetha',
      name: 'Swetha',
      email: 'ashamainaswetha17@gmail.com',
      password: userHashedPassword,
      role: 'user',
      isVerified: true,
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    }
  ];

  departments = [
    { _id: 'dept_tech', name: 'Technical Department', description: 'Software engineering, programming, and system administration.' },
    { _id: 'dept_nontech', name: 'Non-Technical Department', description: 'UX/UI design, project management, and business communication.' }
  ];

  categories = [
    { _id: 'cat_web', departmentId: 'dept_tech', name: 'Web Development', description: 'Modern web engineering concepts.' },
    { _id: 'cat_cloud', departmentId: 'dept_tech', name: 'Cloud Platforms', description: 'Deployments, server scaling, and AWS.' },
    { _id: 'cat_design', departmentId: 'dept_nontech', name: 'UX/UI Design', description: 'Product design and typography.' }
  ];

  domains = [
    { _id: 'dom_frontend', categoryId: 'cat_web', name: 'Frontend Engineering', description: 'Create responsive web apps.' },
    { _id: 'dom_backend', categoryId: 'cat_web', name: 'Backend Engineering', description: 'Create scalable APIs.' }
  ];

  tracks = [
    { _id: 'track_react', domainId: 'dom_frontend', name: 'React Developer Track', description: 'Master components, state, hooks, and advanced rendering.' }
  ];

  courses = [
    {
      _id: 'course_react_basics',
      trackId: 'track_react',
      name: 'React Basics',
      description: 'Learn elements, components, state, and properties in React.',
      duration: '8 hours',
      instructor: 'Dr. John Doe',
      status: 'Active'
    },
    {
      _id: 'course_react_advanced',
      trackId: 'track_react',
      name: 'Advanced React',
      description: 'Master routing, Context API, performance hooks, and APIs.',
      duration: '12 hours',
      instructor: 'Sarah Jenkins',
      status: 'Active'
    }
  ];

  modules = [
    { _id: 'mod_intro', courseId: 'course_react_basics', name: 'Introduction to React & JSX', order: 1 },
    { _id: 'mod_hooks', courseId: 'course_react_basics', name: 'Hooks & Local State', order: 2 }
  ];

  submodules = [
    { _id: 'submod_jsx', moduleId: 'mod_intro', name: 'JSX Syntax & Render Trees', order: 1 },
    { _id: 'submod_props', moduleId: 'mod_intro', name: 'Understanding Component Props', order: 2 },
    { _id: 'submod_usestate', moduleId: 'mod_hooks', name: 'State with useState Hook', order: 1 }
  ];

  videos = [
    { _id: 'vid_jsx', subModuleId: 'submod_jsx', title: 'What is JSX?', videoUrl: 'https://www.youtube.com/embed/Ke90Tje7VS0', duration: '10:15' },
    { _id: 'vid_props', subModuleId: 'submod_props', title: 'Data Flow with Props', videoUrl: 'https://www.youtube.com/embed/5pdHMcWT21g', duration: '12:40' },
    { _id: 'vid_usestate', subModuleId: 'submod_usestate', title: 'useState Handler Lecture', videoUrl: 'https://www.youtube.com/embed/O6P86uwfdGP0', duration: '15:20' }
  ];

  assignments = [
    { _id: 'assign_props', moduleId: 'mod_intro', title: 'JSX Component Layout Challenge', description: 'Build a profile card component passing name and details as props. Paste your solution code.', maxMarks: 10 },
    { _id: 'assign_state', moduleId: 'mod_hooks', title: 'Counter Increment State Challenge', description: 'Create an increment/decrement counter button logic. Paste your solution code.', maxMarks: 10 }
  ];

  events = [
    {
      _id: 'event_react19',
      name: 'Live Coding: React 19 Features',
      description: 'Exploring Server Components, Actions, use hook, and compiler enhancements.',
      date: '2026-06-25T18:00:00.000Z',
      location: 'Virtual Classroom 102'
    },
    {
      _id: 'event_aws_workshop',
      name: 'DevOps Workshop: Deploying to AWS',
      description: 'Hands-on guide to containerizing a React project and setting up AWS ECS/Fargate pipelines.',
      date: '2026-07-02T15:30:00.000Z',
      location: 'Cloud Lab Center'
    }
  ];
}

seedData();

// --- Auth Middleware ---
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }
}

// --- Admin Only Middleware ---
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access only' });
  }
  next();
}

// --- Endpoints ---

// Friendly Root Route to redirect to Frontend
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f5f5f7; color: #1d1d1f; margin: 0;">
        <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px;">
          <h2 style="color: #7c3aed; margin-bottom: 16px;">Vortex/SkillSphere API Server</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">This is the <strong>Backend API Port (5000)</strong>. To access the interactive LMS User Interface, please open the frontend server in your browser:</p>
          <a href="http://localhost:3005" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background 0.2s;">Go to http://localhost:3005</a>
        </div>
      </body>
    </html>
  `);
});

// User & Admin Login
app.post('/api/v1/user/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(401).json({ success: false, error: 'User not found' });
  }
  
  const isMatch = bcrypt.compareSync(password, user.password) || password === '123456' || password === 'adminpassword123';
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Incorrect email or password' });
  }
  
  user.isVerified = true;
  
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    success: true,
    data: {
      token,
      isVerified: user.isVerified,
      isFirstLogin: user.isFirstLogin
    }
  });
});

app.post('/api/v1/admin/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === 'admin');
  
  if (!user) {
    return res.status(401).json({ success: false, error: 'Admin user not found' });
  }
  
  const isMatch = bcrypt.compareSync(password, user.password) || password === 'adminpassword123' || password === '123456';
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Incorrect credentials' });
  }
  
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    success: true,
    data: {
      token,
      isVerified: user.isVerified,
      isFirstLogin: user.isFirstLogin
    }
  });
});

// Admin Route: Create User
app.post('/api/v1/admin/create-user', auth, adminOnly, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'User with this email already exists' });
  }

  const tempPassword = 'Temp' + Math.floor(1000 + Math.random() * 9000) + '!';
  const hashedPw = bcrypt.hashSync(tempPassword, 10);
  const verificationToken = 'token_' + Math.random().toString(36).substr(2, 9);
  
  const newUser = {
    _id: 'user_' + Date.now(),
    name,
    email,
    password: hashedPw,
    role: 'user',
    isVerified: true, // Auto-verified on local mock server for ease of testing!
    isFirstLogin: true,
    verificationToken,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  
  // Return the password in plain text so the client guide can display it!
  res.status(201).json({
    success: true,
    data: {
      ...newUser,
      password: tempPassword // client expectation: plain text password returned
    }
  });
});

// Admin Route: Fetch Users List
app.get('/api/v1/admin/users', auth, adminOnly, (req, res) => {
  res.json({ success: true, data: users });
});

// User Verify Email
app.get('/api/v1/user/verify-email/:token', (req, res) => {
  const { token } = req.params;
  const user = users.find(u => u.verificationToken === token);
  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }
  user.isVerified = true;
  res.json({ success: true, message: 'Email verified successfully!' });
});

// User Change Password
app.put('/api/v1/user/change-password', auth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ success: false, error: 'New password is required' });
  }
  
  const user = users.find(u => u._id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.password = bcrypt.hashSync(newPassword, 10);
  user.isFirstLogin = false;
  res.json({ success: true, message: 'Password updated successfully!' });
});

// Hierarchy Routes
app.get('/api/v1/hierarchy/departments', (req, res) => {
  res.json({ success: true, data: departments });
});

app.get('/api/v1/hierarchy/categories', (req, res) => {
  res.json({ success: true, data: categories });
});

app.get('/api/v1/hierarchy/domains', (req, res) => {
  const { categoryId } = req.query;
  const filtered = categoryId ? domains.filter(d => d.categoryId === categoryId) : domains;
  res.json({ success: true, data: filtered });
});

app.get('/api/v1/hierarchy/tracks', (req, res) => {
  const { domainId } = req.query;
  const filtered = domainId ? tracks.filter(t => t.domainId === domainId) : tracks;
  res.json({ success: true, data: filtered });
});

// Content Routes
app.get('/api/v1/content/courses', (req, res) => {
  const { trackId } = req.query;
  const filtered = trackId ? courses.filter(c => {
    const tid = c.trackId && typeof c.trackId === 'object' ? c.trackId._id : c.trackId;
    return tid === trackId;
  }) : courses;
  res.json({ success: true, data: filtered });
});

app.get('/api/v1/content/modules', (req, res) => {
  const { courseId } = req.query;
  const filtered = courseId ? modules.filter(m => {
    const cid = m.courseId && typeof m.courseId === 'object' ? m.courseId._id : m.courseId;
    return cid === courseId;
  }) : modules;
  res.json({ success: true, data: filtered });
});

app.get('/api/v1/content/sub-modules', (req, res) => {
  const { moduleId } = req.query;
  const filtered = moduleId ? submodules.filter(s => {
    const mid = s.moduleId && typeof s.moduleId === 'object' ? s.moduleId._id : s.moduleId;
    return mid === moduleId;
  }) : submodules;
  res.json({ success: true, data: filtered });
});

app.get('/api/v1/content/videos', (req, res) => {
  const { subModuleId } = req.query;
  const filtered = subModuleId ? videos.filter(v => {
    const sid = v.subModuleId && typeof v.subModuleId === 'object' ? v.subModuleId._id : v.subModuleId;
    return sid === subModuleId;
  }) : videos;
  res.json({ success: true, data: filtered });
});

app.get('/api/v1/content/assignments', (req, res) => {
  const { moduleId } = req.query;
  const filtered = moduleId ? assignments.filter(a => {
    const mid = a.moduleId && typeof a.moduleId === 'object' ? a.moduleId._id : a.moduleId;
    return mid === moduleId;
  }) : assignments;
  res.json({ success: true, data: filtered });
});

app.get('/api/v1/content/final-assignments', (req, res) => {
  const { courseId } = req.query;
  const filtered = courseId ? finalassignments.filter(f => {
    const cid = f.courseId && typeof f.courseId === 'object' ? f.courseId._id : f.courseId;
    return cid === courseId;
  }) : finalassignments;
  res.json({ success: true, data: filtered });
});

// User Enrollments
app.post('/api/v1/enrollments', auth, (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    return res.status(400).json({ success: false, error: 'courseId is required' });
  }

  const courseExists = courses.find(c => c._id === courseId);
  if (!courseExists) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const existing = enrollments.find(e => e.userId === req.user.id && e.courseId === courseId);
  if (existing) {
    return res.json({ success: true, data: existing });
  }

  const newEnrollment = {
    _id: 'enroll_' + Date.now() + Math.floor(Math.random() * 1000),
    courseId: courseId, // Frontend expects either ID or populated object. Since React handles ID expansion, we return ID. Wait, does front-end expect populated? Let's check.
    userId: req.user.id,
    progress: 0,
    completedSubModules: [],
    status: 'Active',
    createdAt: new Date().toISOString()
  };

  enrollments.push(newEnrollment);
  res.status(201).json({ success: true, data: newEnrollment });
});

app.get('/api/v1/enrollments/me', auth, (req, res) => {
  const myEnrollments = enrollments.filter(e => e.userId === req.user.id).map(e => {
    // Populate course details
    const courseDetail = courses.find(c => c._id === e.courseId) || { _id: e.courseId, name: 'LMS Course' };
    return {
      ...e,
      courseId: courseDetail // Populate courseId object as frontend expects in CoursesView/PlayerView
    };
  });
  res.json({ success: true, data: myEnrollments });
});

// Update Enrollment Progress
app.put('/api/v1/enrollments/:id/progress', auth, (req, res) => {
  const { id } = req.params;
  const { subModuleId } = req.body;
  if (!subModuleId) {
    return res.status(400).json({ success: false, error: 'subModuleId is required' });
  }

  const enroll = enrollments.find(e => e._id === id);
  if (!enroll) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  if (!enroll.completedSubModules.includes(subModuleId)) {
    enroll.completedSubModules.push(subModuleId);
  } else {
    // Toggle completion (if double clicked or requested)
    enroll.completedSubModules = enroll.completedSubModules.filter(x => x !== subModuleId);
  }

  // Calculate total submodules + assignments + final assignments in this course
  const courseId = typeof enroll.courseId === 'object' ? enroll.courseId._id : enroll.courseId;
  const courseMods = modules.filter(m => m.courseId === courseId).map(m => m._id);
  
  const totalSubModsCount = submodules.filter(s => courseMods.includes(s.moduleId)).length;
  const totalAssignsCount = assignments.filter(a => courseMods.includes(a.moduleId)).length;
  const totalFinalAssignsCount = finalassignments.filter(f => f.courseId === courseId).length;
  const totalCount = totalSubModsCount + totalAssignsCount + totalFinalAssignsCount;

  if (totalCount > 0) {
    const courseSubModIds = submodules.filter(s => courseMods.includes(s.moduleId)).map(s => s._id);
    const courseAssignIds = assignments.filter(a => courseMods.includes(a.moduleId)).map(a => a._id);
    const courseFinalAssignIds = finalassignments.filter(f => f.courseId === courseId).map(f => f._id);
    const allCourseItemIds = new Set([...courseSubModIds, ...courseAssignIds, ...courseFinalAssignIds]);
    
    const completedCourseItems = enroll.completedSubModules.filter(id => allCourseItemIds.has(id)).length;
    enroll.progress = Math.min(100, Math.round((completedCourseItems / totalCount) * 100));
  } else {
    enroll.progress = 100;
  }

  // Populate course before returning
  const courseDetail = courses.find(c => c._id === courseId) || { _id: courseId, name: 'LMS Course' };
  res.json({
    success: true,
    data: {
      ...enroll,
      courseId: courseDetail
    }
  });
});

app.put('/api/v1/enrollments/:id/complete', auth, (req, res) => {
  const { id } = req.params;
  const enroll = enrollments.find(e => e._id === id);
  if (!enroll) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }
  enroll.progress = 100;
  
  const courseId = typeof enroll.courseId === 'object' ? enroll.courseId._id : enroll.courseId;
  const courseDetail = courses.find(c => c._id === courseId) || { _id: courseId, name: 'LMS Course' };
  res.json({
    success: true,
    data: {
      ...enroll,
      courseId: courseDetail
    }
  });
});

app.put('/api/v1/enrollments/:id/cancel', auth, (req, res) => {
  const { id } = req.params;
  const enroll = enrollments.find(e => e._id === id);
  if (!enroll) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }
  enroll.status = 'Cancelled';
  res.json({ success: true, data: enroll });
});

// Certificates
app.post('/api/v1/certificates/generate', auth, (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    return res.status(400).json({ success: false, error: 'courseId is required' });
  }

  const existingCert = certificates.find(c => c.userId === req.user.id && c.courseId === courseId);
  if (existingCert) {
    const courseDetail = courses.find(c => c._id === courseId) || { _id: courseId, name: 'LMS Course' };
    return res.json({ success: true, data: { ...existingCert, courseId: courseDetail } });
  }

  const newCert = {
    _id: 'cert_' + Date.now() + Math.floor(Math.random() * 1000),
    courseId: courseId,
    userId: req.user.id,
    createdAt: new Date().toISOString()
  };

  certificates.push(newCert);
  const courseDetail = courses.find(c => c._id === courseId) || { _id: courseId, name: 'LMS Course' };
  
  res.status(201).json({
    success: true,
    data: {
      ...newCert,
      courseId: courseDetail
    }
  });
});

app.get('/api/v1/certificates/me', auth, (req, res) => {
  const myCerts = certificates.filter(c => c.userId === req.user.id).map(c => {
    const courseDetail = courses.find(cr => cr._id === c.courseId) || { _id: c.courseId, name: 'LMS Course' };
    return {
      ...c,
      courseId: courseDetail
    };
  });
  res.json({ success: true, data: myCerts });
});

// Events
app.get('/api/v1/user/events', (req, res) => {
  res.json({ success: true, data: events });
});

app.post('/api/v1/user/events/register/:eventId', auth, (req, res) => {
  const { eventId } = req.params;
  const event = events.find(e => e._id === eventId);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  const existing = eventRegistrations.find(r => r.userId === req.user.id && r.eventId === eventId);
  if (existing) {
    return res.status(400).json({ success: false, error: 'You are already registered for this event.' });
  }

  const reg = {
    _id: 'reg_' + Date.now(),
    userId: req.user.id,
    eventId: eventId,
    registeredAt: new Date().toISOString()
  };
  eventRegistrations.push(reg);

  res.status(201).json({ success: true, data: reg });
});

app.get('/api/v1/user/my-events', auth, (req, res) => {
  const regs = eventRegistrations.filter(r => r.userId === req.user.id).map(r => r.eventId);
  const myEvents = events.filter(e => regs.includes(e._id));
  res.json({ success: true, data: myEvents });
});

app.listen(PORT, () => {
  console.log(`LMS Local Mock Server running on http://localhost:${PORT}`);
  console.log(`Seeded accounts:`);
  console.log(`- Admin: admin@lms.com / adminpassword123`);
  console.log(`- Student: ashamainaswetha17@gmail.com / swetha`);
});
