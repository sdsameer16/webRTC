import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login.jsx";
import AdminPage from "./pages/Admin.jsx";
import ParentPage from "./pages/Parent.jsx";
import CaretakerPage from "./pages/Caretaker.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/parent" element={<ParentPage />} />
      <Route path="/caretaker" element={<CaretakerPage />} />
    </Routes>
  );
}
