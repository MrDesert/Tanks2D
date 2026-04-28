// bakeMap.js - клиентская версия генерации карты

const TEXTURES = {
    grass: 'img/grass.png',
    grass_transition: 'img/grass_transition.png',
    stone_path: 'img/stone_path.png',
    brick: 'img/brick.png'
};

async function generateMapOnClient(mapData, options = {}) {
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;
    
    // Создаём canvas
    const canvas = document.createElement('canvas');
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const ctx = canvas.getContext('2d');
    
    // Отключаем сглаживание
    ctx.imageSmoothingEnabled = false;
    
    // Загружаем текстуры
    const textures = {};
    const loadPromises = [];
    
    for (const [name, texturePath] of Object.entries(TEXTURES)) {
        const promise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                textures[name] = img;
                console.log(`Загружена текстура: ${name}`);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Не удалось загрузить текстуру ${name}`);
                textures[name] = null;
                resolve();
            };
            img.src = texturePath;
        });
        loadPromises.push(promise);
    }
    
    // Ждём загрузки всех текстур
    await Promise.all(loadPromises);
    
    // Рисуем полы
    if (mapData.floors) {
        for (const key in mapData.floors) {
            const floor = mapData.floors[key];
            const texture = textures[floor.Material];
            const bgSize = floor.BackgroundSize || 50;
            const rotate = floor.Rotate || 0;
            
            if (texture) {
                ctx.save();
                
                if (rotate !== 0) {
                    const centerX = floor.Left + floor.Width / 2;
                    const centerY = floor.Top + floor.Height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(rotate * Math.PI / 180);
                    ctx.translate(-centerX, -centerY);
                }
                
                // Рисуем каждый тайл отдельно
                const cols = Math.ceil(floor.Width / bgSize);
                const rows = Math.ceil(floor.Height / bgSize);
                
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        ctx.drawImage(
                            texture,
                            0, 0, texture.width, texture.height,
                            floor.Left + i * bgSize, floor.Top + j * bgSize, bgSize, bgSize
                        );
                    }
                }
                
                ctx.restore();
            } else {
                ctx.fillStyle = '#4a7c3f';
                ctx.fillRect(floor.Left, floor.Top, floor.Width, floor.Height);
            }
        }
    }
    
    // Рисуем стены
    if (mapData.walls) {
        for (const key in mapData.walls) {
            const wall = mapData.walls[key];
            const texture = textures.brick;
            const bgSize = wall.BackgroundSize || 15;
            const rotate = wall.Rotate || 0;
            
            if (texture) {
                ctx.save();
                
                if (rotate !== 0) {
                    const centerX = wall.Left + wall.Width / 2;
                    const centerY = wall.Top + wall.Height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(rotate * Math.PI / 180);
                    ctx.translate(-centerX, -centerY);
                }
                
                const cols = Math.ceil(wall.Width / bgSize);
                const rows = Math.ceil(wall.Height / bgSize);
                
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        ctx.drawImage(
                            texture,
                            0, 0, texture.width, texture.height,
                            wall.Left + i * bgSize, wall.Top + j * bgSize, bgSize, bgSize
                        );
                    }
                }
                
                ctx.restore();
            } else {
                ctx.fillStyle = '#555555';
                ctx.fillRect(wall.Left, wall.Top, wall.Width, wall.Height);
            }
        }
    }
    
    // Получаем dataURL
    const imageDataURL = canvas.toDataURL('image/png');
    
    return imageDataURL;
}

// Функция для замены DOM-карты на запечённую картинку
async function bakeAndReplaceMap(mapData) {
    // Создаём map контейнер
    let mapContainer = document.getElementById('map');
    if (!mapContainer) {
        mapContainer = document.createElement('div');
        mapContainer.id = 'map';
        mapContainer.style.position = 'absolute';
        mapContainer.style.width = mapData.width + 'px';
        mapContainer.style.height = mapData.height + 'px';
        mapContainer.style.top = '0';
        mapContainer.style.left = '0';
        document.getElementById('body').appendChild(mapContainer);
    }
    
    console.log('Начинаем запекание карты...');
    const imageUrl = await generateMapOnClient(mapData);
    
    // Очищаем карту
    mapContainer.innerHTML = '';
    
    // Создаём img с запечённой картинкой
    const img = document.createElement('img');
    img.id = 'bakedMap';
    img.src = imageUrl;
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.top = '0';
    img.style.left = '0';
    img.style.pointerEvents = 'none';
    img.style.zIndex = '0';
    
    mapContainer.appendChild(img);
    
    // Создаём слой для стен (невидимый, только для коллизий)
    const wallsLayer = document.createElement('div');
    wallsLayer.id = 'wallsLayer';
    wallsLayer.style.position = 'absolute';
    wallsLayer.style.top = '0';
    wallsLayer.style.left = '0';
    wallsLayer.style.width = '100%';
    wallsLayer.style.height = '100%';
    wallsLayer.style.pointerEvents = 'none';
    wallsLayer.style.zIndex = '1';
    
    // Добавляем стены (невидимые, но нужны для коллизий)
    for(let key in mapData.walls){
        const wall = mapData.walls[key];
        const wallDiv = document.createElement('div');
        wallDiv.id = 'wall' + key;
        wallDiv.style.position = 'absolute';
        wallDiv.style.height = wall.Height + 'px';
        wallDiv.style.width = wall.Width + 'px';
        wallDiv.style.top = wall.Top + 'px';
        wallDiv.style.left = wall.Left + 'px';
        wallDiv.style.backgroundColor = 'transparent'; // Невидимые
        wallDiv.style.pointerEvents = 'none';
        wallsLayer.appendChild(wallDiv);
    }
    
    mapContainer.appendChild(wallsLayer);
    
    console.log('Карта запечена!');
    return mapContainer;
}

// Экспортируем для использования в основном коде
window.bakeMap = { generateMapOnClient, bakeAndReplaceMap };