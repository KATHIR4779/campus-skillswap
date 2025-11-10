const mongoose = require('mongoose');
const Skill = require('./backend/src/models/Skill');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/campus-skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateTestRatings() {
  try {
    // Find all skills
    const skills = await Skill.find({});
    console.log(`Found ${skills.length} skills`);
    
    // Update each skill with a test rating
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      console.log(`Updating skill: ${skill.title}`);
      
      // Set a test rating (4.5 for first skill, 4.0 for second, 3.5 for third, etc.)
      const testRating = Math.max(3.0, 5.0 - (i * 0.5));
      skill.rating.average = testRating;
      skill.rating.count = i + 1;
      
      await skill.save();
      console.log(`Updated ${skill.title} with rating ${testRating} (${i + 1} reviews)`);
    }
    
    console.log('All skills updated with test ratings');
  } catch (error) {
    console.error('Error updating ratings:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateTestRatings();