// src/pages/ProfilePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../auth/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from "axios";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ranking, setRanking] = useState([]);
  const fileInputRef = useRef(null);
  const effectiveUid = user?.uid;

  useEffect(() => {
    if (!effectiveUid) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", effectiveUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
      }
    };
    fetchProfile();
  }, [effectiveUid]);

  // Se obtiene el ranking consultando tanto al usuario actual como a cada uno de sus amigos (profile.friends)
  // y extrayendo la cantidad de países visitados (propiedad "selectedCountries")
  useEffect(() => {
    const fetchRanking = async () => {
      if (!profile) return;
      try {
        // Incluir el uid del usuario actual y de sus amigos (profile.friends es un arreglo de uids)
        const allUids = [effectiveUid, ...(profile.friends || [])];
        const rankingData = await Promise.all(
          allUids.map(async (uid) => {
            try {
              const docSnap = await getDoc(doc(db, "users", uid));
              if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                  uid,
                  username: data.username || "Sin nombre",
                  selectedCount: data.selectedCountries ? data.selectedCountries.length : 0,
                };
              }
              return { uid, username: "Sin datos", selectedCount: 0 };
            } catch (error) {
              console.error("Error al obtener datos del usuario:", uid, error);
              return { uid, username: "Error", selectedCount: 0 };
            }
          })
        );
        // Ordenar de mayor a menor según la cantidad de países visitados
        rankingData.sort((a, b) => b.selectedCount - a.selectedCount);
        setRanking(rankingData);
      } catch (error) {
        console.error("Error al obtener ranking de usuarios:", error);
      }
    };

    fetchRanking();
  }, [profile, effectiveUid]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const cloudName = "dwq7tkjng";
    const uploadPreset = "perfil_usuarios"; // Asegúrate de tener este preset en Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      const downloadURL = response.data.secure_url;
      await setDoc(doc(db, "users", effectiveUid), { profilePicture: downloadURL }, { merge: true });
      setProfile((prev) => ({ ...prev, profilePicture: downloadURL }));
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  if (!profile)
    return <div className="profile-loading">Cargando perfil...</div>;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <h1>Perfil</h1>
      </header>
      <div className="profile-container">
        <div className="profile-info">
          <div
            className="profile-picture-wrapper"
            onClick={() => { if(fileInputRef.current) fileInputRef.current.click(); }}
          >
            <img
              className="profile-picture"
              src={profile.profilePicture || "/default-profile.png"}
              alt="Profile"
            />
            {uploading && <div className="upload-overlay">Subiendo...</div>}
          </div>
          <div className="profile-details">
            <h2 className="profile-username">{profile.username}</h2>
            <p className="friend-count">{profile.friends ? profile.friends.length : 0} amigos</p>
          </div>
        </div>
        {/* Ranking de usuario y amigos según la cantidad de países visitados */}
        <div className="ranking-container">
          <h3>Ranking de países visitados</h3>
          <ul>
            {ranking.map((item) => (
              <li key={item.uid}>
                <span className="friend-name">
                  {item.uid === effectiveUid ? <strong>Yo</strong> : item.username}
                </span>
                <span className="visited-count">{item.selectedCount}</span>
              </li>
            ))}
          </ul>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
