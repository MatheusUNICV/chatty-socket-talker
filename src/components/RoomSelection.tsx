
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
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {Object.entries(AVAILABLE_ROOMS).map(([key, label]) => (
          <label 
            key={key} 
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent/50 ${
              selectedRoom === key 
                ? 'border-primary bg-primary/10' 
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              selectedRoom === key 
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground'
            }`}>
              {selectedRoom === key && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
              )}
            </div>
            <input
              type="radio"
              name="room"
              value={key}
              checked={selectedRoom === key}
              onChange={() => setSelectedRoom(key)}
              className="sr-only"
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>
      
      <Button type="submit" className="mt-2">
        Entrar no chat
      </Button>
    </form>
  );
};

export default RoomSelection;
