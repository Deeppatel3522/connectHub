const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Social Media App API!',
        version: '1.0.0',
        endpoints: {
            posts: '/api/posts',
            myPosts: '/api/my-posts',
            health: '/health'
        },
        features: [
            'Create and manage posts',
            'Like and interact with content',
            'Search and filter posts',
            'Draft functionality',
            'Trending topics'
        ]
    });
    console.log("Social Media API is working");
});

// Get app statistics
router.get('/stats', async (req, res) => {
    try {
        const Post = require('../model/post');
        const UserPost = require('../model/userPost');

        const [totalPosts, totalUsers, totalLikes] = await Promise.all([
            Post.countDocuments({ isPublished: true }),
            Post.distinct('author').then(authors => authors.length),
            Post.aggregate([
                { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
            ]).then(result => result[0]?.totalLikes || 0)
        ]);

        res.json({
            totalPosts,
            totalUsers,
            totalLikes,
            totalInteractions: totalLikes, // Can include comments later
            appStatus: 'Active'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
