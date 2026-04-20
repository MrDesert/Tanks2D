const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs'); //Библиотека для парса JSON

const app = express();
const port = process.env.PORT || 3000;

let nextUserId = 1;
let activeConnections = 0;
const tanks = new Map(); // userId -> данные танка
const userNumbers = new Map(); // userId -> номер для отображения

app.get('/stats', (req, res) => {
  res.json({
    totalUniqueUsers: nextUserId - 1,
    activeConnections: activeConnections
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const map = fs.readFileSync('map1.json', 'utf8');
const mapObj = JSON.parse(map);
const spawnPoints = [[60, 40, 180], [380, 40, 180], [700, 40, 180], [60, 470, 0], [380, 470, 0], [700, 470, 0], [220, 250, 180], [550, 250, 0]];
const rotateTurret = 1.5;
let tankSpeed = 1.5;
const rotateTank = 1;
wss.on('connection', (ws, req) => {
  // При подключении выдаём новый ID и номер
  const userId = nextUserId;
  const userNumber = nextUserId;
  nextUserId++;
  activeConnections++;
  const randomSpawnPoint = Math.floor(Math.random()*spawnPoints.length)
  ws.send(JSON.stringify({type: 'map', map: mapObj}))
  console.log(`Новый пользователь: ID=${userId}, Номер=${userNumber}. Активных: ${activeConnections}`);
  
  // Отправляем приветствие с номером
  ws.send(JSON.stringify({ type: 'welcome', number: userNumber, userId: userId }));
  
  // Сохраняем userId на сокете
  ws.userId = userId;
  ws.userNumber = userNumber;
  ws.turretRotate = 0;
  ws.tankPositionX = spawnPoints[randomSpawnPoint][0];
  ws.tankPositionY = spawnPoints[randomSpawnPoint][1];
  ws.tankRotate = spawnPoints[randomSpawnPoint][2];
  ws.send(JSON.stringify({type:'startposition', X:spawnPoints[randomSpawnPoint][0], Y:spawnPoints[randomSpawnPoint][1], Rotate:spawnPoints[randomSpawnPoint][2]}))
  
  // Отправляем новому клиенту данные обо всех существующих танках
  const allTanksData = {
    type: 'allTanks',
    tanks: Array.from(tanks.values())
  };
  ws.send(JSON.stringify(allTanksData));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'tankState') {
        // Сохраняем данные танка этого пользователя

        for(let key in mapObj.walls){
          if(data.positionY < 100){
            // console.log(mapObj.walls[key].Top)
          }
          if(data.positionX+43 > (mapObj.walls[key].Left) && 
            data.positionX < (mapObj.walls[key].Left+mapObj.walls[key].Width) && 
            data.positionY+80 > (mapObj.walls[key].Top) && 
            data.positionY < (mapObj.walls[key].Top+mapObj.walls[key].Height)){
              console.log("столкновение!")
          } 
        }

        tanks.set(userId, {
          userId: userId,
          userNumber: userNumber,
          positionX: data.positionX,
          positionY: data.positionY,
          tankRotate: data.tankRotate,
          turretRotate: data.turretRotate,
          timestamp: data.timestamp
        });
        
        // Рассылаем данные о ВСЕХ танках ВСЕМ подключённым клиентам
        const broadcastData = {
          type: 'allTanks',
          tanks: Array.from(tanks.values())
        };
        
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(broadcastData));
          }
        });
      } else if(data.type === 'ping'){
         ws.send(JSON.stringify({ type: 'pong', clientTime: data.clientTime, serverTime: Date.now()}));
      } 
      else if (data.type === 'keysDown'){
          const radian = ws.tankRotate * Math.PI / 180;
          if(data.W){
            ws.positionX += tankSpeed * Math.sin(radian);
            ws.positionY -= tankSpeed * Math.cos(radian);
          };
          if(data.S){
            ws.positionX -= tankSpeed * Math.sin(radian);
            ws.positionY += tankSpeed * Math.cos(radian);
          };
          if(data.A){ws.tankRotate -= rotateTank;};
          if(data.D){ws.tankRotate += rotateTank;};
          if(data.Z){ws.turretRotate -= rotateTurret;} 
          if(data.X){ws.turretRotate += rotateTurret;}
          ws.send(JSON.stringify({ type: 'movement', pi: Math.PI, sin: Math.sin(radian), radian: radian, turretRotate: ws.turretRotate, tankRotate: ws.tankRotate, positionX: ws.positionX, positionY: ws.positionY}));
      }
    } catch (err) {
      console.error('Ошибка парсинга сообщения:', err);
    }
  });
  
  ws.on('close', () => {
    activeConnections--;
    tanks.delete(userId);
    console.log(`Пользователь ${userId} отключился. Активных: ${activeConnections}`);
    
    // Рассылаем обновлённый список (без отключившегося)
    const broadcastData = {
      type: 'allTanks',
      tanks: Array.from(tanks.values())
    };
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(broadcastData));
      }
    });
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});