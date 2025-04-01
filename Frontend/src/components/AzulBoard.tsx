import React from "react";
import { motion } from "framer-motion";
import tileBlue from "../assets/tiles/blue.png";
import tileRed from "../assets/tiles/red.png";
import tileYellow from "../assets/tiles/yellow.png";
import tileBlack from "../assets/tiles/black.png";
import tileCyan from "../assets/tiles/cyan.png";

const TILE_TEXTURES = [tileBlue, tileRed, tileBlack, tileCyan, tileYellow];

const AzulBoard = () => {
  return (
    <div className="p-4 grid gap-4 grid-cols-3">
      {/* Scoreboard */}
      <div className="col-span-3 p-2 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">Scoreboard</h2>
        <div className="grid grid-cols-20 gap-1">
          {Array.from({ length: 101 }, (_, score) => (
            <div
              key={score}
              className={`h-6 w-6 text-xs flex items-center justify-center rounded ${
                score % 5 === 0 ? "bg-orange-300" : "bg-white border"
              }`}
            >
              {score % 5 === 0 ? score : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Player board */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Player Board</h2>
        <div className="grid grid-cols-2 gap-2">
          {/* Left side - pattern lines */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }, (_, row) => (
              <div key={row} className="flex gap-1">
                {Array.from({ length: row + 1 }, (_, col) => (
                  <TileSlot key={col} />
                ))}
              </div>
            ))}
          </div>

          {/* Right side - wall */}
          <div className="grid grid-cols-5 gap-1">
            {TILE_TEXTURES.map((_, rowIdx) =>
              TILE_TEXTURES.map((texture, colIdx) => (
                <Tile key={`${rowIdx}-${colIdx}`} image={TILE_TEXTURES[(colIdx + rowIdx) % 5]} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floor line */}
      <div className="col-span-3 p-2 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Floor Line</h2>
        <div className="flex gap-1">
          {["-1", "-1", "-2", "-2", "-2", "-3", "-3"]?.map((val, i) => (
            <TileSlot key={i} label={val} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Tile = ({ image }: { image: string }) => (
  <motion.div
    className="w-10 h-10 rounded shadow border bg-white overflow-hidden"
    whileHover={{ scale: 1.1 }}
  >
    <img src={image} alt="tile" className="object-cover w-full h-full" />
  </motion.div>
);

const TileSlot = ({ label }: { label?: string }) => (
  <div className="w-10 h-10 rounded border-2 border-dashed border-gray-400 flex items-center justify-center text-xs">
    {label || ""}
  </div>
);

export default AzulBoard;

