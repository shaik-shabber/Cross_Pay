import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../lib/formatters";

const RoleRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;

  if (normalizeRole(user.role) !== normalizeRole(role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default RoleRoute;
