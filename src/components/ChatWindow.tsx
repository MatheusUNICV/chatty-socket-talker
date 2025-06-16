import React, { useState } from "react";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import { toast } from "@/hooks/use-toast";
import RoomSelector from "./RoomSelector";
import { useWebSocket } from "@/hooks/useWebSocket";

// Utilitário para dados salvos na session
function getUserData() {
  const name = window.sessionStorage.getItem("chatName");
  const room = window.sessionStorage.getItem("chatRoom");
  return { name, room };
}

const ChatWindow: React.FC = () => {
  const { name: savedName, room: savedRoom } = getUserData();
  const [name, setName] = useState<string | null>(savedName);
  const [currentRoom, setCurrentRoom] = useState<string | null>(savedRoom);

  const {
    messages,
    connected,
    typingUsers,
    sendMessage,
    handleTyping,
    setMessages
  } = useWebSocket({ name, currentRoom });

  const handleJoinRoom = (newName: string, room: string) => {
    window.sessionStorage.setItem("chatName", newName);
    window.sessionStorage.setItem("chatRoom", room);
    setName(newName);
    setCurrentRoom(room);
  };

  const handleLogout = () => {
    // Remove apenas a sala, mantém o nome
    window.sessionStorage.removeItem("chatRoom");
    setCurrentRoom(null);
    setMessages([]);
    toast({ title: "Você saiu do chat." });
  };

  if (!name || !currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-card rounded-lg border shadow w-full md:w-[600px] mx-auto mt-8">
        <RoomSelector onJoinRoom={handleJoinRoom} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh] w-full mx-auto bg-card rounded-lg border shadow overflow-hidden
      md:max-h-[70vh] md:w-[600px]
      sm:max-h-[80dvh] sm:w-full
      ">
      <ChatHeader 
        currentRoom={currentRoom} 
        name={name} 
        onLogout={handleLogout} 
      />
      
      <ChatMessages 
        messages={messages}
        currentRoom={currentRoom}
        name={name}
        typingUsers={typingUsers}
      />
      
      <ChatInput 
        onSend={sendMessage} 
        onTyping={handleTyping} 
        disabled={!connected} 
      />
    </div>
  );
};

export default ChatWindow;
