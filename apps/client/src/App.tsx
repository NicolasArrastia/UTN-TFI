import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AdminOnly } from "./components/AdminOnly.tsx";
import { GuestRoute } from "./components/GuestRoute.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import { DashboardLayout } from "./layouts/DashboardLayout.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { OverviewPage } from "./pages/dashboard/OverviewPage.tsx";
import { ProductDetailPage } from "./pages/dashboard/ProductDetailPage.tsx";
import { ProductFormPage } from "./pages/dashboard/ProductFormPage.tsx";
import { ProductsPage } from "./pages/dashboard/ProductsPage.tsx";
import { SalesPage } from "./pages/dashboard/SalesPage.tsx";
import { SettingsPage } from "./pages/dashboard/SettingsPage.tsx";
import { StatsPage } from "./pages/dashboard/StatsPage.tsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          closeButton
          draggable
          draggableDirection="x"
          pauseOnHover
          newestOnTop
          theme="dark"
        />
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route
                path="products/new"
                element={
                  <AdminOnly>
                    <ProductFormPage mode="create" />
                  </AdminOnly>
                }
              />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route
                path="products/:id/edit"
                element={
                  <AdminOnly>
                    <ProductFormPage mode="edit" />
                  </AdminOnly>
                }
              />
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
