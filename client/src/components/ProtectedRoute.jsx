import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('accessToken');
  const userString = localStorage.getItem('user');
  let user = null;

  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error('Failed to parse user session data', e);
    }
  }

  // Redirect to login if user is not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to subscriber dashboard if admin route requires admin permissions
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
