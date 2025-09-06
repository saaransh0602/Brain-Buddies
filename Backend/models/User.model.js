// models/User.model.js - Differentiating between students and educators
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt to hash passwords

// 1. Define the Schema (the structure of a User document in the database)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // No two users can have the same username
    trim: true, // Removes extra spaces
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
    lowercase: true, // Converts to lowercase
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] // Basic email validation
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'educator'] // Role can ONLY be either 'student' or 'educator'
  },
  // Profile details that can be added later
  bio: {
    type: String,
    maxlength: 500
  },
  profilePicture: {
    type: String, // This will be a URL to an image, stored later (e.g., in Cloudinary)
    default: ''
  }
}, {
  timestamps: true // Adds `createdAt` and `updatedAt` fields automatically
});

// 2. Middleware (Pre-save Hook): Hash the password BEFORE saving the user to the database
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt (extra random data to make hashing more secure)
    const salt = await bcrypt.genSalt(12);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 3. Method: Compare entered password with the hashed password in the database
// This will be used during login
userSchema.methods.isCorrectPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 4. Create the Model from the Schema
const User = mongoose.model('User', userSchema);

// 5. Export the Model
module.exports = User;
