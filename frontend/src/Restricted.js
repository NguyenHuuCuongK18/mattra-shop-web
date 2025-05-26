// src/components/Restricted.js
import { Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

const Restricted = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default Restricted;
