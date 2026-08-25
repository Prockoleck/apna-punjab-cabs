/* Tiny router: serves the public site at / and the admin console at
   /admin (also #/admin and ?admin as hosting fallbacks). */

import { useEffect, useState } from "react";
import App from "./App";
import AdminApp from "./admin/AdminApp";
import { SettingsProvider } from "./lib/settings";

function currentMode(): "admin" | "site" {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  if (window.location.hash.startsWith("#/admin")) return "admin";
  if (new URLSearchParams(window.location.search).has("admin")) return "admin";
  return "site";
}

export default function Root() {
  const [mode, setMode] = useState<"admin" | "site">(currentMode);

  useEffect(() => {
    const sync = () => {
      setMode((prev) => {
        const next = currentMode();
        if (next !== prev) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  return (
    <SettingsProvider>
      {mode === "admin" ? <AdminApp /> : <App />}
    </SettingsProvider>
  );
}
