import React from "react";
import { Routes, Route } from "react-router-dom";
import MapPage from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import Tutorial from "./pages/Tutorial";
import FriendMapPage from "./pages/FriendMapPage";
import ProfilePage from "./pages/ProfilePage";
import PrivateRoute from "./components/PrivateRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tutorial" element={<PrivateRoute><Tutorial /></PrivateRoute>} />
      <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
      <Route path="/friend-map/:friendId" element={<PrivateRoute><FriendMapPage /></PrivateRoute>} />
      <Route path="/profile/*" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      {/* Ruta por defecto con "*" para que se rendericen las rutas hijas */}
      <Route path="*" element={<PrivateRoute><HomePage /></PrivateRoute>} />
    </Routes>
  );
};

export default App;
