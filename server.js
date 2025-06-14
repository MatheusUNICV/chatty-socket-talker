
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 });

let clients = [];

wss.on('connection', function connection(ws) {
  clients.push(ws);

  ws.on('message', function incoming(message) {
    // Reenvia para todos os clientes (broadcast)
    clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', function close() {
    clients = clients.filter(c => c !== ws);
  });
});

console.log('WebSocket server rodando em ws://localhost:8081');
