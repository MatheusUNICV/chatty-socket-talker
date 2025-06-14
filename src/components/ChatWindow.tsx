
import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";

// Gera um identificador curto para "quem é você" (sessão anônima)
function getSessionId() {
  if (window.sessionStorage.getItem("chatId")) {
    return window.sessionStorage.getItem("chatId")!;
  }
  const id = "user-" + Math.random().toString(36).slice(2, 8);
  window.sessionStorage.setItem("chatId", id);
  return id;
}

interface WSMessage {
  text: string;
  user: string;
  timestamp: string;
}

const WS_HOST = "ws://localhost:8081"; // Ajuste conforme seu backend rodar

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const myId = useRef(getSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_HOST);

    ws.current.onopen = () => {
      setConnected(true);
      toast({ title: "Conectado ao chat!" });
    };

    ws.current.onclose = () => {
      setConnected(false);
      toast({ title: "Desconectado do chat", description: "Tentando reconectar..." });
      setTimeout(() => window.location.reload(), 2000);
    };

    ws.current.onerror = () => {
      toast({ title: "Erro de conexão", description: "Verifique o backend!" });
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        // ignora mensagens mal formatadas
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    // Scroll até o fim ao receber novas mensagens
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = (text: string) => {
    const msg: WSMessage = {
      text,
      user: myId.current,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    };
    ws.current?.send(JSON.stringify(msg));
    // Mostra no local já (eco otimizando UX)
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh] md:max-h-[70vh] w-full md:w-[600px] mx-auto bg-card rounded-lg border shadow overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        {messages.length === 0 && (
          <div className="text-muted-foreground text-center mt-14">Nenhuma mensagem ainda. Diga oi!</div>
        )}
        {messages.map((m, idx) => (
          <ChatMessage
            key={idx}
            fromMe={m.user === myId.current}
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
