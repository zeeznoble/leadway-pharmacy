import { Navigate, Outlet } from "react-router-dom";

import Spinner from "@/components/shared/spinner";
import DefaultLayout from "@/layout/default";

import { useAuth } from "@/lib/hooks/use-auth";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
}
