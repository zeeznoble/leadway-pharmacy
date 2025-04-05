import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import ProviderPage from "@/pages/providers";
import BenefitsPage from "@/pages/benefits";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ProviderPage />} path="/providers" />
      <Route element={<BenefitsPage />} path="/benefits" />
    </Routes>
  );
}

export default App;
