import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./index.css";

// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

// Render EstateIQ
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
