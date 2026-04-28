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
    
    const canvas = createCanvas(mapWidth, mapHeight);
    const ctx = canvas.getContext('2d');
    
    // Отключаем сглаживание
    ctx.imageSmoothingEnabled = false;
    
    // Загружаем текстуры
    const textures = {};
    for (const [name, texturePath] of Object.entries(TEXTURES)) {
        try {
            textures[name] = await loadImage(path.resolve(texturePath));
            console.log(`Загружена текстура: ${name}`);
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
                // 👇 ВОТ ЭТОТ КОД ВСТАВИТЬ ВМЕСТО СТАРОГО
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
                // 👆 КОНЕЦ ВСТАВКИ
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
                // 👇 И ДЛЯ СТЕН ТОЖЕ САМОЕ
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
                // 👆
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