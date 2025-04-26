import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/protected";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import EnrolleesPage from "@/pages/enrollees";
import PharmacyPage from "@/pages/pharmacy";
import DeliveriesPage from "./pages/deliveries";

function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<IndexPage />} />
        <Route path="/enrollees" element={<EnrolleesPage />} />
        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
