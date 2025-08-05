import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    // Toggle body scroll
    if (newState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };
  
  // Clean up the body style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="navbar-logo">
          <NavLink to="/" onClick={closeMobileMenu}>
            <img src="/logo512.png" alt="Study" className="logo" />
            <span>Study</span>
          </NavLink>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Mobile Overlay */}
        <div 
          className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={closeMobileMenu}
          role="button"
          tabIndex="0"
          onKeyDown={(e) => e.key === 'Escape' && closeMobileMenu()}
          aria-label="Close menu"
        />

        {/* Navbar Links */}
        <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li><NavLink to="/features" onClick={closeMobileMenu} activeclassname="active">Features</NavLink></li>
          <li><NavLink to="/pricing" onClick={closeMobileMenu} activeclassname="active">Pricing</NavLink></li>
          <li><NavLink to="/signin" onClick={closeMobileMenu} activeclassname="active">Sign In</NavLink></li>
          <li><NavLink to="/get-started" onClick={closeMobileMenu} className="btn-get-started" activeclassname="active">Get Started</NavLink></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;