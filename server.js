const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());

let totalConnections = 0;
let activeConnections = 0;

app.get('/', (req, res) => {
  let userId = req.cookies.userId;
  if (!userId) {
    userId = crypto.randomUUID();
    res.cookie('userId', userId, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });
  }

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

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = value;
  });
  return cookies;
}

wss.on('connection', (ws, req) => {
  const cookies = parseCookies(req.headers.cookie);
  const userId = cookies.userId;
  
  console.log(`WebSocket подключение от пользователя: ${userId}`);
  
  totalConnections++;
  activeConnections++;
  console.log(`Всего: ${totalConnections}, Активных: ${activeConnections}`);

  ws.on('close', () => {
    activeConnections--;
    console.log(`Подключение закрыто. Активных: ${activeConnections}`);
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});