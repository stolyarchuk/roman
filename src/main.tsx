import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import App from "./App";
import { getBrowserLocale, isLocale, normalizeLocalePath } from "./locale";

const LocaleRoute = (): JSX.Element => {
  const { locale } = useParams();
  if (!isLocale(locale)) {
    return <Navigate to={normalizeLocalePath(getBrowserLocale())} replace />;
  }

  return <App locale={locale} />;
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
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
  </BrowserRouter>,
);
