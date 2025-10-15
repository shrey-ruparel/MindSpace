const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { createGoogleMeetEvent } = require('../services/googleCalendarService'); // Import the new service
const { sendEmail } = require('../services/emailService'); // Import the email service
const crypto = require('crypto'); // Import crypto for token generation

// Utility function to send appointment confirmation (meeting link, emails, DB update)
async function sendAppointmentConfirmation(userEmail, counselorEmail, dateTime, appointmentId) {
    const student = await User.findOne({ email: userEmail });
    const counselor = await User.findOne({ email: counselorEmail });
    if (!student || !counselor) throw new Error('User or counselor not found');

    // Generate Google Meet link
    const meetLink = await createGoogleMeetEvent({
        summary: `Counselling Session with ${counselor.name}`,
        description: `Online counselling session with ${counselor.name} and ${student.name}.`,
        start: dateTime,
        end: new Date(new Date(dateTime).getTime() + 60 * 60 * 1000),
        attendees: [userEmail, counselorEmail],
    });

    // Send emails
    const studentEmailHtml = `
        <p>Dear ${student.name},</p>
        <p>Your appointment with ${counselor.name} on ${new Date(dateTime).toLocaleString()} has been approved.</p>
        <p>Join your session here: <a href="${meetLink}">${meetLink}</a></p>
        <p>Please be on time.</p>
        <p>Best regards,<br/>MindSpace Team</p>
    `;
    await sendEmail(userEmail, `Your Appointment with ${counselor.name} is Approved!`, studentEmailHtml);

    const counselorEmailHtml = `
        <p>Dear ${counselor.name},</p>
        <p>Your appointment with ${student.name} (Email: ${student.email}) on ${new Date(dateTime).toLocaleString()} has been approved.</p>
        <p>Join your session here: <a href="${meetLink}">${meetLink}</a></p>
        <p>Please be on time.</p>
        <p>Best regards,<br/>MindSpace Team</p>
    `;
    await sendEmail(counselorEmail, `Appointment with ${student.name} Approved - Meeting Link`, counselorEmailHtml);

    // Update appointment in DB
    await Appointment.findByIdAndUpdate(appointmentId, { meetLink, status: 'approved' });
}

