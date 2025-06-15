
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
let typingTimeouts: Record<string, NodeJS.Timeout> = {};

io.on('connection', (socket) => {
  let userName: string | null = null;

  socket.on('user_joined', ({ user }: { user: string }) => {
    userName = user;
    io.emit("system", {
      type: "system",
      text: "entrou na sala.",
      user,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('user_left', ({ user }: { user: string }) => {
    io.emit("system", {
      type: "system",
      text: "saiu da sala.",
      user,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('message', (msg: { type: string, text: string, user: string, timestamp: string }) => {
    io.emit('message', msg);
  });

  socket.on("typing", ({ user, isTyping }: { user: string, isTyping: boolean }) => {
    socket.broadcast.emit("typing", { user, isTyping: !!isTyping });
    if (typingTimeouts[user]) clearTimeout(typingTimeouts[user]);
    typingTimeouts[user] = setTimeout(() => {
      socket.broadcast.emit("typing", { user, isTyping: false });
      delete typingTimeouts[user];
    }, 2500);
  });

  socket.on("stop_typing", ({ user }: { user: string }) => {
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

// ==== PORTA DINÂMICA PARA PLATAFORMAS COMO RAILWAY ====
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

