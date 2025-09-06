// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// This middleware will run before the final route handler
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Check if the request has an Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization header provided. Access denied.' });
    }

    // 2. Extract the token from the header
    // Format is usually: "Bearer <token>"
    const token = authHeader.replace('Bearer ', ''); // Remove "Bearer " to get just the token

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    // 3. Verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user associated with the token
    // We use the user's ID from the decoded token to find them in the database
    const user = await User.findById(decodedToken.id).select('-password'); // The `.select('-password')` excludes the password field

    if (!user) {
      return res.status(401).json({ message: 'Token is valid, but user not found.' });
    }

    // 5. If everything is successful, attach the user object to the request object
    // This allows the next route handler to access the user's details
    req.user = user;

    // 6. Call next() to pass control to the next middleware/route handler
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired.' });
    }

    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

// Export the middleware so we can use it in our routes
module.exports = authMiddleware;