const createAppointment = async (req, res) => {
    const { counsellor_id, datetime, anonymous } = req.body;
    const student_id = req.user.id; // From JWT token

    try {
        // Validate if counsellor_id is a valid counsellor
        const counsellor = await User.findById(counsellor_id);
        if (!counsellor || counsellor.role !== 'counsellor') {
            return res.status(400).json({ msg: 'Invalid counsellor ID' });
        }

        const newAppointment = new Appointment({
            student_id,
            counsellor_id,
            datetime,
            anonymous: anonymous || false,
            status: 'pending' // Set initial status to pending
        });

        const appointment = await newAppointment.save();

        // Notify counsellor
        sendNotification(counsellor_id, `New appointment scheduled by ${anonymous ? 'an anonymous student' : req.user.name}.`, 'new_appointment');

        res.status(201).json(appointment);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getAppointments = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'counsellor') {
            query = { counsellor_id: req.user.id };
        } else { // Assume student
            query = { student_id: req.user.id };
        }
        const appointments = await Appointment.find(query)
            .select('+meetLink +chatHistoryAccessStatus') // Explicitly include meetLink and chatHistoryAccessStatus
            .populate('counsellor_id', 'name email')
            .populate('student_id', 'name email anonymous_flag');
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status, suggested_datetime, cancellation_remark } = req.body;

    try {
        let appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Check if the user is the assigned counsellor or an admin, or the student canceling their own appointment
        if (
            (req.user.role === 'counsellor' && appointment.counsellor_id.toString() !== req.user.id) ||
            (req.user.role === 'student' && appointment.student_id.toString() !== req.user.id && status === 'cancelled') ||
            (req.user.role !== 'admin' && req.user.role !== 'counsellor' && req.user.role !== 'student')
        ) {
            return res.status(403).json({ msg: 'Not authorized to update this appointment' });
        }

        appointment.status = status;
        if (status === 'rejected' && suggested_datetime) {
            appointment.suggested_datetime = suggested_datetime;
        } else if (status === 'cancelled') {
            appointment.cancellation_remark = cancellation_remark;
        } else if (status === 'approved') {
            // Create Google Meet link with detailed logging
            try {
                const student = await User.findById(appointment.student_id);
                const counsellorUser = await User.findById(appointment.counsellor_id);

                if (!student || !counsellorUser) {
                    console.error('Error: Student or Counsellor user not found for Google Meet event.');
                    notificationMessage = `Your appointment with ${appointment.counsellor_id.name} has been approved, but we could not find student or counsellor details to create a Meet link.`;
                } else {
                    let meetLink = null;
                    try {
                        meetLink = await createGoogleMeetEvent({
                            summary: `Counselling Session with ${counsellorUser.name}`,
                            description: `Online counselling session with ${counsellorUser.name} and ${student.name}.`,
                            start: appointment.datetime,
                            end: new Date(new Date(appointment.datetime).getTime() + 60 * 60 * 1000), // 1 hour duration
                            attendees: [student.email, counsellorUser.email],
                        });
                        console.log('Generated Google Meet link:', meetLink);
                    } catch (err) {
                        console.error('Error generating Google Meet link:', err);
                    }
                    appointment.meetLink = meetLink;
                    if (!meetLink) {
                        notificationMessage = `Your appointment with ${counsellorUser.name} has been approved, but the Meet link could not be generated.`;
                    } else {
                        // Send email to student with meeting link
                        const studentEmailSubject = `Your Appointment with ${counsellorUser.name} is Approved!`;
                        const studentEmailHtml = `
                            <p>Dear ${student.name},</p>
                            <p>Your appointment with ${counsellorUser.name} on ${new Date(appointment.datetime).toLocaleString()} has been approved.</p>
                            <p>Join your session here: <a href="${meetLink}">${meetLink}</a></p>
                            <p>Please be on time.</p>
                            <p>Best regards,</p>
                            <p>MindSpace Team</p>
                        `;
                        try {
                            await sendEmail(student.email, studentEmailSubject, studentEmailHtml);
                            console.log('Sent email to student:', student.email);
                        } catch (err) {
                            console.error('Error sending email to student:', err);
                        }

                        // Send email to counsellor with meeting link
                        const counsellorEmailSubject = `Appointment with ${student.name} Approved - Meeting Link`;
                        const counsellorEmailHtml = `
                            <p>Dear ${counsellorUser.name},</p>
                            <p>Your appointment with ${student.name} (Email: ${student.email}) on ${new Date(appointment.datetime).toLocaleString()} has been approved.</p>
                            <p>Join your session here: <a href="${meetLink}">${meetLink}</a></p>
                            <p>Please be on time.</p>
                            <p>Best regards,</p>
                            <p>MindSpace Team</p>
                        `;
                        try {
                            await sendEmail(counsellorUser.email, counsellorEmailSubject, counsellorEmailHtml);
                            console.log('Sent email to counsellor:', counsellorUser.email);
                        } catch (err) {
                            console.error('Error sending email to counsellor:', err);
                        }
                        notificationMessage = `Your appointment with ${counsellorUser.name} has been approved. Join the session here: ${meetLink}`;
                    }
                }
            } catch (meetError) {
                console.error('Failed to create Google Meet link:', meetError);
                notificationMessage = `Your appointment with ${appointment.counsellor_id.name} has been approved, but the Meet link is currently unavailable. Please contact your counsellor.`;
            }
            sendNotification(appointment.student_id, notificationMessage, 'appointment_update'); // Send notification here
        }

        // If status is approved or scheduled, clear suggested_datetime
        if (status === 'approved' || status === 'scheduled') {
            appointment.suggested_datetime = undefined;
        }

        await appointment.save();

        // Notify involved parties about the status update (for non-approved statuses where notification hasn't been sent)
        if (status === 'cancelled') {
            // If a student cancels
            if (req.user.role === 'student') {
                notificationMessage = `Your appointment with ${appointment.counsellor_id.name} on ${new Date(appointment.datetime).toLocaleString()} has been cancelled by the student. Reason: ${cancellation_remark || 'No remark provided'}.`;
                sendNotification(appointment.counsellor_id, notificationMessage, 'appointment_update');
            }
            // If a counsellor/admin cancels (this scenario is less explicit in current frontend, but for completeness)
            else {
                notificationMessage = `Your appointment with ${appointment.counsellor_id.name} on ${new Date(appointment.datetime).toLocaleString()} has been cancelled. Reason: ${cancellation_remark || 'No remark provided'}.`;
                sendNotification(appointment.student_id, notificationMessage, 'appointment_update');
            }
        } else if (status === 'rejected' && suggested_datetime) {
            notificationMessage = `Your appointment with ${appointment.counsellor_id.name} has been rejected. A new time of ${new Date(suggested_datetime).toLocaleString()} has been suggested.`;
            sendNotification(appointment.student_id, notificationMessage, 'appointment_update');
        } else if (status === 'approved') {
            notificationMessage = `Your appointment with ${appointment.counsellor_id.name} has been approved.`;
            sendNotification(appointment.student_id, notificationMessage, 'appointment_update');
        }
        
        res.json(appointment);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getCounsellors = async (req, res) => {
    try {
        const counsellors = await require('../models/Counsellor').find({ status: 'approved' })
            .populate('user_id', 'name email profile_picture'); // Populate user_id to get user details
        
        // Map to a format suitable for the frontend, combining fields
        const formattedCounsellors = counsellors.map(counsellor => ({
            _id: counsellor.user_id._id, // Send the actual user ID for booking
            name: counsellor.name,
            email: counsellor.email,
            specialization: counsellor.specialization,
            availability: counsellor.availability,
            contact: counsellor.contact,
            profile_picture: counsellor.profile_picture || counsellor.user_id?.profile_picture, // Prefer counsellor's specific pic, fallback to user's
            bio: counsellor.bio,
            // Add any other fields from User or Counsellor you need on the frontend
        }));

        res.json(formattedCounsellors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const requestChatHistoryAccess = async (req, res) => {
const { id: appointmentId } = req.params;

try {
    // 1. Verify if the requesting user is a counsellor
    if (req.user.role !== 'counsellor') {
        return res.status(403).json({ msg: 'Not authorized to request chat history access' });
    }

    // 2. Find the appointment and verify it belongs to this counsellor and is approved
    const appointment = await Appointment.findById(appointmentId)
        .populate('student_id', 'name email')
        .populate('counsellor_id', 'name email');

    if (!appointment) {
        return res.status(404).json({ msg: 'Appointment not found' });
    }
    if (appointment.counsellor_id._id.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to request chat history for this appointment' });
    }
    if (appointment.status !== 'approved') {
        return res.status(400).json({ msg: 'Chat history can only be requested for approved appointments' });
    }
    if (appointment.chatHistoryAccessStatus === 'approved') {
        return res.status(200).json({ msg: 'Chat history access is already approved.' });
    }
    if (appointment.chatHistoryAccessStatus === 'pending' && appointment.chatHistoryAccessTokenExpires > Date.now()) {
        return res.status(200).json({ msg: 'Chat history access request is already pending. Please wait for the student\'s response.' });
    }

    // 3. Generate a unique token for the student to approve/deny
    const chatHistoryAccessToken = crypto.randomBytes(32).toString('hex');
    const chatHistoryAccessTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity

    // 4. Update appointment status to pending and store the token
    appointment.chatHistoryAccessStatus = 'pending';
    appointment.chatHistoryAccessRequestedAt = new Date();
    appointment.chatHistoryAccessToken = chatHistoryAccessToken;
    appointment.chatHistoryAccessTokenExpires = chatHistoryAccessTokenExpires;
    await appointment.save();

    // 5. Send email to student with approve/deny links
    const student = appointment.student_id;
    const counsellorName = appointment.counsellor_id.name;

    const approveLink = `${process.env.FRONTEND_URL}/api/appointments/${appointmentId}/respond-chat-history-access?token=${chatHistoryAccessToken}&action=approve`;
    const denyLink = `${process.env.FRONTEND_URL}/api/appointments/${appointmentId}/respond-chat-history-access?token=${chatHistoryAccessToken}&action=deny`;

    const studentEmailSubject = `Action Required: Counsellor ${counsellorName} Requests Chat History Access`;
    const studentEmailHtml = `
        <p>Dear ${student.name},</p>
        <p>Your counsellor, ${counsellorName}, has requested access to your chatbot history for your appointment.</p>
        <p>This information can help your counsellor provide more personalized support during your session.</p>
        <p>Please click one of the links below to respond to this request:</p>
        <p><a href="${approveLink}">Approve Access</a></p>
        <p><a href="${denyLink}">Deny Access</a></p>
        <p>This request will expire in 24 hours.</p>
        <p>Sincerely,</p>
        <p>Digital Psychological Intervention System</p>
    `;
    await sendEmail(student.email, studentEmailSubject, studentEmailHtml);

    res.status(200).json({ msg: 'Chat history access request sent to student.' });

} catch (err) {
    console.error('Error requesting chat history access:', err.message);
    res.status(500).send('Server error');
}
};

const respondChatHistoryAccess = async (req, res) => {
const { id: appointmentId } = req.params;
const { token, action } = req.query;

try {
    const appointment = await Appointment.findById(appointmentId)
        .populate('student_id', 'name email')
        .populate('counsellor_id', 'name email');

    if (!appointment) {
        return res.status(404).send('Appointment not found.');
    }

    // Verify token and expiration
    if (appointment.chatHistoryAccessToken !== token || appointment.chatHistoryAccessTokenExpires < Date.now()) {
        return res.status(400).send('Invalid or expired chat history access token.');
    }

    if (action === 'approve') {
        appointment.chatHistoryAccessStatus = 'approved';
        appointment.chatHistoryAccessRespondedAt = new Date();
        // Clear token fields after use
        appointment.chatHistoryAccessToken = undefined;
        appointment.chatHistoryAccessTokenExpires = undefined;

        await appointment.save();

        // Optionally, notify counsellor of approval
        const counsellorEmailSubject = `Chat History Access Approved by ${appointment.student_id.name}`;
        const counsellorEmailHtml = `
            <p>Hello ${appointment.counsellor_id.name},</p>
            <p>Your request to access the chat history of ${appointment.student_id.name} for your appointment on ${new Date(appointment.datetime).toLocaleString()} has been <strong>approved</strong>.</p>
            <p>You can now view their chat history in your counsellor dashboard.</p>
            <p>Sincerely,</p>
            <p>Digital Psychological Intervention System</p>
        `;
        await sendEmail(appointment.counsellor_id.email, counsellorEmailSubject, counsellorEmailHtml);

        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Access Approved</title></head>
            <body>
                <p>Chat history access has been <strong>approved</strong>. You can close this window.</p>
            </body>
            </html>
        `);

    } else if (action === 'deny') {
        appointment.chatHistoryAccessStatus = 'denied';
        appointment.chatHistoryAccessRespondedAt = new Date();
        // Clear token fields after use
        appointment.chatHistoryAccessToken = undefined;
        appointment.chatHistoryAccessTokenExpires = undefined;

        await appointment.save();

        // Send formal message to counsellor about denial
        const counsellorEmailSubject = 'Chat History Access Request – Denied';
        const counsellorEmailHtml = `
            <p>Hello ${appointment.counsellor_id.name},</p>
            <p>This is an automated notification from the Digital Psychological Intervention System.</p>
            <p>${appointment.student_id.name} has <strong>declined</strong> your request to access their chat history. As a result, the chat history cannot be viewed at this time.</p>
            <p>Please respect the user’s privacy and continue providing support based on the available information.</p>
            <p>Thank you for your understanding.</p>
            <p>Sincerely,</p>
            <p>Digital Psychological Intervention System</p>
        `;
        await sendEmail(appointment.counsellor_id.email, counsellorEmailSubject, counsellorEmailHtml);

        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Access Denied</title></head>
            <body>
                <p>Chat history access has been <strong>denied</strong>. Your counsellor will be notified. You can close this window.</p>
            </body>
            </html>
        `);

    } else {
        return res.status(400).send('Invalid action.');
    }

} catch (err) {
    console.error('Error responding to chat history access request:', err.message);
    res.status(500).send('Server error');
}
};

const respondChatHistoryAccessInApp = async (req, res) => {
    const { id: appointmentId } = req.params;
    const { action } = req.body; // Get action from request body
    const studentId = req.user.id; // Get student ID from authenticated user

    try {
        // 1. Verify if the requesting user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Not authorized to respond to chat history access' });
        }

        const appointment = await Appointment.findById(appointmentId)
            .populate('student_id', 'name email')
            .populate('counsellor_id', 'name email');

        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found.' });
        }

        // 2. Verify the appointment belongs to this student
        if (appointment.student_id._id.toString() !== studentId) {
            return res.status(403).json({ msg: 'Not authorized to respond to chat history for this appointment' });
        }

        // 3. Ensure the request is currently pending
        if (appointment.chatHistoryAccessStatus !== 'pending') {
            return res.status(400).json({ msg: 'No pending chat history access request for this appointment.' });
        }

        if (action === 'approve') {
            appointment.chatHistoryAccessStatus = 'approved';
            appointment.chatHistoryAccessRespondedAt = new Date();
            // Clear token fields after use (important for single-use email links, although not used here for authentication)
            appointment.chatHistoryAccessToken = undefined;
            appointment.chatHistoryAccessTokenExpires = undefined;

            await appointment.save();

            // Notify counsellor of approval
            const counsellorEmailSubject = `Chat History Access Approved by ${appointment.student_id.name}`;
            const counsellorEmailHtml = `
                <p>Hello ${appointment.counsellor_id.name},</p>
                <p>Your request to access the chat history of ${appointment.student_id.name} for your appointment on ${new Date(appointment.datetime).toLocaleString()} has been <strong>approved</strong>.</p>
                <p>You can now view their chat history in your counsellor dashboard.</p>
                <p>Sincerely,</p>
                <p>Digital Psychological Intervention System</p>
            `;
            await sendEmail(appointment.counsellor_id.email, counsellorEmailSubject, counsellorEmailHtml);

            res.status(200).json({ msg: 'Chat history access approved successfully.' });

        } else if (action === 'deny') {
            appointment.chatHistoryAccessStatus = 'denied';
            appointment.chatHistoryAccessRespondedAt = new Date();
            // Clear token fields after use
            appointment.chatHistoryAccessToken = undefined;
            appointment.chatHistoryAccessTokenExpires = undefined;

            await appointment.save();

            // Send formal message to counsellor about denial
            const counsellorEmailSubject = 'Chat History Access Request – Denied';
            const counsellorEmailHtml = `
                <p>Hello ${appointment.counsellor_id.name},</p>
                <p>This is an automated notification from the Digital Psychological Intervention System.</p>
                <p>${appointment.student_id.name} has <strong>declined</strong> your request to access their chat history. As a result, the chat history cannot be viewed at this time.</p>
                <p>Please respect the user’s privacy and continue providing support based on the available information.</p>
                <p>Thank you for your understanding.</p>
                <p>Sincerely,</p>
                <p>Digital Psychological Intervention System</p>
            `;
            await sendEmail(appointment.counsellor_id.email, counsellorEmailSubject, counsellorEmailHtml);

            res.status(200).json({ msg: 'Chat history access denied successfully.' });

        } else {
            return res.status(400).json({ msg: 'Invalid action. Action must be \'approve\' or \'deny\'.' });
        }

    } catch (err) {
        console.error('Error responding to chat history access request in app:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

const deleteAppointment = async (req, res) => {
    const { id: appointmentId } = req.params;
    const studentId = req.user.id; // From JWT token

    try {
        // 1. Verify if the requesting user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Not authorized to delete appointments' });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found.' });
        }

        // 2. Verify the appointment belongs to this student
        if (appointment.student_id.toString() !== studentId) {
            return res.status(403).json({ msg: 'Not authorized to delete this appointment' });
        }

        // 3. Ensure the appointment is cancelled before deletion
        if (appointment.status !== 'cancelled') {
            return res.status(400).json({ msg: 'Only cancelled appointments can be deleted.' });
        }

        await appointment.deleteOne();

        res.status(200).json({ msg: 'Appointment deleted successfully.' });

    } catch (err) {
        console.error('Error deleting appointment:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    createAppointment,
    getAppointments,
    updateAppointmentStatus,
    getCounsellors,
    requestChatHistoryAccess,
    respondChatHistoryAccess,
    respondChatHistoryAccessInApp,
    deleteAppointment
};
