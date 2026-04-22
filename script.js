// Подключение к серверу на Render
const socket = new WebSocket('wss://tanks2d.onrender.com');
let myUserId = null;
const otherTanks = new Map(); // id -> элемент DOM
let playerTank;
let playerTankTurret;
let speed = 1.5;
const rotateTank = 1;
const rotateTurret = 1.5;
let trackFrameLeft = 1;
let trackFrameRight = 1;
let speedX = 0;
let speedY = 1;
            let tank = document.getElementById("playerTank");
            // const object =  tank.getBoundingClientRect();
let curPositionX;
let curPositionY;
let curTankRotate;
let curTurretRotate = 0;
const speedBullets = 8;
const bulletRecharge = 70;
let bulletRechargeCur = 10;
const bullets = [];
const keysDown = {
    type: "keysDown",
    W: false,
    S: false,
    A: false,
    D: false,
    Z: false,
    X: false,
    Space: false
};

const walls = [];

document.addEventListener('keydown', (e)=> {
        e.preventDefault();
        if(e.code === 'KeyD' || e.code === 'ArrowRight'){keysDown.D = true;  speed = 1;} 
        else if(e.code === 'KeyA' || e.code === 'ArrowLeft'){keysDown.A = true;  speed = 1;} 
        else if(e.code === 'KeyW' || e.code === 'ArrowUp'){keysDown.W = true} 
        else if(e.code === 'KeyS' || e.code === 'ArrowDown'){keysDown.S = true} 
        else if(e.code === 'Period' || e.code === 'KeyX'){keysDown.X = true}
        else if(e.code === 'Comma' || e.code === 'KeyZ'){keysDown.Z = true}
        else if(e.code === 'Space'){keysDown.Space = true}
});

document.addEventListener('keyup', (e)=> {
        if(e.code === 'KeyD' || e.code === 'ArrowRight'){keysDown.D = false;  speed = 1.5;} 
        else if(e.code === 'KeyA' || e.code === 'ArrowLeft'){keysDown.A = false;  speed = 1.5;}
        else if(e.code === 'KeyW' || e.code === 'ArrowUp'){keysDown.W = false} 
        else if(e.code === 'KeyS' || e.code === 'ArrowDown'){keysDown.S = false}
        else if(e.code === 'Period' || e.code === 'KeyX'){keysDown.X = false}
        else if(e.code === 'Comma' || e.code === 'KeyZ'){keysDown.Z = false}
        else if(e.code === 'Space'){keysDown.Space = false}
});

