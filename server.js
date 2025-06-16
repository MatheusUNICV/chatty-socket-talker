
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
let typingTimeouts = {}; // Map user-room -> timeoutId

// Salas disponíveis
const AVAILABLE_ROOMS = {
  'geral': 'Sala Geral',
  'tecnologia': 'Sala Tecnologia'
};

io.on('connection', (socket) => {
  let userName = null;
  let currentRoom = null;

  socket.on('join_room', ({ user, room }) => {
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

  socket.on('user_left', ({ user, room }) => {
    socket.to(room).emit("system", {
      type: "system",
      text: "saiu da sala.",
      user,
      room,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour12: false }),
    });
  });

  socket.on('message', (msg) => {
    // Enviar mensagem apenas para usuários na mesma sala
    socket.to(msg.room).emit('message', msg);
    socket.emit('message', msg); // Enviar de volta para o remetente
  });

  socket.on("typing", ({ user, isTyping, room }) => {
    socket.to(room).emit("typing", { user, isTyping: !!isTyping });
    const key = `${user}-${room}`;
    if (typingTimeouts[key]) clearTimeout(typingTimeouts[key]);
    typingTimeouts[key] = setTimeout(() => {
      socket.to(room).emit("typing", { user, isTyping: false });
      delete typingTimeouts[key];
    }, 2500);
  });

  socket.on("stop_typing", ({ user, room }) => {
    const key = `${user}-${room}`;
    if (typingTimeouts[key]) {
      clearTimeout(typingTimeouts[key]);
      delete typingTimeouts[key];
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

server.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
