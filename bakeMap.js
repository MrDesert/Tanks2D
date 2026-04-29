async function buildAndBakeMap(mapData) {
    // 1. Строим DOM карты
    const body = document.getElementById("body");
    
    // Удаляем старую карту
    const oldMapBackground = document.getElementById("mapBackground");
    // if (oldMapBackground) oldMapBackground.remove();
    
    // Создаём контейнер
    // const mapBackground = document.createElement("div");
    // mapBackground.id = "mapBackground";
    // mapBackground.style.position = "absolute";
    // mapBackground.style.width = "830px";
    // mapBackground.style.height = "600px";
    // mapBackground.style.top = "0px";
    // mapBackground.style.left = "0px";
    // body.appendChild(mapBackground);
    
    // Строим полы
    for (let key in mapData.floors) {
        console.log(mapData.floors)
        const floor = mapData.floors[key];
        const div = document.createElement("div");
        div.className = floor.Material;
        div.style.position = "absolute";
        div.style.width = floor.Width + "px";
        div.style.height = floor.Height + "px";
        div.style.top = floor.Top + "px";
        div.style.left = floor.Left + "px";
        if (floor.Rotate) {
            div.style.transform = "rotate(" + floor.Rotate + "deg)";
        }
        mapBackground.appendChild(div);
    }
    
    // Строим стены
    for (let key in mapData.walls) {
        const wall = mapData.walls[key];
        const div = document.createElement("div");
        div.className = "cement";
        div.style.position = "absolute";
        div.style.width = wall.Width + "px";
        div.style.height = wall.Height + "px";
        div.style.top = wall.Top + "px";
        div.style.left = wall.Left + "px";
        if (wall.Rotate) {
            div.style.transform = "rotate(" + wall.Rotate + "deg)";
        }
        mapBackground.appendChild(div);
    }
    
    // 2. Ждём рендеринга
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Запекаем через DOM (getComputedStyle)
    await bakeMapFromDOM();
}

async function bakeMapFromDOM() {
    const mapContainer = document.getElementById("mapBackground");
    if (!mapContainer) return;
    
    const bakeScale = 2;
    const mapWidth = 830 * bakeScale;
    const mapHeight = 600 * bakeScale;
    
    const canvas = document.createElement('canvas');
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    const elements = mapContainer.querySelectorAll('.grass, .grass_transition, .stone_path, .cement');
    
    for (let el of elements) {
        const rect = el.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        
        const x = (rect.left - containerRect.left) * bakeScale;
        const y = (rect.top - containerRect.top) * bakeScale;
        const w = rect.width * bakeScale;
        const h = rect.height * bakeScale;
        
        const bgImage = getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage !== 'none') {
            const img = new Image();
            img.src = bgImage.slice(5, -2);
            
            await new Promise((resolve) => {
                img.onload = () => {
                    ctx.save();
                    
                    // Поворот из CSS
                    const transform = getComputedStyle(el).transform;
                    if (transform !== 'none') {
                        const matrix = transform.match(/matrix\((.+)\)/);
                        if (matrix) {
                            const values = matrix[1].split(', ');
                            const angle = Math.atan2(values[1], values[0]) * 180 / Math.PI;
                            const centerX = x + w / 2;
                            const centerY = y + h / 2;
                            ctx.translate(centerX, centerY);
                            ctx.rotate(angle * Math.PI / 180);
                            ctx.translate(-centerX, -centerY);
                        }
                    }
                    
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();
                    
                    const bgSize = parseInt(getComputedStyle(el).backgroundSize);
                    const size = bgSize * bakeScale;
                    
                    for (let i = 0; i < w; i += size) {
                        for (let j = 0; j < h; j += size) {
                            ctx.drawImage(img, x + i, y + j, size, size);
                        }
                    }
                    
                    ctx.restore();
                    resolve();
                };
                if (img.complete) img.onload();
            });
        }
    }
    
    // Создаём картинку
    const finalImg = document.createElement('img');
    finalImg.src = canvas.toDataURL('image/png');
    finalImg.style.position = 'absolute';
    finalImg.style.width = '100%';
    finalImg.style.height = '100%';
    finalImg.style.top = '0';
    finalImg.style.left = '0';
    finalImg.style.zIndex = '-1';
    finalImg.style.imageRendering = 'pixelated';
    // finalImg.style.scale = '2';
    
    mapContainer.innerHTML = '';
    mapContainer.appendChild(finalImg);
    
    console.log('Карта запечена из DOM');
}