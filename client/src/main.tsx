import { Fragment, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

const RootMode = import.meta.env.DEV ? Fragment : StrictMode;

createRoot(document.getElementById("root")!).render(
  <RootMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RootMode>
);
