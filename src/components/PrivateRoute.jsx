// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../auth/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  if (loading) return <h2>Cargando...</h2>;
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
