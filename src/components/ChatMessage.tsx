
import React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  fromMe: boolean;
  text: string;
  user: string;
  timestamp: string;
  system?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ fromMe, text, user, timestamp, system }) => {
  if (system) {
    return (
      <div className="flex items-center justify-center mb-1">
        <div className="rounded px-3 py-1 bg-muted text-xs text-muted-foreground shadow">
          <span className="font-semibold">{user}</span> <span>{text}</span>
          <span className="ml-2 text-[10px] text-gray-400">{timestamp}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex items-end mb-1", fromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-md text-sm shadow",
          fromMe
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <span className="font-semibold mr-2">{user}:</span>
        <span>{text}</span>
        <div className="text-xs text-gray-400 mt-1 text-right">{timestamp}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
