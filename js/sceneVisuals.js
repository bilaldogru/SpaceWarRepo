const planetImages = {};

function getPlanetImage(src) {
    if (!planetImages[src]) {
        const image = new Image();
        image.src = src;
        planetImages[src] = image;
    }
    return planetImages[src];
}

function drawFallbackPlanet(ctx, centerX, centerY, radius, color) {
    const gradient = ctx.createRadialGradient(
        centerX - radius * 0.35,
        centerY - radius * 0.35,
        radius * 0.08,
        centerX,
        centerY,
        radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.45, color);
    gradient.addColorStop(1, '#08101f');
    ctx.fillStyle = gradient;
    ctx.fill();
}

export function drawPlanetAsset(ctx, canvas, bolum, assetSrc) {
    const { x: centerX, y: centerY, radius } = getPlanetDefenseZone(canvas, bolum);
    const color = bolum.renk || '#5ae0ff';
    const image = getPlanetImage(assetSrc);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    if (image.complete && image.naturalWidth > 0) {
        const size = Math.min(radius * 2.02, image.naturalWidth);
        ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
    } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        drawFallbackPlanet(ctx, centerX, centerY, radius, color);
    }
    ctx.restore();

}

function drawPlanetImageAt(ctx, centerX, centerY, radius, color, image) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    if (image.complete && image.naturalWidth > 0) {
        const size = Math.min(radius * 2.02, image.naturalWidth);
        ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
    } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        drawFallbackPlanet(ctx, centerX, centerY, radius, color);
    }
    ctx.restore();

}

export function getPlanetDefenseZone(canvas, bolum) {
    const radius = bolum.gezegenYaricapi(canvas);
    return {
        x: canvas.width / 2,
        y: canvas.height - radius * 0.32,
        radius
    };
}

export function randomEdgeSpawn(canvas, margin = 70) {
    const edge = Math.floor(Math.random() * 4);

    if (edge === 0) {
        return { x: Math.random() * canvas.width, y: -margin };
    }
    if (edge === 1) {
        return { x: canvas.width + margin, y: Math.random() * canvas.height };
    }
    if (edge === 2) {
        return { x: Math.random() * canvas.width, y: canvas.height + margin };
    }

    return { x: -margin, y: Math.random() * canvas.height };
}

export function randomTopSideSpawn(canvas, margin = 70) {
    const edge = Math.floor(Math.random() * 3);

    if (edge === 0) {
        return { x: Math.random() * canvas.width, y: -margin };
    }
    if (edge === 1) {
        return { x: canvas.width + margin, y: Math.random() * canvas.height };
    }

    return { x: -margin, y: Math.random() * canvas.height };
}

export function moveEnemyToPlanet(enemy, canvas, bolum) {
    const planet = getPlanetDefenseZone(canvas, bolum);
    const dx = planet.x - enemy.x;
    const dy = planet.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    enemy.x += (dx / distance) * enemy.hiz;
    enemy.y += (dy / distance) * enemy.hiz;
}

export function enemyHitPlanet(enemy, canvas, bolum) {
    const planet = getPlanetDefenseZone(canvas, bolum);
    const dx = planet.x - enemy.x;
    const dy = planet.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < planet.radius * 0.72 + enemy.boyut / 2;
}

export function drawSquareEnemy(ctx, enemy, color) {
    const half = enemy.boyut / 2;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.fillRect(enemy.x - half, enemy.y - half, enemy.boyut, enemy.boyut);
    ctx.shadowBlur = 0;
    ctx.strokeRect(enemy.x - half, enemy.y - half, enemy.boyut, enemy.boyut);

    if (enemy.donmus) {
        ctx.strokeStyle = '#5ae0ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(enemy.x - half - 5, enemy.y - half - 5, enemy.boyut + 10, enemy.boyut + 10);
    }

    ctx.restore();
}

export function drawSquareEnemies(ctx, enemies, drawHealthBar) {
    enemies.forEach(enemy => {
        const color = enemy.tip === 'queen' ? '#f39c12'
            : enemy.tip === 'high' ? '#8e44ad'
            : '#ff4747';

        drawSquareEnemy(ctx, enemy, color);

        const half = enemy.boyut / 2;
        const barWidth = enemy.tip === 'queen' ? 70 : 40;
        const barX = enemy.tip === 'queen' ? 35 : 20;
        drawHealthBar(ctx, enemy.x - barX, enemy.y - half - 12, barWidth, 5, enemy.can, enemy.maxCan);
    });
}

export function drawAstraStyleScene(ctx, canvas, bolum, assetSrc) {
    drawPlanetAsset(ctx, canvas, bolum, assetSrc);
    drawSquareEnemies(ctx, bolum.dusmanlar, bolum.canBariCiz.bind(bolum));
}

export function drawSidePlanetScene(ctx, canvas, bolum, assetSrc) {
    const radius = bolum.gezegenYaricapi(canvas);
    const centerX = radius * 0.12;
    const centerY = canvas.height / 2;
    const color = bolum.renk || '#5ae0ff';
    const image = getPlanetImage(assetSrc);

    drawPlanetImageAt(ctx, centerX, centerY, radius, color, image);
    drawSquareEnemies(ctx, bolum.dusmanlar, bolum.canBariCiz.bind(bolum));
}
