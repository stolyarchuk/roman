import React from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterApp } from "./router";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Pass server-provided initial data to the client hydration step if present
const initialData = (window as any).__INITIAL_DATA__ ?? undefined;

// Hydrate on the client - RouterApp uses BrowserRouter when no location prop is passed
hydrateRoot(rootElement, <RouterApp initialData={initialData} />);
