
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "@/hooks/use-toast";

type WSMessage = {
  type: "message" | "system";
  text: string;
  user: string;
  timestamp: string;
  room: string;
};

const ROOM_NAMES = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

const SOCKET_HOST = "http://192.168.201.2:3001";

interface UseWebSocketProps {
  name: string | null;
  currentRoom: string | null;
}

export const useWebSocket = ({ name, currentRoom }: UseWebSocketProps) => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const socketRef = useRef<Socket | null>(null);

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
      if (data.room === currentRoom) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on("system", (data: WSMessage) => {
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

  const sendMessage = (text: string) => {
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

  return {
    messages,
    connected,
    typingUsers,
    sendMessage,
    handleTyping,
    setMessages
  };
};
