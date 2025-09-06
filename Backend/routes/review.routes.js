// routes/review.routes.js
const express = require('express');
const Review = require('../models/Review.model');
const authMiddleware = require('../middleware/auth.middleware'); // Protect routes
const router = express.Router();

// POST /api/reviews/course/:courseId - Create a review for a course (Protected - Students only)
router.post('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    // 1. Check if the logged-in user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only students can submit reviews.' });
    }

    const { courseId } = req.params; // Get course ID from URL parameter
    const { rating, comment } = req.body; // Get review data from body

    // 2. Check if the student has already reviewed this course
    const existingReview = await Review.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this course.' });
    }

    // 3. Create and save the new review
    const newReview = new Review({
      rating,
      comment,
      student: req.user._id, // From auth middleware
      course: courseId       // From URL parameter
    });

    const savedReview = await newReview.save();

    // 4. Send success response
    res.status(201).json({
      message: 'Review submitted successfully!',
      review: savedReview
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Internal server error while submitting review.' });
  }
});

// GET /api/reviews/course/:courseId - Get all reviews for a specific course (Public)
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ course: courseId })
                              .populate('student', 'username'); // Show reviewer's name

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error while fetching reviews.' });
  }
});

module.exports = router;
