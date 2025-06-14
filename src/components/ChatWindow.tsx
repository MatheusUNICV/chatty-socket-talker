
import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";
import NamePrompt from "./NamePrompt";
import { io, Socket } from "socket.io-client";

// Utilitário para nome do usuário salvo na session
function getUserName() {
  if (window.sessionStorage.getItem("chatName")) {
    return window.sessionStorage.getItem("chatName")!;
  }
  return null;
}

type WSMessage =
  | {
      type: "message";
      text: string;
      user: string;
      timestamp: string;
    }
  | {
      type: "system";
      text: string;
      user: string;
      timestamp: string;
    };

const SOCKET_HOST = "http://localhost:3001";

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState<string | null>(getUserName());
  const [imTyping, setImTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSetName = (newName: string) => {
    window.sessionStorage.setItem("chatName", newName);
    setName(newName);
  };

  useEffect(() => {
    if (!name) return;

    const socket = io(SOCKET_HOST, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      toast({ title: "Conectado ao chat!" });
      // Envia evento para os outros (exibe apenas para si há pouco sentido, mas padrão para exibição do nick)
      socket.emit("user_joined", { user: name });
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

    socket.on("system", (data: WSMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    // O BACKEND só manda status "typing" para o próprio usuário.
    socket.on("typing", ({ user, isTyping }: { user: string; isTyping: boolean }) => {
      if (user === name) {
        setImTyping(isTyping);
        // "isTyping" volta para false após timeout, controlado no backend
      }
    });

    return () => {
      if (name) socket.emit("user_left", { user: name });
      socket.disconnect();
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, imTyping]);

  // Ao enviar mensagem
  const sendMsg = (text: string) => {
    if (!name || !text.trim()) return;
    const msg: WSMessage = {
      type: "message",
      text,
      user: name,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    };
    socketRef.current?.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
    setImTyping(false);
    // Notifica o backend para parar de exibir "typing"
    socketRef.current?.emit("stop_typing", { user: name });
  };

  // Quando está digitando no input, avisa o backend para ativar "typing"
  const handleTyping = () => {
    if (!name) return;
    if (imTyping) return; // já está ativado
    setImTyping(true);
    socketRef.current?.emit("typing", { user: name, isTyping: true });
    // Backend cuida do timeout de digitar (mas frontend já pode agendar localmente caso queira)
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setImTyping(false);
      socketRef.current?.emit("stop_typing", { user: name });
    }, 2500);
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
            key={idx + m.timestamp}
            fromMe={m.user === name}
            text={m.text}
            user={m.user}
            timestamp={m.timestamp}
            system={m.type === "system"}
          />
        ))}
        {imTyping && (
          <div className="flex justify-end">
            <span className="text-xs text-primary-500">Você está digitando...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMsg} onTyping={handleTyping} disabled={!connected} />
    </div>
  );
};

export default ChatWindow;
