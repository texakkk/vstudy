import React, { useState } from "react";
import MultiGroupMessaging from "./MultiGroupMessaging";
import GroupReplyModal from "./GroupReplyModal";
import { FaUsers, FaReply } from "react-icons/fa";

const MultiGroupDemo = () => {
  const [showMultiGroupModal, setShowMultiGroupModal] = useState(false);
  const [showGroupReplyModal, setShowGroupReplyModal] = useState(false);

  // Mock data for demonstration
  const mockGroups = [
    { _id: "1", Group_name: "Study Group A", memberCount: 15 },
    { _id: "2", Group_name: "Project Team B", memberCount: 8 },
    { _id: "3", Group_name: "Research Group C", memberCount: 12 },
    { _id: "4", Group_name: "Discussion Forum D", memberCount: 25 },
  ];

  const mockMessage = {
    _id: "msg1",
    Message_content: "This is a sample message that you can reply to",
    Message_sender: { User_name: "John Doe" },
    Message_createdAt: new Date().toISOString(),
  };

  const mockGroupInfo = {
    _id: "1",
    Group_name: "Study Group A",
  };

  const handleMultiGroupMessageSent = (
    message,
    successfulGroups,
    failedGroups
  ) => {
    console.log("Demo: Multi-group message sent", {
      message,
      successfulGroups,
      failedGroups,
    });
    alert(`Demo: ${message}`);
  };

  const handleGroupReplySent = (message, groupInfo) => {
    console.log("Demo: Group reply sent", { message, groupInfo });
    alert(`Demo: Reply sent to ${groupInfo.Group_name}`);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Multi-Group Messaging Demo</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => setShowMultiGroupModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          <FaUsers />
          Send to Multiple Groups
        </button>

        <button
          onClick={() => setShowGroupReplyModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          <FaReply />
          Reply to Group
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "1rem",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <h3>Features:</h3>
        <ul>
          <li>Send messages to multiple groups simultaneously</li>
          <li>Support for both text and file messages</li>
          <li>Group-specific replies with context</li>
          <li>Real-time socket updates</li>
          <li>Success/failure feedback with toast notifications</li>
          <li>Responsive design for mobile and desktop</li>
        </ul>
      </div>

      <div
        style={{
          backgroundColor: "#eff6ff",
          padding: "1rem",
          borderRadius: "0.5rem",
          border: "1px solid #dbeafe",
        }}
      >
        <h3>How to use:</h3>
        <ol>
          <li>
            Click "Send to Multiple Groups" to open the multi-group messaging
            modal
          </li>
          <li>Select the groups you want to send the message to</li>
          <li>Type your message and optionally attach a file</li>
          <li>Click "Send" to deliver the message to all selected groups</li>
          <li>
            Use "Reply to Group" to respond to messages in specific groups
          </li>
        </ol>
      </div>

      {/* Multi-Group Messaging Modal */}
      <MultiGroupMessaging
        isOpen={showMultiGroupModal}
        onClose={() => setShowMultiGroupModal(false)}
        userGroups={mockGroups}
        socket={null} // In real app, pass actual socket
        onMessageSent={handleMultiGroupMessageSent}
      />

      {/* Group Reply Modal */}
      <GroupReplyModal
        isOpen={showGroupReplyModal}
        onClose={() => setShowGroupReplyModal(false)}
        originalMessage={mockMessage}
        groupInfo={mockGroupInfo}
        socket={null} // In real app, pass actual socket
        onReplySent={handleGroupReplySent}
      />
    </div>
  );
};

export default MultiGroupDemo;
