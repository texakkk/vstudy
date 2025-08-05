// routes/taskRoute.js
const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const Group = require("../models/Group");
const mongoose = require("mongoose");
const { authenticateUser } = require("../middleware/authMiddleware");
const NotificationService = require("../services/notificationService");

const router = express.Router();

// Create a task
router.post("/", authenticateUser, async (req, res) => {
  const {
    Task_name,
    Task_description,
    Task_dueDate,
    Task_priority,
    Task_groupId,
    Task_assignedTo,
  } = req.body;
  const createdBy = req.user._id;

  if (!Task_name || !Task_groupId) {
    return res
      .status(400)
      .json({ message: "Task name and group ID are required" });
  }

  try {
    const group = await Group.findById(Task_groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if the user is an admin in the group
    const isAdmin = await group.isAdmin(req.user._id);

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can create tasks" });
    }

    // Create a new task
    const newTask = new Task({
      Task_name,
      Task_description,
      Task_dueDate,
      Task_priority,
      Task_groupId,
      Task_createdBy: createdBy,
      Task_assignedTo: Task_assignedTo || [], // Handle assigned users array
      Task_progress: 0, // Always start with 0 progress
    });

    const savedTask = await newTask.save();

    // Populate the assigned users for the response
    await savedTask.populate("Task_assignedTo", "User_name User_email");

    // Create notifications for assigned users
    try {
      if (Task_assignedTo && Task_assignedTo.length > 0) {
        const io = req.app.get('io');
        const notificationNamespace = req.app.get('notificationNamespace');
        const notificationService = new NotificationService(io, notificationNamespace);
        await notificationService.createTaskNotification(savedTask, 'task');
      }
    } catch (notificationError) {
      console.error('Error creating task notifications:', notificationError);
      // Don't fail the task creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: savedTask,
    });
  } catch (err) {
    console.error("Error creating task:", err.message);
    res
      .status(500)
      .json({ message: "Error creating task", error: err.message });
  }
});

// Get all tasks (for dashboard overview)
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id; // Extract userId from the token

    const tasks = await Task.find({ sender: userId }).populate(
      "createdBy",
      "name"
    );

    res.status(200).json({ tasks });
  } catch (err) {
    console.error("Error fetching all tasks:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching all tasks", error: err.message });
  }
});

// Get tasks for a specific group
router.get("/group/:groupId", authenticateUser, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Fetch the group by its ID
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Find if the current user is an admin in the group
    const isAdmin = await group.isAdmin(req.user._id);

    // Fetch tasks for the group
    const tasks = await Task.find({ Task_groupId: groupId })
      .populate("Task_comments.Comment_user", "User_name User_email")
      .populate("Task_assignedTo", "User_name User_email") // Populate assigned user details with email
      .exec();

    // Return the tasks and the admin status of the current user
    res.status(200).json({ tasks, isAdmin: isAdmin });
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: err.message });
  }
});

// Update an existing task
router.put("/:taskId", authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { Task_name, Task_description, Task_dueDate, Task_priority, status, Task_progress } =
    req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const group = await Group.findById(task.Task_groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = await group.isAdmin(req.user._id);
    
    // Check if user is assigned to the task
    const isAssignedUser = task.Task_assignedTo && 
      task.Task_assignedTo.some(assignedUser => 
        assignedUser.toString() === req.user._id.toString()
      );

    // For progress updates, allow assigned users
    const isProgressOnlyUpdate = Task_progress !== undefined && 
      !Task_name && !Task_description && !Task_dueDate && !Task_priority && !status;

    if (isProgressOnlyUpdate) {
      // For progress updates, allow assigned users or admins
      if (!isAdmin && !isAssignedUser) {
        return res
          .status(403)
          .json({ message: "Only assigned users or group admins can update task progress" });
      }
    } else {
      // For other updates, only allow task creators or admins
      if (task.Task_createdBy.toString() !== req.user._id && !isAdmin) {
        return res
          .status(403)
          .json({ message: "You do not have permission to update this task" });
      }
    }

    task.Task_name = Task_name || task.Task_name;
    task.Task_description = Task_description || task.Task_description;
    task.Task_dueDate = Task_dueDate || task.Task_dueDate;
    task.Task_priority = Task_priority || task.Task_priority;
    task.Task_status = status || task.Task_status;
    
    // Handle progress update and auto-update status based on progress
    if (Task_progress !== undefined) {
      task.Task_progress = Task_progress;
      
      // Auto-update status based on progress
      if (Task_progress === 100) {
        task.Task_status = 'completed';
      } else if (Task_progress > 0) {
        task.Task_status = 'in-progress';
      } else {
        task.Task_status = 'pending';
      }
    }
    
    task.Task_updatedAt = Date.now();

    const updatedTask = await task.save();
    res
      .status(200)
      .json({ message: "Task updated successfully", task: updatedTask });
  } catch (err) {
    console.error("Error updating task:", err.message);
    res
      .status(500)
      .json({ message: "Error updating task", error: err.message });
  }
});

