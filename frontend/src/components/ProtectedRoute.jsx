import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any route element: <ProtectedRoute roles={["ADMIN"]}><Page/></ProtectedRoute>
 * - No `roles` prop -> any authenticated user.
 * - `roles` provided -> only those roles pass; everyone else is redirected
 *   to /unauthorized rather than silently shown a 403 from the API.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center text-sm text-gray-400 py-10">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
