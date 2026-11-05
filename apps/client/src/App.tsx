import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthProvider.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";

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
          <Route path="/" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