// Delete a task
router.delete("/:taskId", authenticateUser, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const group = await Group.findById(task.Task_groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = await group.isAdmin(req.user._id);

    if (task.Task_createdBy.toString() !== req.user._id && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this task" });
    }

    await Task.findByIdAndDelete(taskId); // Using findByIdAndDelete for deletion
    await User.updateMany({ tasks: taskId }, { $pull: { tasks: taskId } });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res
      .status(500)
      .json({ message: "Error deleting task", error: err.message });
  }
});

// Toggle task completion
router.put("/toggle/:taskId", authenticateUser, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId).populate(
      "Task_assignedTo",
      "User_name User_email"
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    const group = await Group.findById(task.Task_groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = await group.isAdmin(req.user._id);

    // Check if user is assigned to the task
    const isAssignedUser =
      task.Task_assignedTo &&
      task.Task_assignedTo.some(
        (assignedUser) => assignedUser._id.toString() === req.user._id.toString()
      );

    // Allow toggle if user is admin or assigned to the task
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({
        message:
          "Only assigned users or group admins can toggle this task",
      });
    }

    // Check if trying to mark as completed but progress is not 100%
    if (task.Task_status !== "completed" && (task.Task_progress || 0) < 100) {
      return res.status(400).json({
        message: "Task must be 100% complete before marking as completed. Please update the progress first.",
      });
    }

    // Toggle task status between 'completed' and 'pending'
    if (task.Task_status === "completed") {
      task.Task_status = "pending";
      task.Task_progress = 0;
    } else {
      task.Task_status = "completed";
      task.Task_progress = 100;
    }
    task.Task_updatedAt = Date.now();

    const updatedTask = await task.save();

    // Populate the response with assigned user details
    await updatedTask.populate("Task_assignedTo", "User_name User_email");

    // Create notifications for task completion
    try {
      if (updatedTask.Task_status === "completed") {
        const io = req.app.get('io');
        const notificationNamespace = req.app.get('notificationNamespace');
        const notificationService = new NotificationService(io, notificationNamespace);
        // Notify task creator and group members about completion
        const [group, creator, currentUser] = await Promise.all([
          Group.findById(updatedTask.Task_groupId),
          User.findById(updatedTask.Task_createdBy),
          User.findById(req.user._id)
        ]);
        
        if (group && creator && currentUser && updatedTask.Task_createdBy.toString() !== req.user._id.toString()) {
          await notificationService.createNotification({
            userId: updatedTask.Task_createdBy,
            type: 'task',
            title: `Task completed: ${updatedTask.Task_name}`,
            message: `${currentUser.User_name} completed the task "${updatedTask.Task_name}"`,
            referenceId: updatedTask._id,
            referenceModel: 'Task',
            groupId: updatedTask.Task_groupId,
            fromUserId: req.user._id,
            priority: 'medium'
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating task completion notifications:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (err) {
    console.error("Error updating task status:", err.message);
    res
      .status(500)
      .json({ message: "Error updating task status", error: err.message });
  }
});

router.post("/comment/:taskId", authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ message: "Comment is required" });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const newComment = {
      Comment_user: req.user._id,
      Comment_text: comment,
      Comment_date: Date.now(),
    };

    task.Task_comments.push(newComment);
    await task.save();

    // Re-fetch task with populated comment user
    const populatedTask = await Task.findById(taskId).populate(
      "Task_comments.Comment_user",
      "User_name User_email"
    );
    const commentWithUser =
      populatedTask.Task_comments[populatedTask.Task_comments.length - 1];

    res.status(201).json({ 
      success: true, 
      message: "Comment added successfully",
      comment: commentWithUser 
    });
  } catch (err) {
    console.error("Error adding comment:", err.message);
    res
      .status(500)
      .json({ message: "Error adding comment", error: err.message });
  }
});

