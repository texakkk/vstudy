const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  Task_groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true,
  },
  Task_assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    }
  ],
  Task_name: {
    type: String,
    required: true,
    trim: true,
  },
  Task_description: {
    type: String,
    default: '',
    trim: true,
  },
  Task_status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  Task_dueDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value >= Date.now();
      },
      message: 'Due date cannot be in the past.',
    },
  },
  Task_priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  Task_progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0 && value <= 100;
      },
      message: 'Progress must be an integer between 0 and 100'
    }
  },
  Task_comments: [
    {
      Comment_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      Comment_text: {
        type: String,
        required: true,
        trim: true,
      },
      Comment_date: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  Task_createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  Task_isNotified: {
    type: Boolean,
    default: false,
  },
  Task_createdAt: { type: Date, default: Date.now },
  Task_updatedAt: { type: Date, default: Date.now },
}, );


// Indexes for optimized querying
TaskSchema.index({ Task_groupId: 1, Task_status: 1 });
TaskSchema.index({ Task_dueDate: 1 });
TaskSchema.index({ 'Task_comments.Comment_user': 1 });

// Method to add a comment
TaskSchema.methods.addComment = function (userId, comment) {
  this.Task_comments.push({ Comment_user: userId, Comment_text: comment });
  return this.save();
};
// Method to mark task as notified
TaskSchema.methods.markAsNotified = function () {
  this.Task_isNotified = true;
  return this.save();
};

module.exports = mongoose.model('Task', TaskSchema);
