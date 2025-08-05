# Design Document

## Overview

This design enhances the existing task management system to provide comprehensive status tracking and progress monitoring capabilities. The solution builds upon the current Task model and API structure, adding progress tracking fields, automated status management, progress history logging, and enhanced UI components for visual progress representation.

## Architecture

### Current System Analysis
The existing system has:
- Task model with basic status tracking (`pending`, `in-progress`, `completed`)
- RESTful API endpoints for CRUD operations
- Real-time notifications via Socket.IO
- Group-based task management with role-based permissions

### Enhanced Architecture Components
1. **Enhanced Task Model** - Add progress tracking fields and validation
2. **Progress History Service** - Track and manage progress updates
3. **Automated Status Management** - Sync status with progress automatically
4. **Enhanced API Endpoints** - Support progress updates and history retrieval
5. **Real-time Progress Updates** - Socket.IO events for live progress tracking
6. **Enhanced UI Components** - Progress bars and status-grouped task views

## Components and Interfaces

### 1. Enhanced Task Model

**New Fields Added:**
```javascript
Task_progress: {
  type: Number,
  min: 0,
  max: 100,
  default: 0,
  validate: {
    validator: function(v) {
      // Ensure progress aligns with status
      if (this.Task_status === 'completed') return v === 100;
      if (this.Task_status === 'pending') return v === 0;
      return true;
    },
    message: 'Progress must align with task status'
  }
},
Task_progressHistory: [{
  progress: { type: Number, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now },
  previousProgress: { type: Number, required: true },
  changeAmount: { type: Number, required: true },
  statusChanged: { type: Boolean, default: false },
  previousStatus: String,
  newStatus: String
}],
Task_completedAt: {
  type: Date,
  validate: {
    validator: function(v) {
      return !v || this.Task_status === 'completed';
    },
    message: 'Completed date can only be set when status is completed'
  }
},
Task_lastProgressUpdate: {
  type: Date,
  default: Date.now
}
```

**Enhanced Methods:**
```javascript
// Update progress with automatic status management
TaskSchema.methods.updateProgress = function(newProgress, userId) {
  const previousProgress = this.Task_progress;
  const previousStatus = this.Task_status;
  
  // Update progress
  this.Task_progress = newProgress;
  this.Task_lastProgressUpdate = new Date();
  
  // Auto-update status based on progress
  if (newProgress === 0) {
    this.Task_status = 'pending';
    this.Task_completedAt = null;
  } else if (newProgress === 100) {
    this.Task_status = 'completed';
    this.Task_completedAt = new Date();
  } else if (newProgress > 0 && newProgress < 100) {
    this.Task_status = 'in-progress';
    this.Task_completedAt = null;
  }
  
  // Record progress history
  const historyEntry = {
    progress: newProgress,
    updatedBy: userId,
    previousProgress: previousProgress,
    changeAmount: newProgress - previousProgress,
    statusChanged: this.Task_status !== previousStatus,
    previousStatus: previousStatus,
    newStatus: this.Task_status
  };
  
  this.Task_progressHistory.push(historyEntry);
  
  // Keep only last 10 history entries
  if (this.Task_progressHistory.length > 10) {
    this.Task_progressHistory = this.Task_progressHistory.slice(-10);
  }
  
  return this.save();
};

// Get recent progress updates
TaskSchema.methods.getRecentProgressUpdates = function(limit = 5) {
  return this.Task_progressHistory
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
};

// Check if task needs progress reminder
TaskSchema.methods.needsProgressReminder = function() {
  if (this.Task_status === 'completed' || !this.Task_dueDate) return false;
  
  const daysSinceUpdate = (Date.now() - this.Task_lastProgressUpdate) / (1000 * 60 * 60 * 24);
  const daysPastDue = (Date.now() - this.Task_dueDate) / (1000 * 60 * 60 * 24);
  
  return daysPastDue > 0 && daysSinceUpdate >= 3;
};
```

### 2. Enhanced API Endpoints

**New Progress Update Endpoint:**
```javascript
// PUT /api/task/:taskId/progress
router.put("/:taskId/progress", authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { progress } = req.body;
  
  // Validation and permission checks
  // Update progress using model method
  // Emit real-time updates
  // Send notifications if needed
});
```

**Enhanced Task Retrieval with Progress Grouping:**
```javascript
// GET /api/task/group/:groupId/by-status
router.get("/group/:groupId/by-status", authenticateUser, async (req, res) => {
  // Return tasks grouped by status with progress information
  // Include progress statistics for each group
});
```

**Progress History Endpoint:**
```javascript
// GET /api/task/:taskId/progress-history
router.get("/:taskId/progress-history", authenticateUser, async (req, res) => {
  // Return progress history with user details
});
```

### 3. Progress Notification Service

**Enhanced NotificationService:**
```javascript
class ProgressNotificationService extends NotificationService {
  async createProgressNotification(task, progressChange, updatedBy) {
    // Send notifications for significant progress updates (25%+ changes)
    // Send completion notifications
    // Send overdue task reminders
  }
  
  async checkAndSendProgressReminders() {
    // Background job to check for tasks needing progress reminders
  }
}
```

