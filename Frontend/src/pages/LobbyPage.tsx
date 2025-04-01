// src/pages/LobbyPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const mockTables = ["Table 1", "Table 2", "Table 3"];

const LobbyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Waiting Room</h1>
      <div className="grid gap-4">
        {mockTables.map((table, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded shadow flex justify-between items-center">
            <span>{table}</span>
            <button onClick={() => navigate(`/game/${i}`)} className="bg-blue-400 text-white px-4 py-1 rounded">
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LobbyPage;
