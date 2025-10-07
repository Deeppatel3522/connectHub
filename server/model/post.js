const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    author: {
        type: String,
        required: true,
        default: 'Anonymous'
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorUsername: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: null
    },
    likes: {
        type: Number,
        default: 0
    },
    // Track which users liked this post
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublished: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for search functionality
postSchema.index({ title: 'text', content: 'text', author: 'text' });

module.exports = mongoose.model("posts_collections", postSchema);
