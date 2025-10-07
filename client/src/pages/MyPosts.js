import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

function MyPosts() {
    const [posts, setPosts] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Frontend: Fetching my posts...");
            const response = await fetch('https://connecthub-server-9twq.onrender.com/api/my-posts', {
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log("Frontend: My posts response:", data);

            if (response.ok && Array.isArray(data)) {
                setPosts(data);
            } else {
                setError(data.error || 'Failed to fetch posts');
                setPosts([]);
            }
        } catch (error) {
            console.error('Error fetching my posts:', error);
            setError('Network error. Please try again.');
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                console.log("Frontend: Deleting post:", postId);
                const response = await fetch(`https://connecthub-server-9twq.onrender.com/api/my-posts/${postId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const remainingPosts = await response.json();
                    setPosts(remainingPosts);
                    console.log('Post deleted successfully');
                } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to delete post');
                }
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Error deleting post. Please try again.');
            }
        }
    };

    const startEditing = (post) => {
        setEditingPost(post._id);
        setEditTitle(post.title);
        setEditContent(post.content);
    };

    const saveEdit = async (postId) => {
        if (!editTitle.trim() || !editContent.trim()) {
            alert('Title and content cannot be empty');
            return;
        }

        try {
            setSaving(true);
            console.log("Frontend: Updating post:", postId);
            const response = await fetch(`https://connecthub-server-9twq.onrender.com/api/my-posts/${postId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: editTitle.trim(),
                    content: editContent.trim()
                })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                setPosts(posts.map(post =>
                    post._id === postId ? updatedPost : post
                ));
                setEditingPost(null);
                setEditTitle('');
                setEditContent('');
                console.log('Post updated successfully');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update post');
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Error updating post. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setEditingPost(null);
        setEditTitle('');
        setEditContent('');
    };

    // Loading state
    if (loading) {
        return (
            <div>
                <div className="header">
                    <h1>👤 My Posts</h1>
                    <p>Loading your posts...</p>
                </div>
                <div className="posts-page-content">
                    <div className="loading">🔄 Loading your posts...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div>
                <div className="header">
                    <h1>👤 My Posts</h1>
                    <p>Error loading your posts</p>
                </div>
                <div className="posts-page-content">
                    <div className="error-message">
                        <h3>❌ Error</h3>
                        <p>{error}</p>
                        <button onClick={fetchMyPosts} className="retry-btn">
                            🔄 Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="header">
                <h1>👤 My Posts</h1>
                <p>Welcome back, {user?.firstName}! Manage your posts here.</p>
            </div>

            <div style={{ padding: '0 40px' }}>
                <div className="posts-stats">
                    <div className="stat-card">
                        <span className="stat-number">{posts.length}</span>
                        <span className="stat-label">Total Posts</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{posts.reduce((sum, post) => sum + (post.likes || 0), 0)}</span>
                        <span className="stat-label">Total Likes</span>
                    </div>
                </div>

                <div id="Post_Container">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <div
                                key={post._id}
                                className={`post-card my-post ${editingPost === post._id ? 'editing' : ''}`}
                            >
                                {editingPost === post._id ? (
                                    <div className="edit-form">
                                        <div className="form-header">
                                            <div className="edit-icon">✏️</div>
                                            <h3 className="form-title">Edit Your Post</h3>
                                        </div>

                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="edit-title-input"
                                            placeholder="Enter your post title..."
                                            maxLength="200"
                                            disabled={saving}
                                        />
                                        <div className="character-counter">
                                            {editTitle.length}/200 characters
                                        </div>

                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="edit-content-input"
                                            placeholder="Share your thoughts..."
                                            rows="6"
                                            maxLength="2000"
                                            disabled={saving}
                                        />
                                        <div className="character-counter">
                                            {editContent.length}/2000 characters
                                        </div>

                                        <div className="edit-actions">
                                            <button
                                                className="save-btn"
                                                onClick={() => saveEdit(post._id)}
                                                disabled={saving || !editTitle.trim() || !editContent.trim()}
                                            >
                                                {saving ? '💫 Saving...' : '💾 Save Changes'}
                                            </button>
                                            <button
                                                className="cancel-btn"
                                                onClick={cancelEdit}
                                                disabled={saving}
                                            >
                                                ❌ Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="post-header">
                                            <div className="post-author">
                                                <div className="author-avatar">
                                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3>{post.author}</h3>
                                                    <span className="post-date">
                                                        {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {post.image && (
                                            <div className="post-image">
                                                <img src={post.image} alt="Post content" />
                                            </div>
                                        )}

                                        <div className="post-content">
                                            <h2>{post.title}</h2>
                                            <p>{post.content}</p>
                                        </div>

                                        <div className="post-stats">
                                            <span>❤️ {post.likes || 0} likes</span>
                                            <span>💬 {post.comments || 0} comments</span>
                                        </div>

                                        <div className="post-actions">
                                            <button
                                                className="edit-btn"
                                                onClick={() => startEditing(post)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deletePost(post._id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <h3>You haven't created any posts yet</h3>
                            <p>Start sharing your thoughts with the community!</p>
                            <a href="/create-post" className="cta-button">Create Your First Post</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyPosts;
