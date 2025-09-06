const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Authentication middleware that verifies JWT tokens and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Check if Authorization header exists and has correct format
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No authorization token provided.' 
      });
    }

    // 2. Validate Authorization header format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Expected: Bearer <token>'
      });
    }

    // 3. Extract token from header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // 4. Verify JWT token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          error: 'INVALID_TOKEN'
        });
      }

      // For any other JWT errors
      return res.status(401).json({
        success: false,
        message: 'Token verification failed.',
        error: 'TOKEN_VERIFICATION_FAILED'
      });
    }

    // 5. Find user in database using ID from token
    const user = await User.findById(decodedToken.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token might be compromised.',
        error: 'USER_NOT_FOUND'
      });
    }

    // 6. Check if user account is active (you can add this field to your User model later)
    // if (!user.isActive) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Account is deactivated. Please contact support.',
    //     error: 'ACCOUNT_DEACTIVATED'
    //   });
    // }

    // 7. Attach user object to request for use in subsequent middleware/routes
    req.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      // Add other non-sensitive user fields as needed
    };

    // 8. Proceed to the next middleware/route
    next();

  } catch (error) {
    console.error('Auth middleware unexpected error:', error);
    
    // Handle unexpected errors (database connection issues, etc.)
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_SERVER_ERROR'
    });
  }
};

module.exports = authMiddleware;

/*// middleware/auth.middleware.js
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
module.exports = authMiddleware;*/