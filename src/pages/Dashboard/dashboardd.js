import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'react-icons/fa';
import { useAuth } from '../../AuthContext';
import DashboardSummary from './DashboardSummary';
import GroupManagement from './GroupManagement';
import TaskManager from './TaskManager';
import GroupChatPage from './GroupChatPage';
import Profile from './Profile';
import EditProfile from './EditProfile';
import Settings from './Settings';
import ProjectReport from './ProjectReport';
import NotificationCenter from './NotificationCenter';
import NotificationBell from '../../components/NotificationBell';
import SearchBar from '../../components/SearchBar';
import { Box, Avatar, Typography, IconButton, CircularProgress } from '@mui/material';
import { Logout as LogoutIcon, Settings as SettingsIcon } from '@mui/icons-material';
import api from '../../api';

import './dashboardd.css';

// Sidebar Component
const Sidebar = ({ isCollapsed, toggleSidebar, user, onLogout, isMobileMenuOpen, toggleMobileMenu }) => {
  const navigate = useNavigate();
  const initial = user?.User_name ? user.User_name[0].toUpperCase() : 'U';
  const userRole = user?.User_role ? user.User_role.charAt(0).toUpperCase() + user.User_role.slice(1) : 'User';

  const links = [
    { to: 'group-management', icon: <Icons.FaUsers />, label: 'Group Management' },
    { to: 'task-manager', icon: <Icons.FaTasks />, label: 'Task Manager' },
    { to: 'group-chat-page', icon: <Icons.FaComments />, label: 'Group Chat' },
    { to: 'notifications', icon: <Icons.FaBell />, label: 'Notifications' },
    { to: 'project-report', icon: <Icons.FaFileAlt />, label: 'Project Report' },
  ];

  return (
    <Box className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'show-mobile' : ''}`}>
      <Box className="sidebar">
        {/* Logo and Toggle Section */}
        <Box className="sidebar-header">
        {!isCollapsed && (
          <Typography variant="h6" component="h1" noWrap className="logo-text">
            Study Hub
          </Typography>
        )}
        <IconButton 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          size="small"
          sx={{ 
            ml: isCollapsed ? 0 : 'auto',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {isCollapsed ? <Icons.FaChevronRight /> : <Icons.FaChevronLeft />}
        </IconButton>
      </Box>
      
      {/* User Profile Section */}
      <Box 
        className={`user-profile ${isCollapsed ? 'collapsed' : ''}`} 
        onClick={() => navigate('profile')}
      >
        <Avatar 
          src={user?.User_profilePicture} 
          alt={user?.User_name}
          sx={{ 
            width: isCollapsed ? 40 : 60, 
            height: isCollapsed ? 40 : 60,
            transition: 'all 0.3s ease',
            fontSize: isCollapsed ? '1rem' : '1.5rem',
            bgcolor: 'primary.light'
          }}
        >
          {initial}
        </Avatar>
        {!isCollapsed && (
          <Box className="user-info">
            <Typography variant="subtitle1" noWrap fontWeight={500}>
              {user?.User_name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userRole}
            </Typography>
          </Box>
        )}
      </Box>
  
      {/* Navigation Links */}
      <Box className="nav-section">
        <nav className="nav-links">
          {links.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.to}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Box className="nav-icon">{link.icon}</Box>
                  {!isCollapsed && (
                    <Typography variant="body2" className="nav-label">
                      {link.label}
                    </Typography>
                  )}
                  {isActive && !isCollapsed && (
                    <Box className="active-indicator" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </Box>
  
      {/* Bottom Actions */}
      <Box className="sidebar-footer">
        <NavLink 
          to="settings" 
          className={({ isActive }) => 
            `footer-item ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}` 
            
          }
        >
          <SettingsIcon fontSize={isCollapsed ? "medium" : "small"} />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
        <button 
          className={`footer-item logout-button ${isCollapsed ? 'collapsed' : ''}`} 
          onClick={onLogout}
        >
          <LogoutIcon fontSize={isCollapsed ? "medium" : "small"} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </Box>
    </Box>
    </Box>
  );
};

// Main Dashboard Component
const Dashboardd = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Redirect to login if not authenticated
        if (error.response?.status === 401) {
          logout();
          navigate('/signin');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, logout]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Close mobile menu if open when toggling sidebar
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  const location = useLocation();
  
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (loading) {
    return (
      <Box className="dashboard-loading">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="dashboard-container">      
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
      />
      
      
        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleSidebar={toggleSidebar} 
          user={user}
          onLogout={handleLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
        />
      
      
      {/* Mobile header with menu toggle */}
      <Box className="mobile-header">
        <IconButton 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          sx={{ 
            color: 'inherit',
            display: { xs: 'flex', lg: 'none' },
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Icons.FaBars />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ 
          ml: 2,
          display: { xs: 'block', lg: 'none' },
          fontWeight: 600,
          flex: 1
        }}>
          Study Hub
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchBar />
          <NotificationBell />
        </Box>
      </Box>

      {/* Desktop header - always visible */}
      <Box className={`desktop-header ${isCollapsed ? 'collapsed' : ''}`}>
        <Box className="desktop-header-content">
          <SearchBar />
          <NotificationBell />
        </Box>
      </Box>
      
      <Box className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route index element={<DashboardSummary />} />
          <Route path="group-management" element={<GroupManagement />} />
          <Route path="task-manager" element={<TaskManager />} />
          <Route path="group-chat-page" element={<GroupChatPage />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="project-report" element={<ProjectReport />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default Dashboardd;