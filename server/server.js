
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const postsRoutes = require('./routes/posts');
const myPostsRoutes = require('./routes/myPosts');
const indexRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection - Update database name
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to social_media_app database'));

// Routes
app.use('/api/posts', postsRoutes);
app.use('/api/my-posts', myPostsRoutes);
app.use('/api', indexRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running!', timestamp: new Date() });
});

app.listen(port, () => {
    console.log(`Social Media Server running at http://localhost:${port}`);
});