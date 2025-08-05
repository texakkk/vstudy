import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  InputBase,
  IconButton,
  Paper,
  Fade,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Chip,
  Avatar,
} from "@mui/material";
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import api from "../api";

const SearchContainer = styled(Paper)(({ theme, expanded }) => ({
  display: "flex",
  alignItems: "center",
  width: expanded ? "300px" : "40px",
  height: "40px",
  borderRadius: "20px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  transition: "all 0.3s ease-in-out",
  overflow: "hidden",
  position: "relative",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  [theme.breakpoints.down("sm")]: {
    width: expanded ? "250px" : "40px",
  },
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  flex: 1,
  color: "white",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    fontSize: "0.9rem",
    "&::placeholder": {
      color: "rgba(255, 255, 255, 0.7)",
      opacity: 1,
    },
  },
}));

const SearchResults = styled(Paper)(({ theme }) => ({
  position: "absolute",
  top: "45px",
  left: 0,
  right: 0,
  maxHeight: "300px",
  overflowY: "auto",
  backgroundColor: "white",
  borderRadius: "8px",
  boxShadow: theme.shadows[8],
  zIndex: 1000,
}));

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const SearchBar = () => {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await performSearch(query);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowResults(true);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Perform search using unified search endpoint
  const performSearch = async (query) => {
    try {
      const response = await api.get("/search/all", {
        params: { q: query, limit: 15 },
      });

      if (response.data.success) {
        return response.data.results || [];
      } else {
        console.error("Search API error:", response.data.message);
        return [];
      }
    } catch (error) {
      console.error("Search failed:", error);
      // Fallback to individual searches if unified search fails
      return await performFallbackSearch(query);
    }
  };

  // Fallback search function using individual endpoints
  const performFallbackSearch = async (query) => {
    const searchPromises = [
      searchGroups(query),
      searchTasks(query),
      searchUsers(query),
      searchMessages(query),
    ];

    try {
      const [groups, tasks, users, messages] = await Promise.allSettled(
        searchPromises
      );

      const allResults = [];

      // Process groups
      if (groups.status === "fulfilled" && groups.value) {
        allResults.push(
          ...groups.value.map((group) => ({
            type: "group",
            id: group._id,
            name: group.Group_name,
            description:
              group.Group_description ||
              `${group.Group_memberCount || 0} members`,
            data: group,
          }))
        );
      }

      // Process tasks
      if (tasks.status === "fulfilled" && tasks.value) {
        allResults.push(
          ...tasks.value.map((task) => ({
            type: "task",
            id: task._id,
            name: task.Task_name || task.Task_title,
            description:
              task.Task_description ||
              `Due: ${new Date(task.Task_dueDate).toLocaleDateString()}`,
            data: task,
          }))
        );
      }

      // Process users
      if (users.status === "fulfilled" && users.value) {
        allResults.push(
          ...users.value.map((user) => ({
            type: "user",
            id: user._id,
            name: user.User_name,
            description: user.User_email || "User",
            avatar: user.User_profilePicture,
            data: user,
          }))
        );
      }

      // Process messages
      if (messages.status === "fulfilled" && messages.value) {
        allResults.push(
          ...messages.value.map((message) => ({
            type: "message",
            id: message._id,
            name: `Message from ${
              message.Message_sender?.User_name || "Unknown"
            }`,
            description:
              message.Message_content?.substring(0, 50) +
              (message.Message_content?.length > 50 ? "..." : ""),
            data: message,
          }))
        );
      }

      return allResults;
    } catch (error) {
      console.error("Fallback search failed:", error);
      return [];
    }
  };

  // Search functions for different data types
  const searchGroups = async (query) => {
    try {
      const response = await api.get("/group/search", {
        params: { q: query, limit: 10 },
      });
      return response.data.groups || [];
    } catch (error) {
      // If search endpoint doesn't exist, get all groups and filter
      try {
        const response = await api.get("/group");
        const groups = response.data.groups || response.data || [];
        return groups
          .filter(
            (group) =>
              group.Group_name?.toLowerCase().includes(query.toLowerCase()) ||
              group.Group_description?.toLowerCase().includes(
                query.toLowerCase()
              )
          )
          .slice(0, 10);
      } catch (fallbackError) {
        console.error("Group search failed:", fallbackError);
        return [];
      }
    }
  };

  const searchTasks = async (query) => {
    try {
      const response = await api.get("/task/search", {
        params: { q: query, limit: 10 },
      });
      return response.data.tasks || [];
    } catch (error) {
      // If search endpoint doesn't exist, get all tasks and filter
      try {
        const response = await api.get("/task");
        const tasks = response.data.tasks || response.data || [];
        return tasks
          .filter(
            (task) =>
              task.Task_title?.toLowerCase().includes(query.toLowerCase()) ||
              task.Task_description?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 10);
      } catch (fallbackError) {
        console.error("Task search failed:", fallbackError);
        return [];
      }
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await api.get("/auth/users/search", {
        params: { q: query, limit: 10 },
      });
      return response.data.users || [];
    } catch (error) {
      console.error("User search failed:", error);
      return [];
    }
  };

  const searchMessages = async (query) => {
    try {
      const response = await api.get("/message/search", {
        params: { q: query, limit: 5 },
      });
      return response.data.messages || [];
    } catch (error) {
      console.error("Message search failed:", error);
      return [];
    }
  };

  const handleSearchClick = () => {
    setExpanded(true);
  };

  const handleClose = () => {
    setExpanded(false);
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleResultClick = (result) => {
    console.log("Selected:", result);

    // Navigate based on result type
    switch (result.type) {
      case "group":
        navigate("/dashboard/group-management", {
          state: { selectedGroupId: result.id, groupData: result.data },
        });
        break;
      case "task":
        navigate("/dashboard/task-manager", {
          state: { selectedTaskId: result.id, taskData: result.data },
        });
        break;
      case "user":
        navigate("/dashboard/profile", {
          state: { userId: result.id, userData: result.data },
        });
        break;
      case "message":
        // Navigate to the group chat where this message exists
        if (result.data.Message_groupId) {
          navigate("/dashboard/group-chat-page", {
            state: {
              selectedGroupId: result.data.Message_groupId,
              highlightMessageId: result.id,
            },
          });
        }
        break;
      default:
        console.log("Unknown result type:", result.type);
    }

    handleClose();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case "group":
        return "👥";
      case "task":
        return "📋";
      case "user":
        return "👤";
      case "message":
        return "💬";
      default:
        return "🔍";
    }
  };

  return (
    <Box sx={{ position: "relative" }}>
      <SearchContainer expanded={expanded} elevation={0}>
        <IconButton
          sx={{
            p: "8px",
            color: "white",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
          onClick={handleSearchClick}
        >
          <SearchIcon fontSize="small" />
        </IconButton>

        <Fade in={expanded}>
          <SearchInput
            placeholder="Search groups, tasks, users..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus={expanded}
          />
        </Fade>

        {expanded && (
          <IconButton
            sx={{
              p: "8px",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </SearchContainer>

      {/* Search Results */}
      {showResults && (
        <SearchResults>
          {isLoading ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Searching...
              </Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <List dense>
              {searchResults.slice(0, 8).map((result, index) => (
                <ListItem
                  key={`${result.type}-${result.id}-${index}`}
                  button
                  onClick={() => handleResultClick(result)}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <Box sx={{ mr: 2, fontSize: "1.2rem" }}>
                    {getResultIcon(result.type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {result.name}
                        </Typography>
                        <Chip
                          label={result.type}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: "0.7rem",
                            height: "20px",
                            textTransform: "capitalize",
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {result.description}
                      </Typography>
                    }
                  />
                  {result.avatar && (
                    <Avatar
                      src={result.avatar}
                      sx={{ width: 32, height: 32, ml: 1 }}
                    />
                  )}
                </ListItem>
              ))}
              {searchResults.length > 8 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        align="center"
                      >
                        +{searchResults.length - 8} more results
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          ) : (
            searchQuery.trim() && (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No results found for "{searchQuery}"
                </Typography>
              </Box>
            )
          )}
        </SearchResults>
      )}
    </Box>
  );
};

export default SearchBar;
