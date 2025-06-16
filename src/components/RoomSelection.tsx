
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface RoomSelectionProps {
  name: string;
  onSelectRoom: (room: string) => void;
  onBack: () => void;
}

const AVAILABLE_ROOMS = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

const RoomSelection: React.FC<RoomSelectionProps> = ({ name, onSelectRoom, onBack }) => {
  const [selectedRoom, setSelectedRoom] = useState("geral");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectRoom(selectedRoom);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-6">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-xl font-semibold">Olá, {name}! Escolha uma sala:</div>
      </div>
      
      <div className="flex flex-col gap-2 w-full max-w-xs">
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
      
      <Button type="submit">
        Entrar no chat
      </Button>
    </form>
  );
};

export default RoomSelection;
