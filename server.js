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

      if(data.type === 'ping'){
         ws.send(JSON.stringify({ type: 'pong', clientTime: data.clientTime, serverTime: Date.now()}));
      } 
      if (data.type === 'keysDown'){
          const oldX = ws.tankPositionX;
          const oldY = ws.tankPositionY;
          const oldR = ws.tankRotate;
          const radian = ws.tankRotate * Math.PI / 180;
          let speed = tankSpeed;
          if(data.W){
            ws.tankPositionX += speed * Math.sin(radian);
            ws.tankPositionY -= speed * Math.cos(radian);
          };
          if(data.S){
            ws.tankPositionX -= speed * Math.sin(radian);
            ws.tankPositionY += speed * Math.cos(radian);
          };
          if(data.A){
            ws.tankRotate -= rotateTank;
            speed = 1;
          } else {speed = tankSpeed};
          if(data.D){
            ws.tankRotate += rotateTank;
            speed = 1;
          } else {speed = tankSpeed};
          if(data.Z){ws.turretRotate -= rotateTurret;} 
          if(data.X){ws.turretRotate += rotateTurret;}
          
          const tankVertices = OBB(ws.tankPositionX, ws.tankPositionY, tankWidth, tankHeight, ws.tankRotate)
          const wallVertices = OBB(mapGame.walls.kontur_top.Left, mapGame.walls.kontur_top.Top, mapGame.walls.kontur_top.Width, mapGame.walls.kontur_top.Height, 0)
          const wallVertices1 = OBB(mapGame.walls.kontur_right.Left, mapGame.walls.kontur_right.Top, mapGame.walls.kontur_right.Width, mapGame.walls.kontur_right.Height, 0)
          const wallVertices2 = OBB(mapGame.walls.kontur_bottom.Left, mapGame.walls.kontur_bottom.Top, mapGame.walls.kontur_bottom.Width, mapGame.walls.kontur_bottom.Height, 0)
          const wallVertices3 = OBB(mapGame.walls.kontur_left.Left, mapGame.walls.kontur_left.Top, mapGame.walls.kontur_left.Width, mapGame.walls.kontur_left.Height, 0)
          const wallVertices4 = OBB(mapGame.walls.inner_top.Left, mapGame.walls.inner_top.Top, mapGame.walls.inner_top.Width, mapGame.walls.inner_top.Height, 0)
          const wallVertices5 = OBB(mapGame.walls.inner_right.Left, mapGame.walls.inner_right.Top, mapGame.walls.inner_right.Width, mapGame.walls.inner_right.Height, 0)
          const wallVertices6 = OBB(mapGame.walls.inner_bottom.Left, mapGame.walls.inner_bottom.Top, mapGame.walls.inner_bottom.Width, mapGame.walls.inner_bottom.Height, 0)
          const wallVertices7 = OBB(mapGame.walls.inner_left.Left, mapGame.walls.inner_left.Top, mapGame.walls.inner_left.Width, mapGame.walls.inner_left.Height, 0)

          if(SAT(tankVertices, wallVertices) || SAT(tankVertices, wallVertices1) || SAT(tankVertices, wallVertices2) || SAT(tankVertices, wallVertices3) || SAT(tankVertices, wallVertices4) || SAT(tankVertices, wallVertices5) || SAT(tankVertices, wallVertices6) || SAT(tankVertices, wallVertices7)){
            // ws.tankPositionX = oldX;
            // ws.tankPositionY = oldY;
            // ws.tankRotate = oldR;
          }

          // for(let key in mapGame.walls){
          //   if(ws.tankPositionX+43 > (mapGame.walls[key].Left) && 
          //     ws.tankPositionX < (mapGame.walls[key].Left+mapGame.walls[key].Width) && 
          //     ws.tankPositionY+80 > (mapGame.walls[key].Top) && 
          //     ws.tankPositionY < (mapGame.walls[key].Top+mapGame.walls[key].Height)){
          //     ws.tankPositionX = oldX;
          //     ws.tankPositionY = oldY;
          //   } 
          // }
          console.log(AABB({Left: ws.tankPositionX, Top: ws.tankPositionY, Width: tankWidth, Height: tankHeight}, {Left: mapGame.walls.kontur_top.Left, Top: mapGame.walls.kontur_top.Top, Width: mapGame.walls.kontur_top.Width, Height: mapGame.walls.kontur_top.Height}))
          function AABB(obj1, obj2){
            return (
              (obj1.Left + obj1.Width) > obj2.Left &&
              obj1.Left < (obj2.Left + obj2.Width) &&
              (obj1.Top + obj1.Height) > obj2.Top &&
              obj1.Top < (obj2.Top + obj2.Height)
            );
          } 

          ws.send(JSON.stringify({ type: 'movement', turretRotate: ws.turretRotate, tankRotate: ws.tankRotate, positionX: ws.tankPositionX, positionY: ws.tankPositionY}));
                  
          tanks.set(userId, {
          userId: userId,
          positionX: ws.tankPositionX,
          positionY: ws.tankPositionY,
          tankRotate: ws.tankRotate,
          turretRotate: ws.turretRotate
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

  // Делаем поворот и переводим в мировые координаты
  const world = [];
  for(let i = 0; i < 4; i++){
    const newX = local[i].x * cos - local[i].y * sin + centerX;
    const newY = local[i].x * sin + local[i].y * cos + centerY;
    world.push({x: newX, y: newY});
  }
  return world
}

function SAT(verticesA, verticesB) {
  const axes = [...getAxes(verticesA), ...getAxes(verticesB)];
  for (let i = 0; i < axes.length; i++) {
    const projA = project(verticesA, axes[i].x, axes[i].y);
    const projB = project(verticesB, axes[i].x, axes[i].y);
    if (!overlap(projA, projB)){return false}
  }
  return true;

  function overlap(proj1, proj2) {return !(proj1.max < proj2.min || proj2.max < proj1.min)}
    
  function project(vertices, axisX, axisY) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < vertices.length; i++) {
      const projection = vertices[i].x * axisX + vertices[i].y * axisY;
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
    return {min, max};
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
}