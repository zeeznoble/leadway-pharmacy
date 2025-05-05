import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/protected";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import EnrolleesPage from "@/pages/enrollees";
import PharmacyPage from "@/pages/pharmacy";
import DeliveriesPage from "./pages/deliveries";
import DeliveryDetailsPage from "./pages/delivery-details";
import PackPage from "./pages/pack";
import ToBeDeliveredPage from "./pages/to-be-delivered";

function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<IndexPage />} />
        <Route path="/pharmacy" element={<PharmacyPage />} />
        <Route path="/enrollees" element={<EnrolleesPage />} />
        <Route path="/create-deliveries" element={<DeliveriesPage />} />
        <Route path="/pack" element={<PackPage />} />
        <Route path="/to-be-delivered" element={<ToBeDeliveredPage />} />
        <Route path="/deliveries/:id" element={<DeliveryDetailsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
