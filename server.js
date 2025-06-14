
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const PORT = 3001;
const app = express();
app.use(cors({ origin: "http://localhost:8080", credentials: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

const SYSTEM_USER = "Sistema";
let typingTimeouts = {}; // user: timeoutId

io.on("connection", (socket) => {
  let userName = null;

  socket.on("user_joined", ({ user }) => {
    userName = user;
    // Envia a mensagem "system" só pra ele mesmo
    if (user)
      socket.emit("system", {
        type: "system",
        text: "entrou na sala.",
        user,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
      });
  });

  socket.on("user_left", ({ user }) => {
    // Apenas exibe pro próprio usuário
    socket.emit("system", {
      type: "system",
      text: "saiu da sala.",
      user,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on("message", (msg) => {
    // Espera estrutura: { type: message, text, user, timestamp }
    io.emit("message", msg);
  });

  // O evento "typing" será retornado SÓ para o próprio usuário que está digitando.
  socket.on("typing", ({ user, isTyping }) => {
    socket.emit("typing", { user, isTyping: !!isTyping });
    // Limpa qualquer timeout antigo
    if (typingTimeouts[user]) clearTimeout(typingTimeouts[user]);
    typingTimeouts[user] = setTimeout(() => {
      socket.emit("typing", { user, isTyping: false });
      delete typingTimeouts[user];
    }, 2500);
  });
  socket.on("stop_typing", ({ user }) => {
    if (typingTimeouts[user]) {
      clearTimeout(typingTimeouts[user]);
      delete typingTimeouts[user];
    }
    socket.emit("typing", { user, isTyping: false });
  });

  socket.on("disconnect", () => {
    if (userName) {
      socket.emit("system", {
        type: "system",
        text: "desconectou.",
        user: userName,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server rodando em http://localhost:${PORT}`);
});