// Assuming the Task model has a comments array, each comment contains a userId field
router.delete(
  "/comment/:taskId/:commentId",
  authenticateUser,
  async (req, res) => {
    const { taskId, commentId } = req.params;

    try {
      // Find the task by ID
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Find the comment by ID within the task's comments
      const comment = task.Task_comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Ensure that the user deleting the comment is the one who created it
      if (comment.Comment_user.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "You can only delete your own comments" });
      }

      // Remove the comment from the task
      task.Task_comments.pull(commentId);
      await task.save();

      res.status(200).json({ 
        success: true, 
        message: "Comment deleted successfully" 
      });
    } catch (err) {
      console.error("Error deleting comment:", err.message);
      res
        .status(500)
        .json({ message: "Error deleting comment", error: err.message });
    }
  }
);

router.put("/assign/:taskId", authenticateUser, async (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.body;

  // Validate taskId
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Ensure the user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Assign the user to the task
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { Task_assignedTo: userId } }, // Prevent duplicate assignments
      { new: true }
    ).populate("Task_assignedTo", "User_name");

    // Check if the task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Create notification for newly assigned user
    try {
      const io = req.app.get('io');
      const notificationNamespace = req.app.get('notificationNamespace');
      const notificationService = new NotificationService(io, notificationNamespace);
      const [group, assignedUser, assigner] = await Promise.all([
        Group.findById(task.Task_groupId),
        User.findById(userId),
        User.findById(req.user._id)
      ]);

      if (group && assignedUser && assigner && userId !== req.user._id.toString()) {
        await notificationService.createNotification({
          userId: userId,
          type: 'task',
          title: `New task assigned: ${task.Task_name}`,
          message: `${assigner.User_name} assigned you to the task "${task.Task_name}" in ${group.Group_name}`,
          referenceId: task._id,
          referenceModel: 'Task',
          groupId: task.Task_groupId,
          fromUserId: req.user._id,
          priority: 'high'
        });
      }
    } catch (notificationError) {
      console.error('Error creating task assignment notifications:', notificationError);
    }

    // Respond with success
    res.status(200).json({ message: "Task assigned successfully", task });
  } catch (err) {
    console.error("Error assigning user to task:", err.message);
    res
      .status(500)
      .json({ message: "Error assigning user to task", error: err.message });
  }
});

module.exports = router;
// Search tasks
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const userId = req.user._id;

    if (!q || q.trim().length === 0) {
      return res.json({ tasks: [] });
    }

    // Search tasks where user is assigned or created by user
    const tasks = await Task.find({
      $and: [
        {
          $or: [
            { Task_assignedTo: userId },
            { Task_createdBy: userId }
          ]
        },
        {
          $or: [
            { Task_name: { $regex: q, $options: 'i' } },
            { Task_description: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .limit(parseInt(limit))
    .populate('Task_assignedTo', 'User_name User_email')
    .populate('Task_createdBy', 'User_name')
    .populate('Task_groupId', 'Group_name')
    .sort({ Task_createdAt: -1 });

    // Format tasks for frontend
    const formattedTasks = tasks.map(task => ({
      ...task.toObject(),
      Task_title: task.Task_name, // Add title field for consistency
      Task_assignedToName: task.Task_assignedTo?.User_name,
      Task_createdByName: task.Task_createdBy?.User_name,
      Task_groupName: task.Task_groupId?.Group_name
    }));

    res.json({ 
      success: true, 
      tasks: formattedTasks,
      total: formattedTasks.length
    });
  } catch (error) {
    console.error('Task search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching tasks', 
      error: error.message 
    });
  }
});