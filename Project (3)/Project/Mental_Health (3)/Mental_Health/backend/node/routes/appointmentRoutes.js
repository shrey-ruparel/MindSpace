const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private (Student)
router.post('/', authMiddleware, appointmentController.createAppointment);

// @route   GET /api/appointments
// @desc    Get all appointments for the logged-in student
// @access  Private (Student)
router.get('/', authMiddleware, appointmentController.getAppointments);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status (e.g., by counsellor)
// @access  Private (Counsellor/Admin)
router.put('/:id/status', authMiddleware, appointmentController.updateAppointmentStatus);

// @route   GET /api/appointments/counsellors
// @desc    Get all counsellors
// @access  Public (or private if only authenticated users can see them)
router.get('/counsellors', appointmentController.getCounsellors);

// @route   POST /api/appointments/:id/request-chat-history-access
// @desc    Counsellor requests access to a student's chat history for a specific appointment
// @access  Private (Counsellor)
router.post('/:id/request-chat-history-access', authMiddleware, appointmentController.requestChatHistoryAccess);

// @route   GET /api/appointments/:id/respond-chat-history-access
// @desc    Student responds to a chat history access request (approve/deny)
// @access  Public
router.get('/:id/respond-chat-history-access', appointmentController.respondChatHistoryAccess);

// @route   POST /api/appointments/:id/respond-chat-history-access-in-app
// @desc    Authenticated student responds to a chat history access request (approve/deny) from within the app
// @access  Private (Student)
router.post('/:id/respond-chat-history-access-in-app', authMiddleware, appointmentController.respondChatHistoryAccessInApp);

// @route   DELETE /api/appointments/:id
// @desc    Delete a cancelled appointment
// @access  Private (Student)
router.delete('/:id', authMiddleware, appointmentController.deleteAppointment);

module.exports = router;
