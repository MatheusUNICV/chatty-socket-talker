
import { Toaster } from "@/components/ui/toaster";
import ChatWindow from "@/components/ChatWindow";

const App = () => (
  <div className="min-h-screen flex flex-col items-center justify-start pt-10 bg-gradient-to-br from-blue-900 to-purple-900">
    <h1 className="text-3xl font-bold mb-2">ChatZap</h1>
    <p className="text-muted-foreground mb-4">
      Envie mensagens em tempo real!<br />
      <span className="text-xs">(Certifique-se que o backend está rodando em <code>ws://localhost:8081</code>)</span>
    </p>
    <ChatWindow />
    <div className="mt-8 text-sm text-gray-400">Powered by React + Node.js + WebSocket</div>
    <Toaster />
  </div>
);

export default App;
