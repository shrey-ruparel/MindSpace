
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Load client secrets from environment variables (or directly from JSON for development)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN; // This should be securely stored and obtained via OAuth flow

const oAuth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

const createGoogleMeetEvent = async (appointmentDetails) => {
    const { summary, description, start, end, attendees } = appointmentDetails;

    const event = {
        summary: summary,
        description: description,
        start: {
            dateTime: start,
            timeZone: 'Asia/Kolkata', // Set appropriate timezone
        },
        end: {
            dateTime: end,
            timeZone: 'Asia/Kolkata', // Set appropriate timezone
        },
        attendees: attendees.map(email => ({ email: email })),
        conferenceData: {
            createRequest: { requestId: `${Date.now()}` },
        },
        guestsCanModify: true,
        guestsCanInviteOthers: true,
        guestsCanSeeOtherGuests: true,
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 10 },
            ],
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary', // Use 'primary' for the user's primary calendar
            resource: event,
            conferenceDataVersion: 1, // Required for Meet link generation
            sendNotifications: true, // Send email notifications to attendees
        });
        console.log('Google Calendar Event created:', response.data);
        return response.data.hangoutLink; // This contains the Google Meet link
    } catch (error) {
        console.error('Error creating Google Calendar event:', error.message);
        if (error.code === 401) {
            console.error('Authentication error: Ensure your refresh token is valid and has calendar scopes.');
        }
        throw new Error('Failed to create Google Meet event: ' + error.message);
    }
};

module.exports = { createGoogleMeetEvent };
