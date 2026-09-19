import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { AppErrorBoundary } from './DemoErrorBoundary';
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./styles.css";
import { loadPrinterSettings } from "./printing";
import { AuthGate } from './AuthGate';

// Remove obsolete browser-only records. Supabase is the operational data source.
for (const key of [
  "mizan-pos-v1",
  "mizan-pos-recovery-v1",
  "mizan-products-v1",
  "mizan-inventory-v1",
  "mizan-favorites-v1",
  "mizan-categories-v1",
  "mizan-removed-categories-v1",
  "mizan-sales-settings-v1",
]) localStorage.removeItem(key);

document.documentElement.dataset.theme = loadPrinterSettings().theme;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary><AuthGate><App /></AuthGate></AppErrorBoundary>
  </React.StrictMode>,
);
