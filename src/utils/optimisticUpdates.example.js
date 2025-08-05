/**
 * Example Usage of Optimistic Update Utilities
 * 
 * This file demonstrates how to use the optimistic update utilities
 * in the TaskManager component for real-time updates.
 */

import { useState, useEffect, useRef } from 'react';
import { 
  performOptimisticUpdate, 
  handleOptimisticError,
  createTemporaryComment,
  reconcileComment,
  removeTemporaryComment,
  validateComment,
  ERROR_MESSAGES
} from './optimisticUpdates';
import api from '../api';

/**
 * Example: Optimistic User Assignment
 * 
 * This example shows how to implement optimistic user assignment
 * with proper error recovery and loading state management.
 */
export const handleAssignUserExample = async (taskId, userId, user, tasks, setTasks, setLoadingStates) => {
  const previousTask = tasks.find(task => task._id === taskId);
  const assignedUser = userId ? { _id: userId, User_name: 'Loading...', User_email: '' } : null;

  try {
    await performOptimisticUpdate({
      // 1. Optimistic update - immediately show the assignment
      optimisticAction: () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? { ...task, Task_assignedTo: assignedUser }
              : task
          )
        );
      },

      // 2. API call
      apiCall: async () => {
        const token = localStorage.getItem('token');
        return await api.put(
          `/task/assign/${taskId}`,
          { userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },

      // 3. Success reconciliation - update with real user data
      successAction: (response) => {
        if (response.data?.task) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task._id === taskId
                ? { ...task, Task_assignedTo: response.data.task.Task_assignedTo }
                : task
            )
          );
        }
      },

      // 4. Error recovery - revert to previous state
      revertAction: () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? { ...task, Task_assignedTo: previousTask.Task_assignedTo }
              : task
          )
        );
      },

      // 5. Loading state management
      setLoadingState: setLoadingStates,
      loadingKey: `assignments.${taskId}`,

      // 6. Error handling
      onError: (error) => {
        const errorMessage = handleOptimisticError(error, {
          onAuthError: () => {
            // Redirect to login or refresh token
            console.log('Authentication required');
          },
          onNetworkError: () => {
            // Show network error notification
            console.log('Network error occurred');
          }
        });
        
        // Show error to user
        alert(`Assignment failed: ${errorMessage}`);
      }
    });

  } catch (error) {
    console.error('Assignment operation failed:', error);
  }
};

/**
 * Example: Optimistic Comment Addition
 * 
 * This example shows how to implement optimistic comment addition
 * with validation, temporary comment creation, and reconciliation.
 */
export const handleAddCommentExample = async (taskId, commentText, user, tasks, setTasks, setLoadingStates) => {
  // 1. Validate comment input
  const validation = validateComment(commentText);
  if (!validation.isValid) {
    alert(validation.error);
    return;
  }

  // 2. Create temporary comment for optimistic display
  const tempComment = createTemporaryComment(commentText, user);
  let tempCommentId = tempComment._id;

  try {
    await performOptimisticUpdate({
      // 3. Optimistic update - immediately show the comment
      optimisticAction: () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? {
                  ...task,
                  Task_comments: [...(task.Task_comments || []), tempComment]
                }
              : task
          )
        );
      },

      // 4. API call
      apiCall: async () => {
        const token = localStorage.getItem('token');
        return await api.post(
          `/task/comment/${taskId}`,
          { comment: commentText },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },

      // 5. Success reconciliation - replace temp comment with real one
      successAction: (response) => {
        if (response.data?.comment) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task._id === taskId
                ? {
                    ...task,
                    Task_comments: reconcileComment(
                      task.Task_comments,
                      response.data.comment,
                      tempCommentId
                    )
                  }
                : task
            )
          );
        }
      },

      // 6. Error recovery - remove temporary comment
      revertAction: () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? {
                  ...task,
                  Task_comments: removeTemporaryComment(task.Task_comments, tempCommentId)
                }
              : task
          )
        );
      },

      // 7. Loading state management
      setLoadingState: setLoadingStates,
      loadingKey: `comments.${taskId}`,

      // 8. Error handling
      onError: (error) => {
        const errorMessage = handleOptimisticError(error);
        alert(`Failed to add comment: ${errorMessage}`);
      }
    });

  } catch (error) {
    console.error('Comment addition failed:', error);
  }
};

/**
 * Example: Optimistic Comment Deletion
 * 
 * This example shows how to implement optimistic comment deletion
 * with confirmation dialog and proper error recovery.
 */
export const handleDeleteCommentExample = async (taskId, commentId, tasks, setTasks, setLoadingStates) => {
  // 1. Show confirmation dialog
  if (!window.confirm('Are you sure you want to delete this comment?')) {
    return;
  }

  // 2. Store the comment for potential restoration
  const taskToUpdate = tasks.find(task => task._id === taskId);
  const commentToDelete = taskToUpdate?.Task_comments?.find(comment => comment._id === commentId);
  
  if (!commentToDelete) {
    alert('Comment not found');
    return;
  }

  try {
    await performOptimisticUpdate({
      // 3. Optimistic update - immediately remove the comment
      optimisticAction: () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? {
                  ...task,
                  Task_comments: task.Task_comments.filter(comment => comment._id !== commentId)
                }
              : task
          )
        );
      },

      // 4. API call
      apiCall: async () => {
        const token = localStorage.getItem('token');
        return await api.delete(
          `/task/comment/${taskId}/${commentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      },

      // 5. Success action (optional - comment already removed optimistically)
      successAction: (response) => {
        console.log('Comment deleted successfully');
      },

      // 6. Error recovery - restore the deleted comment
      revertAction: () => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? {
                  ...task,
                  Task_comments: [...task.Task_comments, commentToDelete].sort(
                    (a, b) => new Date(a.Comment_createdAt) - new Date(b.Comment_createdAt)
                  )
                }
              : task
          )
        );
      },

      // 7. Loading state management
      setLoadingState: setLoadingStates,
      loadingKey: `deletions.${commentId}`,

      // 8. Error handling
      onError: (error) => {
        const errorMessage = handleOptimisticError(error);
        alert(`Failed to delete comment: ${errorMessage}`);
      }
    });

  } catch (error) {
    console.error('Comment deletion failed:', error);
  }
};

/**
 * Example: Loading State Hook
 * 
 * This example shows how to create a custom hook for managing
 * loading states across multiple operations.
 */
export const useOptimisticLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState({
    assignments: {},
    comments: {},
    deletions: {}
  });

  const setLoadingState = (category, key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: isLoading
      }
    }));
  };

  const isLoading = (category, key) => {
    return loadingStates[category]?.[key] || false;
  };

  const clearAllLoadingStates = () => {
    setLoadingStates({
      assignments: {},
      comments: {},
      deletions: {}
    });
  };

  return {
    loadingStates,
    setLoadingState,
    isLoading,
    clearAllLoadingStates
  };
};

/**
 * Example: Component Cleanup Hook
 * 
 * This example shows how to prevent state updates on unmounted components.
 */
export const useComponentCleanup = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = (setState) => {
    return (newState) => {
      if (mountedRef.current) {
        setState(newState);
      }
    };
  };

  return { mountedRef, safeSetState };
};