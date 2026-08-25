/* ================================================================== */
/*  App router — multi-page public site + admin console.               */
/*  HashRouter keeps deep links working on any static host; typing     */
/*  /admin in the address bar is normalised to #/admin automatically.  */
/* ================================================================== */

import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminApp from "./admin/AdminApp";
import { PublicLayout, NotFound, PUBLIC_ROUTES } from "./pages/public";

const {
  HomePage,
  CarsPage,
  CarDetailPage,
  BookingPage,
  AboutPage,
  ServicesPage,
  ContactPage,
  FaqPage,
  TermsPage,
  PrivacyPage,
} = PUBLIC_ROUTES;

/** /admin or /admin/... typed directly → redirect into the hash route. */
function usePathNormaliser() {
  useEffect(() => {
    const p = window.location.pathname;
    if (p === "/admin" || p.startsWith("/admin/")) {
      const rest = p.slice("/admin".length) || "";
      window.history.replaceState(null, "", window.location.pathname.replace(/\/admin\/?$/, "/") + "#/admin" + rest);
      window.location.reload();
    }
  }, []);
}

export default function Root() {
  usePathNormaliser();
  return (
    <HashRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cars" element={<CarsPage />} />
          <Route path="cars/:id" element={<CarDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </HashRouter>
  );
}

export { Navigate };
