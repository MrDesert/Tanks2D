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

          if(data.A){
            ws.tankRotate -= rotateTank;
            speed = 1;
          } else {speed = tankSpeed};
          if(data.D){
            ws.tankRotate += rotateTank;
            speed = 1;
          } else {speed = tankSpeed};
          if(data.W){
            ws.tankPositionX += speed * Math.sin(radian);
            ws.tankPositionY -= speed * Math.cos(radian);
          };
          if(data.S){
            ws.tankPositionX -= speed * Math.sin(radian);
            ws.tankPositionY += speed * Math.cos(radian);
          };
          if(data.Z){ws.turretRotate -= rotateTurret;} 
          if(data.X){ws.turretRotate += rotateTurret;}

              // Проверка коллизии с другими танками
for (let [otherUserId, otherTank] of tanks) {
    if (otherUserId === userId) continue; // пропускаем себя

    const tankVertices = OBB(ws.tankPositionX, ws.tankPositionY, tankWidth, tankHeight, ws.tankRotate);
    const otherVertices = OBB(otherTank.positionX, otherTank.positionY, tankWidth, tankHeight, otherTank.tankRotate);
    
    if (SAT(tankVertices, otherVertices)) {
        ws.tankPositionX = oldX;
        ws.tankPositionY = oldY;
        ws.tankRotate = oldR;
        
        
        // Опционально: отталкивание
        const dx = ws.tankPositionX - otherTank.positionX;
        const dy = ws.tankPositionY - otherTank.positionY;
        const angle = Math.atan2(dy, dx);
        ws.tankPositionX += Math.cos(angle) * 1;
        ws.tankPositionY += Math.sin(angle) * 1;

        // Меняем позицию другого танка в самой Map
        tanks.set(otherUserId, {
          ...otherTank,
          positionX: otherTank.positionX - Math.cos(angle) * 2,
          positionY: otherTank.positionY - Math.sin(angle) * 2
        });
    
    // Обновляем данные в текущей переменной (для дальнейшего использования)
    otherTank.positionX = tanks.get(otherUserId).positionX;
    otherTank.positionY = tanks.get(otherUserId).positionY;
        
        break; // достаточно одного столкновения
    }
}

          for(let key in mapGame.walls){
            const wall = mapGame.walls[key];
            const firstColliz = AABB(
              {Left: (ws.tankPositionX-19), Top: ws.tankPositionY, Width: (tankWidth+38), Height: tankHeight}, 
              {Left: wall.Left, Top: wall.Top, Width: wall.Width, Height: wall.Height}
            )

            if(firstColliz){
              const tankVertices = OBB(ws.tankPositionX, ws.tankPositionY, tankWidth, tankHeight, ws.tankRotate);
              const wallVertices = OBB(wall.Left, wall.Top, wall.Width, wall.Height, wall.Rotate)
              if(SAT(tankVertices, wallVertices)){

                function getClosestTankSide(tankAngle, wallAngle) {
                  // Углы сторон танка
                  const sides = [
                  {angle: tankAngle, plus: 0 },
                  {angle: tankAngle + 90, plus: 90 },
                  {angle: tankAngle + 180, plus: 180 },
                  {angle: tankAngle + 270, plus: 270 }
                  ];
    
                  // Нормализуем углы в 0..360
                  for (let side of sides) {
                    side.angle = side.angle % 360;
                    if (side.angle < 0) side.angle += 360;
                  }
    
                  // Находим сторону с минимальной разницей к wallAngle
                  let closest = sides[0];
                  let minDiff = Math.abs(wallAngle - closest.angle);
                  minDiff = Math.min(minDiff, 360 - minDiff);
    
                  for (let side of sides) {
                    let diff = Math.abs(wallAngle - side.angle);
                    diff = Math.min(diff, 360 - diff);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closest = side;
                    }
                  }
    
                  return closest.plus;
                }

                const wallAngle = wall.Width > wall.Height ? 0 : 90;
                const closestSide = getClosestTankSide(ws.tankRotate, wallAngle);
                let targetAngle = (wallAngle - closestSide) % 360; // Нормализуем в 0..360
                if (targetAngle < 0) targetAngle += 360;
    
                // Плавный поворот к targetAngle
                let diff = targetAngle - ws.tankRotate;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
    
                ws.tankRotate += Math.sign(diff) * rotateTank * 0.5;
                ws.tankPositionX = oldX;
                ws.tankPositionY = oldY;

                // При повороте у стены
                if (data.A || data.D) {
                  if (wallAngle === 0) {// Отъезжаем вверх или вниз
                    const sign = (ws.tankPositionY < wall.Top) ? -1 : 1;
                    ws.tankPositionY += sign * 0.2;
                  } else {// Отъезжаем влево или вправо
                    const sign = (ws.tankPositionX < wall.Left) ? -1 : 1;
                    ws.tankPositionX += sign * 0.2;
                  }
                  ws.tankRotate = oldR;
                }
                break
              }
            } 
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

function AABB(obj1, obj2){
  return (
    (obj1.Left + obj1.Width) > obj2.Left &&
    obj1.Left < (obj2.Left + obj2.Width) &&
    (obj1.Top + obj1.Height) > obj2.Top &&
    obj1.Top < (obj2.Top + obj2.Height)
  );
} 

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
      if (length !== 0){axes.push({ x: axisX / length, y: axisY / length })}
    }
    return axes;
  }
}