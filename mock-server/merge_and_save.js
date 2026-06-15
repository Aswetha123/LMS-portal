const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const liveDataPath = 'C:\\Users\\K Vijay  Swatha\\.gemini\\antigravity\\brain\\2b0f4fea-c3df-4402-8645-b16d13a2b07b\\scratch\\live_data.json';
    const mockServerDir = 'C:\\Users\\K Vijay  Swatha\\OneDrive\\Documents\\react_userpage\\mock-server';
    
    console.log('Reading live data file...');
    const rawData = fs.readFileSync(liveDataPath, 'utf8');
    const liveData = JSON.parse(rawData);

    // Create the test users list
    console.log('Hashing passwords for seeded users...');
    const adminHash = bcrypt.hashSync('adminpassword123', 10);
    const swethaHash = bcrypt.hashSync('swetha', 10);

    const seededUsers = [
      {
        _id: 'user_admin',
        name: 'LMS Administrator',
        email: 'admin@lms.com',
        password: adminHash,
        role: 'admin',
        isVerified: true,
        isFirstLogin: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'user_swetha',
        name: 'Swetha',
        email: 'ashamainaswetha17@gmail.com',
        password: swethaHash,
        role: 'user',
        isVerified: true,
        isFirstLogin: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'user_swetha_lms',
        name: 'Swetha LMS',
        email: 'swetha.lms@gmail.com',
        password: swethaHash,
        role: 'user',
        isVerified: true,
        isFirstLogin: false,
        createdAt: new Date().toISOString()
      }
    ];

    // Combine users and the live data
    const dbPayload = {
      users: seededUsers,
      departments: liveData.departments || [],
      categories: liveData.categories || [],
      domains: liveData.domains || [],
      tracks: liveData.tracks || [],
      courses: liveData.courses || [],
      modules: liveData.modules || [],
      submodules: liveData.submodules || [],
      videos: liveData.videos || [],
      assignments: liveData.assignments || [],
      finalassignments: liveData.finalassignments || [],
      events: liveData.events || []
    };

    // Save to C:\Users\K Vijay  Swatha\OneDrive\Documents\react_userpage\mock-server\db.json
    const dbJsonPath = path.join(mockServerDir, 'db.json');
    fs.writeFileSync(dbJsonPath, JSON.stringify(dbPayload, null, 2), 'utf8');
    console.log(`Successfully created db.json at ${dbJsonPath}`);

  } catch (error) {
    console.error('Error during merge:', error);
  }
}

main();
