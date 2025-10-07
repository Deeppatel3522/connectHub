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

function Posts() {
    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});

    const { user } = useAuth();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Frontend: Fetching posts from API...");
            const response = await fetch('/api/posts');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Frontend: Received data:", data);

            if (Array.isArray(data)) {
                setPosts(data);
                console.log("Frontend: Posts set successfully:", data.length);

                // Check like status for each post if user is authenticated
                if (user) {
                    checkLikeStatus(data);
                }
            } else {
                console.error("Frontend: API did not return an array:", data);
                setPosts([]);
                setError("Invalid data format received from server");
            }
        } catch (error) {
            console.error('Frontend: Error fetching posts:', error);
            setError(error.message);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const checkLikeStatus = async (postsData) => {
        try {
            const likedPostsSet = new Set();

            for (const post of postsData) {
                try {
                    const response = await fetch(`/api/posts/${post._id}/like-status`, {
                        headers: getAuthHeaders()
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.isLiked) {
                            likedPostsSet.add(post._id);
                        }
                    }
                } catch (error) {
                    console.error(`Error checking like status for post ${post._id}:`, error);
                }
            }

            setLikedPosts(likedPostsSet);
        } catch (error) {
            console.error('Error checking like statuses:', error);
        }
    };

    const toggleLike = async (postId) => {
        if (!user) {
            showNotification('Please log in to like posts', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/toggle-like`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();

                // Update like status
                const newLikedPosts = new Set(likedPosts);
                if (data.isLiked) {
                    newLikedPosts.add(postId);
                } else {
                    newLikedPosts.delete(postId);
                }
                setLikedPosts(newLikedPosts);

                // Update post likes count
                setPosts(posts.map(post =>
                    post._id === postId ? { ...post, likes: data.likes } : post
                ));

                showNotification(data.message, 'success');
            } else {
                throw new Error('Failed to toggle like');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            showNotification('Failed to update like status', 'error');
        }
    };

    const toggleComments = async (postId) => {
        if (!showComments[postId]) {
            // Load comments if not already loaded
            try {
                const response = await fetch(`/api/posts/${postId}/comments`);
                if (response.ok) {
                    const commentsData = await response.json();
                    setComments(prev => ({ ...prev, [postId]: commentsData }));
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        }

        setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const addComment = async (postId) => {
        if (!user) {
            showNotification('Please log in to add comments', 'error');
            return;
        }

        const commentText = newComment[postId];
        if (!commentText || !commentText.trim()) {
            showNotification('Please enter a comment', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ content: commentText.trim() })
            });

            if (response.ok) {
                const newCommentData = await response.json();

                // Update comments list
                setComments(prev => ({
                    ...prev,
                    [postId]: [newCommentData, ...(prev[postId] || [])]
                }));

                // Update post comment count
                setPosts(posts.map(post =>
                    post._id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
                ));

                // Clear comment input
                setNewComment(prev => ({ ...prev, [postId]: '' }));

                showNotification('Comment added successfully!', 'success');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification(error.message, 'error');
        }
    };

    const deleteComment = async (commentId, postId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/comments/${commentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                // Update comments list
                setComments(prev => ({
                    ...prev,
                    [postId]: prev[postId].filter(comment => comment._id !== commentId)
                }));

                // Update post comment count
                setPosts(posts.map(post =>
                    post._id === postId ? { ...post, comments: Math.max(0, (post.comments || 1) - 1) } : post
                ));

                showNotification('Comment deleted successfully!', 'success');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            showNotification(error.message, 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const clearSearch = () => {
        setSearch('');
        setFilterType('all');
    };

    // Filter posts based on search and filter type
    const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
        if (!post) return false;

        const matchesSearch =
            (post.title && post.title.toLowerCase().includes(search.toLowerCase())) ||
            (post.content && post.content.toLowerCase().includes(search.toLowerCase())) ||
            (post.author && post.author.toLowerCase().includes(search.toLowerCase()));

        if (filterType === 'all') return matchesSearch;
        if (filterType === 'recent') {
            const postDate = new Date(post.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return matchesSearch && postDate >= weekAgo;
        }
        if (filterType === 'popular') return matchesSearch && (post.likes > 10);

        return matchesSearch;
    }) : [];

    // Loading state
    if (loading) {
        return (
            <div>
                <div className="header">
                    <h1>📰 Community Posts</h1>
                    <p>Loading posts...</p>
                </div>
                <div className="posts-page-content">
                    <div className="loading">🔄 Loading posts...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div>
                <div className="header">
                    <h1>📰 Community Posts</h1>
                    <p>Error loading posts</p>
                </div>
                <div className="posts-page-content">
                    <div className="error-message">
                        <h3>❌ Error</h3>
                        <p>{error}</p>
                        <button onClick={fetchPosts} className="retry-btn">
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
                <h1>📰 Community Posts</h1>
                <p>Discover and engage with posts from the community</p>
            </div>

            <div className="posts-page-content">
                {/* Enhanced Search Section */}
                <div className="search-section">
                    <div className="search-bar-container">
                        <div className="search-input-wrapper">
                            <div className="search-icon">🔍</div>
                            <input
                                type="text"
                                placeholder="Search posts by title, content, or author..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="enhanced-search-input"
                            />
                            {search && (
                                <button className="clear-search" onClick={clearSearch}>
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterType('all')}
                            >
                                All Posts
                            </button>
                            <button
                                className={`filter-tab ${filterType === 'recent' ? 'active' : ''}`}
                                onClick={() => setFilterType('recent')}
                            >
                                Recent
                            </button>
                            <button
                                className={`filter-tab ${filterType === 'popular' ? 'active' : ''}`}
                                onClick={() => setFilterType('popular')}
                            >
                                Popular
                            </button>
                        </div>
                    </div>

                    <div className="search-stats">
                        <span className="results-count">
                            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
                        </span>
                        {search && (
                            <span className="search-term">
                                for "{search}"
                            </span>
                        )}
                    </div>
                </div>

                {notification.message && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}

                <div id="Post_Container">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map(post => (
                            <div key={post._id || post.id} className="post-card">
                                <div className="post-header">
                                    <div className="post-author">
                                        <div className="author-avatar">
                                            {post.author ? post.author.charAt(0).toUpperCase() : 'A'}
                                        </div>
                                        <div>
                                            <h3>{post.author || 'Anonymous'}</h3>
                                            <span className="post-date">
                                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
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
                                    <h2>{post.title || 'Untitled'}</h2>
                                    <p>{post.content || 'No content'}</p>
                                </div>

                                <div className="post-actions">
                                    <button
                                        className={`like-btn ${likedPosts.has(post._id) ? 'liked' : ''}`}
                                        onClick={() => toggleLike(post._id)}
                                    >
                                        {likedPosts.has(post._id) ? '❤️' : '🤍'} {post.likes || 0}
                                    </button>
                                    <button
                                        className="comment-btn"
                                        onClick={() => toggleComments(post._id)}
                                    >
                                        💬 {post.comments || 0}
                                    </button>
                                    <button className="share-btn">
                                        🔗 Share
                                    </button>
                                </div>

                                {/* Comments Section */}
                                {showComments[post._id] && (
                                    <div className="comments-section">
                                        {user && (
                                            <div className="add-comment">
                                                <div className="comment-input-wrapper">
                                                    <div className="commenter-avatar">
                                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Write a comment..."
                                                        value={newComment[post._id] || ''}
                                                        onChange={(e) => setNewComment(prev => ({
                                                            ...prev,
                                                            [post._id]: e.target.value
                                                        }))}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                addComment(post._id);
                                                            }
                                                        }}
                                                        className="comment-input"
                                                        maxLength="500"
                                                    />
                                                    <button
                                                        onClick={() => addComment(post._id)}
                                                        className="comment-submit"
                                                        disabled={!newComment[post._id]?.trim()}
                                                    >
                                                        Send
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="comments-list">
                                            {comments[post._id]?.length > 0 ? (
                                                comments[post._id].map(comment => (
                                                    <div key={comment._id} className="comment-item">
                                                        <div className="comment-avatar">
                                                            {comment.author?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="comment-content">
                                                            <div className="comment-header">
                                                                <strong>{comment.author}</strong>
                                                                <span className="comment-date">
                                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                                </span>
                                                                {user && comment.authorId === user.id && (
                                                                    <button
                                                                        onClick={() => deleteComment(comment._id, post._id)}
                                                                        className="delete-comment"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p>{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="no-comments">No comments yet. Be the first to comment!</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <h3>No posts found</h3>
                            <p>
                                {search
                                    ? `No posts match "${search}". Try different keywords or check your filters.`
                                    : 'No posts available. Be the first to share something!'
                                }
                            </p>
                            {search && (
                                <button className="clear-filters-btn" onClick={clearSearch}>
                                    Clear Search & Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Posts;
