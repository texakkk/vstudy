const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  checkUser();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function checkUser() {
  try {
    const User = require('./backend/models/User');
    const userId = '685bb4f857dd30e4b50ca77e'; // From the token
    
    console.log('Checking user with ID:', userId);
    
    // Check if user exists
    const user = await User.findById(userId).lean();
    
    if (!user) {
      console.log('User not found');
      // Check if any users exist
      const anyUser = await User.findOne().lean();
      console.log('Sample user from database:', anyUser);
    } else {
      console.log('User found:', {
        id: user._id,
        email: user.User_email,
        name: user.User_name,
        createdAt: user.createdAt
      });
    }
    
    // List all users
    const allUsers = await User.find({}, { _id: 1, User_email: 1, User_name: 1 }).lean();
    console.log('All users in database:', allUsers);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
