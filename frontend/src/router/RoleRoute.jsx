import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // 🚫 Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Logged in but wrong role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ Allowed
  return <Outlet />;
};

export default RoleRoute;
