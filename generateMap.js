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

const WALL_SHADOW = {
    color: 'rgba(0, 0, 0, 0.5)',
    blur: 5,
    offsetX: 3,
    offsetY: 3
};

async function generateMap(mapData, options = {}) {
    // Берём размеры из JSON
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
        } catch (err) {
            console.warn(`Не удалось загрузить текстуру ${name}`);
            textures[name] = null;
        }
    }
    
    // Рисуем полы
    if (mapData.floors) {
        for (const key in mapData.floors) {
            const floor = mapData.floors[key];
            const texture = textures[floor.Material];
            
            if (texture) {
                const pattern = ctx.createPattern(texture, 'repeat');
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = '#4a7c3f';
            }
            
            ctx.fillRect(floor.Left, floor.Top, floor.Width, floor.Height);
        }
    }
    
    // Рисуем стены с тенями
    if (mapData.walls) {
        ctx.shadowColor = WALL_SHADOW.color;
        ctx.shadowBlur = WALL_SHADOW.blur;
        ctx.shadowOffsetX = WALL_SHADOW.offsetX;
        ctx.shadowOffsetY = WALL_SHADOW.offsetY;
        
        for (const key in mapData.walls) {
            const wall = mapData.walls[key];
            const texture = textures.brick;
            
            if (texture) {
                const pattern = ctx.createPattern(texture, 'repeat');
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = '#555555';
            }
            
            ctx.fillRect(wall.Left, wall.Top, wall.Width, wall.Height);
        }
        
        ctx.shadowColor = 'transparent';
    }
    
    const buffer = canvas.toBuffer('image/png');
    
    if (options.outputPath) {
        fs.writeFileSync(options.outputPath, buffer);
    }
    
    return buffer;
}

module.exports = { generateMap };