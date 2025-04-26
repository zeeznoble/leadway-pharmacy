import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import { initializeDiagnosesData } from "./lib/services/fetch-diagnosis.ts";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";

import "@/styles/globals.css";

initializeDiagnosesData();

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
