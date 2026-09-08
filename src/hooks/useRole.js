import { useAuth } from "../context/AuthContext";

export function useRole() {
  const { role, isAuthenticated } = useAuth();
  return {
    role,
    isAdmin: isAuthenticated && role === "admin",
    isStaff: isAuthenticated && role === "staff",
  };
}