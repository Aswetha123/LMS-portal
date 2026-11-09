/**
 * SkillSphere LMS API Client
 * Integrates with the backend API
 */

const getApiBaseUrl = () => {
  const env = localStorage.getItem('lms_api_env') || 'local';
  if (env === 'live') {
    return 'https://brillon-tasks-1.onrender.com/api/v1';
  }
  if (typeof window !== 'undefined' && (window.location.port === '3005' || !window.location.port)) {
    return '/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const API = {
  // --- Helper Methods ---
  getToken() {
    return localStorage.getItem('lms_token');
  },

  setToken(token, role) {
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_role', role);
  },

  clearToken() {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_role');
  },

  getRole() {
    return localStorage.getItem('lms_role');
  },

  async request(endpoint, options = {}) {
    const url = `${getApiBaseUrl()}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      let data = {};
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: response.ok, message: text };
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired - let the App layer handle state reset if token exists
          if (this.getToken()) {
            this.clearToken();
            // Dispatch custom event to let React components know
            window.dispatchEvent(new Event('lms-session-expired'));
          }
        }
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      // Automatically unwrap standard response data envelope
      if (data && data.success && data.hasOwnProperty('data')) {
        return data.data;
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      if (error.message === 'Failed to fetch') {
        throw new Error('Could not connect to the backend server. Please ensure the backend is running (run node server.js to start both) or switch to Live Render Server in the dev playbook (bottom right).');
      }
      throw error;
    }
  },

  // --- Auth & Admin Routes ---
  async adminLogin(email, password) {
    try {
      const data = await this.request('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data && data.token) {
        this.setToken(data.token, 'admin');
      }
      return data;
    } catch (err) {
      if (err.message && (err.message.includes('Could not connect') || err.message.includes('Failed to fetch'))) {
        const demoToken = 'offline-demo-admin-token';
        this.setToken(demoToken, 'admin');
        return { token: demoToken, role: 'admin', isVerified: true, isFirstLogin: false };
      }
      throw err;
    }
  },

  async adminCreateUser(name, email) {
    return this.request('/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
  },

  async adminGetUsers() {
    return this.request('/admin/users', { method: 'GET' });
  },

  // --- Event Management (Admin Only) ---
  async adminCreateEvent(title, description, date, location) {
    return this.request('/admin/events', {
      method: 'POST',
      body: JSON.stringify({ title, description, date, location }),
    });
  },

  async adminUpdateEvent(id, title, description, date, location) {
    return this.request(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, date, location }),
    });
  },

  async adminDeleteEvent(id) {
    return this.request(`/admin/events/${id}`, { method: 'DELETE' });
  },

  async adminGetEventRegistrations() {
    return this.request('/admin/registrations', { method: 'GET' });
  },

  // --- User Routes & Event Registrations ---
  async userLogin(email, password) {
    try {
      const data = await this.request('/user/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const token = typeof data === 'string' ? data : (data && data.token);
      if (token) {
        this.setToken(token, 'user');
      }
      return data;
    } catch (err) {
      if (err.message && (err.message.includes('Could not connect') || err.message.includes('Failed to fetch'))) {
        const demoToken = 'offline-demo-user-token';
        this.setToken(demoToken, 'user');
        return { token: demoToken, role: 'user', isVerified: true, isFirstLogin: false };
      }
      throw err;
    }
  },

  async userChangePassword(newPassword) {
    return this.request('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },

  async userVerifyEmail(token) {
    return this.request(`/user/verify-email/${token}`, { method: 'GET' });
  },

  async userGetEvents() {
    return this.request('/user/events', { method: 'GET' });
  },

  async userRegisterEvent(eventId) {
    return this.request(`/user/events/register/${eventId}`, { method: 'POST' });
  },

  async userGetMyEvents() {
    return this.request('/user/my-events', { method: 'GET' });
  },

  // --- Course Hierarchy ---
  async getDepartments() {
    return this.request('/hierarchy/departments', { method: 'GET' });
  },

  async adminCreateDepartment(name, description) {
    return this.request('/hierarchy/departments', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async adminUpdateDepartment(id, name, description) {
    return this.request(`/hierarchy/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
  },

  async adminDeleteDepartment(id) {
    return this.request(`/hierarchy/departments/${id}`, { method: 'DELETE' });
  },

  async getCategories(departmentId) {
    const query = departmentId ? `?departmentId=${departmentId}` : '';
    return this.request(`/hierarchy/categories${query}`, { method: 'GET' });
  },

  async adminCreateCategory(departmentId, name, description) {
    return this.request('/hierarchy/categories', {
      method: 'POST',
      body: JSON.stringify({ departmentId, name, description }),
    });
  },

  async adminUpdateCategory(id, departmentId, name, description) {
    return this.request(`/hierarchy/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ departmentId, name, description }),
    });
  },

  async adminDeleteCategory(id) {
    return this.request(`/hierarchy/categories/${id}`, { method: 'DELETE' });
  },

  async getDomains(categoryId) {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request(`/hierarchy/domains${query}`, { method: 'GET' });
  },

  async adminCreateDomain(categoryId, name, description) {
    return this.request('/hierarchy/domains', {
      method: 'POST',
      body: JSON.stringify({ categoryId, name, description }),
    });
  },

  async adminUpdateDomain(id, categoryId, name, description) {
    return this.request(`/hierarchy/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ categoryId, name, description }),
    });
  },

  async adminDeleteDomain(id) {
    return this.request(`/hierarchy/domains/${id}`, { method: 'DELETE' });
  },

  async getTracks(domainId) {
    const query = domainId ? `?domainId=${domainId}` : '';
    return this.request(`/hierarchy/tracks${query}`, { method: 'GET' });
  },

  async adminCreateTrack(domainId, name, description) {
    return this.request('/hierarchy/tracks', {
      method: 'POST',
      body: JSON.stringify({ domainId, name, description }),
    });
  },

  async adminUpdateTrack(id, domainId, name, description) {
    return this.request(`/hierarchy/tracks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ domainId, name, description }),
    });
  },

  async adminDeleteTrack(id) {
    return this.request(`/hierarchy/tracks/${id}`, { method: 'DELETE' });
  },

  // --- Course Content ---
  async getCourses(trackId) {
    const query = trackId ? `?trackId=${trackId}` : '';
    return this.request(`/content/courses${query}`, { method: 'GET' });
  },

  async adminCreateCourse(trackId, name, description, duration, instructor, status = 'Active') {
    return this.request('/content/courses', {
      method: 'POST',
      body: JSON.stringify({ trackId, name, description, duration, instructor, status }),
    });
  },

  async adminUpdateCourse(id, trackId, name, description, duration, instructor, status = 'Active') {
    return this.request(`/content/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ trackId, name, description, duration, instructor, status }),
    });
  },

  async adminDeleteCourse(id) {
    return this.request(`/content/courses/${id}`, { method: 'DELETE' });
  },

  async getModules(courseId) {
    const query = courseId ? `?courseId=${courseId}` : '';
    return this.request(`/content/modules${query}`, { method: 'GET' });
  },

  async adminCreateModule(courseId, name, order) {
    return this.request('/content/modules', {
      method: 'POST',
      body: JSON.stringify({ courseId, name, order: parseInt(order, 10) }),
    });
  },

  async adminUpdateModule(id, courseId, name, order) {
    return this.request(`/content/modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ courseId, name, order: parseInt(order, 10) }),
    });
  },

  async adminDeleteModule(id) {
    return this.request(`/content/modules/${id}`, { method: 'DELETE' });
  },

  async getSubModules(moduleId) {
    const query = moduleId ? `?moduleId=${moduleId}` : '';
    return this.request(`/content/sub-modules${query}`, { method: 'GET' });
  },

  async adminCreateSubModule(moduleId, name, order) {
    return this.request('/content/sub-modules', {
      method: 'POST',
      body: JSON.stringify({ moduleId, name, order: parseInt(order, 10) }),
    });
  },

  async adminUpdateSubModule(id, moduleId, name, order) {
    return this.request(`/content/sub-modules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ moduleId, name, order: parseInt(order, 10) }),
    });
  },

  async adminDeleteSubModule(id) {
    return this.request(`/content/sub-modules/${id}`, { method: 'DELETE' });
  },

  async getVideos(subModuleId) {
    const query = subModuleId ? `?subModuleId=${subModuleId}` : '';
    return this.request(`/content/videos${query}`, { method: 'GET' });
  },

  async adminCreateVideo(subModuleId, title, videoUrl, duration) {
    return this.request('/content/videos', {
      method: 'POST',
      body: JSON.stringify({ subModuleId, title, videoUrl, duration }),
    });
  },

  async adminUpdateVideo(id, subModuleId, title, videoUrl, duration) {
    return this.request(`/content/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ subModuleId, title, videoUrl, duration }),
    });
  },

  async adminDeleteVideo(id) {
    return this.request(`/content/videos/${id}`, { method: 'DELETE' });
  },

  async getAssignments(moduleId) {
    const query = moduleId ? `?moduleId=${moduleId}` : '';
    return this.request(`/content/assignments${query}`, { method: 'GET' });
  },

  async getFinalAssignments(courseId) {
    const query = courseId ? `?courseId=${courseId}` : '';
    return this.request(`/content/final-assignments${query}`, { method: 'GET' });
  },

  async adminCreateAssignment(moduleId, title, description, maxMarks) {
    return this.request('/content/assignments', {
      method: 'POST',
      body: JSON.stringify({ moduleId, title, description, maxMarks: parseInt(maxMarks, 10) }),
    });
  },

  async adminUpdateAssignment(id, moduleId, title, description, maxMarks) {
    return this.request(`/content/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ moduleId, title, description, maxMarks: parseInt(maxMarks, 10) }),
    });
  },

  async adminDeleteAssignment(id) {
    return this.request(`/content/assignments/${id}`, { method: 'DELETE' });
  },

  // --- Enrollments ---
  async enrollInCourse(courseId) {
    return this.request('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  async getMyEnrollments() {
    return this.request('/enrollments/me', { method: 'GET' });
  },

  async updateEnrollmentProgress(enrollmentId, subModuleId) {
    return this.request(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ subModuleId }),
    });
  },

  async cancelEnrollment(enrollmentId) {
    return this.request(`/enrollments/${enrollmentId}/cancel`, { method: 'PUT' });
  },

  async completeEnrollment(enrollmentId) {
    return this.request(`/enrollments/${enrollmentId}/complete`, { method: 'PUT' });
  },

  async adminGetCourseEnrollments(courseId) {
    return this.request(`/enrollments/course/${courseId}`, { method: 'GET' });
  },

  // --- Certificates ---
  async generateCertificate(courseId) {
    return this.request('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  async getMyCertificates() {
    return this.request('/certificates/me', { method: 'GET' });
  },
};

export default API;
