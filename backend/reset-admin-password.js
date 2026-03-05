// Reset admin password
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mtg-inventory';

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: String,
  name: String
});

const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin account found!');
      process.exit(1);
    }

    // Generate a random password so it is never predictable from the source code
    const newPassword = 'Adm-' + require('crypto').randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    admin.passwordHash = passwordHash;
    await admin.save();

    console.log('\n✅ Password reset successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    ', admin.email);
    console.log('Password: ', newPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Use these credentials to login at http://localhost:5173/admin/login');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
