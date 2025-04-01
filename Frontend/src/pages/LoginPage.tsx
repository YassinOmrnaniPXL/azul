import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (username && password) {
      login(username); // placeholder logic
      navigate("/lobby");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-800 to-purple-900 text-white font-sans">
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 sm:px-6 lg:px-8">
        <img src="/assets/logo.png" alt="Azul Logo" className="w-40 mb-6 drop-shadow-xl" />
        <h2 className="text-3xl font-extrabold text-yellow-200 mb-2">
          {isRegistering ? "Maak een account aan" : "Log in bij Azul 🎨"}
        </h2>
        <p className="mb-4 text-blue-200">
          {isRegistering ? "Speel met anderen in kleurrijke stijl!" : "Welkom terug! Tijd om te tegelzen 🧩"}
        </p>
        <div className="bg-white bg-opacity-10 p-6 rounded-lg shadow-xl w-full max-w-md">
          <input
            type="text"
            placeholder="Gebruikersnaam"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-white bg-opacity-20 placeholder-white text-white focus:outline-none"
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-white bg-opacity-20 placeholder-white text-white focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded"
          >
            {isRegistering ? "Registreer" : "Log in"}
          </button>
          <p className="mt-4 text-sm text-center">
            {isRegistering ? "Heb je al een account?" : "Nog geen account?"}
            <button
              className="ml-1 text-blue-300 underline hover:text-white"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Log in" : "Registreer"}
            </button>
          </p>
        </div>
      </div>

      {/* Scrollbare uitleg */}
      <div className="bg-opacity-10 text-center px-6 py-12 backdrop-blur-md">
        <h3 className="text-2xl text-white font-bold mb-4">Hoe werkt Azul? 🤔</h3>
        <div className="max-w-3xl mx-auto space-y-6 text-blue-200">
          <p>🧱 Verzamel gekleurde tegels uit fabrieken</p>
          <p>🧩 Plaats ze slim in je patroonlijnen</p>
          <p>🏆 Scoor punten voor rijen, kolommen en kleuren</p>
          <p>🚫 Maar pas op! Te veel tegels? Strafpunten 😵</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;