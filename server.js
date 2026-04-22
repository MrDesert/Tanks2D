const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs'); //Библиотека для парса JSON

const app = express();
const port = process.env.PORT || 3000;

app.get('/stats', (req, res) => {
  res.json({
    totalUniqueUsers: nextUserId - 1,
    activeConnections: activeConnections
  });
});

//Сервер
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let nextUserId = 0;
let activeConnections = 0;
const tanks = new Map(); // userId -> данные танка

//Карта
const mapGame = JSON.parse(fs.readFileSync('map1.json', 'utf8'));
const spawnPoints = Object.keys(mapGame.spawnPoints);

//Танк
const tankHeight = 80;
const tankWidth = 43;
let tankSpeed = 1.5;
const rotateTank = 1;
const rotateTurret = 1.5;

wss.on('connection', (ws, req) => {

  //Пользователь
  const userId = nextUserId++;   //При подключении выдаём новый ID и номер
  activeConnections++;
  console.log(`Новый пользователь: ID=${userId}, Активных: ${activeConnections}`);
  ws.send(JSON.stringify({ type: 'welcome', userId: userId }));    // Отправляем приветствие с номером

  const randomSpawnPoint = Math.floor(Math.random()*spawnPoints.length)
  ws.send(JSON.stringify({type: 'map', map: mapGame}))
  
  ws.userId = userId; // Сохраняем userId на сокете
  ws.tankPositionY = mapGame.spawnPoints[spawnPoints[randomSpawnPoint]].Top;
  ws.tankPositionX = mapGame.spawnPoints[spawnPoints[randomSpawnPoint]].Left;
  ws.tankRotate = mapGame.spawnPoints[spawnPoints[randomSpawnPoint]].Rotate;
  ws.turretRotate = 0;
  ws.send(JSON.stringify({type:'startposition', X:ws.tankPositionX, Y:ws.tankPositionY, Rotate:ws.tankRotate, Height:tankHeight, Width:tankWidth}))
  
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

        tanks.set(userId, {
          userId: userId,
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
          const oldX = ws.tankPositionX;
          const oldY = ws.tankPositionY;
          const radian = ws.tankRotate * Math.PI / 180;
          if(data.W){
            ws.tankPositionX += tankSpeed * Math.sin(radian);
            ws.tankPositionY -= tankSpeed * Math.cos(radian);
          };
          if(data.S){
            ws.tankPositionX -= tankSpeed * Math.sin(radian);
            ws.tankPositionY += tankSpeed * Math.cos(radian);
          };
          if(data.A){ws.tankRotate -= rotateTank;};
          if(data.D){ws.tankRotate += rotateTank;};
          if(data.Z){ws.turretRotate -= rotateTurret;} 
          if(data.X){ws.turretRotate += rotateTurret;}
          
          const tankVertices = OBB(ws.tankPositionX, ws.tankPositionY, tankWidth, tankHeight, ws.tankRotate)
          const wallVertices = OBB(mapGame.walls.kontur_top.Left, mapGame.walls.kontur_top.Top, mapGame.walls.kontur_top.Width, mapGame.walls.kontur_top.Height, 0)

          console.log("Столкновение - " + SAT(tankVertices, wallVertices));

          function OBB(X, Y, Width, Height, Rotate){
            //Переводим в OBB
            const halfWidth = Width / 2;
            const halfHeight = Height / 2;
            const centerX = X + halfWidth;
            const centerY = Y + halfHeight;
            const angleRad = Rotate * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);

            // Локальные вершины (до поворота)
            const local = [
              { x: -halfWidth, y: -halfHeight },  // левый верхний
              { x:  halfWidth, y: -halfHeight },  // правый верхний
              { x:  halfWidth, y:  halfHeight },  // правый нижний
              { x: -halfWidth, y:  halfHeight }   // левый нижний
            ];

            const world = [];
            for(let i = 0; i < 4; i++){
              const newX = local[i].x * cos - local[i].y * sin + centerX;
              const newY = local[i].x * sin + local[i].y * cos + centerY;
              world.push({x: newX, y: newY});
            }
            return world
          }

          function getAxes(vertices) {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % vertices.length];
        const edgeX = p2.x - p1.x;
        const edgeY = p2.y - p1.y;
        const axisX = -edgeY;
        const axisY = edgeX;
        const length = Math.sqrt(axisX * axisX + axisY * axisY);
        if (length !== 0) {
            axes.push({ x: axisX / length, y: axisY / length });
        }
    }
    return axes;
}

function project(vertices, axisX, axisY) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < vertices.length; i++) {
        const projection = vertices[i].x * axisX + vertices[i].y * axisY;
        min = Math.min(min, projection);
        max = Math.max(max, projection);
    }
    return { min, max };
}

function overlap(proj1, proj2) {
    return !(proj1.max < proj2.min || proj2.max < proj1.min);
}

function SAT(verticesA, verticesB) {
    const axes = [...getAxes(verticesA), ...getAxes(verticesB)];
    for (let i = 0; i < axes.length; i++) {
        const projA = project(verticesA, axes[i].x, axes[i].y);
        const projB = project(verticesB, axes[i].x, axes[i].y);
        if (!overlap(projA, projB)) {
            return false;
        }
    }
    return true;
}





          for(let key in mapGame.walls){
            if(ws.tankPositionX+43 > (mapGame.walls[key].Left) && 
              ws.tankPositionX < (mapGame.walls[key].Left+mapGame.walls[key].Width) && 
              ws.tankPositionY+80 > (mapGame.walls[key].Top) && 
              ws.tankPositionY < (mapGame.walls[key].Top+mapGame.walls[key].Height)){
              ws.tankPositionX = oldX;
              ws.tankPositionY = oldY;
            } 
          }

          ws.send(JSON.stringify({ type: 'movement', pi: oldX, turretRotate: ws.turretRotate, tankRotate: ws.tankRotate, positionX: ws.tankPositionX, positionY: ws.tankPositionY}));
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