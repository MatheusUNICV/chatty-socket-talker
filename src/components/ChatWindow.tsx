
import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";
import NamePrompt from "./NamePrompt";
import { io, Socket } from "socket.io-client";
import { LogOut } from "lucide-react";

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

const SOCKET_HOST = "http://192.168.201.2:3001";

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState<string | null>(getUserName());
  const [typingUser, setTypingUser] = useState<string | null>(null); // Novo estado informando quem está digitando (outro usuário)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSetName = (newName: string) => {
    window.sessionStorage.setItem("chatName", newName);
    setName(newName);
  };

  // Novo handler para sair
  const handleLogout = () => {
    window.sessionStorage.removeItem("chatName");
    setName(null);
    setMessages([]);
    toast({ title: "Você saiu do chat." });
  };

  useEffect(() => {
    if (!name) return;

    const socket = io(SOCKET_HOST, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      toast({ title: "Conectado ao chat!" });
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

    socket.on("typing", ({ user, isTyping }: { user: string; isTyping: boolean }) => {
      // Atualiza typingUser apenas se for outro usuário
      if (user !== name) {
        if (isTyping) {
          setTypingUser(user);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => {
            setTypingUser(null);
          }, 2500);
        } else {
          setTypingUser(null);
        }
      }
    });

    return () => {
      if (name) socket.emit("user_left", { user: name });
      socket.disconnect();
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

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
    // Removido o setMessages aqui para evitar duplicidade
    socketRef.current?.emit("stop_typing", { user: name });
  };

  // Quando está digitando no input
  const handleTyping = () => {
    if (!name) return;
    socketRef.current?.emit("typing", { user: name, isTyping: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
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
    <div className="flex flex-col h-full max-h-[70vh] w-full mx-auto bg-card rounded-lg border shadow overflow-hidden
      md:max-h-[70vh] md:w-[600px]
      sm:max-h-[80dvh] sm:w-full
      ">
      {/* Header com botão de sair */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="font-semibold text-muted-foreground">
          Bem-vindo, <span className="text-primary">{name}</span>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Sair do chat"
          className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors flex items-center gap-1"
        >
          <LogOut size={20} />
          <span className="sr-only">Sair</span>
        </button>
      </div>
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
        {typingUser && (
          <div className="flex justify-end">
            <span className="text-xs text-primary-500">{typingUser} está digitando...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMsg} onTyping={handleTyping} disabled={!connected} />
    </div>
  );
};

export default ChatWindow;
