
import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";
import NamePrompt from "./NamePrompt";
import { io, Socket } from "socket.io-client";

function getUserName() {
  if (window.sessionStorage.getItem("chatName")) {
    return window.sessionStorage.getItem("chatName")!;
  }
  return null;
}

interface WSMessage {
  text: string;
  user: string;
  timestamp: string;
}

const SOCKET_HOST = "http://localhost:3001";

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState<string | null>(getUserName());
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSetName = (newName: string) => {
    window.sessionStorage.setItem("chatName", newName);
    setName(newName);
  };

  useEffect(() => {
    if (!name) return; // conecta só após definir nome

    const socket = io(SOCKET_HOST, { transports: ["websocket"] });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      toast({ title: "Conectado ao chat!" });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      toast({ title: "Desconectado do chat", description: "Reconectando..." });
    });

    socket.on("connect_error", () => {
      toast({ title: "Erro de conexão", description: "Verifique o backend!" });
    });

    socket.on("message", (data: WSMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = (text: string) => {
    if (!name) return;
    const msg: WSMessage = {
      text,
      user: name,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    };
    socketRef.current?.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
  };

  if (!name) {
    return (
      <div className="flex flex-col items-center justify-center h-[320px] bg-card rounded-lg border shadow w-full md:w-[600px] mx-auto mt-8">
        <NamePrompt onSubmit={handleSetName} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh] md:max-h-[70vh] w-full md:w-[600px] mx-auto bg-card rounded-lg border shadow overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        {messages.length === 0 && (
          <div className="text-muted-foreground text-center mt-14">Nenhuma mensagem ainda. Diga oi!</div>
        )}
        {messages.map((m, idx) => (
          <ChatMessage
            key={idx}
            fromMe={m.user === name}
            text={m.text}
            timestamp={m.timestamp}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMsg} disabled={!connected} />
    </div>
  );
};

export default ChatWindow;
