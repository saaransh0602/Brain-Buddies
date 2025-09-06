// Add to routes/course.routes.js
const Enrollment = require('../models/Enrollment.model');

// POST /api/courses/:courseId/enroll - Enroll a student in a course
router.post('/:courseId/enroll', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll in courses.' });
    }

    const { courseId } = req.params;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course.' });
    }

    // Create enrollment
    const newEnrollment = new Enrollment({
      student: req.user._id,
      course: courseId
    });

    await newEnrollment.save();
    res.status(201).json({ message: 'Successfully enrolled in course!' });

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Internal server error during enrollment.' });
  }
});