import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { DemoErrorBoundary } from './DemoErrorBoundary';
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DemoErrorBoundary><App /></DemoErrorBoundary>
  </React.StrictMode>,
);