### 4. Real-time Progress Updates

**Socket.IO Events:**
```javascript
// Client -> Server
socket.emit('updateTaskProgress', { taskId, progress });

// Server -> Clients
socket.emit('taskProgressUpdated', { 
  taskId, 
  progress, 
  status, 
  updatedBy, 
  timestamp 
});

socket.emit('taskStatusChanged', { 
  taskId, 
  oldStatus, 
  newStatus, 
  progress 
});
```

### 5. Frontend Components

**TaskProgressBar Component:**
```javascript
const TaskProgressBar = ({ progress, status, size = 'medium' }) => {
  const getProgressColor = () => {
    if (progress === 0) return 'gray';
    if (progress === 100) return 'green';
    return 'blue';
  };
  
  return (
    <div className={`progress-bar-container ${size}`}>
      <div 
        className={`progress-bar ${getProgressColor()}`}
        style={{ width: `${progress}%` }}
      />
      <span className="progress-text">{progress}%</span>
    </div>
  );
};
```

**TaskStatusGroups Component:**
```javascript
const TaskStatusGroups = ({ tasks, onProgressUpdate }) => {
  const groupedTasks = {
    pending: tasks.filter(t => t.Task_status === 'pending'),
    'in-progress': tasks.filter(t => t.Task_status === 'in-progress'),
    completed: tasks.filter(t => t.Task_status === 'completed')
  };
  
  return (
    <div className="task-status-groups">
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        <TaskStatusGroup 
          key={status}
          status={status}
          tasks={statusTasks}
          onProgressUpdate={onProgressUpdate}
        />
      ))}
    </div>
  );
};
```

## Data Models

### Enhanced Task Schema
```javascript
{
  // Existing fields...
  Task_progress: Number (0-100),
  Task_progressHistory: [ProgressHistoryEntry],
  Task_completedAt: Date,
  Task_lastProgressUpdate: Date,
  
  // Computed fields
  Task_progressPercentage: String, // "75%"
  Task_daysSinceLastUpdate: Number,
  Task_isOverdueWithoutProgress: Boolean
}
```

### Progress History Entry Schema
```javascript
{
  progress: Number,
  updatedBy: ObjectId (User),
  updatedAt: Date,
  previousProgress: Number,
  changeAmount: Number,
  statusChanged: Boolean,
  previousStatus: String,
  newStatus: String
}
```

### API Response Formats

**Task with Progress:**
```javascript
{
  _id: "...",
  Task_name: "...",
  Task_status: "in-progress",
  Task_progress: 75,
  Task_progressHistory: [...],
  Task_lastProgressUpdate: "2025-01-20T10:30:00Z",
  Task_completedAt: null,
  // ... other fields
}
```

**Grouped Tasks Response:**
```javascript
{
  pending: {
    count: 5,
    tasks: [...],
    averageProgress: 0
  },
  "in-progress": {
    count: 8,
    tasks: [...],
    averageProgress: 45
  },
  completed: {
    count: 12,
    tasks: [...],
    averageProgress: 100
  }
}
```

## Error Handling

### Validation Errors
- Progress value out of range (0-100)
- Progress-status mismatch validation
- Invalid user permissions for progress updates
- Concurrent update conflicts

### Error Response Format
```javascript
{
  success: false,
  error: "INVALID_PROGRESS_VALUE",
  message: "Progress must be between 0 and 100",
  details: {
    field: "Task_progress",
    value: 150,
    constraint: "max: 100"
  }
}
```

### Error Recovery Strategies
- Optimistic locking for concurrent updates
- Progress validation with automatic correction
- Fallback to manual status updates if auto-sync fails
- Graceful degradation for notification failures

## Testing Strategy

### Unit Tests
1. **Task Model Tests**
   - Progress validation logic
   - Automatic status updates
   - Progress history recording
   - Reminder detection logic

2. **API Endpoint Tests**
   - Progress update validation
   - Permission checking
   - Response format verification
   - Error handling scenarios

### Integration Tests
1. **Progress Update Flow**
   - End-to-end progress update
   - Real-time notification delivery
   - Database consistency checks
   - Status synchronization

2. **Notification System**
   - Progress milestone notifications
   - Completion notifications
   - Overdue task reminders

### Frontend Tests
1. **Component Tests**
   - Progress bar rendering
   - Status group organization
   - User interaction handling

2. **Real-time Updates**
   - Socket.IO event handling
   - UI state synchronization
   - Optimistic updates

### Performance Tests
1. **Database Queries**
   - Task retrieval with progress data
   - Progress history queries
   - Grouped task aggregations

2. **Real-time Performance**
   - Socket.IO event throughput
   - Concurrent progress updates
   - Notification delivery latency

### Test Data Scenarios
- Tasks with various progress levels
- Tasks with extensive progress history
- Overdue tasks requiring reminders
- Multiple users updating same task
- Large groups with many tasks