// src/pages/FriendMapPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/MapPage.css";
import "leaflet/dist/leaflet.css";
import { loadUserSelectedCountries } from "../services/firestoreService";
import CountryDrawer from "../components/CountryDrawer";
import countriesData from "../data/countries.geo.json";

const FriendMapPage = () => {
  const navigate = useNavigate();
  const { friendId } = useParams(); // Se obtiene el uid del amigo desde la URL
  const [selectedCountries, setSelectedCountries] = useState([]);
  const layersRef = useRef({});
  const selectedCountriesRef = useRef(selectedCountries);

  // Actualizamos el ref cada vez que cambian los países seleccionados
  useEffect(() => {
    selectedCountriesRef.current = selectedCountries;
  }, [selectedCountries]);

  // Estado del drawer (abierto/cerrado y país mostrado)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCountry, setDrawerCountry] = useState(null);

  // Cargar países seleccionados del amigo usando su uid
  useEffect(() => {
    const loadData = async () => {
      console.log("Cargando países para friendId:", friendId);
      const countries = await loadUserSelectedCountries(friendId);
      console.log("Países cargados:", countries);
      if (countries) {
        setSelectedCountries(countries);
      }
    };
    loadData();
  }, [friendId]);

  // Aplicar el efecto de elevación y estilos según si el país está seleccionado
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

  // Se utiliza el mismo mecanismo que en MapPage: al hacer click derecho en un país
  // seleccionado (elevado), se abre el drawer para mostrar las imágenes.
  const onEachCountry = (feature, layer) => {
    const countryName = feature.properties.name;
    layersRef.current[countryName] = layer;

    layer.on("contextmenu", (e) => {
      if (selectedCountriesRef.current.includes(countryName)) {
        e.originalEvent.preventDefault();
        setDrawerOpen(true);
        setDrawerCountry(countryName);
      }
    });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerCountry(null);
  };

  return (
    <div className="map-page">
      <header className="map-header">
        <div style={{ fontWeight: "bold" }}>Mapa del amigo</div>
        <div className="header-buttons">
          <button onClick={() => navigate("/")}>Inicio</button>
        </div>
      </header>

      <MapContainer center={[20, 0]} zoom={2} className="leaflet-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <GeoJSON data={countriesData} onEachFeature={onEachCountry} />
      </MapContainer>

      <div className="map-instructions">
        <div className="instruction">
          <span className="icon">→</span> Click derecho en país elevado: Abrir menú de imágenes
        </div>
      </div>

      <CountryDrawer
        friendId={friendId}  // Se pasa el uid del amigo
        isOpen={drawerOpen}
        onClose={closeDrawer}
        countryName={drawerCountry}
        readOnly={true}     // Modo solo lectura: no se permite modificar
      />
    </div>
  );
};

export default FriendMapPage;
