import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    if (!user) {
      localStorage.removeItem("user");
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);

    localStorage.removeItem("user");

    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;