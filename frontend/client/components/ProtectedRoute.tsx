import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOrganizer?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireOrganizer = false }: ProtectedRouteProps) => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      // Redirect to login but save the current location they were trying to access
      navigate("/login", { state: { from: location }, replace: true });
    } else if (requireAdmin && user?.role !== "admin") {
      // If admin is required but user is not admin, redirect to home
      navigate("/", { replace: true });
    } else if (requireOrganizer && user?.role !== "ORGANIZER" && user?.role !== "admin") {
      // If organizer is required but user is neither organizer nor admin, redirect to home
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, user, requireAdmin, requireOrganizer, navigate, location]);

  // If not logged in or role requirements not met, return null while redirecting
  if (!isLoggedIn) return null;
  if (requireAdmin && user?.role !== "admin") return null;
  if (requireOrganizer && user?.role !== "ORGANIZER" && user?.role !== "admin") return null;

  return <>{children}</>;
};

export default ProtectedRoute;
