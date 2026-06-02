import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MaxiKioscoApp } from "./MaxiKioscoApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MaxiKioscoApp />
  </StrictMode>,
);
