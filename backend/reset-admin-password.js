// Reset admin password
// Usage:
//   node reset-admin-password.js                     → prompts you to type a new password
//   node reset-admin-password.js MyNewPassword123    → sets that password directly

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mtg-inventory';

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: String,
  name: String
});

const User = mongoose.model('User', userSchema);

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function resetAdminPassword() {
  try {
    // Get new password from CLI arg or interactive prompt
    let newPassword = process.argv[2] || '';

    if (!newPassword) {
      newPassword = await prompt('Enter new admin password: ');
    }

    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters.');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      console.log('❌ No admin account found! Run create-admin.js first.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    admin.passwordHash = passwordHash;
    await admin.save();

    console.log('\n✅ Password updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:   ', admin.email);
    console.log('Password:', newPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Login at https://sylvanlibraryfe.vercel.app/login');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
