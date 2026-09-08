// Personel Admin Yetkilerini Goremez
// Admin yada Personel Harici Yetkileri Goremez

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/giris" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Yetkisiz rol denemesi de bir "hata yönetimi" senaryosu
    return <Navigate to="/" replace />;
  }
  return children;
}