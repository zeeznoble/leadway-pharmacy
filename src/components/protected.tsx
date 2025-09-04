import { Navigate, Outlet } from "react-router-dom";

import Spinner from "@/components/shared/spinner";
import DefaultLayout from "@/layout/default";

import { useAuth } from "@/lib/hooks/use-auth";
import { useInactivityModal } from "@/lib/hooks/use-inactive-modal";
import { InactivityModal } from "./shared/inactivity-modal";
import { logout } from "@/lib/store/app-store";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const { showWarning, countdown, handleStayActive } = useInactivityModal({
    warningTimeout: 5 * 60 * 1000,
    logoutTimeout: 30 * 1000,
    onLogout: handleLogout,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <DefaultLayout>
      <Outlet />
      <InactivityModal
        isOpen={showWarning}
        countdown={countdown}
        onStayActive={handleStayActive}
        onLogout={handleLogout}
      />
    </DefaultLayout>
  );
}
