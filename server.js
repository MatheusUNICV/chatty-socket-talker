
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

io.on("connection", (socket) => {
  // Evento 'message' -> repassa msg para todos os conectados
  socket.on("message", (msg) => {
    // garante formato: { text, user, timestamp }
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    // nada extra por enquanto
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server rodando em http://localhost:${PORT}`);
});
