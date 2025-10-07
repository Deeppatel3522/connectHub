import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <div className="header hero-section">
                <h1 className="hero-title">Social Connect</h1>
                <p className="hero-subtitle">
                    Share your thoughts, connect with others, and discover amazing content in one beautiful place.
                    Create posts, engage with the community, and build meaningful connections.
                </p>

                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-number">500+</span>
                        <span className="stat-label">Active Users</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">2.5k+</span>
                        <span className="stat-label">Posts Shared</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">15k+</span>
                        <span className="stat-label">Interactions</span>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 40px' }}>
                <div className="welcome-message">
                    <p>Welcome to your personal social space! Connect, share, and discover content that matters to you.</p>
                </div>

                <div className="nav-grid">
                    <Link to="/posts" className="nav-card">
                        <div className="nav-card-icon">📰</div>
                        <h2>Browse Posts</h2>
                        <p>Explore posts from the community. Discover new perspectives, interesting stories, and engaging content from fellow users.</p>
                        <div className="nav-card-footer">
                            <span className="card-action">Explore →</span>
                            <span className="card-count">Latest posts</span>
                        </div>
                    </Link>

                    <Link to="/my-posts" className="nav-card">
                        <div className="nav-card-icon">👤</div>
                        <h2>My Posts</h2>
                        <p>Manage your personal posts and content. Edit, delete, or review your contributions to the community.</p>
                        <div className="nav-card-footer">
                            <span className="card-action">Manage →</span>
                            <span className="card-count">Your content</span>
                        </div>
                    </Link>

                    <Link to="/create-post" className="nav-card">
                        <div className="nav-card-icon">✏️</div>
                        <h2>Create Post</h2>
                        <p>Share your thoughts, experiences, and ideas with the community. Start conversations and connect with others.</p>
                        <div className="nav-card-footer">
                            <span className="card-action">Create →</span>
                            <span className="card-count">Share ideas</span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;
