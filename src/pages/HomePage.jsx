// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../auth/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import axios from "axios";
import "../styles/HomePage.css";

//////////////////////
// HomePage Component
//////////////////////
const HomePage = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [usernameToSend, setUsernameToSend] = useState("");
  const [message, setMessage] = useState(""); // Mensajes generales (fuera del sidebar)
  const [sidebarMessage, setSidebarMessage] = useState(""); // Mensajes específicos del sidebar
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [username, setUsername] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("friends"); // "friends", "send", "received"
  const sidebarRef = useRef(null);

  const goMap = () => {
    navigate("/map");
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Obtener el username del usuario (si user.displayName no está definido, se consulta en Firestore)
  useEffect(() => {
    if (user) {
      if (user.displayName) {
        setUsername(user.displayName);
      } else {
        const fetchUsername = async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().username) {
              setUsername(userDoc.data().username);
            } else {
              console.warn("No se encontró username en Firestore para este usuario");
            }
          } catch (error) {
            console.error("Error al obtener el username:", error);
          }
        };
        fetchUsername();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && username) {
      fetchFriendRequests();
      fetchFriends();
    }
  }, [user, username]);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(
        `https://backbend-server.onrender.com/api/get-friend-requests?username=${username}`
      );
      console.log("Solicitudes recibidas:", response.data.requests);
      setFriendRequests(response.data.requests || []);
    } catch (error) {
      console.error("Error al obtener solicitudes", error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(
        `https://backbend-server.onrender.com/api/get-friends?username=${username}`
      );
      console.log("Amigos recibidos:", response.data.friends);
      const friendsData = response.data.friends || [];
      // Para cada amigo, obtenemos su foto de perfil de Firebase usando su uid
      const friendsWithProfiles = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            const friendDoc = await getDoc(doc(db, "users", friend.id));
            if (friendDoc.exists() && friendDoc.data().profilePicture) {
              return { ...friend, profilePicture: friendDoc.data().profilePicture };
            }
          } catch (error) {
            console.error("Error al obtener perfil del amigo con id:", friend.id, error);
          }
          return friend;
        })
      );
      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error("Error al obtener amigos", error);
    }
  };

  const handleSendRequest = async () => {
    try {
      const response = await axios.post(
        "https://backbend-server.onrender.com/api/send-friend-request",
        {
          senderId: user.uid,
          receiverUsername: usernameToSend,
        }
      );
      setSidebarMessage(response.data.message);
      console.log("Solicitud enviada:", response.data.message);
    } catch (error) {
      setSidebarMessage(error.response?.data.message || "Error al enviar la solicitud");
      console.error("Error al enviar solicitud", error);
    }
  };

  const handleAcceptRequest = async (senderUsername, requestId) => {
    try {
      const response = await axios.post(
        "https://backbend-server.onrender.com/api/handle-friend-request",
        {
          requestId: requestId,
          action: "accept",
        }
      );
      setSidebarMessage(response.data.message);
      console.log("Solicitud aceptada:", response.data.message);
      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      setSidebarMessage(error.response?.data.message || "Error al aceptar la solicitud");
      console.error("Error al aceptar solicitud", error);
    }
  };

  const handleRejectRequest = async (senderUsername, requestId) => {
    try {
      const response = await axios.post(
        "https://backbend-server.onrender.com/api/handle-friend-request",
        {
          requestId: requestId,
          action: "reject",
        }
      );
      setSidebarMessage(response.data.message);
      console.log("Solicitud rechazada:", response.data.message);
      fetchFriendRequests();
    } catch (error) {
      setSidebarMessage(error.response?.data.message || "Error al rechazar la solicitud");
      console.error("Error al rechazar solicitud", error);
    }
  };

  // Cerrar sidebar si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error al cargar perfil en HomePage:", error);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="home-page">
      <header className="home-header">
        {/* Cabecera con icono de perfil y nombre */}
        <div className="profile-link" onClick={() => navigate("/profile")}>
          <img
            src={profile?.profilePicture || "/default-profile.png"}
            alt="Profile"
            className="profile-icon"
          />
          <span>{username || (user && user.email)}</span>
        </div>
        <div className="header-buttons">
          <button onClick={goMap}>Mapa</button>
          <button onClick={logout}>Cerrar Sesión</button>
          <button
            className="sidebar-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
          >
            Amigos
          </button>
        </div>
      </header>

      {/* Sidebar lateral */}
      <div ref={sidebarRef} className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-tabs">
          <button className={activeTab === "friends" ? "active" : ""} onClick={() => setActiveTab("friends")}>
            Amigos
          </button>
          <button className={activeTab === "send" ? "active" : ""} onClick={() => setActiveTab("send")}>
            Enviar Solicitud
          </button>
          <button className={activeTab === "received" ? "active" : ""} onClick={() => setActiveTab("received")}>
            Solicitudes Recibidas
          </button>
        </div>
        <div className="sidebar-content">
          {sidebarMessage && <p className="sidebar-message">{sidebarMessage}</p>}
          {activeTab === "friends" && (
            <div>
              <h3>Mis Amigos</h3>
              <ul>
                {friends.length > 0 ? (
                  friends.map((friend, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <img
                        src={friend.profilePicture || "/default-profile.png"}
                        alt="Friend"
                        className="friend-icon"
                      />
                      <span style={{ flex: 1, color: "#3a6073", fontWeight: "bold" }}>{friend.username}</span>
                      <button
                        onClick={() => navigate(`/friend-map/${friend.id}`)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#3a6073",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Ver Mapa
                      </button>
                    </li>
                  ))
                ) : (
                  <p>No tienes amigos aún.</p>
                )}
              </ul>
            </div>
          )}
          {activeTab === "send" && (
            <div>
              <h3>Enviar Solicitud</h3>
              <input
                type="text"
                placeholder="Nombre de usuario del amigo"
                value={usernameToSend}
                onChange={(e) => setUsernameToSend(e.target.value)}
              />
              <button onClick={handleSendRequest}>Enviar solicitud</button>
            </div>
          )}
          {activeTab === "received" && (
            <div>
              <h3>Solicitudes Recibidas</h3>
              <ul>
                {friendRequests.length > 0 ? (
                  friendRequests.map((request, index) => (
                    <li key={index}>
                      {request.senderUsername}{" "}
                      <button onClick={() => handleAcceptRequest(request.senderUsername, request.id)}>
                        Aceptar
                      </button>
                      <button onClick={() => handleRejectRequest(request.senderUsername, request.id)}>
                        Rechazar
                      </button>
                    </li>
                  ))
                ) : (
                  <p>No tienes solicitudes pendientes.</p>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="home-content animated-box">
        <h1>Bienvenido a la Red Social de Viajeros</h1>
        <p>
          Explora, comparte y viaja por el mundo. Descubre nuevas culturas y conecta con viajeros de todo el mundo.
        </p>
        {message && <p>{message}</p>}
        <div className="map-container">
          {/* Aquí irá el mapa con Leaflet */}
        </div>
      </div>
    </div>
  );
};

//////////////////////
// ProfilePage Component
//////////////////////
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

  // Sección para obtener el ranking de amigos basado en la cantidad de países visitados.
  // Se consulta el documento de cada amigo (a través de su uid) y se obtiene la cantidad de países de la propiedad "selectedCountries"
  useEffect(() => {
    const fetchRanking = async () => {
      if (!profile || !profile.friends) return;
      try {
        const rankingData = await Promise.all(
          profile.friends.map(async (friendUid) => {
            try {
              const friendDoc = await getDoc(doc(db, "users", friendUid));
              if (friendDoc.exists()) {
                const friendData = friendDoc.data();
                return {
                  uid: friendUid,
                  username: friendData.username || "Sin nombre",
                  selectedCount: friendData.selectedCountries ? friendData.selectedCountries.length : 0,
                };
              }
              return { uid: friendUid, username: "Sin datos", selectedCount: 0 };
            } catch (error) {
              console.error("Error al obtener datos del amigo:", friendUid, error);
              return { uid: friendUid, username: "Error", selectedCount: 0 };
            }
          })
        );
        // Ordenar de mayor a menor cantidad de países seleccionados
        rankingData.sort((a, b) => b.selectedCount - a.selectedCount);
        setRanking(rankingData);
      } catch (error) {
        console.error("Error al obtener ranking de amigos:", error);
      }
    };

    fetchRanking();
  }, [profile]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const cloudName = "dwq7tkjng";
    const uploadPreset = "perfil_usuarios"; // Preset configurado en Cloudinary para perfiles
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
          <div className="profile-picture-wrapper" onClick={() => fileInputRef.current.click()}>
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
        {/* Ranking de amigos basado en países seleccionados */}
        <div className="ranking-container">
          <h3>Ranking de países visitados</h3>
          <ul>
            {ranking.map((friend) => (
              <li key={friend.uid}>
                <span className="friend-name">{friend.username}</span>
                <span className="visited-count">{friend.selectedCount}</span>
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

//////////////////////
// AppRoutes Component
//////////////////////
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<></>} /> {/* Tu LoginPage */}
      <Route path="/tutorial" element={<></>} /> {/* Tu Tutorial */}
      <Route path="/map" element={<></>} />       {/* Tu MapPage */}
      <Route path="/friend-map/:friendId" element={<></>} /> {/* Tu FriendMapPage */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes;
