const playerTank = document.getElementById("playerTank")
const playerTankTurret = document.getElementById("playerTankTurret")
const speed = 4;
const rotateTank = 6;
const rotateTurret = 8;
let speedX = 0;
let speedY = 1;
            const tank = document.getElementById("playerTank");
            const object =  tank.getBoundingClientRect();
            const objectX = object.left;
            const objectY = object.top;
let curPositionX = objectX ;
let curPositionY = objectY;
let curTankRotate = 0;
let curTurretRotate = 0;
const speedBullets = 25;
const bulletRecharge = 10;
let bulletRechargeCur = 10;
const bullets = [];
const keysDown = {
    W: false,
    S: false,
    A: false,
    D: false,
    Z: false,
    X: false,
    Space: false
};

const wall = document.getElementById("stone").getBoundingClientRect()

document.addEventListener('keydown', (e)=> {
        if(e.code === 'KeyD' || e.code === 'ArrowRight'){keysDown.D = true} 
        else if(e.code === 'KeyA' || e.code === 'ArrowLeft'){keysDown.A = true} 
        else if(e.code === 'KeyW' || e.code === 'ArrowUp'){keysDown.W = true} 
        else if(e.code === 'KeyS' || e.code === 'ArrowDown'){keysDown.S = true} 
        else if(e.code === 'Period' || e.code === 'KeyX'){keysDown.X = true}
        else if(e.code === 'Comma' || e.code === 'KeyZ'){keysDown.Z = true}
        else if(e.code === 'Space'){keysDown.Space = true}
});

document.addEventListener('keyup', (e)=> {
        if(e.code === 'KeyD' || e.code === 'ArrowRight'){keysDown.D = false} 
        else if(e.code === 'KeyA' || e.code === 'ArrowLeft'){keysDown.A = false}
        else if(e.code === 'KeyW' || e.code === 'ArrowUp'){keysDown.W = false} 
        else if(e.code === 'KeyS' || e.code === 'ArrowDown'){keysDown.S = false}
        else if(e.code === 'Period' || e.code === 'KeyX'){keysDown.X = false}
        else if(e.code === 'Comma' || e.code === 'KeyZ'){keysDown.Z = false}
        else if(e.code === 'Space'){keysDown.Space = false}
});

tick(performance.now());
function tick(time){
    tick.count = (tick.count || 0)
    if(time - (tick.lastTime || 0) >= 20){
        let oldX = curPositionX;
        let oldY = curPositionY;
        for (const key in keysDown){
            if(key == "W" && keysDown[key]){
                const radian = curTankRotate * Math.PI / 180;
                curPositionX += speed * Math.sin(radian);
                curPositionY -= speed * Math.cos(radian);
            } 
            if(key == "S" && keysDown[key]){
                const radian = curTankRotate * Math.PI / 180;
                curPositionX -= speed * Math.sin(radian);
                curPositionY += speed * Math.cos(radian);
            } 
            if(key == "A" && keysDown[key]){curTankRotate -= rotateTank} 
            if(key == "D" && keysDown[key]){curTankRotate += rotateTank} 
            if(key == "Z" && keysDown[key]){curTurretRotate -= rotateTurret} 
            if(key == "X" && keysDown[key]){curTurretRotate += rotateTurret}
            if(tick.count % bulletRecharge === 0){
                if(key == "Space" && keysDown[key]){createBullet();}
            }
            
            const tankCoor = tank.getBoundingClientRect();
            if(tankCoor.right > wall.left && 
                tankCoor.left < wall.right && 
                tankCoor.bottom > wall.top && 
                tankCoor.top < wall.bottom){
                curPositionX = oldX;
                curPositionY = oldY;
            } 
            playerTank.style.transform = "translate("+curPositionX +"px, "+curPositionY+"px) rotate("+curTankRotate+"deg)";
            playerTankTurret.style.transform = "rotate("+curTurretRotate+"deg)";
        }
        bullets.forEach(bul => {
            const bullet = document.getElementById(bul[0]);
            if(bul[3] >= 0 && bullet){
                bul[3]--;
                const radian = (bul[4] + bul[5]) * Math.PI / 180;
                bul[1] += speedBullets * Math.sin(radian);
                bul[2] -= speedBullets * Math.cos(radian);
                bullet.style.transform = "translate("+bul[1] +"px, "+bul[2]+"px) rotate("+(bul[4]+bul[5])%360+"deg)";
            } 
            const bulCoor = bullet.getBoundingClientRect();
            if(bulCoor.right > wall.left && 
                bulCoor.left < wall.right && 
                bulCoor.bottom > wall.top && 
                bulCoor.top < wall.bottom){
                bul[3]=0;
                console.log()
                 bullet?.remove();
            } 
            bullet?.addEventListener('transitionend', function opacity(e){
                bullet?.remove();
            })
        });
        for(let i = bullets.length - 1; i >= 0; i--) {
            if(bullets[i][3] < 0) {
                bullets.splice(i, 1);
            }
        }
        console.log(bullets[0])

        tick.count++;
        tick.lastTime = time;
    }
    requestAnimationFrame(tick);
}

function createBullet(turret){
    createBullet.count = (createBullet.count || 0)
            turret = document.getElementById("gunpointTank");
            const object =  turret.getBoundingClientRect();
            const objectX = object.left + window.scrollX;
            const objectY = object.top + window.scrollY;
            const parent = document.getElementById("body");
            parent['append'](Object.assign(document.createElement("div"), {id: "bull" + createBullet.count, className: "bullet", style: "transform: translate(" + objectX + "px, " + objectY + "px) rotate("+(curTurretRotate+curTankRotate)%360+"deg)"}));
            bullets.push(["bull" + createBullet.count, objectX, objectY, 10, curTurretRotate, curTankRotate])
            createBullet.count++;
        }