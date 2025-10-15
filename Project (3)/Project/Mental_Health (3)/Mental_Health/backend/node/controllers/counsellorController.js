const Counsellor = require('../models/Counsellor');
const User = require('../models/User'); // Import User model
const Appointment = require('../models/Appointment'); // Import Appointment model
const ChatbotLog = require('../models/ChatbotLog'); // Import ChatbotLog model
const { decrypt } = require('../utils/encryptionUtils'); // Import decryption utility
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Load environment variables

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const addCounsellor = async (req, res) => {
    const { name, specialization, availability, contact, email, bio } = req.body;
    let profile_picture = req.body.profile_picture; // For non-file uploads from admin

    try {
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'counsellor_profiles',
                resource_type: 'image'
            });
            profile_picture = result.secure_url;
        }

        const newCounsellor = new Counsellor({
            name,
            specialization,
            availability,
            contact,
            email,
            profile_picture,
            bio,
            user_id: req.user.id, // Add user_id
            status: 'approved' // Admin adds directly, so it's approved
        });

        const counsellor = await newCounsellor.save();
        res.status(201).json(counsellor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const requestCounsellorApproval = async (req, res) => {
    const { name, specialization, availability, contact, email, bio } = req.body;
    let profile_picture = '';

    // Log req.user.id for debugging
    console.log('req.user.id in requestCounsellorApproval:', req.user.id);

    try {
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'counsellor_profiles',
                resource_type: 'image'
            });
            profile_picture = result.secure_url;
        }

        const newCounsellor = new Counsellor({
            name,
            specialization,
            availability,
            contact,
            email,
            bio,
            profile_picture,
            user_id: req.user.id, // Add user_id
            status: 'pending'
        });

        const counsellor = await newCounsellor.save();
        res.status(201).json(counsellor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const editCounsellor = async (req, res) => {
    const { name, specialization, availability, contact, email, bio } = req.body;
    let profile_picture = req.body.profile_picture; // Existing picture or base64 if not new file upload

    try {
        let counsellor = await Counsellor.findById(req.params.id);

        if (!counsellor) {
            return res.status(404).json({ msg: 'Counsellor not found' });
        }

        if (req.file) {
            // If a new file is uploaded, upload to cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'counsellor_profiles',
                resource_type: 'image'
            });
            profile_picture = result.secure_url;
        } else if (profile_picture === '' && counsellor.profile_picture) {
            // If profile_picture is explicitly set to empty and an old picture existed, delete old one
            // (This logic assumes frontend sends an empty string if picture is removed)
            const publicId = counsellor.profile_picture.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`counsellor_profiles/${publicId}`);
            profile_picture = '';
        }

        counsellor.name = name || counsellor.name;
        counsellor.specialization = specialization || counsellor.specialization;
        counsellor.availability = availability || counsellor.availability;
        counsellor.contact = contact || counsellor.contact;
        counsellor.email = email || counsellor.email;
        counsellor.bio = bio || counsellor.bio;
        counsellor.profile_picture = profile_picture || counsellor.profile_picture;
        // If admin is editing, they can change status directly. Counsellor edits keep status.
        if (req.user && req.user.role === 'admin' && req.body.status) {
            counsellor.status = req.body.status;
        }

        await counsellor.save();
        res.json(counsellor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const removeCounsellor = async (req, res) => {
    try {
        const counsellor = await Counsellor.findById(req.params.id);

        if (!counsellor) {
            return res.status(404).json({ msg: 'Counsellor not found' });
        }

        // Delete profile picture from Cloudinary if it exists
        if (counsellor.profile_picture) {
            const publicId = counsellor.profile_picture.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`counsellor_profiles/${publicId}`);
        }

        await counsellor.deleteOne();
        res.json({ msg: 'Counsellor removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const listCounsellors = async (req, res) => {
    try {
        const counsellors = await Counsellor.find();
        res.json(counsellors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getCounsellorById = async (req, res) => {
    try {
        // Find counsellor by user_id instead of _id
        const counsellor = await Counsellor.findOne({ user_id: req.params.id });
        if (!counsellor) {
            return res.status(404).json({ msg: 'Counsellor not found for this user ID' });
        }
        res.json(counsellor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const listPendingCounsellors = async (req, res) => {
    try {
        const pendingCounsellors = await Counsellor.find({ status: 'pending' });
        res.json(pendingCounsellors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const updateCounsellorStatus = async (req, res) => {
    const { status } = req.body;

    try {
        let counsellor = await Counsellor.findById(req.params.id);

        if (!counsellor) {
            return res.status(404).json({ msg: 'Counsellor not found' });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status provided. Must be \'approved\' or \'rejected\'.' });
        }

        counsellor.status = status;
        await counsellor.save();

        res.json(counsellor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getCounsellorChatHistory = async (req, res) => {
    const { studentId, appointmentId } = req.params;

    try {
        // 1. Verify if the requesting user is a counsellor
        if (req.user.role !== 'counsellor') {
            return res.status(403).json({ msg: 'Not authorized to view chat history' });
        }

        // 2. Verify the appointment belongs to this counsellor and student
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            counsellor_id: req.user.id,
            student_id: studentId,
            status: 'approved' // Only allow access for approved appointments
        });

        if (!appointment) {
            return res.status(404).json({ msg: 'Approved appointment not found for this counsellor and student' });
        }

        // 3. Check if chat history access has been approved by the student
        if (appointment.chatHistoryAccessStatus !== 'approved') {
            let msg = 'Chat history access is not approved for this appointment.';
            if (appointment.chatHistoryAccessStatus === 'pending') {
                msg = 'Chat history access request is pending student approval.';
            } else if (appointment.chatHistoryAccessStatus === 'denied') {
                msg = 'Chat history access has been denied by the student.';
            }
            return res.status(403).json({ msg });
        }

        // 4. Retrieve encrypted chat logs for the student
        const chatLogs = await ChatbotLog.find({ userId: studentId }).sort({ timestamp: 1 });

        if (chatLogs.length === 0) {
            return res.status(200).json({ msg: 'No chatbot history found for this student.', history: [] });
        }

        // 4. Decrypt each chat entry
        const decryptedHistory = chatLogs.map(log => {
            try {
                const decryptedQuery = decrypt(log.encryptedQuery, log.iv);
                const decryptedResponse = decrypt(log.encryptedResponse, log.iv);
                return {
                    query: decryptedQuery,
                    response: decryptedResponse,
                    timestamp: log.timestamp,
                };
            } catch (decryptError) {
                console.error('Error decrypting chat log entry:', decryptError);
                return {
                    query: '[Decryption Error]',
                    response: '[Decryption Error]',
                    timestamp: log.timestamp,
                };
            }
        });

        res.status(200).json({ msg: 'Chat history fetched and decrypted successfully', history: decryptedHistory });

    } catch (err) {
        console.error('Error fetching counsellor chat history:', err.message);
        res.status(500).send('Server error');
    }
};

const requestChatHistoryAccess = async (req, res) => {
    try {
        const counsellor = await Counsellor.findById(req.params.id);

        if (!counsellor) {
            return res.status(404).json({ msg: 'Counsellor not found' });
        }

        counsellor.chat_history_access = true;
        await counsellor.save();

        res.json(counsellor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    addCounsellor,
    requestCounsellorApproval,
    editCounsellor,
    removeCounsellor,
    listCounsellors,
    getCounsellorById,
    listPendingCounsellors,
    updateCounsellorStatus,
    getCounsellorChatHistory,
};
