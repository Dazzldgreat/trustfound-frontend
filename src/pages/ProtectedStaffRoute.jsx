import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

function ProtectedStaffRoute({ children }) {
  const staff = JSON.parse(localStorage.getItem("staff") || "null");

  if (!isLoggedIn() || !staff) {
    localStorage.clear();
    return <Navigate to="/staff-login" replace />;
  }

  return children;
}

export default ProtectedStaffRoute;