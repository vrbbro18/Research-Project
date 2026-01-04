// In-memory user data
// In a production system, passwords should be hashed
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

