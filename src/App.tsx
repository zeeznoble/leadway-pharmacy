import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";

function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/auth/login" />

      <Route element={<IndexPage />} path="/" />
    </Routes>
  );
}

export default App;
