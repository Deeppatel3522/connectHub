import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);

    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await fetch(`https://connecthub-server-9twq.onrender.com/api/auth/verify-reset-token/${token}`);
            const data = await response.json();

            if (response.ok) {
                setTokenValid(true);
            } else {
                setError(data.error);
                setTokenValid(false);
            }
        } catch (error) {
            console.error('Token verification error:', error);
            setError('Network error. Please try again.');
            setTokenValid(false);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`https://connecthub-server-9twq.onrender.com/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password, confirmPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.error);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>🔄 Verifying...</h1>
                        <p>Please wait while we verify your reset token</p>
                    </div>
                    <div className="loading">Verifying reset link...</div>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>❌ Invalid or Expired Link</h1>
                        <p>This password reset link is invalid or has expired</p>
                    </div>

                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="auth-footer">
                        <p>Need a new reset link?</p>
                        <Link to="/forgot-password" className="auth-link">
                            Request New Link →
                        </Link>
                        <br />
                        <Link to="/login" className="auth-link">
                            Back to Sign In →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🔑 Reset Your Password</h1>
                    <p>Enter your new password below</p>
                </div>

                {message && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        {message}
                        <br />
                        <small>Redirecting to login page in 3 seconds...</small>
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
                        <label htmlFor="password">New Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                disabled={loading}
                                minLength="6"
                            />
                        </div>
                        <small className="form-help">Password must be at least 6 characters long</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                disabled={loading}
                                minLength="6"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`auth-button ${loading ? 'loading' : ''}`}
                        disabled={loading || !password || !confirmPassword}
                    >
                        {loading ? '🔄 Resetting...' : '✅ Reset Password'}
                    </button>
                </form>

                <div className="auth-footer">
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

export default ResetPassword;
