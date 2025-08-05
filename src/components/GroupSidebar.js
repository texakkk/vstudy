import React, { useState, useEffect, useCallback } from "react";
import { FaChevronDown, FaChevronRight, FaUserFriends } from "react-icons/fa";
import api from "../api";
import "./GroupSidebar.css";

const GroupSidebar = ({ onGroupChange, currentGroup }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [currentUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  // Fetch user groups
  const fetchUserGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/group/user-groups");
      const groupsData = response.data.groups || [];
      setGroups(groupsData);

      if (groupsData.length > 0) {
        // Try to find the last active group from localStorage
        const lastActiveGroupId = localStorage.getItem("lastActiveGroup");
        const groupToSelect = lastActiveGroupId
          ? groupsData.find((g) => g._id === lastActiveGroupId) || groupsData[0]
          : groupsData[0];

        // Call onGroupChange with both groupId and groupData
        onGroupChange(groupToSelect._id, {
          ...groupToSelect,
          isAdmin: groupToSelect.createdBy === currentUser?._id,
          memberCount: groupToSelect.members?.length || 0,
        });
      }
      return groupsData;
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError("Failed to load groups. Please refresh the page.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onGroupChange, currentUser?._id]);

  // Handle new message to update last message
  const handleNewMessage = useCallback((message) => {
    if (message && message.groupId) {
      setLastMessages((prev) => ({
        ...prev,
        [message.groupId]: {
          text: message.content || message.text || "📎 Attachment",
          sender: message.sender || message.userId,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      }));
    }
  }, []);

  // Load groups when component mounts
  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  // Handle group selection
  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find((g) => g._id === groupId);
    if (selectedGroup && onGroupChange) {
      onGroupChange(groupId, {
        ...selectedGroup,
        isAdmin: selectedGroup.createdBy === currentUser?._id,
        memberCount: selectedGroup.members?.length || 0,
      });
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.Group_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "G";
  };

  const getRandomColor = (str) => {
    const colors = [
      "#4e73df",
      "#1cc88a",
      "#36b9cc",
      "#f6c23e",
      "#e74a3b",
      "#6610f2",
      "#fd7e14",
      "#20c9a6",
    ];
    const hash = str
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`group-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div
        className="sidebar-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="sidebar-title">Your Groups</h3>
        <span className="collapse-icon">
          {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
        </span>
      </div>

      {!isCollapsed && (
        <>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="group-count">
            {filteredGroups.length}{" "}
            {filteredGroups.length === 1 ? "Group" : "Groups"}
          </div>

          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading groups...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <button onClick={fetchUserGroups} className="retry-button">
                Retry
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="no-groups-container">
              <FaUserFriends size={48} />
              <h3>No Groups Found</h3>
              <p>You're not a member of any groups yet.</p>
            </div>
          ) : (
            <ul className="group-list">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <li
                    key={group._id}
                    className={`group-item ${
                      currentGroup === group._id ? "active" : ""
                    }`}
                    onClick={() => handleGroupSelect(group._id)}
                  >
                    <div
                      className="group-avatar"
                      style={{ backgroundColor: getRandomColor(group._id) }}
                    >
                      {getInitials(group.Group_name)}
                    </div>
                    <div className="group-details">
                      <div className="group-name">
                        {group.Group_name}
                        {group.isAdmin && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </div>
                      {group.lastMessage && (
                        <div className="last-message">
                          {currentUser?._id &&
                          group.lastMessage.sender === currentUser._id
                            ? "You: "
                            : ""}
                          {group.lastMessage.text &&
                          group.lastMessage.text.length > 25
                            ? group.lastMessage.text.substring(0, 25) + "..."
                            : group.lastMessage.text || "New message"}
                        </div>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <div className="no-groups">
                  {searchTerm
                    ? "No matching groups found"
                    : "No groups available"}
                </div>
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default GroupSidebar;
