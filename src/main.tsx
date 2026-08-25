import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Root from "./router";

/* PWA service worker — offline shell for the installable admin CRM */
if ("serviceWorker" in navigator && !window.location.hostname.includes("localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* SW unavailable — app still works normally */
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
