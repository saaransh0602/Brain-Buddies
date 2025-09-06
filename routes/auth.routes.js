/*// routes/auth.routes.js - The Registration System
const express = require('express');
const User = require('../models/User.model'); // Import the User model
const router = express.Router(); // Create a Router instead of a new Express app

// POST /api/auth/signup - Route for user registration
router.post('/signup', async (req, res) => {
  try {
    // 1. Get user input from the request body
    const { username, email, password, role } = req.body;

    // 2. Check if the user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or username.'
      });
    }

    // 3. Create a new user document (The pre('save') middleware will hash the password)
    const newUser = new User({
      username,
      email,
      password, // This is the plain text password. It will be hashed automatically before saving.
      role
    });

    // 4. Save the new user to the database
    const savedUser = await newUser.save();

    // 5. Respond successfully (NEVER send back the password, even hashed)
    res.status(201).json({
      message: 'User created successfully!',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error during signup.' });
  }
});

// POST /api/auth/login - We will build this next!
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

// Export the router so it can be used in index.js
module.exports = router;*/

// routes/auth.routes.js
const express = require('express');
const jwt = require('jsonwebtoken'); // Import jwt
const User = require('../models/User.model');
const router = express.Router();

// ... (keep your existing signup route code above this line) ...

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    // 1. Get user input from request body
    const { email, password } = req.body;

    // 2. Basic validation: Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 3. Find the user by email
    const user = await User.findOne({ email });
    
    // 4. If user doesn't exist OR password is incorrect, return error
    if (!user) {
      // We use a generic message for security (don't reveal if email exists or not)
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 5. Use the method from the User model to check the password
    const isPasswordCorrect = await user.isCorrectPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 6. If we get here, login is successful!
    // Create a payload for the JWT (the data we want to store in the token)
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // 7. Sign and generate a JWT token
    const authToken = jwt.sign(
      payload,
      process.env.JWT_SECRET, // Use the secret from the .env file
      { expiresIn: '24h' } // Optional: Token expires in 24 hours
    );

    // 8. Send the token and user info back to the client
    res.status(200).json({
      message: 'Login successful!',
      authToken: authToken, // Send the token to the frontend
      user: { // Also send user details (optional, but useful)
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

module.exports = router;