const jwt = require('jsonwebtoken');
const Group = require('../models/Group');
const User = require('../models/User');


// Authenticate User Middleware
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid',
        error: error.message 
      });
    }

    // Get user from the token
    const user = await User.findById(decoded.user?._id).select('+User_tokenVersion');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check token version
    if (decoded.user?.tokenVersion !== user.User_tokenVersion) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please log in again.' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Authorize Admin Middleware
const authorizeAdmin = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isAdmin = await group.isAdmin(userId);

    if (!isAdmin) return res.status(403).json({ message: 'Access denied, admin privileges required' });

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during authorization' });
  }
};

module.exports = { authenticateUser, authorizeAdmin };
