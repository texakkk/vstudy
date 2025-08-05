import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import "./TaskManager.css";

const TaskManager = () => {
  const { groupId: Task_groupId } = useParams();
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [editTaskId, setEditTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [adminStatusLoading, setAdminStatusLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(Task_groupId || null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, []);

  // Task assignment functionality has been removed as per requirements

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/group/user-groups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data.groups || []);
        if (!Task_groupId && res.data.groups.length > 0) {
          setActiveGroup(res.data.groups[0]._id);
        }
      } catch (err) {
        setError("Failed to fetch groups");
        console.error("Error fetching groups:", err);
      }
    };
    fetchGroups();
  }, [Task_groupId]);

  // Fetch users for the active group
  useEffect(() => {
    const fetchUsers = async () => {
      if (!activeGroup) return;
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/auth/group-users/${activeGroup}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Error fetching group users:", err);
      }
    };
    fetchUsers();
  }, [activeGroup]);

  // Function to fetch tasks for the active group
  const fetchTasks = async () => {
    if (!activeGroup) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch tasks for the active group
      const response = await api.get(`/task/group/${activeGroup}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Process the tasks data - handle both array and object with tasks property
      const tasksData = Array.isArray(response.data)
        ? response.data
        : response.data?.tasks;

      if (tasksData && Array.isArray(tasksData)) {
        const tasksWithProcessedData = tasksData.map((task) => {
          // Process comments
          const processedComments = (task.Task_comments || []).map(
            (comment) => ({
              ...comment,
              Comment_user: {
                User_name: comment.Comment_user?.User_name || "Unknown User",
                User_email: comment.Comment_user?.User_email || "",
                _id: comment.Comment_user?._id,
              },
              Comment_createdAt:
                comment.Comment_date ||
                comment.Comment_createdAt ||
                new Date().toISOString(),
            })
          );

          // Process assigned users - Task_assignedTo is an array in the backend
          let assignedUsers = [];
          if (task.Task_assignedTo && Array.isArray(task.Task_assignedTo)) {
            assignedUsers = task.Task_assignedTo.map((user) => ({
              _id: user._id || user,
              User_name: user.User_name || "Unknown User",
              User_email: user.User_email || "",
            }));
          }

          // Return processed task
          return {
            ...task,
            Task_comments: processedComments,
            Task_assignedTo: assignedUsers,
            Task_dueDate: task.Task_dueDate || null,
            Task_progress: task.Task_progress || 0,
            // Ensure status is one of the allowed values
            Task_status: ["pending", "in-progress", "completed"].includes(
              task.Task_status?.toLowerCase()
            )
              ? task.Task_status.toLowerCase()
              : "pending",
          };
        });

        setTasks(tasksWithProcessedData);
      } else {
        console.warn("Unexpected response format:", response.data);
        setTasks([]);
      }

      // Check if the current user is an admin in this group
      try {
        const groupResponse = await api.get(`/group/${activeGroup}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (groupResponse.data?.group) {
          const isAdmin =
            groupResponse.data.group.Group_members?.some(
              (member) =>
                member.GroupMember_userId?._id === user?._id &&
                member.GroupMember_role === "admin"
            ) || false;

          setIsGroupAdmin(isAdmin);
          console.log("Admin status check:", {
            userId: user?._id,
            isAdmin,
            groupMembers: groupResponse.data.group.Group_members,
          });
        }
      } catch (groupErr) {
        console.error("Error checking admin status:", groupErr);
        setIsGroupAdmin(false);
      }
    } catch (err) {
      console.error("Error fetching tasks:", {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
      });

      setError(
        err.response?.data?.message ||
          "Failed to fetch tasks. Please try again."
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks when activeGroup changes
  useEffect(() => {
    if (user && activeGroup) {
      fetchTasks();
    }
  }, [activeGroup, user?._id]);

  // Separate effect to check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !activeGroup) {
        setIsGroupAdmin(false);
        setAdminStatusLoading(false);
        return;
      }

      setAdminStatusLoading(true);
      try {
        const token = localStorage.getItem("token");
        const groupResponse = await api.get(`/group/${activeGroup}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (groupResponse.data?.group) {
          const isAdmin =
            groupResponse.data.group.Group_members?.some(
              (member) =>
                member.GroupMember_userId?._id === user?._id &&
                member.GroupMember_role === "admin"
            ) || false;

          setIsGroupAdmin(isAdmin);
          console.log("Admin status check (separate):", {
            userId: user?._id,
            isAdmin,
            groupMembers: groupResponse.data.group.Group_members,
          });
        }
      } catch (groupErr) {
        console.error("Error checking admin status (separate):", groupErr);
        setIsGroupAdmin(false);
      } finally {
        setAdminStatusLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?._id, activeGroup]);

  const handleGroupChange = (e) => {
    setActiveGroup(e.target.value);
    setError("");
  };

  // Handle task deletion
  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      // Optimistically remove the task from the UI
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));

      const token = localStorage.getItem("token");
      const res = await api.delete(`/task/${taskId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.data?.success) {
        // If the API call fails, refetch tasks to restore the correct state
        throw new Error(res.data?.message || "Failed to delete task");
      }

      // Show success message
      alert("Task deleted successfully!");
    } catch (err) {
      // Revert optimistic update on error
      await fetchTasks();

      const errorMessage =
        err.response?.data?.message || err.message || "Failed to delete task";
      setError(errorMessage);
      console.error("Error deleting task:", {
        error: err,
        response: err.response?.data,
      });

      // Show error alert
      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle progress update
  const handleProgressUpdate = async (taskId, newProgress) => {
    console.log("Progress update started:", { taskId, newProgress });

    try {
      // Optimistically update the UI
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === taskId
            ? {
                ...t,
                Task_progress: newProgress,
                Task_status:
                  newProgress === 100
                    ? "completed"
                    : newProgress > 0
                    ? "in-progress"
                    : "pending",
                Task_updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      const token = localStorage.getItem("token");
      const res = await api.put(
        `/task/${taskId}`,
        { Task_progress: newProgress },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Progress update response:", res.data);

      // Success - no need to refetch since we already updated optimistically
      if (res.status === 200) {
        console.log("Progress updated successfully");
        return;
      }

      throw new Error(res.data?.message || "Failed to update task progress");
    } catch (err) {
      console.error("Progress update error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update task progress";
      setError(errorMessage);

      // Revert optimistic update on error by refetching tasks
      console.log("Reverting optimistic update...");
      try {
        await fetchTasks();
      } catch (fetchError) {
        console.error("Error refetching tasks:", fetchError);
      }
    }
  };

  // Handle task completion toggle - only allow assigned user to toggle
  const handleToggleCompletion = async (task) => {
    // Check if current user is one of the assigned users (Task_assignedTo is an array)
    const isAssignedUser = Array.isArray(task.Task_assignedTo)
      ? task.Task_assignedTo.some(
          (assignedUser) =>
            (typeof assignedUser === "object"
              ? assignedUser._id
              : assignedUser) === user?._id
        )
      : task.Task_assignedTo?._id === user?._id ||
        task.Task_assignedTo === user?._id;

    if (!isAssignedUser && !isGroupAdmin) {
      alert("Only assigned users or group admins can toggle this task.");
      return;
    }

    // Check if trying to mark as completed but progress is not 100%
    if (task.Task_status !== "completed" && (task.Task_progress || 0) < 100) {
      alert(
        "Task must be 100% complete before marking as completed. Please update the progress first."
      );
      return;
    }

    try {
      // Optimistically update the UI
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === task._id
            ? {
                ...t,
                Task_status:
                  t.Task_status === "completed" ? "pending" : "completed",
                Task_updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      const token = localStorage.getItem("token");
      const res = await api.put(
        `/task/toggle/${task._id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          validateStatus: (status) => status < 500,
        }
      );

      if (!res.data?.task) {
        // If API call fails, revert the optimistic update
        await fetchTasks();
        throw new Error(res.data?.message || "Failed to update task status");
      }

      // Show success message
      const newStatus =
        task.Task_status === "completed"
          ? "marked as pending"
          : "marked as completed";
      alert(`Task ${newStatus} successfully!`);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update task status";
      setError(errorMessage);
      console.error("Error toggling task status:", {
        error: err,
        response: err.response?.data,
      });
      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle task form submission (create/update)
  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    if (!title || !activeGroup) {
      setError("Title and group are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Prepare task data according to backend schema
      const taskData = {
        Task_name: title.trim(),
        Task_description: description ? description.trim() : "",
        Task_dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        Task_priority: priority || "medium",
        Task_groupId: activeGroup,
        Task_status: "pending", // Always start with pending status
        Task_progress: 0, // Always start with 0 progress
      };

      // Handle task assignment - backend expects an array but we'll use the assign endpoint
      if (assignedTo) {
        taskData.Task_assignedTo = [assignedTo]; // Send as array to match backend schema
      }

      console.log("Submitting task data:", taskData);

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      let response;
      if (editTaskId) {
        // Update existing task
        response = await api.put(`/task/${editTaskId}`, taskData, { headers });
      } else {
        // Create new task - ensure we're sending the correct data structure
        response = await api.post("/task", taskData, {
          headers,
          validateStatus: (status) => status < 500, // Don't throw for 4xx errors
        });

        // Log the full response for debugging
        console.log("Task creation response:", response);
      }

      if (response.data) {
        // Refresh the tasks list
        await fetchTasks();
        // Reset the form
        resetForm();
        setEditTaskId(null);
        setError("");

        // Show success message
        if (!editTaskId) {
          alert("Task created successfully!");
        } else {
          alert("Task updated successfully!");
        }
      }
    } catch (err) {
      console.error("Error saving task:", {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });

      let errorMessage = "Failed to save task";
      const serverMessage =
        err.response?.data?.message || err.response?.data?.error;

      if (serverMessage) {
        errorMessage = serverMessage;

        // Add validation errors if they exist
        if (err.response?.data?.errors) {
          const errorDetails = Object.values(err.response.data.errors)
            .map((e) => e.message || e)
            .join("\n");
          errorMessage += `\n\n${errorDetails}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // If this is a 401 Unauthorized error, redirect to login
      if (err.response?.status === 401) {
        // Handle unauthorized error (e.g., redirect to login)
        console.error("Authentication required, redirecting to login...");
        // You might want to add your auth redirect logic here
      }
    }
  };

  const handleEdit = (task) => {
    setTitle(task.Task_name);
    setDescription(task.Task_description || "");
    setDueDate(
      task.Task_dueDate
        ? new Date(task.Task_dueDate).toISOString().split("T")[0]
        : ""
    );
    setPriority(task.Task_priority || "medium");
    // Handle assigned user - take the first user from the array if it exists
    const firstAssignedUser =
      Array.isArray(task.Task_assignedTo) && task.Task_assignedTo.length > 0
        ? task.Task_assignedTo[0]._id || task.Task_assignedTo[0]
        : "";
    setAssignedTo(firstAssignedUser);
    setEditTaskId(task._id);

    const formElement = document.getElementById("task-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAddComment = async (taskId) => {
    const commentText = commentInputs[taskId];
    if (!commentText?.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/task/comment/${taskId}`,
        { comment: commentText },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success && res.data.comment) {
        // Update the tasks state with the new comment
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId
              ? {
                  ...task,
                  Task_comments: [
                    ...(task.Task_comments || []),
                    {
                      _id: res.data.comment._id,
                      Comment_text: res.data.comment.Comment_text,
                      Comment_date: res.data.comment.Comment_date,
                      Comment_createdAt:
                        res.data.comment.Comment_date ||
                        new Date().toISOString(),
                      Comment_user: {
                        _id: res.data.comment.Comment_user._id,
                        User_name:
                          res.data.comment.Comment_user.User_name ||
                          user?.User_name ||
                          "You",
                        User_email:
                          res.data.comment.Comment_user.User_email ||
                          user?.User_email ||
                          "",
                      },
                    },
                  ],
                }
              : task
          )
        );

        // Clear the comment input
        setCommentInputs((prev) => ({ ...prev, [taskId]: "" }));
        setError("");
      } else {
        throw new Error(res.data.message || "Failed to add comment");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
      console.error("Error adding comment:", err);
    }
  };

  if (!user) {
    return <p>Loading user data...</p>; // Show loader while user data is being fetched
  }

  const handleDeleteComment = async (taskId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return; // User cancelled the deletion
    }

    try {
      // Optimistically remove the comment from the UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                Task_comments: task.Task_comments.filter(
                  (comment) => comment._id !== commentId
                ),
              }
            : task
        )
      );

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Make the API call
      const res = await api.delete(`/task/comment/${taskId}/${commentId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.data?.success) {
        // If API call fails, revert the optimistic update
        await fetchTasks();
        throw new Error(res.data?.message || "Failed to delete comment");
      }

      // Show success message
      alert("Comment deleted successfully!");
      setError("");
    } catch (err) {
      // Revert optimistic update on error by refetching tasks
      await fetchTasks();

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete comment";
      setError(errorMessage);
      console.error("Error deleting comment:", {
        error: err,
        response: err.response?.data,
        taskId,
        commentId,
        errorMessage,
      });

      // Show error message
      alert(`Error: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setAssignedTo("");
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditTaskId(null);
  };

  // Format date for display (date only)
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No due date";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Format date and time for comments
  const formatCommentDate = (dateString) => {
    try {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleString(undefined, options);
    } catch (error) {
      console.error("Error formatting comment date:", error);
      return "";
    }
  };

  // Get user name by ID
  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u._id === userId);
    return user ? user.User_name : "Unknown User";
  };

  // Format assigned user information
  const formatAssignedUser = (user) => {
    if (!user) return "Unassigned";
    if (typeof user === "string") return "Loading..."; // In case user data is still loading
    return user.User_name || "Unassigned";
  };

  // Get current group details
  const currentGroup = groups.find((group) => group._id === activeGroup);

  // Debug log for admin status
  console.log("Render - Admin status:", {
    isGroupAdmin,
    activeGroup,
    userId: user?._id,
  });

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <h1>Task Manager</h1>

        <div className="group-selector">
          <select
            id="group-select"
            value={activeGroup || ""}
            onChange={handleGroupChange}
            disabled={loading}
            className="group-select-dropdown"
          >
            <option value="">-- Select a group --</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.Group_name}
              </option>
            ))}
          </select>
        </div>

        {currentGroup && (
          <div className="group-info">
            <div className="group-name">
              <i className="fas fa-users"></i>
              <span>{currentGroup.Group_name}</span>
            </div>
            <div className="group-meta">
              <span className="task-count">
                <i className="fas fa-tasks"></i>
                {tasks.length} tasks
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading || adminStatusLoading ? (
        <p>Loading...</p>
      ) : activeGroup ? (
        <>
          {/* Task Form - Only visible for admins */}
          {isGroupAdmin === true && (
            <div className="task-form-container">
              <form
                onSubmit={handleTaskSubmit}
                className="task-form"
                id="task-form"
              >
                <h2>{editTaskId ? "Edit Task" : "Add New Task"}</h2>

                <div className="form-group">
                  <label htmlFor="task-title">Title *</label>
                  <input
                    id="task-title"
                    type="text"
                    placeholder="Enter task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="task-description">Description</label>
                  <textarea
                    id="task-description"
                    placeholder="Enter task description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="task-due-date">Due Date *</label>
                    <input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority">Priority *</label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      required
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="task-assignee">Assign To</label>
                  <select
                    id="task-assignee"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a user...</option>
                    {users.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.User_name} ({member.User_email})
                      </option>
                    ))}
                  </select>
                </div>



                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editTaskId ? "Update Task" : "Add Task"}
                  </button>
                  {editTaskId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Message for non-admins */}
          {isGroupAdmin === false && (
            <div className="admin-only-message">
              <p>
                <i className="fas fa-info-circle"></i> Only group admins can
                create and manage tasks.
              </p>
            </div>
          )}

          <div className="task-list-container">
            <h2>Tasks</h2>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks found. Create one to get started!</p>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`task-item ${
                      task.Task_status === "completed" ? "completed" : ""
                    } priority-${
                      task.Task_priority?.toLowerCase() || "medium"
                    }`}
                  >
                    <div className="task-header">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={task.Task_status === "completed"}
                          onChange={() => handleToggleCompletion(task)}
                          disabled={
                            (!isGroupAdmin &&
                              !(
                                Array.isArray(task.Task_assignedTo) &&
                                task.Task_assignedTo.some(
                                  (assignedUser) =>
                                    (typeof assignedUser === "object"
                                      ? assignedUser._id
                                      : assignedUser) === user?._id
                                )
                              )) ||
                            (task.Task_status !== "completed" &&
                              (task.Task_progress || 0) < 100)
                          }
                          aria-label={
                            task.Task_status === "completed"
                              ? "Mark as incomplete"
                              : "Mark as complete"
                          }
                          title={
                            !isGroupAdmin &&
                            !(
                              Array.isArray(task.Task_assignedTo) &&
                              task.Task_assignedTo.some(
                                (assignedUser) =>
                                  (typeof assignedUser === "object"
                                    ? assignedUser._id
                                    : assignedUser) === user?._id
                              )
                            )
                              ? "Only assigned members or group admins can toggle completion"
                              : task.Task_status !== "completed" &&
                                (task.Task_progress || 0) < 100
                              ? "Task must be 100% complete before marking as completed"
                              : ""
                          }
                        />
                        <span className="checkmark"></span>
                      </label>
                      <div className="task-content">
                        <div className="task-main">
                          <div className="task-header-row">
                            <h3 className="task-title">
                              {task.Task_name || "Untitled Task"}
                            </h3>
                          </div>

                          {task.Task_description && (
                            <div className="task-description">
                              <p>{task.Task_description}</p>
                            </div>
                          )}
                        </div>

                        <div className="task-meta">
                          <div className="meta-item due-date">
                            <i className="fas fa-calendar"></i>
                            <span>Due: {formatDate(task.Task_dueDate)}</span>
                          </div>
                          <div className="meta-item priority">
                            <i className="fas fa-flag"></i>
                            <span>Priority: {task.Task_priority}</span>
                          </div>
                          <div className="meta-item status">
                            <i className="fas fa-info-circle"></i>
                            <span>Status: {task.Task_status || "pending"}</span>
                          </div>
                          <div className="meta-item progress">
                            <i className="fas fa-chart-line"></i>
                            <span>Progress: {task.Task_progress || 0}%</span>
                            <div className="task-progress-bar">
                              <div
                                className="task-progress-fill"
                                style={{ width: `${task.Task_progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="meta-item assigned-to">
                            <i className="fas fa-user"></i>
                            <div className="assigned-user-info">
                              <div>
                                <strong>Assigned to: </strong>
                                {Array.isArray(task.Task_assignedTo) &&
                                task.Task_assignedTo.length > 0 ? (
                                  <div className="assigned-users-list">
                                    {task.Task_assignedTo.map(
                                      (assignedUser, index) => (
                                        <div
                                          key={assignedUser._id || index}
                                          className="assigned-user"
                                        >
                                          <span className="assigned-user-name">
                                            {assignedUser.User_name ||
                                              "Unknown User"}
                                          </span>
                                          {assignedUser.User_email && (
                                            <div className="assigned-email">
                                              {assignedUser.User_email}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="unassigned">
                                    Not assigned yet
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="task-comments">
                      <h4>Comments</h4>
                      <div className="comment-list">
                        {task.Task_comments?.length > 0 ? (
                          task.Task_comments.map((comment) => (
                            <div key={comment._id} className="comment-item">
                              <div className="comment-header">
                                <span className="comment-author">
                                  {comment.Comment_user?.User_name ||
                                    "Unknown User"}
                                </span>
                                <span className="comment-date">
                                  {formatCommentDate(comment.Comment_createdAt)}
                                </span>
                                {(isGroupAdmin ||
                                  comment.Comment_user?._id === user?._id) && (
                                  <button
                                    className="btn-delete-comment"
                                    onClick={() =>
                                      handleDeleteComment(task._id, comment._id)
                                    }
                                    title="Delete comment"
                                  >
                                    <i className="icon-trash"></i>
                                  </button>
                                )}
                              </div>
                              <div className="comment-content">
                                <p>{comment.Comment_text}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="no-comments">No comments yet</p>
                        )}
                      </div>

                      {/* Add Comment */}
                      <div className="add-comment">
                        <textarea
                          placeholder="Add a comment..."
                          value={commentInputs[task._id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [task._id]: e.target.value,
                            }))
                          }
                          rows="2"
                        />
                        <button
                          className="btn-add-comment"
                          onClick={() => handleAddComment(task._id)}
                          disabled={!commentInputs[task._id]?.trim()}
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>

                    {/* Progress Update Controls - Only for assigned users on created tasks */}
                    {Array.isArray(task.Task_assignedTo) &&
                      task.Task_assignedTo.some(
                        (assignedUser) =>
                          (typeof assignedUser === "object"
                            ? assignedUser._id
                            : assignedUser) === user?._id
                      ) &&
                      task._id && (
                        <div className="progress-update-section">
                          <label htmlFor={`progress-${task._id}`}>
                            Update Progress:
                          </label>
                          <div className="progress-controls">
                            <input
                              id={`progress-${task._id}`}
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={task.Task_progress || 0}
                              onChange={(e) =>
                                handleProgressUpdate(
                                  task._id,
                                  parseInt(e.target.value)
                                )
                              }
                              className="progress-update-slider"
                            />
                            <span className="progress-percentage">
                              {task.Task_progress || 0}%
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Task Actions - Only visible for admins */}
                    {isGroupAdmin === true && (
                      <div className="task-actions">
                        {/* Edit Button - Only Admin */}
                        <button
                          onClick={() => handleEdit(task)}
                          className="btn-edit"
                          title="Edit Task"
                        >
                          <i className="icon-edit"></i> Edit
                        </button>

                        {/* Delete Button - Only Admin */}
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="btn-delete"
                          title="Delete Task"
                        >
                          <i className="icon-trash"></i> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-group-selected">
          <p>Please select a group to view or create tasks</p>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
