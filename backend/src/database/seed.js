const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const Review = require('../models/Review');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('📊 Connected to database');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Skill.deleteMany({});
    await Session.deleteMany({});
    await Review.deleteMany({});
    
    // Create sample users
    console.log('👥 Creating sample users...');
    const users = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        password: 'password123',
        university: 'Anna University',
        major: 'Computer Science',
        year: '3rd Year',
        bio: 'Passionate about web development and teaching others. Love to share knowledge!',
        interests: ['Web Development', 'JavaScript', 'React', 'Teaching'],
        timeCredits: 45,
        rating: { average: 4.8, count: 12 },
        isActive: true,
        isVerified: true
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
        password: 'password123',
        university: 'Anna University',
        major: 'Mathematics',
        year: '2nd Year',
        bio: 'Math enthusiast with a passion for helping others understand complex concepts.',
        interests: ['Mathematics', 'Calculus', 'Linear Algebra', 'Statistics'],
        timeCredits: 32,
        rating: { average: 4.6, count: 8 },
        isActive: true,
        isVerified: true
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@example.com',
        password: 'password123',
        university: 'Anna University',
        major: 'English Literature',
        year: '4th Year',
        bio: 'Creative writer and language tutor. Helping students improve their communication skills.',
        interests: ['Writing', 'Literature', 'Grammar', 'Communication'],
        timeCredits: 28,
        rating: { average: 4.9, count: 15 },
        isActive: true,
        isVerified: true
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        password: 'password123',
        university: 'Anna University',
        major: 'Physics',
        year: 'Postgraduate',
        bio: 'Physics PhD student with extensive knowledge in quantum mechanics and theoretical physics.',
        interests: ['Physics', 'Quantum Mechanics', 'Mathematics', 'Research'],
        timeCredits: 67,
        rating: { average: 4.7, count: 20 },
        isActive: true,
        isVerified: true
      },
      {
        name: 'Emma Brown',
        email: 'emma.brown@example.com',
        password: 'password123',
        university: 'Anna University',
        major: 'Business Administration',
        year: '3rd Year',
        bio: 'Business student with experience in entrepreneurship and project management.',
        interests: ['Business', 'Entrepreneurship', 'Marketing', 'Finance'],
        timeCredits: 41,
        rating: { average: 4.5, count: 9 },
        isActive: true,
        isVerified: true
      },
      {
        name: 'Frank Miller',
        email: 'frank.miller@example.com',
        password: 'password123',
        university: 'Anna University',
        major: 'Mechanical Engineering',
        year: '4th Year',
        bio: 'Engineering student passionate about CAD design and mechanical systems.',
        interests: ['Engineering', 'CAD Design', 'Manufacturing', 'Automation'],
        timeCredits: 35,
        rating: { average: 4.4, count: 6 },
        isActive: true,
        isVerified: true
      }
    ]);
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create sample skills
    console.log('🎯 Creating sample skills...');
    const skills = await Skill.create([
      {
        title: 'Web Development with React',
        description: 'Learn modern web development using React.js. Perfect for beginners who want to build dynamic web applications.',
        category: 'Technology',
        level: 'Beginner',
        creditsPerHour: 3,
        teacher: users[0]._id, // Alice
        location: 'online',
        sessionDuration: 60,
        maxStudents: 5,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableTimes: [{ start: '09:00', end: '12:00' }, { start: '18:00', end: '21:00' }],
        prerequisites: ['Basic HTML/CSS knowledge'],
        learningOutcomes: [
          'Understand React fundamentals',
          'Build interactive components',
          'Manage state effectively',
          'Deploy React applications'
        ],
        materialsRequired: ['Laptop with internet connection', 'Node.js installed'],
        tags: ['React', 'JavaScript', 'Web Development', 'Frontend'],
        rating: { average: 4.8, count: 12 },
        isActive: true,
        isVerified: true,
        isFeatured: true
      },
      {
        title: 'Calculus Made Easy',
        description: 'Master differential and integral calculus with clear explanations and practical examples.',
        category: 'Academics',
        level: 'Intermediate',
        creditsPerHour: 4,
        teacher: users[1]._id, // Bob
        location: 'campus-library',
        sessionDuration: 90,
        maxStudents: 8,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableTimes: [{ start: '14:00', end: '17:00' }, { start: '18:00', end: '21:00' }],
        prerequisites: ['Algebra and trigonometry'],
        learningOutcomes: [
          'Understand limits and continuity',
          'Master derivatives and applications',
          'Solve integration problems',
          'Apply calculus to real-world problems'
        ],
        materialsRequired: ['Graphing calculator', 'Notebook'],
        tags: ['Mathematics', 'Calculus', 'Derivatives', 'Integration'],
        rating: { average: 4.6, count: 8 },
        isActive: true,
        isVerified: true,
        isFeatured: true
      },
      {
        title: 'Creative Writing Workshop',
        description: 'Develop your creative writing skills through guided exercises and peer feedback.',
        category: 'Arts',
        level: 'Beginner',
        creditsPerHour: 2,
        teacher: users[2]._id, // Carol
        location: 'campus-cafeteria',
        sessionDuration: 120,
        maxStudents: 10,
        availableDays: ['saturday', 'sunday'],
        availableTimes: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
        prerequisites: ['Basic English proficiency'],
        learningOutcomes: [
          'Develop creative voice',
          'Learn story structure',
          'Practice character development',
          'Receive constructive feedback'
        ],
        materialsRequired: ['Writing materials', 'Laptop or notebook'],
        tags: ['Writing', 'Creative', 'Literature', 'Storytelling'],
        rating: { average: 4.9, count: 15 },
        isActive: true,
        isVerified: true,
        isFeatured: true
      },
      {
        title: 'Introduction to Quantum Mechanics',
        description: 'Explore the fascinating world of quantum mechanics with mathematical rigor and intuitive explanations.',
        category: 'Academics',
        level: 'Advanced',
        creditsPerHour: 6,
        teacher: users[3]._id, // David
        location: 'study-rooms',
        sessionDuration: 90,
        maxStudents: 6,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableTimes: [{ start: '18:00', end: '21:00' }],
        prerequisites: ['Advanced calculus', 'Linear algebra', 'Physics background'],
        learningOutcomes: [
          'Understand wave-particle duality',
          'Master Schrödinger equation',
          'Explore quantum states',
          'Apply quantum principles'
        ],
        materialsRequired: ['Scientific calculator', 'Physics textbooks'],
        tags: ['Physics', 'Quantum Mechanics', 'Mathematics', 'Advanced'],
        rating: { average: 4.7, count: 20 },
        isActive: true,
        isVerified: true,
        isFeatured: true
      },
      {
        title: 'Digital Marketing Fundamentals',
        description: 'Learn the basics of digital marketing including SEO, social media, and content marketing.',
        category: 'Life Skills',
        level: 'Beginner',
        creditsPerHour: 3,
        teacher: users[4]._id, // Emma
        location: 'online',
        sessionDuration: 75,
        maxStudents: 10,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        availableTimes: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
        prerequisites: ['Basic computer skills'],
        learningOutcomes: [
          'Understand digital marketing landscape',
          'Learn SEO best practices',
          'Master social media marketing',
          'Create marketing campaigns'
        ],
        materialsRequired: ['Laptop with internet', 'Social media accounts'],
        tags: ['Marketing', 'Digital', 'SEO', 'Social Media'],
        rating: { average: 4.5, count: 9 },
        isActive: true,
        isVerified: true,
        isFeatured: false
      },
      {
        title: 'AutoCAD Design Basics',
        description: 'Learn computer-aided design using AutoCAD for mechanical and architectural drawings.',
        category: 'Technology',
        level: 'Beginner',
        creditsPerHour: 4,
        teacher: users[5]._id, // Frank
        location: 'study-rooms',
        sessionDuration: 90,
        maxStudents: 8,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        availableTimes: [{ start: '14:00', end: '17:00' }],
        prerequisites: ['Basic computer skills'],
        learningOutcomes: [
          'Navigate AutoCAD interface',
          'Create 2D drawings',
          'Use drawing tools effectively',
          'Understand technical drawings'
        ],
        materialsRequired: ['Laptop with AutoCAD installed', 'Mouse'],
        tags: ['CAD', 'Design', 'Engineering', 'AutoCAD'],
        rating: { average: 4.4, count: 6 },
        isActive: true,
        isVerified: true,
        isFeatured: false
      }
    ]);
    
    console.log(`✅ Created ${skills.length} skills`);
    
    // Create sample sessions
    console.log('📅 Creating sample sessions...');
    const sessions = await Session.create([
      {
        title: 'React Component Development',
        description: 'Building reusable React components with props and state',
        teacher: users[0]._id,
        student: users[1]._id,
        skill: skills[0]._id,
        creditsPerHour: 3,
        duration: 60,
        totalCredits: 3,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        startTime: '14:00',
        endTime: '15:00',
        location: 'online',
        locationDetails: 'Google Meet link will be shared',
        status: 'approved',
        teacherConfirmed: true,
        studentConfirmed: true
      },
      {
        title: 'Calculus Integration Techniques',
        description: 'Learning various integration methods and applications',
        teacher: users[1]._id,
        student: users[0]._id,
        skill: skills[1]._id,
        creditsPerHour: 4,
        duration: 90,
        totalCredits: 6,
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        startTime: '16:00',
        endTime: '17:30',
        location: 'campus-library',
        locationDetails: 'Study room 3B',
        status: 'confirmed',
        teacherConfirmed: true,
        studentConfirmed: true
      },
      {
        title: 'Creative Writing Exercise',
        description: 'Character development and dialogue writing workshop',
        teacher: users[2]._id,
        student: users[3]._id,
        skill: skills[2]._id,
        creditsPerHour: 2,
        duration: 120,
        totalCredits: 4,
        scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        startTime: '10:00',
        endTime: '12:00',
        location: 'campus-cafeteria',
        locationDetails: 'Quiet corner table',
        status: 'pending',
        teacherConfirmed: false,
        studentConfirmed: true
      }
    ]);
    
    console.log(`✅ Created ${sessions.length} sessions`);
    
    // Create sample reviews
    console.log('⭐ Creating sample reviews...');
    const reviews = await Review.create([
      {
        session: sessions[0]._id,
        reviewer: users[1]._id,
        reviewee: users[0]._id,
        type: 'teacher',
        rating: 5,
        detailedRatings: {
          teachingQuality: 5,
          communication: 5,
          punctuality: 5,
          preparation: 5
        },
        comment: 'Alice is an excellent teacher! She explained React concepts clearly and was very patient with my questions. Highly recommended!',
        tags: ['patient', 'clear', 'helpful'],
        isPublic: true,
        isVerified: true
      },
      {
        session: sessions[1]._id,
        reviewer: users[0]._id,
        reviewee: users[1]._id,
        type: 'teacher',
        rating: 4,
        detailedRatings: {
          teachingQuality: 4,
          communication: 4,
          punctuality: 5,
          preparation: 4
        },
        comment: 'Bob helped me understand integration techniques really well. The session was well-structured and he provided good examples.',
        tags: ['structured', 'examples', 'mathematics'],
        isPublic: true,
        isVerified: true
      },
      {
        session: sessions[0]._id,
        reviewer: users[0]._id,
        reviewee: users[1]._id,
        type: 'student',
        rating: 4,
        detailedRatings: {
          participation: 4,
          preparation: 4,
          communication: 5
        },
        comment: 'Bob was an engaged student who asked thoughtful questions and completed all the exercises. Great to work with!',
        tags: ['engaged', 'prepared', 'questions'],
        isPublic: true,
        isVerified: true
      }
    ]);
    
    console.log(`✅ Created ${reviews.length} reviews`);
    
    // Update user ratings based on reviews
    console.log('📊 Updating user ratings...');
    for (const user of users) {
      const userReviews = reviews.filter(review => 
        review.reviewee.toString() === user._id.toString()
      );
      
      if (userReviews.length > 0) {
        const averageRating = userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length;
        user.rating = {
          average: Math.round(averageRating * 10) / 10,
          count: userReviews.length
        };
        await user.save();
      }
    }
    
    console.log('✅ User ratings updated');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created: ${users.length} users, ${skills.length} skills, ${sessions.length} sessions, ${reviews.length} reviews`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
