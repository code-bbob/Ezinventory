import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useBranchManagement } from "@/hooks/useBranchManagement";

const BranchProtectedRoute = ({ children }) => {
  const { requiresBranchSelection } = useBranchManagement();

  if (requiresBranchSelection()) {
    return <Navigate to="/select-branch" replace />;
  }

  return children ? children : <Outlet />;
};

export default BranchProtectedRoute;
