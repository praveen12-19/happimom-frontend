import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import { loginUser, registerUser, getUserProfile } from '../api/authApi';
import '../css/AuthModal.css';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, login, authDestination, openOnboardingModal } = useTracker();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset form fields completely whenever the modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const regRes = await registerUser(email, password);
        setSuccessMsg('Account created successfully! Welcome...');

        // Auto login
        const loginRes = await loginUser(email, password);
        let userData = {
          id: loginRes.id,
          email: loginRes.email,
          profileComplete: loginRes.profileComplete || false,
          name: ''
        };

        // Try getting user profile
        try {
          const profile = await getUserProfile(loginRes.id);
          if (profile) {
            userData = { ...userData, ...profile };
          }
        } catch (err) {
          // If profile not complete yet, keep empty name
        }

        login(userData);
        setTimeout(() => {
          closeAuthModal();
          // Prompt user with onboarding details modal before entering UI
          openOnboardingModal(authDestination);
        }, 700);
      } else {
        const loginRes = await loginUser(email, password);
        let userData = {
          id: loginRes.id,
          email: loginRes.email,
          profileComplete: loginRes.profileComplete || false,
          name: ''
        };

        try {
          const profile = await getUserProfile(loginRes.id);
          if (profile) {
            userData = { ...userData, ...profile };
          }
        } catch (err) {
          // Ignore profile error
        }

        login(userData);
        setSuccessMsg('Welcome back!');
        setTimeout(() => {
          closeAuthModal();
          // If first time login and profile is not complete, show onboarding modal
          if (!userData.profileComplete) {
            openOnboardingModal(authDestination);
          } else if (authDestination) {
            navigate(authDestination);
          }
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="auth-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close Authentication Modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-icon-badge">💖</div>
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Sign In to HappiMoM' : 'Join HappiMoM'}
          </h2>
          <p className="auth-modal-subtext">
            {authDestination
              ? 'Please sign in to access this section and save your journey'
              : 'Keep track of your health, calendar milestones, and personal journey'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active-tab' : ''}`}
            onClick={() => handleModeChange('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active-tab' : ''}`}
            onClick={() => handleModeChange('register')}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {error && <div className="auth-alert error-alert">{error}</div>}
        {successMsg && <div className="auth-alert success-alert">{successMsg}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye Off SVG */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye On SVG */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm the password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    /* Eye Off SVG */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye On SVG */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-wrap">
                <span className="btn-spinner"></span> Connecting...
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer-note">
          {mode === 'login' ? (
            <p>
              New to HappiMoM?{' '}
              <button
                type="button"
                className="link-style-btn"
                onClick={() => handleModeChange('register')}
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="link-style-btn"
                onClick={() => handleModeChange('login')}
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
