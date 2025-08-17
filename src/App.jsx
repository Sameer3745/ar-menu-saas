 import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PublicMenu from "./pages/PublicMenu"; // Public menu page
import LandingPage from "./pages/LandingPage"; // Assuming you have this page

// Dashboard child components
import MenuManagement from "./components/MenuManagement";
import Orders from "./components/Orders";
import Analytics from "./components/Analytics";
import QRCodePage from "./components/QRCodePage";
import Settings from "./components/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />

        {/* Public menu page for customers */}
        <Route path="/menu/:profileId" element={<PublicMenu />} />

        {/* Dashboard & nested routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={null} /> {/* Default dashboard home */}
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<Orders />} />
          <Route path="analytics" element={<Analytics />} />
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
    </Router>
  );
}
