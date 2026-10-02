import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

export const SystemRoute = ({ children, requiredSystem }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { activeSystem, selectSystem } = useSystem();

  if (loading) {
    return <Loading message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no system selected yet, auto-select from route or go to /select-system
  if (!activeSystem) {
    if (requiredSystem) {
      selectSystem(requiredSystem);
    } else {
      return <Navigate to="/select-system" replace />;
    }
  } else if (requiredSystem && activeSystem !== requiredSystem.toLowerCase()) {
    selectSystem(requiredSystem);
  }

  return children;
};

export default SystemRoute;
