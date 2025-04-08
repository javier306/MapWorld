import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "../auth/firebaseConfig";
import "../styles/Tutorial.css";

const Tutorial = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, username: doc.data().username }));
      setAccounts(users);
    };
    fetchUsers();
  }, []);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const user = auth.currentUser;
      if (user) {
        setLoading(true);
        try {
          await setDoc(doc(db, "users", user.uid), {
            username: username.trim(),
            tutorialCompleted: true
          }, { merge: true });
          navigate("/map"); // Redirige a la página del mapa
        } catch (error) {
          console.error("Error guardando el usuario:", error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleAddFriend = async (friendId) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "friendRequests", `${user.uid}_${friendId}`), {
          from: user.uid,
          to: friendId,
          status: "pending"
        });
        alert("Solicitud enviada");
      } catch (error) {
        console.error("Error al enviar solicitud:", error);
      }
    }
  };

  // Filtrar las cuentas, asegurándose de que username exista antes de hacer toLowerCase()
  const filteredAccounts = accounts.filter(acc =>
    acc.username && acc.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`tutorial-container step-${step}`}>
      {step === 1 && (
        <div className="tutorial-step step1 animate-roll-in">
          <h1>Elige un nombre de usuario</h1>
          <input
            type="text"
            placeholder="Nombre de usuario..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleNext} disabled={!username.trim() || loading}>
            {loading ? "Guardando..." : "Siguiente"}
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="tutorial-step step2 animate-slide-in">
          <h1>Busca a tus amigos</h1>
          <input
            type="text"
            placeholder="Buscar amigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="accounts-list">
            {filteredAccounts.map((acc) => (
              <li key={acc.id}>
                {acc.username} <button onClick={() => handleAddFriend(acc.id)}>Añadir</button>
              </li>
            ))}
          </ul>
          <button onClick={handleNext}>Siguiente</button>
        </div>
      )}
      {step === 3 && (
        <div className="tutorial-step step3 animate-fade-in">
          <h1>Finaliza tu configuración</h1>
          <p>Ya estás listo para explorar la web.</p>
          <button onClick={handleNext} className="go-to-map-button">
            Ir a mi mapa
          </button>
        </div>
      )}
    </div>
  );
};

export default Tutorial;
