const ForumPost = require('../models/ForumPost');
const { callFlaskApi } = require('../services/flaskApiService');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.createPost = async (req, res) => {
    const { content, anonymous } = req.body;
    const user_id = req.user.id;
    let media_url = '';

    try {
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'forum_posts',
                resource_type: "auto"
            });
            media_url = result.secure_url;
            fs.unlinkSync(req.file.path); // Delete local temp file
        }

        // AI moderation via Flask API
        const moodAnalysis = await callFlaskApi('/predict_mood', { text: content });
        const isFlagged = moodAnalysis.mood === 'NEGATIVE' && moodAnalysis.score > 0.8; // Example logic

        const newPost = new ForumPost({
            user_id,
            content,
            anonymous: anonymous || false,
            flagged: isFlagged,
            media_url
        });

        const post = await newPost.save();
        res.status(201).json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getPosts = async (req, res) => {
    try {
        const posts = await ForumPost.find().populate('user_id', 'name anonymous_flag profile_picture').sort({ timestamp: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deletePost = async (req, res) => {
    const { id } = req.params;

    try {
        const post = await ForumPost.findById(id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Only the owner or an admin can delete a post
        if (post.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Delete from Cloudinary if a media_url exists
        if (post.media_url) {
            const publicId = post.media_url.split('/').pop().split('.')[0];
            const folderMatch = post.media_url.match(/upload\/v\d+\/([^\/]+)\/[^\/]+\.\w+$/);
            const folder = folderMatch ? folderMatch[1] : 'forum_posts';
            await cloudinary.uploader.destroy(`${folder}/${publicId}`);
        }

        await post.deleteOne();
        res.json({ msg: 'Post removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
