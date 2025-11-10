const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./src/models/User');

const createAdminUser = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@campusskillswap.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Is Active:', existingAdmin.isActive);
      console.log('Is Verified:', existingAdmin.isVerified);
      
      // Update password and ensure admin role
      existingAdmin.password = 'Pass';
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin user password and role updated!');
    } else {
      // Create admin user
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@campusskillswap.com',
        password: 'Skillswap@123', // This will be hashed automatically
        university: 'System Admin',
        major: 'Administration',
        year: 'Postgraduate',
        bio: 'System administrator with full access to the platform',
        role: 'admin',
        isActive: true,
        isVerified: true,
        timeCredits: 1000, // Give admin plenty of credits
        interests: ['System Administration', 'User Management', 'Platform Maintenance'],
        rating: {
          average: 5.0,
          count: 0
        },
        stats: {
          sessionsTaught: 0,
          sessionsCompleted: 0,
          studentsHelped: 0,
          totalHours: 0
        }
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@campusskillswap.com');
      console.log('Password: Skillswap@123');
      console.log('Role: admin');
    }

    console.log('\n📋 Admin Login Credentials:');
    console.log('Email: admin@campusskillswap.com');
    console.log('Password: Skillswap@123');
    console.log('\n🔐 You can now log in to the admin panel with these credentials');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run the script
createAdminUser();
