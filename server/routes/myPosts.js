const express = require('express');
const router = express.Router();
const Post = require('../model/post');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get current user's posts
router.get('/', async (req, res) => {
    try {
        console.log("Fetching posts for user:", req.user.username);

        const posts = await Post.find({
            authorId: req.user._id
        }).sort({ createdAt: -1 });

        console.log("User posts fetched successfully:", posts.length);
        res.json(posts);
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new user post
router.post('/', async (req, res) => {
    try {
        console.log("Creating new post for user:", req.user.username);
        const { title, content, image, tags } = req.body;

        const post = new Post({
            title,
            content,
            author: req.user.fullName,
            authorId: req.user._id,
            authorUsername: req.user.username,
            image,
            tags: tags || [],
            isPublished: true
        });

        await post.save();
        console.log("User post created successfully:", post._id);
        res.status(201).json(post);
    } catch (error) {
        console.error("Error creating user post:", error);
        res.status(400).json({ error: error.message });
    }
});

// Update user's post
router.put('/:id', async (req, res) => {
    try {
        console.log("Updating post:", req.params.id, "for user:", req.user.username);
        const { title, content, image, tags } = req.body;

        // Only update if it belongs to current user
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, authorId: req.user._id },
            {
                title,
                content,
                image,
                tags,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({ error: 'Post not found or you are not authorized to edit this post' });
        }

        console.log("User post updated successfully:", post._id);
        res.json(post);
    } catch (error) {
        console.error("Error updating user post:", error);
        res.status(400).json({ error: error.message });
    }
});

// Delete user's post
router.delete('/:id', async (req, res) => {
    try {
        console.log("Deleting post:", req.params.id, "for user:", req.user.username);

        // Only delete if it belongs to current user
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            authorId: req.user._id
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found or you are not authorized to delete this post' });
        }

        console.log("User post deleted successfully:", post._id);

        // Return remaining user posts
        const remainingPosts = await Post.find({
            authorId: req.user._id
        }).sort({ createdAt: -1 });

        res.json(remainingPosts);
    } catch (error) {
        console.error("Error deleting user post:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's post statistics
router.get('/stats', async (req, res) => {
    try {
        console.log("Fetching statistics for user:", req.user.username);

        const stats = await Post.aggregate([
            { $match: { authorId: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalPosts: { $sum: 1 },
                    publishedPosts: {
                        $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] }
                    },
                    totalLikes: { $sum: '$likes' },
                    totalComments: { $sum: '$comments' }
                }
            }
        ]);

        const result = stats[0] || {
            totalPosts: 0,
            publishedPosts: 0,
            totalLikes: 0,
            totalComments: 0
        };

        console.log("User statistics:", result);
        res.json(result);
    } catch (error) {
        console.error("Error fetching user statistics:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
