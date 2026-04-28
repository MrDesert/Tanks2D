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
// const bullets = [];
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

// const walls = [];

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

function keyDownSensor(key, heldDown){
    if(key === "w"){
        keysDown.W = heldDown;
    }else if(key === "s"){
        keysDown.S = heldDown;
    }else if(key === "d"){
        keysDown.D = heldDown;
    }else if(key === "a"){
        keysDown.A = heldDown;
    }
}

const fps = document.getElementById("fps");
tick(performance.now());
function tick(time){
    tick.countTank = (tick.countTank || 0)

    if(time - (tick.lastFPS || 0) >= 1000){
      if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({type: "ping", clientTime: Date.now()}));
      } 
      fps.textContent = "fps: " + tick.FPScount;
      tick.FPScount = 0;
      tick.lastFPS = time;
    }
    tick.FPScount = (tick.FPScount || 0) + 1;

    if(time - (tick.lastTimeMove || 0) >= 16){
        // Отправляем данные о танке на сервер
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(keysDown));
      }     
        for (const key in keysDown){
            const leftTrack = document.getElementById("playerLeftTrack");
            const rightTrack = document.getElementById("playerRightTrack");
            if(key == "W" && keysDown[key]){
                // const radian = curTankRotate * Math.PI / 180;
                // curPositionX += speed * Math.sin(radian);
                // curPositionY -= speed * Math.cos(radian);
                if(trackFrameLeft >= 7){trackFrameLeft = 1;
                }else{trackFrameLeft++;}
                if(trackFrameRight >= 7){trackFrameRight = 1;
                }else{trackFrameRight++;}
                leftTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                leftTrack.classList.add("trackFrame"+trackFrameLeft);
                rightTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                rightTrack.classList.add("trackFrame"+trackFrameRight);
            } 
            if(key == "S" && keysDown[key]){
                // const radian = curTankRotate * Math.PI / 180;
                // curPositionX -= speed * Math.sin(radian);
                // curPositionY += speed * Math.cos(radian);
                if(trackFrameLeft <= 1){trackFrameLeft = 7;
                }else{trackFrameLeft--;}
                if(trackFrameRight <= 1){trackFrameRight = 7;
                }else{trackFrameRight--;}
                leftTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                leftTrack.classList.add("trackFrame"+trackFrameLeft);
                rightTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                rightTrack.classList.add("trackFrame"+trackFrameRight);
            } 
            if(key == "A" && keysDown[key]){
                // curTankRotate -= rotateTank;
                if(trackFrameLeft <= 1){trackFrameLeft = 7;
                }else{trackFrameLeft--;}
                if(trackFrameRight >= 7){trackFrameRight = 1;
                }else{trackFrameRight++;}
                leftTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                leftTrack.classList.add("trackFrame"+trackFrameLeft);
                rightTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                rightTrack.classList.add("trackFrame"+trackFrameRight);
            } 
            if(key == "D" && keysDown[key]){
                // curTankRotate += rotateTank;
                if(trackFrameLeft >= 7){trackFrameLeft = 1;
                }else{trackFrameLeft++;}
                if(trackFrameRight <= 1){trackFrameRight = 7;
                }else{trackFrameRight--;}
                leftTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                leftTrack.classList.add("trackFrame"+trackFrameLeft);
                rightTrack.classList.remove("trackFrame1", "trackFrame2", "trackFrame3", "trackFrame4", "trackFrame5", "trackFrame6", "trackFrame7")
                rightTrack.classList.add("trackFrame"+trackFrameRight);
            }             
            if(key == "Z" && keysDown[key]){curTurretRotate -= rotateTurret} 
            if(key == "X" && keysDown[key]){curTurretRotate += rotateTurret}

            if(playerTank){   
                playerTank.style.top = `${curPositionY}px`;
                playerTank.style.left = `${curPositionX}px`;
                playerTank.style.transform = "rotate("+curTankRotate+"deg)"
                playerTankTurret.style.transform = "translateX(-50%) rotate("+curTurretRotate+"deg)";
            }
        }
        tick.countTank++;
        tick.lastTimeMove = time;
    }
    // if(time - (tick.lastTimeBull || 0) >= 2){
    //     tick.countBul = (tick.countBul || 0)
    //     for (const key in keysDown){
    //         // if(tick.countBul >= bulletRecharge){
    //         //     if(key == "Space" && keysDown[key]){createBullet(); tick.countBul = 0;}
    //         // }
    //     }
    //     bullets.forEach(bul => {
    //         const bullet = document.getElementById(bul[0]);
    //         const oldBul1 = bul[1];
    //         const oldBul2 = bul[2];
    //         if(bul[3] >= 0 && bullet){
    //             bul[3]--;
    //             const radian = (bul[4] + bul[5]) * Math.PI / 180;
    //             bul[1] += speedBullets * Math.sin(radian);
    //             bul[2] -= speedBullets * Math.cos(radian);
    //             bullet.style.transform = "translate("+bul[1] +"px, "+bul[2]+"px) rotate("+(bul[4]+bul[5])%360+"deg)";
    //         } 
    //         if(colliziia(bullet)){
    //             bul[1] = oldBul1;
    //             bul[2] = oldBul2;
    //             bullet.style.transform = "translate("+bul[1] +"px, "+bul[2]+"px) rotate("+(bul[4]+bul[5])%360+"deg)";
    //             bul[3] = 0;
    //         }
    //     });
    //     for(let i = bullets.length - 1; i >= 0; i--) {
    //         if(bullets[i][3] <= 0) {
    //             // console.log(bullets[i][0])
    //             document.getElementById(bullets[i][0])?.remove();
    //             bullets.splice(i, 1);
    //         }
    //     }
    //     tick.countBul++
    //     tick.lastTimeBull = time;
    // }
    requestAnimationFrame(tick);
}

