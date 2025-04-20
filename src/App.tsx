import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/protected";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";

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
    </Routes>
  );
}

export default App;
