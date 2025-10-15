const { sendNotification } = require('../services/notificationService');
const User = require('../models/User'); // Import User model
const { sendEmail } = require('../services/emailService'); // Import the email service

exports.triggerEmergency = async (req, res) => {
    const { userId, location, contactInfo } = req.body; // Assuming these are sent from frontend

    try {
        // In a real application, this would integrate with helpline APIs,
        // emergency contacts, or internal alert systems.
        console.log(`EMERGENCY TRIGGERED for user ${userId} at ${location}. Contact: ${contactInfo}`);
        
        // Example: Notify administrators or counselors
        sendNotification('admin_group_id', `EMERGENCY ALERT: User ${userId} needs help! Location: ${location}, Contact: ${contactInfo}`, 'emergency');

        res.status(200).json({ msg: 'Emergency alert triggered successfully. Help is on the way.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.sendSOSAlert = async (req, res) => {
    const { userId, userName, userEmail, timestamp, location } = req.body;

    try {
        console.log(`SOS ALERT Received:
        User ID: ${userId}
        User Name: ${userName}
        User Email: ${userEmail}
        Timestamp: ${timestamp}
        Location: ${location}`);

        // Fetch all active counsellors and admins
        const recipients = await User.find({
            role: { $in: ['counsellor', 'admin'] },
            isVerified: true // Ensure only verified staff receive alerts
        }).select('email name');

        if (recipients.length === 0) {
            console.warn('No active counsellors or admins found to send SOS alert to.');
            return res.status(500).json({ msg: 'SOS alert received, but no active support staff found to notify.' });
        }

        // Send SOS email to each recipient
        const sosEmailSubject = '🚨 SOS Alert – Immediate Support Required';
        for (const recipient of recipients) {
            const sosEmailHtml = `
                <p>Hello ${recipient.name || recipient.email},</p>
                <p>This is an automated alert from the Mental Health Support Application.</p>
                <p>A user has activated the SOS button, indicating that they require urgent support.</p>
                <p><strong>Details:</strong></p>
                <ul>
                    <li><strong>User ID:</strong> ${userId}</li>
                    <li><strong>User Name:</strong> ${userName}</li>
                    <li><strong>User Email:</strong> ${userEmail}</li>
                    <li><strong>Date & Time of SOS:</strong> ${new Date(timestamp).toLocaleString()}</li>
                    <li><strong>Location:</strong> ${location}</li>
                </ul>
                <p>Please reach out to the user immediately to ensure their safety and provide the necessary support.</p>
                <p>Thank you for your prompt attention.</p>
                <p>Sincerely,</p>
                <p>Mental Health Support System</p>
            `;
            await sendEmail(recipient.email, sosEmailSubject, sosEmailHtml);
        }

        res.status(200).json({ msg: 'SOS alert received and support staff have been notified.' });
    } catch (err) {
        console.error('Error processing SOS alert:', err.message);
        res.status(500).send('Server error');
    }
};