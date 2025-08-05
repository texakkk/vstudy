const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  Group_name: { type: String, required: true, trim: true, unique: true },
  Group_description: { type: String, trim: true },
  Group_createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  Group_invitationToken: { type: String, index: true },
  Group_invitationTokenExpiresAt: { type: Date },
  Group_createdAt: { type: Date, default: Date.now },
  Group_updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: {
    createdAt: 'Group_createdAt',
    updatedAt: 'Group_updatedAt',
    currentTime: () => new Date()
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting group members
GroupSchema.virtual('Group_members', {
  ref: 'GroupMember',
  localField: '_id',
  foreignField: 'GroupMember_groupId',
  justOne: false
});

// TTL index on invitationTokenExpiresAt
GroupSchema.index({ Group_invitationTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if a user is an admin
GroupSchema.methods.isAdmin = async function(userId) {
  const GroupMember = mongoose.model('GroupMember');
  const member = await GroupMember.findOne({ 
    GroupMember_groupId: this._id, 
    GroupMember_userId: userId 
  });
  return member && member.GroupMember_role === 'admin';
};

// Method to get all members with their details
GroupSchema.methods.getMembers = async function() {
  const GroupMember = mongoose.model('GroupMember');
  return GroupMember.find({ GroupMember_id: this._id })
    .populate('GroupMember_userId', 'User_name User_email')
    .sort({ GroupMember_role: -1, GroupMember_joinedAt: 1 }); // Sort by role (admins first), then join date
};

// Method to add a member to the group
GroupSchema.methods.addMember = async function(userId, role = 'member') {
  const GroupMember = mongoose.model('GroupMember');
  return GroupMember.findOneAndUpdate(
    { GroupMember_groupId: this._id, GroupMember_userId: userId },
    { GroupMember_role: role },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Method to remove a member from the group
GroupSchema.methods.removeMember = async function(userId) {
  const GroupMember = mongoose.model('GroupMember');
  return GroupMember.findOneAndDelete({ 
    GroupMember_groupId: this._id, 
    GroupMember_userId: userId 
  });
};

// Method to get admin count
GroupSchema.methods.getAdminCount = async function() {
  const GroupMember = mongoose.model('GroupMember');
  return GroupMember.countDocuments({ 
    GroupMember_groupId: this._id, 
    GroupMember_role: 'admin' 
  });
};

// Method to promote/demote member
GroupSchema.methods.updateMemberRole = async function(userId, role) {
  const GroupMember = mongoose.model('GroupMember');
  return GroupMember.findOneAndUpdate(
    { GroupMember_groupId: this._id, GroupMember_userId: userId },
    { GroupMember_role: role },
    { new: true }
  );
};

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;