import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CajoraApp } from "./CajoraApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CajoraApp />
  </StrictMode>,
);
