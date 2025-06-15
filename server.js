
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const SYSTEM_USER = "Sistema";
let typingTimeouts = {}; // Map user -> timeoutId

io.on('connection', (socket) => {
  let userName = null;

  socket.on('user_joined', ({ user }) => {
    userName = user;
    // Broadcast para todos (inclusive para quem entrou)
    io.emit("system", {
      type: "system",
      text: "entrou na sala.",
      user,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('user_left', ({ user }) => {
    // Broadcast para todos (inclusive para quem saiu)
    io.emit("system", {
      type: "system",
      text: "saiu da sala.",
      user,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('message', (msg) => {
    // Estrutura esperada do frontend: { type: "message", text, user, timestamp }
    io.emit('message', msg);
  });

  // Quando um usuário estiver digitando, avisa todos MENOS o próprio
  socket.on("typing", ({ user, isTyping }) => {
    socket.broadcast.emit("typing", { user, isTyping: !!isTyping });
    // Timeout para parar o "digitando" após 2.5s
    if (typingTimeouts[user]) clearTimeout(typingTimeouts[user]);
    typingTimeouts[user] = setTimeout(() => {
      socket.broadcast.emit("typing", { user, isTyping: false });
      delete typingTimeouts[user];
    }, 2500);
  });

  socket.on("stop_typing", ({ user }) => {
    if (typingTimeouts[user]) {
      clearTimeout(typingTimeouts[user]);
      delete typingTimeouts[user];
    }
    socket.broadcast.emit("typing", { user, isTyping: false });
  });

  socket.on('disconnect', () => {
    if (userName) {
      io.emit("system", {
        type: "system",
        text: "desconectou.",
        user: userName,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
      });
    }
  });
});

server.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
