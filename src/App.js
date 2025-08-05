
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './AuthContext'; // Import Auth Context and Provider
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import Home from './pages/Home';
import Features from './pages/Features';
import FAQ from './pages/FAQ';
import About from './pages/About';
import SignIn from './pages/SignIn'; // SignIn form page
import GetStarted from './pages/GetStarted'; // Get Started form page
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import JoinGroup from './pages/Dashboard/JoinGroup';
import TaskManager from './pages/Dashboard/TaskManager';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EditProfile from './pages/Dashboard/EditProfile';
import Dashboardd from './pages/Dashboard/dashboardd'; // Dashboard component
import PublicLayout from './components/PublicLayout'; // Layout for public pages
import PrivateRoute from './components/PrivateRoute'; // Private Route

function App() {

  return (
    <ThemeProvider>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <Router>
              <Routes>
                {/* Public Routes wrapped in PublicLayout */}
                <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
                <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
                <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
                <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
                <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

                {/* Pages without Navbar and Footer */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/get-started" element={<GetStarted />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/join-group/:invitationToken" element={<JoinGroup />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/task-manager/:groupId" element={<TaskManager />} />

                {/* Protected Route for Dashboard */}
                <Route
                  path="/dashboard/*"
                  element={
                    <PrivateRoute>
                      <Dashboardd />
                    </PrivateRoute>
                  }
                />
              </Routes>
              </Router>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;