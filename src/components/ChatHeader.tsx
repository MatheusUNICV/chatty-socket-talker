
import React from "react";
import { LogOut, Users } from "lucide-react";

interface ChatHeaderProps {
  currentRoom: string;
  name: string;
  onLogout: () => void;
}

const ROOM_NAMES = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ currentRoom, name, onLogout }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-primary" />
        <div className="font-semibold text-sm">
          <span className="text-primary">{ROOM_NAMES[currentRoom as keyof typeof ROOM_NAMES]}</span>
          <div className="text-xs text-muted-foreground">{name}</div>
        </div>
      </div>
      <button
        onClick={onLogout}
        aria-label="Sair do chat"
        className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors flex items-center gap-1"
      >
        <LogOut size={20} />
        <span className="sr-only">Sair</span>
      </button>
    </div>
  );
};

export default ChatHeader;
