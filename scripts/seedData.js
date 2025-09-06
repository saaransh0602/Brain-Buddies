// scripts/seedData.js
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline'); // Built-in Node.js module for terminal input
const User = require('../models/User.model');
const Course = require('../models/Course.model');

// Create interface for terminal input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const seedData = async () => {
  // SAFETY CHECK: Confirm before deleting any data
  rl.question('🚨 This will DELETE ALL DATA in the database. Type "YES" to continue: ', async (answer) => {
    if (answer !== 'YES') {
      console.log('Seed cancelled.');
      rl.close();
      process.exit(0);
    }

    try {
      console.log('Connecting to database...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to DB for seeding');

      // Clear existing data (This is the destructive part)
      console.log('Clearing existing data...');
      await User.deleteMany({});
      await Course.deleteMany({});
      // Add other models if you have them: Review, Enrollment, etc.

      // Create sample users
      console.log('Creating sample data...');
      const sampleStudent = await User.create({
        username: 'demo_student',
        email: 'student@demo.com',
        password: 'password123', // Will be hashed automatically
        role: 'student'
      });

      const sampleEducator = await User.create({
        username: 'demo_educator',
        email: 'educator@demo.com',
        password: 'password123', // Will be hashed automatically
        role: 'educator'
      });

      // Create sample courses
      await Course.create([
        {
          title: 'Web Development Bootcamp',
          description: 'Learn full-stack web development from scratch',
          educator: sampleEducator._id,
          price: 49.99,
          category: 'Programming',
          isPublished: true,
          imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&w=1000&q=80'
        },
        {
          title: 'Graphic Design Fundamentals',
          description: 'Master the principles of good design',
          educator: sampleEducator._id,
          price: 29.99,
          category: 'Design', 
          isPublished: true,
          imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1000&q=80'
        }
      ]);

      console.log('✅ Demo data seeded successfully!');
      console.log('Student Login: student@demo.com / password123');
      console.log('Educator Login: educator@demo.com / password123');
      
      rl.close();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding error:', error);
      rl.close();
      process.exit(1);
    }
  });
};

seedData();