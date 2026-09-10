import { Navigate } from "react-router-dom";
import { getToken } from "./tokenStorage.js";

export default function RotaProtegida({ children }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