// function colliziia(object){
//     const Object = object.getBoundingClientRect();
//     for (const wall of walls) {
//         if(Object.right > (wall.left) && 
//             Object.left < (wall.right) && 
//             Object.bottom > (wall.top) && 
//             Object.top < (wall.bottom)){
//             return true;
//         } 
//     }
// }

// function createBullet(turret){
//     createBullet.count = (createBullet.count || 0)
//             turret = document.getElementById("gunpointTank");
//             const object =  turret.getBoundingClientRect();
//             const objectX = object.left- object.width;
//             const objectY = object.top- object.height;
//             const parent = document.getElementById("map");
//             parent['append'](Object.assign(document.createElement("div"), {id: "bull" + createBullet.count, className: "bullet", style: "transform: translate(" + objectX + "px, " + objectY + "px) rotate("+(curTurretRotate+curTankRotate)%360+"deg)"}));
//             bullets.push(["bull" + createBullet.count, objectX, objectY, 150, curTurretRotate, curTankRotate])
//             createBullet.count++;
//         }

function drawBullet(id, X, Y, Rotate){
  const bullet = document.getElementById("bull" + id);
  if(bullet){
    
    bullet.style.top = `${Y}px`;
    bullet.style.left = `${X}px`;
    bullet.style.transform = "rotate("+Rotate+"deg)"
  } else{
    const parent = document.getElementById("map");
    parent['append'](Object.assign(document.createElement("div"), {id: "bull" + id, className: "bullet", style: `top: ${Y}px; left: ${X}px; transform: rotate(${Rotate}deg); `}));
  }
}