const fps = document.getElementById("fps");
tick(performance.now());
function tick(time){
    tick.countTank = (tick.countTank || 0)

    if(time - (tick.lastFPS || 0) >= 1000){
      fps.textContent = "fps: " + tick.FPScount;
      tick.FPScount = 0;
      tick.lastFPS = time;
    }
    tick.FPScount = (tick.FPScount || 0) + 1;

    if(time - (tick.lastTimePing || 0) >= 500){
      if (socket.readyState === WebSocket.OPEN) {
  socket.send(JSON.stringify({type: "ping", clientTime: Date.now()}));
      }   
       tick.lastTimePing = time; 
}

    if(time - (tick.lastTimeMove || 0) >= 16){
        // Отправляем данные о танке на сервер
if (socket.readyState === WebSocket.OPEN) {
  const tankData = {
    type: 'tankState',
    positionX: curPositionX,
    positionY: curPositionY,
    tankRotate: curTankRotate,
    turretRotate: curTurretRotate,
    timestamp: time
  };
  socket.send(JSON.stringify(tankData));
  socket.send(JSON.stringify(keysDown));
}     
        let oldX = curPositionX;
        let oldY = curPositionY;
        // for (const key in keysDown){
        //     if(key == "W" && keysDown[key]){
        //         const radian = curTankRotate * Math.PI / 180;
        //         curPositionX += speed * Math.sin(radian);
        //         curPositionY -= speed * Math.cos(radian);
        //         if(trackFrameLeft >= 7){trackFrameLeft = 1;
        //         }else{trackFrameLeft++;}
        //         if(trackFrameRight >= 7){trackFrameRight = 1;
        //         }else{trackFrameRight++;}
        //         document.getElementById("leftTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("leftTrack").classList.add("trackFrame"+trackFrameLeft);
        //         document.getElementById("rightTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("rightTrack").classList.add("trackFrame"+trackFrameRight);
        //     } 
        //     if(key == "S" && keysDown[key]){
        //         const radian = curTankRotate * Math.PI / 180;
        //         curPositionX -= speed * Math.sin(radian);
        //         curPositionY += speed * Math.cos(radian);
        //         if(trackFrameLeft <= 1){trackFrameLeft = 7;
        //         }else{trackFrameLeft--;}
        //         if(trackFrameRight <= 1){trackFrameRight = 7;
        //         }else{trackFrameRight--;}
        //         document.getElementById("leftTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("leftTrack").classList.add("trackFrame"+trackFrameLeft);
        //         document.getElementById("rightTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("rightTrack").classList.add("trackFrame"+trackFrameRight);
        //     } 
        //     if(key == "A" && keysDown[key]){
        //         curTankRotate -= rotateTank;
        //         if(trackFrameLeft <= 1){trackFrameLeft = 7;
        //         }else{trackFrameLeft--;}
        //         if(trackFrameRight >= 7){trackFrameRight = 1;
        //         }else{trackFrameRight++;}
        //         document.getElementById("leftTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("leftTrack").classList.add("trackFrame"+trackFrameLeft);
        //         document.getElementById("rightTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("rightTrack").classList.add("trackFrame"+trackFrameRight);
        //     } 
        //     if(key == "D" && keysDown[key]){
        //         curTankRotate += rotateTank;
        //         if(trackFrameLeft >= 7){trackFrameLeft = 1;
        //         }else{trackFrameLeft++;}
        //         if(trackFrameRight <= 1){trackFrameRight = 7;
        //         }else{trackFrameRight--;}
        //         document.getElementById("leftTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("leftTrack").classList.add("trackFrame"+trackFrameLeft);
        //         document.getElementById("rightTrack").classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
        //         document.getElementById("rightTrack").classList.add("trackFrame"+trackFrameRight);
        //     }             
        //     if(key == "Z" && keysDown[key]){curTurretRotate -= rotateTurret} 
        //     if(key == "X" && keysDown[key]){curTurretRotate += rotateTurret}

        //     if(colliziia(tank)){
        //         curPositionX = oldX;
        //         curPositionY = oldY; 
        //     }

        //     playerTank.style.transform = "translate("+curPositionX +"px, "+curPositionY+"px) rotate("+curTankRotate+"deg)";
        //     playerTankTurret.style.transform = "translateX(-50%) rotate("+curTurretRotate+"deg)";
        // }
        tick.countTank++;
        tick.lastTimeMove = time;
    }
    if(time - (tick.lastTimeBull || 0) >= 2){
        tick.countBul = (tick.countBul || 0)
        for (const key in keysDown){
            if(tick.countBul >= bulletRecharge){
                if(key == "Space" && keysDown[key]){createBullet(); tick.countBul = 0;}
            }
        }
        bullets.forEach(bul => {
            const bullet = document.getElementById(bul[0]);
            const oldBul1 = bul[1];
            const oldBul2 = bul[2];
            if(bul[3] >= 0 && bullet){
                bul[3]--;
                const radian = (bul[4] + bul[5]) * Math.PI / 180;
                bul[1] += speedBullets * Math.sin(radian);
                bul[2] -= speedBullets * Math.cos(radian);
                bullet.style.transform = "translate("+bul[1] +"px, "+bul[2]+"px) rotate("+(bul[4]+bul[5])%360+"deg)";
            } 
            if(colliziia(bullet)){
                bul[1] = oldBul1;
                bul[2] = oldBul2;
                bullet.style.transform = "translate("+bul[1] +"px, "+bul[2]+"px) rotate("+(bul[4]+bul[5])%360+"deg)";
                bul[3] = 0;
            }
        });
        for(let i = bullets.length - 1; i >= 0; i--) {
            if(bullets[i][3] <= 0) {
                // console.log(bullets[i][0])
                document.getElementById(bullets[i][0])?.remove();
                bullets.splice(i, 1);
            }
        }
        tick.countBul++
        tick.lastTimeBull = time;
    }
    requestAnimationFrame(tick);
}

function colliziia(object){
    const Object = object.getBoundingClientRect();
    for (const wall of walls) {
        if(Object.right > (wall.left) && 
            Object.left < (wall.right) && 
            Object.bottom > (wall.top) && 
            Object.top < (wall.bottom)){
            return true;
        } 
    }
}

function createBullet(turret){
    createBullet.count = (createBullet.count || 0)
            turret = document.getElementById("gunpointTank");
            const object =  turret.getBoundingClientRect();
            const objectX = object.left- object.width;
            const objectY = object.top- object.height;
            const parent = document.getElementById("body");
            parent['append'](Object.assign(document.createElement("div"), {id: "bull" + createBullet.count, className: "bullet", style: "transform: translate(" + objectX + "px, " + objectY + "px) rotate("+(curTurretRotate+curTankRotate)%360+"deg)"}));
            bullets.push(["bull" + createBullet.count, objectX, objectY, 150, curTurretRotate, curTankRotate])
            createBullet.count++;
        }



