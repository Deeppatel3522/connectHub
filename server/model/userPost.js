const mongoose = require('mongoose');

const userPostSchema = new mongoose.Schema({
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
        default: 'Current User'
    },
    image: {
        type: String,
        default: null
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    isDraft: {
        type: Boolean,
        default: false
    },
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

module.exports = mongoose.model("user_posts_collection", userPostSchema);
