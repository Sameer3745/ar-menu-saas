 import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PublicMenu from "./pages/PublicMenu";
import LandingPage from "./pages/LandingPage";
import UpdatePassword from "./pages/UpdatePassword";

import MenuManagement from "./components/MenuManagement";
import Orders from "./components/Orders";
import QRCodePage from "./components/QRCodePage";
import Settings from "./components/Settings";

function AppRoutes({ user }) {
  const location = useLocation();

  // ✅ check if current URL is recovery (password reset link)
  const isRecoveryFlow =
    location.search.includes("type=recovery") ||
    location.search.includes("access_token");

  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={user && !isRecoveryFlow ? <Navigate to="/dashboard" /> : <LandingPage />} />

      {/* Auth page */}
      <Route path="/auth" element={user && !isRecoveryFlow ? <Navigate to="/dashboard" /> : <Auth />} />

      {/* Update password page */}
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* Agar user recovery link se aya hai → force update-password page */}
      {isRecoveryFlow && <Route path="*" element={<Navigate to="/update-password" />} />}

      {/* Public menu */}
      <Route path="/menu/:profileId" element={<PublicMenu />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/" />}
      >
        <Route index element={null} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="orders" element={<Orders />} />
        <Route path="qrcode" element={<QRCodePage />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <div className="p-4 text-center text-red-600 font-bold">
            404 - Page Not Found
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <Router>
      <AppRoutes user={user} />
    </Router>
  );
}
