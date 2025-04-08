import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { auth, db } from "../auth/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../styles/LoginPage.css";

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar si el correo ha sido verificado
      if (!user.emailVerified) {
        setError("Por favor, verifica tu correo electrónico antes de iniciar sesión.");
        await signOut(auth); // Cerrar sesión si el correo no está verificado
        return;
      }

      // Verificar si el usuario completó el tutorial
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().tutorialCompleted) {
        navigate("/"); // Usuario ya completó el tutorial, ir a la página principal
      } else {
        navigate("/tutorial"); // Usuario nuevo o que aún no completó el tutorial
      }
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Usuario no encontrado");
      } else if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else {
        setError("Error al iniciar sesión");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Enviar correo de verificación
      await sendEmailVerification(user);

      // Inicializar el documento del usuario en Firestore con tutorialCompleted en false
      await setDoc(doc(db, "users", user.uid), {
        tutorialCompleted: false,
        selectedCountries: []
      });

      setSuccessMessage("Registro exitoso, correo de verificación enviado. Por favor, revisa tu correo.");
      setEmail("");
      setPassword("");
      setRepeatPassword("");

      // Redirigir a la vista de login después de 3 segundos
      setTimeout(() => {
        setIsRegister(false);
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("El correo ya está en uso");
      } else if (err.code === "auth/invalid-email") {
        setError("Correo inválido");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es demasiado débil");
      } else {
        setError("Error al registrarse");
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccessMessage("");

    if (!email) {
      setError("Por favor, ingresa tu correo para restablecer la contraseña");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Correo de restablecimiento enviado. Revisa tu bandeja de entrada.");
    } catch (err) {
      setError("Error al enviar el correo de restablecimiento");
    }
  };

  return (
    <div className="login-container">
      {isRegister ? (
        <>
          <h1>Registrarse</h1>
          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Repetir Contraseña"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <button type="submit">Registrarse</button>
          </form>
          <p>
            ¿Ya tienes cuenta?{" "}
            <span className="toggle-form" onClick={() => {
              setIsRegister(false);
              setError("");
              setSuccessMessage("");
            }}>
              Iniciar Sesión
            </span>
          </p>
        </>
      ) : (
        <>
          <h1>Iniciar Sesión</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <button type="submit">Ingresar</button>
          </form>
          <div className="forgot-password" onClick={handleForgotPassword}>
            He olvidado mi contraseña
          </div>
          <p>
            ¿No tienes cuenta?{" "}
            <span className="toggle-form" onClick={() => {
              setIsRegister(true);
              setError("");
              setSuccessMessage("");
            }}>
              Regístrate aquí
            </span>
          </p>
        </>
      )}
    </div>
  );
};

export default LoginPage;
