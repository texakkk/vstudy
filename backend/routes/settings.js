const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/authMiddleware');

// @desc    Update user password
// @route   PUT /api/settings/password
// @access  Private
router.put('/password', authenticateUser, async (req, res) => {
  try {
    console.log('Password update request received', { body: req.body });
    
    const { currentPassword, newPassword } = req.body;
    
    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password and new password are required',
        receivedFields: Object.keys(req.body)
      });
    }
    
    // Get the email from the authenticated user
    const email = req.user.User_email;

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+User_password');
    
    if (!user) {
      console.error('User not found');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Verify the provided email matches the user's email
    if (user.User_email !== email) {
      return res.status(400).json({
        success: false,
        message: 'The provided email does not match your account email'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.User_password);
    if (!isMatch) {
      console.log('Current password is incorrect');
      return res.status(400).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Hash and update new password
    try {
      user.User_password = newPassword;
      user.User_tokenVersion = (user.User_tokenVersion || 0) + 1;
      
      try {
        await user.save();
        console.log('Password updated successfully');
        
        // Return success response
        res.json({ 
          success: true, 
          message: 'Password updated successfully. You will be logged out.',
          tokenVersion: user.User_tokenVersion
        });
      } catch (error) {
        console.error('Error saving user after password update:', error);
        return res.status(500).json({
          success: false,
          message: 'Error updating password. Please try again.'
        });
      }
    } catch (dbError) {
      console.error('Error saving new password:', dbError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to save new password',
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete user account
// @route   DELETE /api/settings/account
// @access  Private
router.delete('/account', authenticateUser, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: 'Password is required to delete account' 
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+User_password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.User_password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Incorrect password' 
      });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ 
      success: true, 
      message: 'Your account has been permanently deleted',
      redirect: '/'
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Note: Appearance and language settings are now handled in localStorage on the client side

module.exports = router;
