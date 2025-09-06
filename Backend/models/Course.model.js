// models/Course.model.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  educator: {
    type: mongoose.Schema.Types.ObjectId, // This will store the User ID of the educator
    ref: 'User', // This links this field to the User model
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0 // Course can be free (0) or paid
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming', 'Design', 'Business', 'Science', 'Mathematics', 'Languages', 'Music', 'Other'] // Predefined categories
  },
  imageUrl: {
    type: String,
    default: '' // A link to a course image
  },
  isPublished: {
    type: Boolean,
    default: false // Educator can save as draft first
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Create the Model
const Course = mongoose.model('Course', courseSchema);

// Export the Model
module.exports = Course;
