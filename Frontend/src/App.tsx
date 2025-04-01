// App.tsx
import  { JSX } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Navbar from "./components/Navbar";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
          <Route path="/game/:id" element={<PrivateRoute><GamePage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
