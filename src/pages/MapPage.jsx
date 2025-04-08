import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { auth } from "../auth/firebaseConfig";
import { signOut } from "firebase/auth";
import countriesData from "../data/countries.geo.json";
import "../styles/MapPage.css";
import "leaflet/dist/leaflet.css";
import {
  saveSelectedCountries,
  loadSelectedCountries,
} from "../services/firestoreService";
import { useAuthState } from "react-firebase-hooks/auth";
import CountryDrawer from "../components/CountryDrawer"; // Componente del drawer

const MapPage = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const layersRef = useRef({});
  const selectedCountriesRef = useRef(selectedCountries);
  
  // Actualizamos el ref cada vez que cambia selectedCountries
  useEffect(() => {
    selectedCountriesRef.current = selectedCountries;
  }, [selectedCountries]);

  // Estado del drawer (abierto/cerrado y país mostrado)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCountry, setDrawerCountry] = useState(null);

  // Funciones de navegación
  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };
  const goHome = () => {
    navigate("/");
  };

  // Al hacer clic en un país: click izquierdo para seleccionar/deseleccionar,
  // click derecho para abrir el drawer (solo si el país ya está seleccionado)
  const onEachCountry = (feature, layer) => {
    const countryName = feature.properties.name;
    layersRef.current[countryName] = layer;

    // Click izquierdo: seleccionar/deseleccionar (botón 0)
    layer.on("click", (e) => {
      if (e.originalEvent.button !== 0) return;
      setSelectedCountries((prevSelected) => {
        if (prevSelected.includes(countryName)) {
          if (drawerCountry === countryName) {
            setDrawerOpen(false);
            setDrawerCountry(null);
          }
          return prevSelected.filter((name) => name !== countryName);
        } else {
          return [...prevSelected, countryName];
        }
      });
    });

    // Click derecho: si el país está seleccionado, abrir el drawer y prevenir el menú contextual
    layer.on("contextmenu", (e) => {
      if (selectedCountriesRef.current.includes(countryName)) {
        e.originalEvent.preventDefault();
        setDrawerOpen(true);
        setDrawerCountry(countryName);
      }
      // Si no está seleccionado, se deja el comportamiento por defecto.
    });
  };

  // Cargar la selección inicial desde Firestore
  useEffect(() => {
    const loadData = async () => {
      const countries = await loadSelectedCountries();
      if (countries) {
        setSelectedCountries(countries);
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  // Guardar en Firestore cada vez que cambie la selección
  useEffect(() => {
    if (loaded) {
      saveSelectedCountries(selectedCountries);
    }
  }, [selectedCountries, loaded]);

  // Actualizar el estilo de cada país según si está seleccionado o no
  useEffect(() => {
    Object.entries(layersRef.current).forEach(([countryName, layer]) => {
      const el = layer.getElement();
      if (el) {
        el.style.transition = "transform 0.3s ease";
      }
      if (selectedCountries.includes(countryName)) {
        layer.setStyle({
          fillColor: "#00008B",
          fillOpacity: 0.7,
          weight: 1,
          color: "#0000FF",
          dashArray: "",
          opacity: 1,
        });
        if (el) {
          el.style.transform = "translateY(-10px)";
        }
      } else {
        layer.setStyle({
          fillColor: "#3388FF",
          fillOpacity: 0.3,
          weight: 1,
          color: "#0000FF",
          dashArray: "",
          opacity: 1,
        });
        if (el) {
          el.style.transform = "translateY(0)";
        }
      }
    });
  }, [selectedCountries]);

  // Función para cerrar manualmente el drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerCountry(null);
  };

  return (
    <div className="map-page">
      <header className="map-header">
        <div className="user-email">{user && user.email}</div>
        <div className="header-buttons">
          <button onClick={goHome}>Inicio</button>
          <button onClick={logout}>Cerrar Sesión</button>
        </div>
      </header>

      <MapContainer center={[20, 0]} zoom={2} className="leaflet-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON data={countriesData} onEachFeature={onEachCountry} />
      </MapContainer>

      {/* Contenedor de instrucciones debajo del mapa */}
      <div className="map-instructions">
        <div className="instruction">
          <span className="icon">←</span> Click izquierdo: Seleccionar/Deseleccionar país
        </div>
        <div className="instruction">
          <span className="icon">→</span> Click derecho (en país seleccionado): Abrir menú de imágenes
        </div>
      </div>

      {/* Drawer (panel lateral) */}
      <CountryDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        countryName={drawerCountry}
      />
    </div>
  );
};

export default MapPage;
