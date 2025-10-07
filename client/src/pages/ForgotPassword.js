import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail('');
            } else {
                setError(data.error);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔐 Forgot Password?</h1>
                    <p>No worries! Enter your email and we'll send you a reset link</p>
                </div>

                {message && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        {message}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📧</span>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`auth-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? '📤 Sending...' : '🔗 Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Remember your password?</p>
                    <Link to="/login" className="auth-link">
                        Back to Sign In →
                    </Link>
                </div>
            </div>

            <div className="auth-background">
                <div className="floating-shape shape-1"></div>
                <div className="floating-shape shape-2"></div>
                <div className="floating-shape shape-3"></div>
            </div>
        </div>
    );
}

export default ForgotPassword;
