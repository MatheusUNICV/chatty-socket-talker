
import React from "react";
import ChatWindow from "../components/ChatWindow";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background pt-10">
      <h1 className="text-3xl font-bold mb-2">Chat WebSocket Simples</h1>
      <p className="text-muted-foreground mb-4">
        Envie mensagens em tempo real! <br />
        <span className="text-xs">(Certifique-se que o backend está rodando em <code>ws://localhost:8081</code>)</span>
      </p>
      <ChatWindow />
      <div className="mt-8 text-sm text-gray-400">Powered by React + Node.js + WebSocket</div>
    </div>
  );
};

export default Index;
