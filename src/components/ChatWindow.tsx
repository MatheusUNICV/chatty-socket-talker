import React, { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";
import NamePrompt from "./NamePrompt";

// Gera um identificador curto para "quem é você" (sessão anônima)
// substitui getSessionId por getUserName
function getUserName() {
  // Reutiliza sessionStorage para manter o nome durante a sessão.
  if (window.sessionStorage.getItem("chatName")) {
    return window.sessionStorage.getItem("chatName")!;
  }
  return null;
}

interface WSMessage {
  text: string;
  user: string;      // Agora: nome do usuário
  timestamp: string;
}

const WS_HOST = "ws://localhost:8081"; // Ajuste conforme seu backend rodar

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState<string | null>(getUserName());
  const ws = useRef<WebSocket | null>(null);
  const myId = useRef(getSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);

  // salva o nome escolhido e atualiza o estado
  const handleSetName = (newName: string) => {
    window.sessionStorage.setItem("chatName", newName);
    setName(newName);
  };

  useEffect(() => {
    if (!name) return; // só conecta ao websocket depois do nome definido

    ws.current = new WebSocket(WS_HOST);

    ws.current.onopen = () => {
      setConnected(true);
      toast({ title: "Conectado ao chat!" });
    };

    ws.current.onclose = () => {
      setConnected(false);
      toast({ title: "Desconectado do chat", description: "Tentando reconectar..." });
      setTimeout(() => window.location.reload(), 2000); // reload só roda com nome já salvo
    };

    ws.current.onerror = () => {
      toast({ title: "Erro de conexão", description: "Verifique o backend!" });
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) { }
    };

    return () => {
      ws.current?.close();
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = (text: string) => {
    if (!name) return;
    const msg: WSMessage = {
      text,
      user: name, // Envia o nome, não mais ID
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    };
    ws.current?.send(JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
  };

  // Se nome não definido, pede via modal
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
