// In-memory user store for authentication
// Used by routes/auth.js POST /login endpoint
// Roles: SUPER_ADMIN, OFFICER, ANALYST

const users = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'SUPER_ADMIN'
  },
  {
    username: 'officer',
    password: 'officer123',
    role: 'OFFICER'
  },
  {
    username: 'analyst',
    password: 'analyst123',
    role: 'ANALYST'
  }
];

module.exports = users;
