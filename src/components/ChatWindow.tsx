
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
  const [typingUsers, setTypingUsers] = useState<string[]>([]); // Lista de pessoas digitando (exceto eu)
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSetName = (newName: string) => {
    window.sessionStorage.setItem("chatName", newName);
    setName(newName);
  };

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
      // Se for mensagem de entrada ("entrou na sala") do próprio usuário, ignora
      if (
        data.type === "system" &&
        data.text === "entrou na sala." &&
        data.user === name
      ) {
        return;
      }
      setMessages((prev) => [...prev, data]);
    });

    socket.on(
      "typing",
      ({ user, isTyping }: { user: string; isTyping: boolean }) => {
        if (!user || user === name) return; // Não conta eu mesmo!
        setTypingUsers((prev) => {
          if (isTyping) {
            if (!prev.includes(user)) return [...prev, user];
            return prev;
          } else {
            return prev.filter((u) => u !== user);
          }
        });

        // Limpa timeout antigo e inicia novo, para cada usuário separadamente
        if (isTyping) {
          if (typingTimeouts.current[user])
            clearTimeout(typingTimeouts.current[user]);
          typingTimeouts.current[user] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== user));
            delete typingTimeouts.current[user];
          }, 2500);
        } else {
          if (typingTimeouts.current[user]) {
            clearTimeout(typingTimeouts.current[user]);
            delete typingTimeouts.current[user];
          }
        }
      }
    );

    return () => {
      if (name) socket.emit("user_left", { user: name });
      socket.disconnect();
      // Limpa timeouts quando sair
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
      setTypingUsers([]);
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMsg = (text: string) => {
    if (!name || !text.trim()) return;
    const msg: WSMessage = {
      type: "message",
      text,
      user: name,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    };
    socketRef.current?.emit("message", msg);
    socketRef.current?.emit("stop_typing", { user: name });
  };

  const handleTyping = () => {
    if (!name) return;
    socketRef.current?.emit("typing", { user: name, isTyping: true });
    if (typingTimeouts.current[name]) clearTimeout(typingTimeouts.current[name]);
    typingTimeouts.current[name] = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { user: name });
      clearTimeout(typingTimeouts.current[name]);
      delete typingTimeouts.current[name];
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
        {typingUsers.length > 0 && (
          <div className="flex justify-end">
            {typingUsers.length === 1 ? (
              <span className="text-xs text-primary-500">{typingUsers[0]} está digitando...</span>
            ) : (
              <span className="text-xs text-primary-500">tem várias pessoas digitando...</span>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMsg} onTyping={handleTyping} disabled={!connected} />
    </div>
  );
};

export default ChatWindow;

