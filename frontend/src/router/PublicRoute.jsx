import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "author") {
      return <Navigate to="/publisher" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
