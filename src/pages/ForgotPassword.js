import React, { useState } from 'react';
import api from '../api';  
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState(''); // State to store email input
  const [message, setMessage] = useState(''); // State to store success messages
  const [error, setError] = useState(''); // State to store error messages
  const [loading, setLoading] = useState(false); // State to manage loading state

  // Function to validate email format
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setMessage('');
    setError('');

    // Basic validation for email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true); // Set loading to true while the request is in progress

      // Make a POST request to your backend API to send the reset link
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message); // Display success message from backend
      setEmail(''); // Clear the email field after successful submission
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link'); // Set error message
    } finally {
      setLoading(false); // Set loading to false when request completes
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-hero">
        <h1>Reset Your Password</h1>
        <p>Enter your email and we'll send you a link to reset your password</p>
      </div>
      
      <div className="forgot-password-layout">
        {/* Left Side Content */}
        <div className="left-content">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Password Reset</h3>
            <p>Your security is our priority. We'll help you regain access to your account safely and securely.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Quick & Easy</h3>
            <p>Get back to your studies in no time with our simple password reset process.</p>
          </div>
        </div>
        
        {/* Center Form */}
        <div className="center-form">
          <div className="forgot-password-form">
            <h2>Forgot Your Password?</h2>
            <p className="form-subtitle">Enter your registered email to receive a password reset link</p>
            
            <form onSubmit={handleSubmit} aria-live="polite">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                className={error ? 'input-error' : ''}
                disabled={loading}
              />
              
              <button type="submit" className="btn-reset" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              {/* Display Success or Error Messages */}
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message" aria-live="assertive">{error}</p>}
              
              <p className="back-to-login">
                Remember your password? <a href="/signin" className="login-link">Log in</a>
              </p>
            </form>
          </div>
        </div>
        
        {/* Right Side Content */}
        <div className="right-content">
          <div className="testimonial">
            <h3>What our users say</h3>
            <p>"The password reset process was quick and painless. I was back to studying in no time!"</p>
            <p className="testimonial-author">- Sarah, University Student</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>Check Your Inbox</h3>
            <p>After submitting, check your email for a secure link to reset your password.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
