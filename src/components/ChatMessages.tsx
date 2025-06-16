
import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

type WSMessage = {
  type: "message" | "system";
  text: string;
  user: string;
  timestamp: string;
  room: string;
};

interface ChatMessagesProps {
  messages: WSMessage[];
  currentRoom: string;
  name: string;
  typingUsers: string[];
}

const ROOM_NAMES = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  currentRoom, 
  name, 
  typingUsers 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-background">
      {messages.length === 0 && (
        <div className="text-muted-foreground text-center mt-14">
          Bem-vindo à {ROOM_NAMES[currentRoom as keyof typeof ROOM_NAMES]}! Diga oi! 👋
        </div>
      )}
      {messages.map((m, idx) => (
        <ChatMessage
          key={idx + m.timestamp}
          fromMe={m.user === name}
          text={m.text}
          user={m.user}
          timestamp={m.timestamp}
          system={m.type === "system"}
        />
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