socket.onopen = () => {
  console.log('Соединение с сервером установлено');
      // Запрашиваем карту
    // socket.send(JSON.stringify({ type: 'getMap' }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
if (data.type === 'welcome') {
  console.log(`Сервер сказал: ${data.userId}`);
  myUserId = data.userId;
  const numberDiv = document.getElementById('connectionNumber');
  if (numberDiv) {
    numberDiv.innerHTML = `Номер: ${data.userId}`;
  }
} else if(data.type === 'pong'){
    const ping = Math.ceil((Date.now() - data.clientTime)/2);
    const pingText = document.getElementById("ping");
    if      (ping < 60) {pingText.style.color = "#00ff00"}
    else if (ping < 100){pingText.style.color = "#aaff00"}
    else if (ping < 150){pingText.style.color = "#ffdd00"}
    else if (ping < 250){pingText.style.color = "#ff8800"}
    else if (ping < 400){pingText.style.color = "#ff3300"}
    else                {pingText.style.color = "#770000"}
    pingText.textContent = "ping: "+ping;
} else if (data.type === 'mapImage') {
    // Получили картинку карты
    const map = document.getElementById('map');
    if (!map) return;
    
    // Создаём img
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + data.imageBase64;
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.top = '0';
    img.style.left = '0';
    img.style.pointerEvents = 'none'; // чтобы не мешала кликам
    img.style.zIndex = '0';
    
    // Очищаем карту от старых полов, но оставляем стены
    const floors = map.querySelectorAll('.grass, .stone_path, .grass_transition');
    floors.forEach(floor => floor.remove());
    
    // Добавляем картинку в карту
    map.appendChild(img);
    
    // Опускаем картинку вниз (чтобы стены и танки были сверху)
    img.style.zIndex = '-1';
}else if(data.type === 'spawn'){
  animationOnce(data.id, "spawn")
}else if(data.type === "hp"){
   document.getElementById("hp").style.width = (data.hp>0? data.hp : 0)  +"%"
  document.getElementById("hp").textContent = "hp: " + data.hp;
}else if(data.type === 'death'){
  let leftTrack;
  let turret;
  let body;
  if(data.id === myUserId){
    body = document.getElementById("playerTankBody")
    document.getElementById("playerTank").classList.add("explosion-mark");
    turret = document.getElementById("playerTankTurret");
    leftTrack = document.getElementById("playerLeftTrack");
  }else{
    document.getElementById("otherTank_"+data.id).classList.add("explosion-mark");
    body = document.getElementById("otherTankBody_"+data.id);
    turret = document.getElementById("otherTankTurret_"+data.id);
    leftTrack = document.getElementById("leftTrack_"+data.id);
  }
  body.classList.add("tankBodyDestroyed");
  turret.classList.add("tankTurretDestroyed");
  const animationTurret = Math.floor(Math.random()*3)
  if(animationTurret != 0){
    turret.classList.add("flyTurret"+animationTurret); 
  }
  const animationBody = Math.floor(Math.random()*2)
  if(animationBody != 0){
    body.classList.add("tankBodyDestroyedFallen");
    leftTrack.classList.add("leftTrackKnockedOut");
  }
}else if(data.type === 'rebirth'){
  if(data.id === myUserId){
    document.getElementById("playerTank").classList.remove("explosion-mark");
    document.getElementById("playerTankBody").classList.remove("tankBodyDestroyed", "tankBodyDestroyedFallen");
    document.getElementById("playerTankTurret").classList.remove("tankTurretDestroyed", "flyTurret1", "flyTurret2");
    document.getElementById("playerLeftTrack").classList.remove("leftTrackKnockedOut");
  }else{
    document.getElementById("otherTank_"+data.id).classList.remove("explosion-mark");
    document.getElementById("otherTankBody_"+data.id).classList.remove("tankBodyDestroyed", "tankBodyDestroyedFallen");
    document.getElementById("otherTankTurret_"+data.id).classList.remove("tankTurretDestroyed", "flyTurret1", "flyTurret2");
    document.getElementById("leftTrack_"+data.id).classList.remove("leftTrackKnockedOut");
  }
}else if(data.type === 'bullets'){
    // Отрисовываем все пули из data.bullets
    for (let bullet of data.bullets) {
        drawBullet(bullet.id, bullet.positionX, bullet.positionY, bullet.angle);
    }
}else if(data.type === 'delBullet'){
  document.getElementById("bull" + data.id)?.classList.add("bulletDestroyed");
  setTimeout(() => {document.getElementById("bull" + data.id)?.remove();}, 200)
}else if (data.type === 'startposition'){
    curPositionX = data.X;
    curPositionY = data.Y;
    curTankRotate = data.Rotate;
    const parent = document.getElementById("map");
    parent['append'](Object.assign(document.createElement("div"), {id: "playerTank", style: ` height: ${data.Height}px; width: ${data.Width}px; top: ${curPositionY}px; left: ${curPositionX}px; transform: rotate(${curTankRotate}deg); `}));
    playerTank = document.getElementById("playerTank");
    playerTank['append'](Object.assign(document.createElement("div"), {id: "playerLeftTrack", className: "playerTankTrack leftTrack trackFrame7"}));
    playerTank['append'](Object.assign(document.createElement("div"), {id: "playerRightTrack", className: "playerTankTrack rightTrack trackFrame7"}));
    playerTank['append'](Object.assign(document.createElement("div"), {id: "playerTankBody", className: "playerTankBody", style: "height: " + data.Height + "px; width: " + data.Width + "px;)"}));
    playerTank['append'](Object.assign(document.createElement("div"), {id: "playerTankTurret", className: "playerTankTurret"}));
    playerTankTurret = document.getElementById("playerTankTurret");
    document.getElementById("hp").textContent = "hp: " + data.hp;
    updateCamera();
} else if (data.type === 'movement'){
    curTurretRotate = data.turretRotate;
    curPositionX = data.positionX;
    curPositionY = data.positionY;
    curTankRotate = data.tankRotate;
    playerTank.style.top = `${curPositionY}px`;
    playerTank.style.left = `${curPositionX}px`;
    playerTank.style.rotate = "rotate("+curTankRotate+"deg)"
    playerTankTurret.style.transform = "translateX(-50%) rotate("+curTurretRotate+"deg)";
    updateCamera();
} else if (data.type === 'map') {
    // document.getElementById("body")['append'](Object.assign(document.createElement("div"), {id: "map", style: "height: " + 600 + "px; width: " + 830 + "px; top:" + 0 + "px; left:" + 0 + "px;"}));
    // for(let key in data.map.floors){
    //   const parent = document.getElementById("map");
    //   parent['append'](Object.assign(document.createElement("div"), {id: "floor"+key, className: data.map.floors[key].Material, style: "height: " + data.map.floors[key].Height + "px; width: " + data.map.floors[key].Width + "px; top:" + data.map.floors[key].Top + "px; left:" + data.map.floors[key].Left + "px; rotate:" + data.map.floors[key].Rotate + "deg;"}));
    // };
    // for(let key in data.map.walls){
    //     const parent = document.getElementById("map");
    //     parent['append'](Object.assign(document.createElement("div"), {id: "wall"+key, className: "cement", style: "height: " + data.map.walls[key].Height + "px; width: " + data.map.walls[key].Width + "px; top:" + data.map.walls[key].Top + "px; left:" + data.map.walls[key].Left + "px;"}));
    //     // walls.push(document.getElementById("wall"+key).getBoundingClientRect());
    // }
    // updateCamera();
        // Сначала создаём map контейнер
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.position = 'absolute';
    mapDiv.style.width = '830px';
    mapDiv.style.height = '600px';
    mapDiv.style.top = '0';
    mapDiv.style.left = '0';
    document.getElementById('body').appendChild(mapDiv);
    
    // Запекаем карту (асинхронно)
    window.bakeMap.bakeAndReplaceMap(data.map).then(() => {
        updateCamera();
    });
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
        <div id="leftTrack_${tankData.userId}" class="playerTankTrack leftTrack trackFrame7"></div>
        <div id="rightTrack_${tankData.userId}" class="playerTankTrack rightTrack trackFrame7"></div>
        <div id="otherTankBody_${tankData.userId}" class="otherTankBody"></div>
        <div id="otherTankTurret_${tankData.userId}" class="otherTankTurret"></div>
      `;
      document.getElementById('map').appendChild(tankDiv);
      otherTanks.set(tankData.userId, tankDiv);
    }
    
    const tankElement = otherTanks.get(tankData.userId);
    if (tankElement) {
      tankElement.style.top = `${tankData.positionY}px`;
      tankElement.style.left = `${tankData.positionX}px`;
      tankElement.style.transform = `rotate(${tankData.tankRotate}deg)`;
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

let cameraZoom = 2
    const tankWidth = 43;
    const tankHeight = 80;
    const halfTankW = tankWidth / 2;   
    const halfTankH = tankHeight / 2;
    const MAP_WIDTH = 830;
    const MAP_HEIGHT = 600;
function updateCamera() {
    const tank = document.getElementById("playerTank");
    const map = document.getElementById("map");
    
    if (!tank || !map) return;
    
    const screenW = document.documentElement.clientWidth;
    const screenH = document.documentElement.clientHeight;
    
    let tankX = parseFloat(curPositionX) || 0;
    let tankY = parseFloat(curPositionY) || 0;
    
    const tankCenterX = tankX + halfTankW;
    const tankCenterY = tankY + halfTankH;
    
    // Желаемая позиция (танк по центру)
    let desiredMapX = screenW / 2 - (tankCenterX * cameraZoom);
    let desiredMapY = screenH / 2 - (tankCenterY * cameraZoom);
    
    // ГРАНИЦЫ (с учётом масштаба)
    const minMapX = screenW - (MAP_WIDTH * cameraZoom);
    const minMapY = screenH - (MAP_HEIGHT * cameraZoom);
    const maxMapX = 0;
    const maxMapY = 0;
    
    // Ограничиваем
    let finalMapX = Math.max(minMapX, Math.min(maxMapX, desiredMapX));
    let finalMapY = Math.max(minMapY, Math.min(maxMapY, desiredMapY));
    
    // ПОПРАВКА: Смещение из-за transform-origin
    // При scale карта увеличивается от левого верхнего угла
    // Нужно компенсировать, чтобы карта оставалась в пределах видимости
    const offsetX = (MAP_WIDTH * cameraZoom - MAP_WIDTH) / 2;
    const offsetY = (MAP_HEIGHT * cameraZoom - MAP_HEIGHT) / 2;
    
    map.style.transform = `translate(${finalMapX + offsetX}px, ${finalMapY + offsetY}px) scale(${cameraZoom})`;
}