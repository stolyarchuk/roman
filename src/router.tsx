import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { getBrowserLocale, isLocale, normalizeLocalePath } from "./locale";

const LocaleRoute = ({ initialData }: { initialData?: any }): JSX.Element => {
  const { locale } = useParams();
  if (!isLocale(locale)) {
    return <Navigate to={normalizeLocalePath(getBrowserLocale())} replace />;
  }

  return <App locale={locale as any} initialData={initialData} />;
};

export function RouterApp({
  location,
  initialData,
}: {
  location?: string;
  initialData?: any;
}) {
  if (location) {
    return (
      <StaticRouter location={location}>
        <Routes>
          <Route
            path="/"
            element={
              <Navigate to={normalizeLocalePath(getBrowserLocale())} replace />
            }
          />
          <Route
            path="/:locale/*"
            element={<LocaleRoute initialData={initialData} />}
          />
          <Route
            path="*"
            element={
              <Navigate to={normalizeLocalePath(getBrowserLocale())} replace />
            }
          />
        </Routes>
      </StaticRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={normalizeLocalePath(getBrowserLocale())} replace />
          }
        />
        <Route path="/:locale/*" element={<LocaleRoute />} />
        <Route
          path="*"
          element={
            <Navigate to={normalizeLocalePath(getBrowserLocale())} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
