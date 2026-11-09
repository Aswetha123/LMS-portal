# 🎓 SkillSphere LMS - Interactive Learning Portal

A modern, responsive, and full-featured Learning Management System (LMS) client built with **React**, **Vite**, and **Node.js**. SkillSphere provides a streamlined education platform featuring deep hierarchical course navigation, interactive video learning with real-time progress tracking, final capstone assignments, verifiable certificates, event registrations, and complete light/dark theme customization.

---

## 🌟 Key Features

- **📚 Hierarchical Course Syllabus**:
  - Organized curriculum browsing: `Departments` → `Categories` → `Domains` → `Tracks` → `Courses` → `Modules` → `Sub-Modules` → `Videos`.
  - Nested, collapsible double-accordion UI for intuitive learning path navigation.
- **🎥 Interactive Course Player**:
  - Distraction-free video tutorial player with synchronized syllabus sidebar.
  - Automatic progress tracking and lesson completion checkmarks.
- **📝 Assignments & Capstones**:
  - Support for submodule assignments and course-level **Final Capstone Assignments**.
  - Dynamic score calculation and prerequisite checks for certifications.
- **🏆 Certification System**:
  - Automatically unlocks upon achieving 100% course progress.
  - View and download achievement certificates directly from the **My Certificates** dashboard.
- **🌗 Theme Customization**:
  - Switch between **Bright (Light)**, **Dark**, and **Auto (System)** modes.
  - System mode listens in real-time to your operating system's color preferences (`prefers-color-scheme`).
- **📅 Events Hub**:
  - Discover and register for expert-led technical and non-technical workshops and webinars.
- **🛠️ Integrated Dev Playbook**:
  - Slide-out developer drawer for switching between the **Local Mock Database** (`http://localhost:5000`) and the **Live Cloud API**.

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite, Modern CSS3 (CSS Variables, Flexbox/Grid, Responsive Media Queries), FontAwesome Icons
- **Backend / Mock API**: Node.js, Express, Local JSON Database (`db.json`)
- **State Management**: Reactive state hooks & dynamic token-based API client (`api.js`)

---

## 📂 Project Structure

```text
react_userpage/
├── dist/                     # Optimized production build artifacts
├── mock-server/              # Local mock backend server
│   ├── db.json               # Seeded mock database (courses, modules, users, events)
│   └── server.js             # Express mock API server (Port 5000)
├── public/                   # Static assets & SVG icons
├── src/
│   ├── assets/               # Images and logos
│   ├── components/           # Reusable UI components
│   │   ├── DevPlaybook.jsx   # Environment & dev testing drawer
│   │   ├── Footer.jsx        # Platform footer
│   │   ├── Navbar.jsx        # Navigation bar with theme selector
│   │   └── ...
│   ├── views/                # Top-level view controllers
│   │   ├── HomeView.jsx      # Landing page with hero & 4-column event grid
│   │   ├── CoursesView.jsx   # Course catalog & syllabus explorer
│   │   ├── PlayerView.jsx    # Classroom player & assignment submitter
│   │   ├── CertificatesView.jsx # Certificate viewer & claim hub
│   │   └── DashboardView.jsx # Student enrollment dashboard
│   ├── api.js                # Unified REST API client
│   ├── App.jsx               # Application router & theme controller
│   ├── index.css             # Global design tokens & dark mode styling
│   └── main.jsx              # Application entry point
├── package.json              # Project dependencies & scripts
└── vite.config.js            # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 1. Clone the Repository

```bash
git clone https://github.com/Aswetha123/LMS-portal.git
cd LMS-portal
```

### 2. Install Dependencies

```bash
npm install
cd mock-server && npm install && cd ..
```

### 3. Start the Local Backend API Server (Port 5000)

In a terminal window:
```bash
cd mock-server
node server.js
```
The API server will run at `http://localhost:5000`.

### 4. Start the Frontend Application (Port 3005)

In a second terminal window:
```bash
npm run dev
```
Open **[http://localhost:3005](http://localhost:3005)** in your web browser.

---

## 🔑 Default Test Credentials

Use these pre-seeded accounts to explore different roles on the platform:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@lms.com` | `adminpassword123` | Full student & curriculum management access |
| **Student** | `ashamainaswetha17@gmail.com` | `123456` | Student enrollments, courses, & certificates |

*(You can also create new student accounts instantly via the Dev Playbook on the bottom right of the screen!)*

---

## 📜 Available Scripts

- `npm run dev` - Launches the Vite development server with Hot Module Replacement (HMR).
- `npm run build` - Compiles and bundles production-ready assets into the `dist/` directory.
- `npm run preview` - Locally previews the production build.

---

## 👩‍💻 Author

Created & Maintained by **[Aswetha](https://github.com/Aswetha123)**.
