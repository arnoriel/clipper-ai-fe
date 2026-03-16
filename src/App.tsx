// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Apps from "./pages/Apps";
import Auth from "./pages/Auth";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import { isAuthenticated } from "./lib/Auth";

// ─── Protected Route: requires login ─────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

// ─── Protected Route: requires superadmin role ────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"     element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />

        {/* User app */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <Apps />
            </RequireAuth>
          }
        />

        {/* Superadmin dashboard — has its own login screen built-in */}
        <Route path="/superadmin" element={<SuperadminDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;