import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import '../css/Navbar.css';

const Navbar = () => {
  const { user, openAuthModal, logout, setIsEmergencyModalOpen, openEmergencyModal } = useTracker();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Calendar', path: '/calendar' },
    { name: 'Pregnancy', path: '/pregnancy', protected: true },
    { name: 'Only for U', path: '/only-for-u' },
    { name: 'Memories', path: '/memories', protected: true }
  ];

  const handleNavClick = (e, item) => {
    if (item.protected && !user) {
      e.preventDefault();
      openAuthModal(item.path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/calendar');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Left: Logo */}
        <NavLink to="/calendar" className="navbar-logo">
          <span className="logo-heart">💖</span>
          <span className="logo-text">HappiMoM</span>
        </NavLink>

        {/* Center: Nav links */}
        <nav className="navbar-navigation" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active-nav-link' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="nav-link-text">{item.name}</span>
                  {isActive && <span className="nav-pink-underline" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side: Emergency Contact button & Login / User Profile */}
        <div className="navbar-right">
          {user && (
            <button
              id="emergency-contact-btn"
              className="emergency-btn"
              onClick={() => (openEmergencyModal ? openEmergencyModal({ readOnly: true }) : setIsEmergencyModalOpen(true))}
              aria-label="Open Emergency Contact"
            >
              <span className="btn-icon">🚨</span>
              Emergency Contact
            </button>
          )}

          {user ? (
            <div className="navbar-user-group">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `profile-avatar-wrapper ${isActive ? 'active-profile' : ''}`
                }
                title={user?.name ? `${user.name} - View Profile Details` : "View Profile Details"}
                aria-label="View Profile details"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile Avatar"
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '👤')}</span>
                  </div>
                )}
              </NavLink>
              <button
                type="button"
                className="navbar-logout-btn"
                onClick={handleLogout}
                title="Log out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="navbar-login-btn"
              type="button"
              className="navbar-login-btn"
              onClick={() => openAuthModal('/profile')}
              aria-label="Login to HappiMoM"
            >
              <span className="btn-icon">🔐</span>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
