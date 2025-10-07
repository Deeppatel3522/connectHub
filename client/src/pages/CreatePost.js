import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

function CreatePost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [tags, setTags] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();
    const navigate = useNavigate();

    // Load draft on component mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('postDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setTitle(draft.title || '');
                setContent(draft.content || '');
                setImage(draft.image || '');
                setTags(draft.tags || '');
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    image: image.trim(),
                    tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Clear form and draft
                setTitle('');
                setContent('');
                setImage('');
                setTags('');
                localStorage.removeItem('postDraft');

                setSuccess(true);

                // Navigate to posts page after success
                setTimeout(() => {
                    setSuccess(false);
                    navigate('/posts');
                }, 2000);
            } else {
                setError(data.error || 'Failed to create post. Please try again.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const saveDraft = () => {
        const draft = {
            title: title.trim(),
            content: content.trim(),
            image: image.trim(),
            tags: tags.trim()
        };

        if (draft.title || draft.content) {
            localStorage.setItem('postDraft', JSON.stringify(draft));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        }
    };

    const clearDraft = () => {
        if (window.confirm('Are you sure you want to clear the draft? This cannot be undone.')) {
            setTitle('');
            setContent('');
            setImage('');
            setTags('');
            localStorage.removeItem('postDraft');
        }
    };

    return (
        <div>
            <div className="header">
                <h1>✏️ Create New Post</h1>
                <p>Share your thoughts and ideas with the community, {user?.firstName}!</p>
            </div>

            <div className="create-post-page">
                {success && (
                    <div className="notification success">
                        🎉 {loading ? 'Draft saved successfully!' : 'Post created successfully! Redirecting...'}
                    </div>
                )}

                {error && (
                    <div className="notification error">
                        ⚠️ {error}
                    </div>
                )}

                <div className="create-post-layout">
                    {/* Main Form Section */}
                    <div className="form-section">
                        <form onSubmit={handleSubmit} className="post-form">
                            <div className="form-group">
                                <label htmlFor="title">
                                    <span className="label-icon">📝</span>
                                    Post Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="What's on your mind?"
                                    required
                                    className="form-input"
                                    maxLength="200"
                                    disabled={loading}
                                />
                                <div className="character-count">
                                    {title.length}/200 characters
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="content">
                                    <span className="label-icon">💭</span>
                                    Content
                                </label>
                                <textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Share your thoughts, experiences, or ideas..."
                                    required
                                    rows="8"
                                    className="form-textarea"
                                    maxLength="2000"
                                    disabled={loading}
                                />
                                <div className="character-count">
                                    {content.length}/2000 characters
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="image">
                                    <span className="label-icon">🖼️</span>
                                    Image URL (optional)
                                </label>
                                <input
                                    type="url"
                                    id="image"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="form-input"
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="tags">
                                    <span className="label-icon">🏷️</span>
                                    Tags (optional)
                                </label>
                                <input
                                    type="text"
                                    id="tags"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="technology, lifestyle, travel (separate with commas)"
                                    className="form-input"
                                    disabled={loading}
                                />
                                <div className="form-help">
                                    Add relevant tags to help others discover your post
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    disabled={loading || !title.trim() || !content.trim()}
                                    className="submit-btn"
                                >
                                    {loading ? '📤 Publishing...' : '📝 Publish Post'}
                                </button>

                                <button
                                    type="button"
                                    className="draft-btn"
                                    onClick={saveDraft}
                                    disabled={loading || (!title.trim() && !content.trim())}
                                >
                                    💾 Save as Draft
                                </button>

                                <button
                                    type="button"
                                    className="clear-btn"
                                    onClick={clearDraft}
                                    disabled={loading}
                                >
                                    🗑️ Clear Draft
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar Section */}
                    <div className="sidebar-section">
                        {/* Live Preview */}
                        <div className="preview-card">
                            <h3>📱 Live Preview</h3>
                            <div className="post-preview">
                                <div className="preview-header">
                                    <div className="preview-author">
                                        <div className="author-avatar">
                                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <strong>{user?.fullName || 'Your Name'}</strong>
                                            <span className="preview-date">
                                                {new Date().toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {image && (
                                    <div className="preview-image">
                                        <img
                                            src={image}
                                            alt="Preview"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="preview-content">
                                    <h2>{title || 'Your post title will appear here...'}</h2>
                                    <p>{content || 'Your post content will appear here...'}</p>
                                    {tags && (
                                        <div className="preview-tags">
                                            {tags.split(',').map((tag, index) => (
                                                <span key={index} className="tag">
                                                    #{tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="preview-actions">
                                    <span>❤️ 0</span>
                                    <span>💬 0</span>
                                    <span>🔗 Share</span>
                                </div>
                            </div>
                        </div>

                        {/* Writing Tips */}
                        <div className="tips-card">
                            <h3>💡 Writing Tips</h3>
                            <ul className="tips-list">
                                <li>
                                    <strong>Engaging Title:</strong> Make it catchy and descriptive
                                </li>
                                <li>
                                    <strong>Clear Content:</strong> Use paragraphs and proper formatting
                                </li>
                                <li>
                                    <strong>Visual Appeal:</strong> Add relevant images to boost engagement
                                </li>
                                <li>
                                    <strong>Use Tags:</strong> Help others discover your content
                                </li>
                                <li>
                                    <strong>Community Guidelines:</strong> Keep content respectful and appropriate
                                </li>
                            </ul>
                        </div>

                        {/* Community Stats */}
                        <div className="stats-card">
                            <h3>📊 Community Stats</h3>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-number">2.5k+</span>
                                    <span className="stat-label">Total Posts</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">500+</span>
                                    <span className="stat-label">Active Users</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">15k+</span>
                                    <span className="stat-label">Interactions</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">95%</span>
                                    <span className="stat-label">Positive Feedback</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="activity-card">
                            <h3>🔥 Trending Topics</h3>
                            <div className="trending-tags">
                                <span className="tag">#Technology</span>
                                <span className="tag">#Travel</span>
                                <span className="tag">#Lifestyle</span>
                                <span className="tag">#Food</span>
                                <span className="tag">#Photography</span>
                                <span className="tag">#Music</span>
                                <span className="tag">#Programming</span>
                                <span className="tag">#Fitness</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
