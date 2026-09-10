import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ListaLivros from "./pages/ListaLivros.jsx";
import Estatisticas from "./pages/Estatisticas.jsx";
import RotaProtegida from "./auth/RotaProtegida.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RotaProtegida>
            <ListaLivros />
          </RotaProtegida>
        }
      />
      <Route
        path="/estatisticas"
        element={
          <RotaProtegida>
            <Estatisticas />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
