// routes/course.routes.js
const express = require('express');
const Course = require('../models/Course.model');
const authMiddleware = require('../middleware/auth.middleware'); // Import the auth middleware
const router = express.Router();

// POST /api/courses - Create a new course (Protected Route - only for educators)
// The authMiddleware runs first. It will check for a valid JWT token.
// If successful, it attaches the user document to `req.user`
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 1. Check if the logged-in user is an educator
    if (req.user.role !== 'educator') {
      return res.status(403).json({ message: 'Access denied. Only educators can create courses.' });
    }

    // 2. Get course data from the request body
    const { title, description, price, category, imageUrl } = req.body;

    // 3. Create a new course document
    const newCourse = new Course({
      title,
      description,
      price,
      category,
      imageUrl,
      educator: req.user._id // The educator's ID comes from the authenticated user (from the middleware)
    });

    // 4. Save the new course to the database
    const savedCourse = await newCourse.save();

    // 5. Send success response
    res.status(201).json({
      message: 'Course created successfully!',
      course: savedCourse
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Internal server error while creating course.' });
  }
});

// GET /api/courses - Get all published courses (Public route, no auth needed)
router.get('/', async (req, res) => {
  try {
    // Find courses that are published, and populate the educator's name
    const courses = await Course.find({ isPublished: true })
                              .populate('educator', 'username'); // Fetches educator's username from User model

    res.status(200).json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Internal server error while fetching courses.' });
  }
});

// Export the router
module.exports = router;
