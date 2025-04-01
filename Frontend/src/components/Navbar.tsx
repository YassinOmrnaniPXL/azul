import React from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="w-full p-4 bg-blue-200 flex justify-between items-center">
      <span className="text-lg font-bold">Azul Online</span>
      <button onClick={() => { logout(); navigate("/login"); }} className="bg-red-400 px-4 py-1 rounded text-white">
        Logout
      </button>
    </div>
  );
};

export default Navbar;