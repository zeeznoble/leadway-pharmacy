import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import { initializeDiagnosesData } from "@/lib/services/fetch-diagnosis.ts";
import { initializeProvidersData } from "@/lib/services/fetch-pro-select.ts";
import { initializeProceduresData } from "@/lib/services/fetch-procedure.ts";
import { deliveryFormState } from "@/lib/store/delivery-store.ts";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import "@/styles/globals.css";

initializeDiagnosesData();
initializeProvidersData();

const pharmacyid = deliveryFormState.get().pharmacyId;

if (pharmacyid !== 0) {
  initializeProceduresData();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 5000,
          }}
        />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
