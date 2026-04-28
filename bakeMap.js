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
        const promise = new Promise((resolve, reject) => {
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
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Элемент #map не найден');
        return;
    }
    
    console.log('Начинаем запекание карты...');
    const imageUrl = await generateMapOnClient(mapData);
    
    // Создаём img и заменяем содержимое
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.position = 'absolute';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.top = '0';
    img.style.left = '0';
    img.style.pointerEvents = 'none';
    img.style.zIndex = '0';
    
    // Очищаем и добавляем картинку
    mapContainer.innerHTML = '';
    mapContainer.appendChild(img);
    
    // Возвращаем стены (нужны для коллизий)
    for(let key in mapData.walls){
        const wall = mapData.walls[key];
        const wallDiv = document.createElement('div');
        wallDiv.className = 'cement';
        wallDiv.style.position = 'absolute';
        wallDiv.style.height = wall.Height + 'px';
        wallDiv.style.width = wall.Width + 'px';
        wallDiv.style.top = wall.Top + 'px';
        wallDiv.style.left = wall.Left + 'px';
        wallDiv.style.pointerEvents = 'none';
        wallDiv.style.zIndex = '1';
        mapContainer.appendChild(wallDiv);
    }
    
    console.log('Карта запечена!');
}

// Экспортируем для использования в основном коде
window.bakeMap = { generateMapOnClient, bakeAndReplaceMap };