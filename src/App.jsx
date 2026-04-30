import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import DonorRegister from "./pages/DonorRegister";
import RecipientRegister from "./pages/RecipientRegister";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Admin from "./pages/Admin";
import Donor from "./pages/Donor";
import Recipient from "./pages/Recipient";
import Logistics from "./pages/Logistics";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route path="/register/donor" element={<DonorRegister />} />
      <Route path="/register/recipient" element={<RecipientRegister />} />

      {/* Role-based dashboards (protected) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Admin />} />
      </Route>

      <Route
        path="/donor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["donor"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Donor />} />
      </Route>

      <Route
        path="/recipient/dashboard"
        element={
          <ProtectedRoute allowedRoles={["recipient"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Recipient />} />
      </Route>

      <Route
        path="/logistics/dashboard"
        element={
          <ProtectedRoute allowedRoles={["logistics"]}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Logistics />} />
      </Route>

      {/* Backward compat */}
      <Route
        path="/dashboard/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/dashboard/donor"
        element={<Navigate to="/donor/dashboard" replace />}
      />
      <Route
        path="/dashboard/recipient"
        element={<Navigate to="/recipient/dashboard" replace />}
      />
      <Route
        path="/dashboard/logistics"
        element={<Navigate to="/logistics/dashboard" replace />}
      />
    </Routes>
  );
}
