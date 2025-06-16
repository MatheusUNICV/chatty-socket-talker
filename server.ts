
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

// Salas disponíveis
const AVAILABLE_ROOMS = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

io.on('connection', (socket) => {
  let userName: string | null = null;
  let currentRoom: string | null = null;

  socket.on('join_room', ({ user, room }: { user: string, room: string }) => {
    userName = user;
    currentRoom = room;
    
    // Sair da sala anterior se houver
    if (socket.rooms.size > 1) {
      const previousRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      previousRooms.forEach(r => socket.leave(r));
    }
    
    // Entrar na nova sala
    socket.join(room);
    
    // Notificar entrada na sala
    socket.to(room).emit("system", {
      type: "system",
      text: "entrou na sala.",
      user,
      room,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('user_left', ({ user, room }: { user: string, room: string }) => {
    socket.to(room).emit("system", {
      type: "system",
      text: "saiu da sala.",
      user,
      room,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('message', (msg: { type: string, text: string, user: string, timestamp: string, room: string }) => {
    // Enviar mensagem apenas para usuários na mesma sala
    socket.to(msg.room).emit('message', msg);
    socket.emit('message', msg); // Enviar de volta para o remetente
  });

  socket.on("typing", ({ user, isTyping, room }: { user: string, isTyping: boolean, room: string }) => {
    socket.to(room).emit("typing", { user, isTyping: !!isTyping });
    if (typingTimeouts[`${user}-${room}`]) clearTimeout(typingTimeouts[`${user}-${room}`]);
    typingTimeouts[`${user}-${room}`] = setTimeout(() => {
      socket.to(room).emit("typing", { user, isTyping: false });
      delete typingTimeouts[`${user}-${room}`];
    }, 2500);
  });

  socket.on("stop_typing", ({ user, room }: { user: string, room: string }) => {
    if (typingTimeouts[`${user}-${room}`]) {
      clearTimeout(typingTimeouts[`${user}-${room}`]);
      delete typingTimeouts[`${user}-${room}`];
    }
    socket.to(room).emit("typing", { user, isTyping: false });
  });

  socket.on('disconnect', () => {
    if (userName && currentRoom) {
      socket.to(currentRoom).emit("system", {
        type: "system",
        text: "desconectou.",
        user: userName,
        room: currentRoom,
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
