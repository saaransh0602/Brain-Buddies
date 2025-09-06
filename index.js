/*// 1. IMPORTING PACKAGES
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Loads variables from .env file

// 2. CREATING THE EXPRESS APPLICATION
const app = express(); // 'app' object is created which is the core of the server

// 3. MIDDLEWARE
app.use(cors()); // Enables CORS for all routes. CORS == Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON requests and puts the data in `req.body`

// 4. BASIC ROUTE FOR TESTING
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the RT-Terrors API!' }); //JSON == JavaScript Object Notation
});

// 5. DATABASE CONNECTION
const PORT = process.env.PORT || 5000;
const URI = process.env.MONGO_URI;

mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    // 6. STARTING THE SERVER
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });*/

// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // This is crucial to parse JSON bodies in POST requests

// --- Import Routes ---
// We will create these files next
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const reviewRoutes = require('./routes/review.routes'); // Import the new review routes

// --- Use Routes ---
// This means:任何发送到 /api/auth 的请求都将由 authRoutes 处理
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/reviews', reviewRoutes);

// Basic route for testing (Keep it for now)
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Brain-Buddies API!' });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const URI = process.env.MONGO_URI;

mongoose.connect(URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });  