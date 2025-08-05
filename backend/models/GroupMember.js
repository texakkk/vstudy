const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema({
  GroupMember_groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  GroupMember_userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  GroupMember_role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  GroupMember_joinedAt: {
    type: Date,
    default: Date.now
  },
  GroupMember_lastActive: {
    type: Date,
    default: Date.now
  },
  GroupMember_createdAt: { type: Date, default: Date.now },
  GroupMember_updatedAt: { type: Date, default: Date.now },
}, { 
  timestamps: {
    createdAt: 'GroupMember_createdAt',
    updatedAt: 'GroupMember_updatedAt',
    currentTime: () => new Date()
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a compound index to ensure a user can only be a member of a group once
GroupMemberSchema.index({ GroupMember_groupId: 1, GroupMember_userId: 1 }, { unique: true });

// Virtual for user details
GroupMemberSchema.virtual('user', {
  ref: 'User',
  localField: 'GroupMember_userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for group details
GroupMemberSchema.virtual('group', {
  ref: 'Group',
  localField: 'GroupMember_groupId',
  foreignField: '_id',
  justOne: true
});

// Add a method to check if member is admin
GroupMemberSchema.methods.isAdmin = function() {
  return this.GroupMember_role === 'admin';
};

// Update last active timestamp
GroupMemberSchema.methods.updateLastActive = function() {
  this.GroupMember_lastActive = new Date();
  return this.save();
};

// Pre-save hook to ensure required fields
GroupMemberSchema.pre('save', function(next) {
  const now = new Date();
  if (this.isNew) {
    this.GroupMember_joinedAt = now;
    this.GroupMember_createdAt = now;
  }
  this.GroupMember_lastActive = now;
  this.GroupMember_updatedAt = now;
  next();
});

const GroupMember = mongoose.model('GroupMember', GroupMemberSchema);

module.exports = GroupMember;