socket.onopen = () => {
  console.log('Соединение с сервером установлено');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
if (data.type === 'welcome') {
  console.log(`Сервер сказал: ${data.number}`);
  myUserId = data.userId;
  const numberDiv = document.getElementById('connectionNumber');
  if (numberDiv) {
    numberDiv.innerHTML = `Номер: ${data.number}`;
  }
} else if(data.type === 'pong'){
  const ping = Math.ceil((Date.now() - data.clientTime)/2);
  if(ping < 60){
    document.getElementById("ping").style.color = "#00ff00";
  }else if(ping < 100){
     document.getElementById("ping").style.color = "#aaff00"
  }else if(ping < 150){
     document.getElementById("ping").style.color = "#ffdd00"
  }else if(ping < 250){
     document.getElementById("ping").style.color = "#ff8800"
  }else if(ping < 400){
     document.getElementById("ping").style.color = "#ff3300"
  }else{
     document.getElementById("ping").style.color = "#770000"
  }
  document.getElementById("ping").textContent = "ping: "+ping;
}else if (data.type === 'startposition'){
    curPositionX = data.X;
    curPositionY = data.Y;
    curTankRotate = data.Rotate;
    const parent = document.getElementById("body");
    parent['append'](Object.assign(document.createElement("div"), {id: "playerTank", style: "height: " + data.Height + "px; width: " + data.Width + "px; translate("+curPositionX +"px, "+curPositionY+"px) rotate("+curTankRotate+"deg)"}));
    playerTank = document.getElementById("playerTank");
    playerTank['append'](Object.assign(document.createElement("div"), {id: "leftTrack", className: "playerTankTrack trackFrame7"}));
    playerTank['append'](Object.assign(document.createElement("div"), {id: "rightTrack", className: "playerTankTrack trackFrame7"}));
    playerTank['append'](Object.assign(document.createElement("div"), {id: "playerTankBody", style: "height: " + data.Height + "px; width: " + data.Width + "px;)"}));
    playerTank['append'](Object.assign(document.createElement("div"), {id: "playerTankTurret"}));
    playerTankTurret = document.getElementById("playerTankTurret")
    playerTank['append'](Object.assign(document.createElement("div"), {id: "gunpointTank"}));
} else if (data.type === 'movement'){
    curTurretRotate = data.turretRotate;
    curPositionX = data.positionX;
    curPositionY = data.positionY;
    curTankRotate = data.tankRotate;
    playerTank.style.transform = "translate("+curPositionX +"px, "+curPositionY+"px) rotate("+curTankRotate+"deg)";
    playerTankTurret.style.transform = "translateX(-50%) rotate("+curTurretRotate+"deg)";
} else if (data.type === 'map') {
    for(let key in data.map.walls){
        const parent = document.getElementById("body");
        parent['append'](Object.assign(document.createElement("div"), {id: "wall"+key, className: "cement", style: "height: " + data.map.walls[key].Height + "px; width: " + data.map.walls[key].Width + "px; top:" + data.map.walls[key].Top + "px; left:" + data.map.walls[key].Left + "px;"}));
        console.log(document.getElementById("wall"+key).getBoundingClientRect())
        walls.push(document.getElementById("wall"+key).getBoundingClientRect());
    }

} else if (data.type === 'allTanks') {
  const currentTankIds = new Set();
  
  data.tanks.forEach(tankData => {
    currentTankIds.add(tankData.userId);
    
    // НЕ создаём танк для самого себя
    if (tankData.userId === myUserId) return;
    
    if (!otherTanks.has(tankData.userId)) {
      const tankDiv = document.createElement('div');
      tankDiv.className = 'otherTank';
      tankDiv.id = `otherTank_${tankData.userId}`;
      tankDiv.innerHTML = `
        <div id="leftTrack" class="playerTankTrack trackFrame7"></div>
        <div id="rightTrack" class="playerTankTrack trackFrame7"></div>
        <div class="otherTankBody"></div>
        <div class="otherTankTurret"></div>
      `;
      document.getElementById('body').appendChild(tankDiv);
      otherTanks.set(tankData.userId, tankDiv);
    }
    
    const tankElement = otherTanks.get(tankData.userId);
    if (tankElement) {
      tankElement.style.transform = `translate(${tankData.positionX}px, ${tankData.positionY}px) rotate(${tankData.tankRotate}deg)`;
      const turret = tankElement.querySelector('.otherTankTurret');
      if (turret) {
        turret.style.transform = `translateX(-50%) rotate(${tankData.turretRotate}deg)`;
      }
    }
  });
  
  // Удаляем танки отключившихся
  for (const [id, element] of otherTanks.entries()) {
    if (!currentTankIds.has(id)) {
      element.remove();
      otherTanks.delete(id);
    }
  }
}
};

socket.onerror = (error) => {
  console.error('Ошибка WebSocket:', error);
};

socket.onclose = () => {
  console.log('Соединение с сервером закрыто');
};