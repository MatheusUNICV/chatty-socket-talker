
import React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  fromMe: boolean;
  text: string;
  timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ fromMe, text, timestamp }) => (
  <div
    className={cn(
      "flex items-end mb-1",
      fromMe ? "justify-end" : "justify-start"
    )}
  >
    <div
      className={cn(
        "rounded-lg px-4 py-2 max-w-md text-sm shadow",
        fromMe
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground"
      )}
    >
      <span>{text}</span>
      <div className="text-xs text-gray-400 mt-1 text-right">{timestamp}</div>
    </div>
  </div>
);

export default ChatMessage;
