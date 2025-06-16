
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RoomSelectorProps {
  onJoinRoom: (name: string, room: string) => void;
}

const AVAILABLE_ROOMS = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

const RoomSelector: React.FC<RoomSelectorProps> = ({ onJoinRoom }) => {
  const [name, setName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("geral");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoinRoom(name.trim(), selectedRoom);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-6">
      <div className="text-xl font-semibold mb-2">Entre no ChatZap</div>
      
      <Input
        autoFocus
        value={name}
        maxLength={32}
        placeholder="Digite seu nome"
        onChange={e => setName(e.target.value)}
        className="max-w-xs"
      />
      
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <label className="text-sm font-medium">Escolha uma sala:</label>
        <div className="space-y-2">
          {Object.entries(AVAILABLE_ROOMS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="room"
                value={key}
                checked={selectedRoom === key}
                onChange={() => setSelectedRoom(key)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <Button type="submit" disabled={!name.trim()}>
        Entrar no chat
      </Button>
    </form>
  );
};

export default RoomSelector;
