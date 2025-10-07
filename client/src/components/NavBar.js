import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showDropdown]);

    // Close mobile menu when route changes
    useEffect(() => {
        setShowMobileMenu(false);
        setShowDropdown(false);
    }, [location.pathname]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMobileMenu && !event.target.closest('.navbar')) {
                setShowMobileMenu(false);
            }
        };

        if (showMobileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMobileMenu]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (showMobileMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showMobileMenu]);

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    <span className="brand-icon">🌐</span>
                    <span className="brand-text">Connect Hub</span>
                </Link>

                {/* Desktop Navigation */}
                <div className={`nav-links ${showMobileMenu ? 'show' : ''}`}>
                    <Link
                        to="/"
                        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        onClick={() => setShowMobileMenu(false)}
                    >
                        🏠 Home
                    </Link>
                    <Link
                        to="/posts"
                        className={`nav-link ${location.pathname === '/posts' ? 'active' : ''}`}
                        onClick={() => setShowMobileMenu(false)}
                    >
                        📰 All Posts
                    </Link>
                    <Link
                        to="/my-posts"
                        className={`nav-link ${location.pathname === '/my-posts' ? 'active' : ''}`}
                        onClick={() => setShowMobileMenu(false)}
                    >
                        👤 My Posts
                    </Link>
                    <Link
                        to="/create-post"
                        className={`nav-link ${location.pathname === '/create-post' ? 'active' : ''}`}
                        onClick={() => setShowMobileMenu(false)}
                    >
                        ✏️ Create Post
                    </Link>
                </div>

                {/* User Dropdown */}
                <div className="nav-user" ref={dropdownRef}>
                    <button
                        className="user-btn"
                        onClick={toggleDropdown}
                        aria-expanded={showDropdown}
                        aria-label="User menu"
                    >
                        <div className="nav-avatar">
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                        <span className="nav-username">{user?.firstName}</span>
                        <span className={`dropdown-arrow ${showDropdown ? 'up' : 'down'}`}>▼</span>
                    </button>

                    {showDropdown && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </div>
                                <div className="dropdown-info">
                                    <strong>{user?.fullName || `${user?.firstName} ${user?.lastName}`}</strong>
                                    <span>@{user?.username}</span>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item logout-item" onClick={handleLogout}>
                                <span>🚪</span>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="nav-toggle"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle navigation menu"
                    aria-expanded={showMobileMenu}
                >
                    <span className={`hamburger ${showMobileMenu ? 'active' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>
        </nav>
    );
}