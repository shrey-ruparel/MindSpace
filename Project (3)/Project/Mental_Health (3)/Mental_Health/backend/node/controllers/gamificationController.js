const User = require('../models/User');
const { updateStreak, awardBadge } = require('../services/gamificationService');

exports.getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // In a real app, you would fetch actual streaks and badges from the user model or a separate gamification model
        const stats = {
            streak: user.streak || 0,
            badges: user.badges || [],
            // ... other gamification metrics
        };

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Example route for manually awarding a badge (admin only or triggered by an event)
exports.awardBadgeManually = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Admin access required' });
    }

    const { userId, badgeType } = req.body;
    try {
        await awardBadge(userId, badgeType);
        res.json({ msg: 'Badge awarded successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
