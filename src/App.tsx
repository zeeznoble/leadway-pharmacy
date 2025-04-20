import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/protected";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import EnrolleesPage from "@/pages/enrollees";
import PharmacyPage from "@/pages/pharmacy";

function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/auth/login" />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <IndexPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enrollees"
        element={
          <ProtectedRoute>
            <EnrolleesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute>
            <PharmacyPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
