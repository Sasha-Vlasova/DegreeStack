// Navigate is used to redirect the user to another route
import { Navigate } from "react-router-dom";

// useAuth gives us access to the current user from AuthContext
import { useAuth } from "./AuthContext";

// This component protects routes that require authentication.
// If the user is not logged in, they are redirected to /authorization.
// If the user is logged in, the protected content (children) is rendered.
export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return null; // or a loading spinner if you want
  }
  // If no user is logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/authorization" replace />;
  }

  // If user exists, render the protected component
  return children;
}
