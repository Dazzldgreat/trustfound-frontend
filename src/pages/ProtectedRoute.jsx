import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!isLoggedIn() || !user) {
    localStorage.clear();
    return <Navigate to="/login-page" replace />;
  }

  return children;
}

export default ProtectedRoute;