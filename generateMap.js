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
    
    // ОТКЛЮЧАЕМ СГЛАЖИВАНИЕ для чёткого уменьшения
    ctx.imageSmoothingEnabled = false;
    
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
                
                // Для поворота
                if (rotate !== 0) {
                    const centerX = floor.Left + floor.Width / 2;
                    const centerY = floor.Top + floor.Height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(rotate * Math.PI / 180);
                    ctx.translate(-centerX, -centerY);
                }
                
                // Рисуем заливку текстурой
                const patternCanvas = createCanvas(bgSize, bgSize);
                const patternCtx = patternCanvas.getContext('2d');
                patternCtx.imageSmoothingEnabled = false;
                
                // Рисуем текстуру в нужном размере (уменьшаем с сохранением чёткости)
                patternCtx.drawImage(texture, 0, 0, bgSize, bgSize);
                
                const pattern = ctx.createPattern(patternCanvas, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(floor.Left, floor.Top, floor.Width, floor.Height);
                
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
                
                const patternCanvas = createCanvas(bgSize, bgSize);
                const patternCtx = patternCanvas.getContext('2d');
                patternCtx.imageSmoothingEnabled = false;
                patternCtx.drawImage(texture, 0, 0, bgSize, bgSize);
                
                const pattern = ctx.createPattern(patternCanvas, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(wall.Left, wall.Top, wall.Width, wall.Height);
                
                ctx.restore();
            } else {
                ctx.fillStyle = '#555555';
                ctx.fillRect(wall.Left, wall.Top, wall.Width, wall.Height);
            }
        }
    }
    
    return canvas.toBuffer('image/png');
}

module.exports = { generateMap };