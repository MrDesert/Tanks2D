const playerTank = document.getElementById("playerTank")
const playerTankTurret = document.getElementById("playerTankTurret")
const speed = 2;
const rotate = 10;
let curPositionX = 0;
let curPositionY = 0;
let curRotate = 0;

document.addEventListener('keydown', (e)=> {
        if(e.code === 'KeyD'){
            e.preventDefault();
            curPositionX += speed;
        } else if(e.code === 'KeyA') {
            e.preventDefault();
            curPositionX -= speed; 
        } else if(e.code === 'KeyW') {
            e.preventDefault();
            curPositionY -= speed; 
        } else if(e.code === 'KeyS') {
            e.preventDefault();
            curPositionY += speed; 
        } else if(e.code === 'Period'){
            e.preventDefault();
            curRotate += rotate;
        }
        playerTankTurret.style.transform = "rotate("+curRotate+"deg)"
        playerTank.style.transform = "translate("+curPositionX+"px, "+curPositionY+"px)";
});