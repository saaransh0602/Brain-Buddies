// models/Review.model.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model (the student writing the review)
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Links to the Course model (the course being reviewed)
    required: true
  }
}, {
  timestamps: true
});

// Optional: Prevent a student from submitting more than one review per course
reviewSchema.index({ student: 1, course: 1 }, { unique: true });

// Create the Model
const Review = mongoose.model('Review', reviewSchema);

// Export the Model
module.exports = Review;
