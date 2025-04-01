import React, { createContext, useContext, useState } from "react";

// 🔒 De context zelf
const AuthContext = createContext<any>(null);

// 🌍 Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);

  // 🔑 Login functie
  const login = (username: string) => setUser(username);

  // 🚪 Logout functie
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✨ Custom hook om auth info op te halen
export const useAuth = () => useContext(AuthContext);
