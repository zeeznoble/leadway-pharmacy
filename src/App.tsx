import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/protected";

import LoginPage from "@/pages/login";
import IndexPage from "@/pages/index";
import PharmacyPage from "@/pages/pharmacy";
import EnrolleesPage from "@/pages/enrollees";
import DeliveriesPage from "@/pages/deliveries";
import PackPage from "@/pages/pack";
import ToBeDeliveredPage from "@/pages/to-be-delivered";
import ReportsPage from "@/pages/reports";
import RiderPage from "@/pages/rider";

import DeliveryDetailsPage from "@/pages/delivery-details";

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
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/rider" element={<RiderPage />} />
        <Route path="/deliveries/:id" element={<DeliveryDetailsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
