const User = require('../models/User');
const Appointment = require('../models/Appointment');
const ForumPost = require('../models/ForumPost');
const Screening = require('../models/Screening');
const Analytics = require('../models/Analytics');

// Middleware to check if user is admin
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Admin access required' });
    }
    next();
};

exports.getUsers = [authorizeAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password_hash');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}];

exports.getUserById = [authorizeAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}];

exports.deleteUser = [authorizeAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        await user.deleteOne();
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}];

exports.getAdminAnalytics = [authorizeAdmin, async (req, res) => {
    try {
        // Example analytics: total users, total appointments, flagged posts, etc.
        const totalUsers = await User.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const flaggedPosts = await ForumPost.countDocuments({ flagged: true });
        const averagePhq9Score = await Screening.aggregate([
            { $match: { type: 'phq9' } },
            { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]);

        const analyticsData = {
            totalUsers,
            totalAppointments,
            flaggedPosts,
            averagePhq9Score: averagePhq9Score.length > 0 ? averagePhq9Score[0].avgScore : 0
        };

        // Save analytics (optional, for historical data)
        await Analytics.create({ metric: 'admin_dashboard', value: analyticsData });

        res.json(analyticsData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}];

exports.updateUserRole = [authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}];
