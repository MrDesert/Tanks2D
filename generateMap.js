// server/generateMap.js
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const TEXTURES = {
    grass: 'public/img/grass.png',
    grass_transition: 'public/img/grass_transition.png',
    stone_path: 'public/img/stone_path.png',
    brick: 'public/img/brick.png'
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
            const bgSize = floor.BackgroundSize || 50; // дефолт 50px
            
            if (texture) {
                // 👇 ВОТ ЭТОТ КОД ВСТАВИТЬ СЮДА
                ctx.save();
                ctx.translate(floor.Left, floor.Top);
                
                const pattern = ctx.createPattern(texture, 'repeat');
                ctx.fillStyle = pattern;
                
                const scale = bgSize / texture.width;
                ctx.scale(scale, scale);
                ctx.fillRect(0, 0, floor.Width / scale, floor.Height / scale);
                
                ctx.restore();
                // 👆 КОНЕЦ ВСТАВКИ
            } else {
                // Fallback цвет
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
            const bgSize = wall.BackgroundSize || 15; // дефолт 15px для стен
            
            if (texture) {
                // 👇 И ДЛЯ СТЕН ТОЖЕ САМОЕ
                ctx.save();
                ctx.translate(wall.Left, wall.Top);
                
                const pattern = ctx.createPattern(texture, 'repeat');
                ctx.fillStyle = pattern;
                
                const scale = bgSize / texture.width;
                ctx.scale(scale, scale);
                ctx.fillRect(0, 0, wall.Width / scale, wall.Height / scale);
                
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