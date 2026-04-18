const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

let totalConnections = 0;
let activeConnections = 0;

app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Счётчик подключений</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>Клиентская страница</h1>
        <p>Здесь позже появится номер подключения</p>
        <script>
          const socket = new WebSocket('wss://' + window.location.host);
          socket.onopen = () => {
            console.log('WebSocket соединение открыто');
          };
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  totalConnections++;
  activeConnections++;
  console.log(`Подключение открыто. Всего: ${totalConnections}, Активных: ${activeConnections}`);

  ws.on('close', () => {
    activeConnections--;
    console.log(`Подключение закрыто. Активных: ${activeConnections}`);
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});