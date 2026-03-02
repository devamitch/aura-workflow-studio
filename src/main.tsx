import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { useStore } from "./store";

// Bootstrap auth before first render so the AuthGate has session state
useStore.getState().bootstrapAuth();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
