// 1. IMPORTING PACKAGES
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
  });