const transporter = require('../config/emailConfig');

const sendEmail = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw new Error('Failed to send email');
    }
};

module.exports = { sendEmail };
