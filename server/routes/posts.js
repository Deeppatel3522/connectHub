const express = require('express');
const router = express.Router();
const Post = require('../model/post');
const Comment = require('../model/comment');
const { authenticateToken } = require('../middleware/auth');

// Get all posts - No auth required for reading posts
router.get('/', async (req, res) => {
    try {
        console.log("Fetching all posts");

        const { search, filter, limit = 50, page = 1 } = req.query;
        let query = { isPublished: true };

        // Search functionality
        if (search) {
            query.$text = { $search: search };
        }

        // Filter functionality
        if (filter === 'recent') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query.createdAt = { $gte: weekAgo };
        } else if (filter === 'popular') {
            query.likes = { $gte: 10 };
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        console.log("Posts fetched successfully:", posts.length);
        res.json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get single post by ID with comments
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Get comments for this post
        const comments = await Comment.find({ postId: req.params.id })
            .sort({ createdAt: -1 });

        res.json({ ...post.toObject(), commentsData: comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new post - Requires authentication
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log("Creating new post by user:", req.user.username);
        const { title, content, image, tags } = req.body;

        const post = new Post({
            title,
            content,
            author: `${req.user.firstName} ${req.user.lastName}`,
            authorId: req.user._id,
            authorUsername: req.user.username,
            image,
            tags: tags || []
        });

        await post.save();
        console.log("Post created successfully:", post._id);
        res.status(201).json(post);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(400).json({ error: error.message });
    }
});

// Toggle like/unlike post
router.post('/:id/toggle-like', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user already liked this post
        const hasLiked = post.likedBy.includes(userId);

        if (hasLiked) {
            // Unlike the post
            post.likedBy.pull(userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            // Like the post
            post.likedBy.push(userId);
            post.likes += 1;
        }

        await post.save();

        res.json({
            message: hasLiked ? 'Post unliked!' : 'Post liked!',
            likes: post.likes,
            isLiked: !hasLiked
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user liked a post
router.get('/:id/like-status', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const isLiked = post.likedBy.includes(req.user._id);
        res.json({ isLiked, likes: post.likes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Create comment
        const comment = new Comment({
            content: content.trim(),
            author: `${req.user.firstName} ${req.user.lastName}`,
            authorId: req.user._id,
            authorUsername: req.user.username,
            postId: postId
        });

        await comment.save();

        // Update comment count in post
        post.comments += 1;
        await post.save();

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.id })
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete comment (only comment author can delete)
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user is the comment author
        if (comment.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        // Update post comment count
        await Post.findByIdAndUpdate(comment.postId, { $inc: { comments: -1 } });

        await Comment.findByIdAndDelete(req.params.commentId);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get trending topics/tags
router.get('/trending/tags', async (req, res) => {
    try {
        const trendingTags = await Post.aggregate([
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json(trendingTags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
