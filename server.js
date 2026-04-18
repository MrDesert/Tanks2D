const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express(); //само приложение
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Сервер работает');
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
      </body>
    </html>
  `;
  res.send(html);
  console.log(`Кто то подключился к серверу!`);
}); //Когда кто то заходить на сервер выводит

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Кто-то подключился по WebSocket');
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
}); // пишет в консоль сервере на каком порту он запущен