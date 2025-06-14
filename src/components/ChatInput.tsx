
import React, { useState } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (msg: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState("");

  const sendMessage = () => {
    if (value.trim()) {
      onSend(value);
      setValue("");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex w-full gap-2 items-center py-3 px-2 bg-card border-t">
      <textarea
        className="flex-1 resize-none rounded-md p-2 border focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] max-h-[80px] text-sm"
        placeholder="Digite sua mensagem..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
      />
      <button
        aria-label="Enviar"
        disabled={disabled || !value.trim()}
        className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
        onClick={sendMessage}
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default ChatInput;
