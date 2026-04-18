const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());

let totalUniqueUsers = 0;
let activeConnections = 0;
const seenUsers = new Set();

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
        <div id="message">Ожидание подключения...</div>
        <script>
          const socket = new WebSocket('wss://' + window.location.host);
          socket.onopen = () => {
            console.log('WebSocket соединение открыто');
          };
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'welcome') {
              document.getElementById('message').innerHTML = 'Вы подключились под номером ' + data.number;
            }
          };
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

app.get('/stats', (req, res) => {
  res.json({
    totalUniqueUsers: totalUniqueUsers,
    activeConnections: activeConnections
  });
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
  
  let userNumber = null;
  if (!seenUsers.has(userId)) {
    seenUsers.add(userId);
    totalUniqueUsers++;
    userNumber = totalUniqueUsers;
    console.log(`Новый уникальный пользователь: ${userId}. Номер: ${userNumber}. Всего уникальных: ${totalUniqueUsers}`);
  } else {
    userNumber = [...seenUsers].indexOf(userId) + 1;
    console.log(`Известный пользователь: ${userId}. Номер: ${userNumber}`);
  }
  
  ws.send(JSON.stringify({ type: 'welcome', number: userNumber }));
  
  activeConnections++;
  console.log(`Активных соединений: ${activeConnections}`);

  ws.on('close', () => {
    activeConnections--;
    console.log(`Активных соединений: ${activeConnections}`);
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});