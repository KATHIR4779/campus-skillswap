const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure they're registered
const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Message = require('../models/Message');
const MessageThread = require('../models/MessageThread');

const migrate = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('📊 Connected to database');
    
    // Create indexes for better performance
    console.log('📈 Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ university: 1 });
    await User.collection.createIndex({ major: 1 });
    await User.collection.createIndex({ 'rating.average': -1 });
    await User.collection.createIndex({ timeCredits: -1 });
    
    // Skill indexes
    await Skill.collection.createIndex({ title: 'text', description: 'text', tags: 'text' });
    await Skill.collection.createIndex({ category: 1 });
    await Skill.collection.createIndex({ teacher: 1 });
    await Skill.collection.createIndex({ 'rating.average': -1 });
    await Skill.collection.createIndex({ isActive: 1, isFeatured: 1 });
    await Skill.collection.createIndex({ createdAt: -1 });
    
    // Session indexes
    await Session.collection.createIndex({ teacher: 1, status: 1 });
    await Session.collection.createIndex({ student: 1, status: 1 });
    await Session.collection.createIndex({ skill: 1 });
    await Session.collection.createIndex({ scheduledDate: 1 });
    await Session.collection.createIndex({ status: 1 });
    await Session.collection.createIndex({ createdAt: -1 });
    
    // Review indexes
    await Review.collection.createIndex({ session: 1 });
    await Review.collection.createIndex({ reviewer: 1 });
    await Review.collection.createIndex({ reviewee: 1 });
    await Review.collection.createIndex({ type: 1 });
    await Review.collection.createIndex({ rating: -1 });
    await Review.collection.createIndex({ createdAt: -1 });
    await Review.collection.createIndex({ isPublic: 1, isVerified: 1 });
    
    // Message indexes
    await Message.collection.createIndex({ sender: 1, recipient: 1, createdAt: -1 });
    await Message.collection.createIndex({ recipient: 1, isRead: 1 });
    await Message.collection.createIndex({ session: 1 });
    await Message.collection.createIndex({ thread: 1, createdAt: 1 });
    await Message.collection.createIndex({ type: 1 });
    await Message.collection.createIndex({ createdAt: -1 });
    
    // MessageThread indexes
    await MessageThread.collection.createIndex({ 'participants.user': 1, isActive: 1 });
    await MessageThread.collection.createIndex({ type: 1 });
    await MessageThread.collection.createIndex({ session: 1 });
    await MessageThread.collection.createIndex({ lastMessageAt: -1 });
    await MessageThread.collection.createIndex({ createdAt: -1 });
    
    console.log('✅ Database indexes created successfully');
    
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      
      const adminUser = await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        university: 'Campus SkillSwap',
        major: 'Administration',
        year: 'Postgraduate',
        role: 'admin',
        isActive: true,
        isVerified: true,
        timeCredits: 1000,
        bio: 'System administrator for Campus SkillSwap platform'
      });
      
      console.log(`✅ Admin user created: ${adminUser.email}`);
    } else {
      console.log('👤 Admin user already exists');
    }
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;
