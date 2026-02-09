// Quick script to create admin user
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

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('\n📋 Found existing admin account:');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name || 'Not set');
      console.log('\nIf you forgot the password, delete this user in MongoDB and run this script again.');
    } else {
      // Create new admin
      const email = 'admin@sylvan.com';
      const password = 'Admin123456';
      const passwordHash = await bcrypt.hash(password, 10);

      const admin = await User.create({
        email,
        passwordHash,
        role: 'admin',
        name: 'Administrator'
      });

      console.log('\n✅ Admin account created!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  Please save these credentials!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
