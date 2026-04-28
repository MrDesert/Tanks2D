// server/generateMap.js
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const TEXTURES = {
    grass: 'img/grass.png',
    grass_transition: 'img/grass_transition.png',
    stone_path: 'img/stone_path.png',
    brick: 'img/brick.png'
};

async function generateMap(mapData, options = {}) {
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;
    
    if (!mapWidth || !mapHeight) {
        throw new Error('В JSON карты должны быть поля width и height');
    }
    
    const canvas = createCanvas(mapWidth, mapHeight);
    const ctx = canvas.getContext('2d');
    
    // Загружаем текстуры
    const textures = {};
    for (const [name, texturePath] of Object.entries(TEXTURES)) {
        try {
            textures[name] = await loadImage(path.resolve(texturePath));
            console.log(`Загружена текстура: ${name}, размер: ${textures[name].width}x${textures[name].height}`);
        } catch (err) {
            console.warn(`Не удалось загрузить текстуру ${name}:`, err.message);
            textures[name] = null;
        }
    }
    
    // Рисуем полы
    if (mapData.floors) {
        for (const key in mapData.floors) {
            const floor = mapData.floors[key];
            const texture = textures[floor.Material];
            const bgSize = floor.BackgroundSize || 50;
            const rotate = floor.Rotate || 0;
            
            if (texture) {
                ctx.save();
                
                // Смещаемся к центру блока (для поворота)
                const centerX = floor.Left + floor.Width / 2;
                const centerY = floor.Top + floor.Height / 2;
                ctx.translate(centerX, centerY);
                
                // Поворот
                if (rotate !== 0) {
                    ctx.rotate(rotate * Math.PI / 180);
                }
                
                // Возвращаемся обратно
                ctx.translate(-centerX, -centerY);
                
                // Рисуем текстуру с повторением
                ctx.save();
                ctx.beginPath();
                ctx.rect(floor.Left, floor.Top, floor.Width, floor.Height);
                ctx.clip();
                
                // Рисуем тайлы текстуры
                const cols = Math.ceil(floor.Width / bgSize);
                const rows = Math.ceil(floor.Height / bgSize);
                
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        ctx.drawImage(
                            texture,
                            floor.Left + i * bgSize,
                            floor.Top + j * bgSize,
                            bgSize,
                            bgSize
                        );
                    }
                }
                
                ctx.restore();
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
                
                // Смещаемся к центру блока (для поворота)
                const centerX = wall.Left + wall.Width / 2;
                const centerY = wall.Top + wall.Height / 2;
                ctx.translate(centerX, centerY);
                
                // Поворот для стены
                if (rotate !== 0) {
                    ctx.rotate(rotate * Math.PI / 180);
                }
                
                ctx.translate(-centerX, -centerY);
                
                // Рисуем текстуру с повторением
                ctx.beginPath();
                ctx.rect(wall.Left, wall.Top, wall.Width, wall.Height);
                ctx.clip();
                
                const cols = Math.ceil(wall.Width / bgSize);
                const rows = Math.ceil(wall.Height / bgSize);
                
                for (let i = 0; i < cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        ctx.drawImage(
                            texture,
                            wall.Left + i * bgSize,
                            wall.Top + j * bgSize,
                            bgSize,
                            bgSize
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
    
    const buffer = canvas.toBuffer('image/png');
    
    if (options.outputPath) {
        fs.writeFileSync(options.outputPath, buffer);
    }
    
    return buffer;
}

module.exports = { generateMap };