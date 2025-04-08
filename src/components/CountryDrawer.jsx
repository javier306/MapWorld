import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../auth/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import axios from "axios";
import "../styles/CountryDrawer.css";

const MAX_IMAGES = 5;

const CountryDrawer = ({ isOpen, onClose, countryName, readOnly = false, friendId }) => {
  const [user] = useAuthState(auth);
  const [imageURLs, setImageURLs] = useState([]);
  const fileInputRef = useRef(null);

  // Si readOnly es true, usamos friendId; de lo contrario, el uid del usuario actual.
  const effectiveUserId = readOnly ? friendId : user?.uid;

  // Cargar imágenes existentes de Firestore usando effectiveUserId
  useEffect(() => {
    const fetchImages = async () => {
      if (!countryName || !effectiveUserId) return;
      try {
        const docRef = doc(db, "users", effectiveUserId, "countries", countryName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Imágenes obtenidas de Firestore:", data.images);
          setImageURLs(data.images || []);
        } else {
          console.log("No se encontró documento en Firestore, inicializando con array vacío");
          setImageURLs([]);
        }
      } catch (error) {
        console.error("Error al cargar imágenes desde Firestore:", error);
      }
    };
    fetchImages();
  }, [countryName, effectiveUserId]);

  // Función para subir imagen (solo en modo edición)
  const handleFileChange = async (e) => {
    if (readOnly || !user || !countryName) return;
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = "dwq7tkjng";
    const uploadPreset = "imagenes_paises_usuarios";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      const downloadURL = response.data.secure_url;
      const publicId = response.data.public_id;
      console.log("Imagen subida a Cloudinary. URL:", downloadURL);

      const newImages = [...imageURLs, { url: downloadURL, public_id: publicId }].slice(0, MAX_IMAGES);
      console.log("Nuevo array de imágenes que se guardará en Firestore:", newImages);

      // En modo edición se guarda usando el uid del usuario actual
      const docRef = doc(db, "users", user.uid, "countries", countryName);
      await setDoc(docRef, { images: newImages }, { merge: true });
      console.log("URL guardada en Firestore con éxito");
      setImageURLs(newImages);
    } catch (error) {
      console.error("Error al subir imagen a Cloudinary o guardar la URL en Firestore:", error);
      alert("Error al subir la imagen");
    }
  };

  // Al hacer clic en un recuadro vacío, se abre el explorador de archivos (solo si no es readOnly)
  const handleSlotClick = (index) => {
    if (readOnly) return;
    if (!imageURLs[index] || imageURLs.length < MAX_IMAGES) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // Función para borrar imagen (solo si no es readOnly)
  const handleDelete = async (index) => {
    if (readOnly || !user || !countryName) return;
    const imageToDelete = imageURLs[index];
    const publicId = imageToDelete.public_id;
    console.log("Intentando borrar la imagen con public_id:", publicId);
    try {
      await axios.post("http://localhost:3000/api/delete-image", { public_id: publicId });
      const newImages = imageURLs.filter((_, i) => i !== index);
      const docRef = doc(db, "users", user.uid, "countries", countryName);
      await setDoc(docRef, { images: newImages }, { merge: true });
      console.log("Imagen borrada de Firestore. Nuevo array:", newImages);
      setImageURLs(newImages);
    } catch (error) {
      console.error("Error al borrar imagen:", error);
      alert("Error al borrar la imagen");
    }
  };

  return (
    <div className={`drawer ${isOpen ? "open" : ""}`}>
      <div className="drawer-header">
        <h2>{countryName}</h2>
        <button onClick={onClose}>X</button>
      </div>
      <div className="drawer-content">
        {readOnly ? (
          <p>Visualización de imágenes (modo solo lectura)</p>
        ) : (
          <p>Sube hasta 5 imágenes en este país:</p>
        )}
        {/* Se muestra el input de archivos solo en modo edición */}
        {!readOnly && (
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        )}
        <div className="image-slots">
          {Array.from({ length: MAX_IMAGES }).map((_, index) => (
            <div
              key={index}
              className="image-slot"
              onClick={() => handleSlotClick(index)}
            >
              {imageURLs[index] ? (
                <div className="image-wrapper">
                  <img src={imageURLs[index].url} alt={`slot-${index}`} />
                  {/* Se muestra el botón de borrar solo en modo edición */}
                  {!readOnly && (
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(index);
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ) : (
                <div className="empty-slot">
                  {!readOnly && <span>+</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountryDrawer;
