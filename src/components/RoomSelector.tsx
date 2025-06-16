
import React, { useState } from "react";
import NamePrompt from "./NamePrompt";
import RoomSelection from "./RoomSelection";

interface RoomSelectorProps {
  onJoinRoom: (name: string, room: string) => void;
}

const RoomSelector: React.FC<RoomSelectorProps> = ({ onJoinRoom }) => {
  const [step, setStep] = useState<'name' | 'room'>('name');
  const [name, setName] = useState("");

  const handleNameSubmit = (enteredName: string) => {
    setName(enteredName);
    setStep('room');
  };

  const handleRoomSelect = (room: string) => {
    onJoinRoom(name, room);
  };

  const handleBack = () => {
    setStep('name');
  };

  if (step === 'name') {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  return <RoomSelection name={name} onSelectRoom={handleRoomSelect} onBack={handleBack} />;
};

export default RoomSelector;
