
import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";
import RoomSelector from "./RoomSelector";
import { io, Socket } from "socket.io-client";
import { LogOut, Users } from "lucide-react";

// Utilitário para dados salvos na session
function getUserData() {
  const name = window.sessionStorage.getItem("chatName");
  const room = window.sessionStorage.getItem("chatRoom");
  return { name, room };
}

const ROOM_NAMES = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

type WSMessage =
  | {
      type: "message";
      text: string;
      user: string;
      timestamp: string;
      room: string;
    }
  | {
      type: "system";
      text: string;
      user: string;
      timestamp: string;
      room: string;
    };

const SOCKET_HOST = "http://192.168.201.2:3001";

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const { name: savedName, room: savedRoom } = getUserData();
  const [name, setName] = useState<string | null>(savedName);
  const [currentRoom, setCurrentRoom] = useState<string | null>(savedRoom);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleJoinRoom = (newName: string, room: string) => {
    window.sessionStorage.setItem("chatName", newName);
    window.sessionStorage.setItem("chatRoom", room);
    setName(newName);
    setCurrentRoom(room);
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem("chatName");
    window.sessionStorage.removeItem("chatRoom");
    setName(null);
    setCurrentRoom(null);
    setMessages([]);
    toast({ title: "Você saiu do chat." });
  };

  useEffect(() => {
    if (!name || !currentRoom) return;

    const socket = io(SOCKET_HOST, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      toast({ title: `Conectado à ${ROOM_NAMES[currentRoom as keyof typeof ROOM_NAMES]}!` });
      socket.emit("join_room", { user: name, room: currentRoom });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      toast({ title: "Desconectado do chat", description: "Reconectando..." });
    });

    socket.on("connect_error", () => {
      toast({ title: "Erro de conexão", description: "Verifique o backend!" });
    });

    socket.on("message", (data: WSMessage) => {
      // Só adiciona mensagens da sala atual
      if (data.room === currentRoom) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on("system", (data: WSMessage) => {
      // Só adiciona mensagens da sala atual e ignora própria entrada
      if (data.room === currentRoom && !(data.type === "system" && data.text === "entrou na sala." && data.user === name)) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on(
      "typing",
      ({ user, isTyping }: { user: string; isTyping: boolean }) => {
        if (!user || user === name) return;
        setTypingUsers((prev) => {
          if (isTyping) {
            if (!prev.includes(user)) return [...prev, user];
            return prev;
          } else {
            return prev.filter((u) => u !== user);
          }
        });

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
      if (name && currentRoom) socket.emit("user_left", { user: name, room: currentRoom });
      socket.disconnect();
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
      setTypingUsers([]);
    };
  }, [name, currentRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const sendMsg = (text: string) => {
    if (!name || !text.trim() || !currentRoom) return;
    const msg: WSMessage = {
      type: "message",
      text,
      user: name,
      room: currentRoom,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    };
    socketRef.current?.emit("message", msg);
    socketRef.current?.emit("stop_typing", { user: name, room: currentRoom });
  };

  const handleTyping = () => {
    if (!name || !currentRoom) return;
    socketRef.current?.emit("typing", { user: name, isTyping: true, room: currentRoom });
    if (typingTimeouts.current[name]) clearTimeout(typingTimeouts.current[name]);
    typingTimeouts.current[name] = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { user: name, room: currentRoom });
      clearTimeout(typingTimeouts.current[name]);
      delete typingTimeouts.current[name];
    }, 2500);
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
      {/* Header com informações da sala */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <div className="font-semibold text-sm">
            <span className="text-primary">{ROOM_NAMES[currentRoom as keyof typeof ROOM_NAMES]}</span>
            <div className="text-xs text-muted-foreground">{name}</div>
          </div>
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
        {typingUsers.length > 0 && (
          <div className="flex justify-end">
            {typingUsers.length === 1 ? (
              <span className="text-xs text-primary-500">{typingUsers[0]} está digitando...</span>
            ) : (
              <span className="text-xs text-primary-500">várias pessoas estão digitando...</span>
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
