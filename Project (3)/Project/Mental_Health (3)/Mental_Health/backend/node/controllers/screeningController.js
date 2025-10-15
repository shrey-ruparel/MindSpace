const Screening = require('../models/Screening');
const { callFlaskApi } = require('../services/flaskApiService');

exports.submitPhq9 = async (req, res) => {
    const { answers } = req.body;
    const user_id = req.user.id;

    try {
        const flaskResponse = await callFlaskApi('/screening/phq9', { answers });

        const newScreening = new Screening({
            user_id,
            type: 'phq9',
            score: flaskResponse.score
        });

        await newScreening.save();
        res.status(201).json(flaskResponse);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.submitGad7 = async (req, res) => {
    const { answers } = req.body;
    const user_id = req.user.id;

    try {
        const flaskResponse = await callFlaskApi('/screening/gad7', { answers });

        const newScreening = new Screening({
            user_id,
            type: 'gad7',
            score: flaskResponse.score
        });

        await newScreening.save();
        res.status(201).json(flaskResponse);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getUserScreenings = async (req, res) => {
    try {
        const screenings = await Screening.find({ user_id: req.user.id }).sort({ timestamp: -1 });
        res.json(screenings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
