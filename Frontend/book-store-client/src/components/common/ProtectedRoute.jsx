import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute component to restrict access based on roles.
 * @param {Array} allowedRoles - List of roleIds permitted to access the route (e.g., [1] for Admin/Staff)
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const authData = localStorage.getItem('auth');
  
  if (!authData) {
    // User not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const auth = JSON.parse(authData);
  
  // Check if user's roleId is in the allowedRoles list
  // Usually roleId: 1 is Admin/Staff, roleId: 2 is Customer
  const hasAccess = allowedRoles.includes(auth.roleId);

  if (!hasAccess) {
    // User logged in but doesn't have the required permission
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
