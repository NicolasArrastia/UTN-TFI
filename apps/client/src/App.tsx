import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GuestRoute } from "./components/GuestRoute.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import { DashboardLayout } from "./layouts/DashboardLayout.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { OverviewPage } from "./pages/dashboard/OverviewPage.tsx";
import { ProductsPage } from "./pages/dashboard/ProductsPage.tsx";
import { SalesPage } from "./pages/dashboard/SalesPage.tsx";
import { SettingsPage } from "./pages/dashboard/SettingsPage.tsx";
import { StatsPage } from "./pages/dashboard/StatsPage.tsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#0f172a" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#0f172a" } },
          }}
        />
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
