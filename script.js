const playerTank = document.getElementById("playerTank")
const playerTankTurret = document.getElementById("playerTankTurret")
const speed = 4;
const rotateTank = 6;
const rotateTurret = 8;
let speedX = 0;
let speedY = 1;
let curPositionX = 0;
let curPositionY = 0;
let curTankRotate = 0;
let curTurretRotate = 0;
const keysDown = {
    W: false,
    S: false,
    A: false,
    D: false,
    Z: false,
    X: false
};

document.addEventListener('keydown', (e)=> {
        if(e.code === 'KeyD' || e.code === 'ArrowRight'){keysDown.D = true} 
        else if(e.code === 'KeyA' || e.code === 'ArrowLeft'){keysDown.A = true} 
        else if(e.code === 'KeyW' || e.code === 'ArrowUp'){keysDown.W = true} 
        else if(e.code === 'KeyS' || e.code === 'ArrowDown'){keysDown.S = true} 
        else if(e.code === 'Period' || e.code === 'KeyX'){keysDown.X = true}
        else if(e.code === 'Comma' || e.code === 'KeyZ'){keysDown.Z = true}
});

document.addEventListener('keyup', (e)=> {
        if(e.code === 'KeyD' || e.code === 'ArrowRight'){keysDown.D = false} 
        else if(e.code === 'KeyA' || e.code === 'ArrowLeft'){keysDown.A = false}
        else if(e.code === 'KeyW' || e.code === 'ArrowUp'){keysDown.W = false} 
        else if(e.code === 'KeyS' || e.code === 'ArrowDown'){keysDown.S = false}
        else if(e.code === 'Period' || e.code === 'KeyX'){keysDown.X = false}
        else if(e.code === 'Comma' || e.code === 'KeyZ'){keysDown.Z = false}
});

tick(performance.now());
function tick(time){
    tick.count = (tick.count || 0)
    if(time - (tick.lastTime || 0) >= 100){
        for (const key in keysDown){
            if(key == "W" && keysDown[key]){curPositionY -= speed} 
            if(key == "S" && keysDown[key]){curPositionY += speed} 
            if(key == "A" && keysDown[key]){curPositionX -= speed} 
            if(key == "D" && keysDown[key]){curPositionX += speed} 
            if(key == "Z" && keysDown[key]){curTurretRotate -= rotateTurret} 
            if(key == "X" && keysDown[key]){curTurretRotate += rotateTurret}
            playerTank.style.transform = "translate("+curPositionX+"px, "+curPositionY+"px)";
            playerTankTurret.style.transform = "rotate("+curTurretRotate+"deg)";
        }

        tick.count++;
        tick.lastTime = time;
    }
    requestAnimationFrame(tick);
}