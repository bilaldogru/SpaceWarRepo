const planetImages = {};

/**
 * Gezegen görselini önbellekten (cache) alır, eğer yoksa yükler.
 * Nerede kullanılır: drawPlanetAsset ve drawSidePlanetScene içerisinde.
 * Neden kullanılır: Aynı görselin sürekli baştan yüklenmesini önleyerek performansı artırmak için.
 */
function getPlanetImage(src) {
    if (!planetImages[src]) {
        const image = new Image();
        image.src = src;
        planetImages[src] = image;
    }
    return planetImages[src];
}

/**
 * Görsel yüklenemediği durumlarda degrade (gradient) ile yedek bir gezegen çizer.
 * Nerede kullanılır: drawPlanetAsset ve drawPlanetImageAt içinde, görsel yüklenirken veya hata verirse.
 * Neden kullanılır: Oyunun görselsiz kalmasını engellemek ve estetik bir dolgu sağlamak için.
 */
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

/**
 * Verilen bölüm ayarlarına göre gezegeni ekranın alt ortasına çizer (Astra stili).
 * Nerede kullanılır: Astra bölümü veya benzeri aşağıda gezegen olan seviyelerin ciz() fonksiyonunda.
 * Neden kullanılır: Savunulacak hedef gezegenin görselleştirilmesi için.
 */
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

/**
 * Belirtilen koordinatlara gezegen görselini veya yedek çizimi yerleştirir.
 * Nerede kullanılır: drawSidePlanetScene gibi özel konumlara sahip seviyelerin çiziminde.
 * Neden kullanılır: Gezegeni sadece alta değil, sol/sağ gibi farklı yerlere konumlandırabilmek için esneklik sağlar.
 */
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

/**
 * Düşmanların gezegene ulaşmış sayılıp hasar vereceği çarpışma (savunma) bölgesini hesaplar.
 * Nerede kullanılır: Düşman yöneliminde (moveEnemyToPlanet) ve hasar kontrolünde (enemyHitPlanet).
 * Neden kullanılır: Merkez koordinatı ve yarıçapını tek bir yerden almak, çarpışma sınırlarını doğru ayarlamak için.
 */
export function getPlanetDefenseZone(canvas, bolum) {
    const radius = bolum.gezegenYaricapi(canvas);
    return {
        x: canvas.width / 2,
        y: canvas.height - radius * 0.32,
        radius
    };
}

/**
 * Ekranın rastgele bir kenarından (üst, alt, sağ, sol) dışarıda kalacak şekilde bir başlangıç noktası üretir.
 * Nerede kullanılır: Düşman spawn edilirken başlangıç lokasyonunu belirlemede.
 * Neden kullanılır: Düşmanların ekran dışından geliyormuş gibi görünmesini sağlamak için.
 */
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

/**
 * Ekranın üst, sağ veya sol kenarının üst yarısından düşmanlar için başlangıç noktası seçer.
 * Nerede kullanılır: Düşmanların sadece üst bölgelerden gelmesi istenen seviyelerde.
 * Neden kullanılır: Gezegen altta olduğunda düşmanların alttan çıkıp hemen çarpmasını engellemek için.
 */
export function randomTopSideSpawn(canvas, margin = 70) {
    const edge = Math.floor(Math.random() * 3);
    const sideY = Math.random() * Math.max(1, canvas.height - 280) + 120;

    if (edge === 0) {
        return { x: Math.random() * canvas.width, y: -margin };
    }
    if (edge === 1) {
        return { x: canvas.width + margin, y: sideY };
    }

    return { x: -margin, y: sideY };
}

/**
 * Düşmanı mevcut konumundan hedef gezegenin merkezine doğru hareket ettirir.
 * Nerede kullanılır: Serbest hareket eden (koridorsuz) düşmanların update fonksiyonlarında.
 * Neden kullanılır: Düşmanların oyuncunun koruması gereken asıl hedefe ilerlemesini sağlamak için.
 */
export function moveEnemyToPlanet(enemy, canvas, bolum) {
    const planet = getPlanetDefenseZone(canvas, bolum);
    const dx = planet.x - enemy.x;
    const dy = planet.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    enemy.x += (dx / distance) * enemy.hiz;
    enemy.y += (dy / distance) * enemy.hiz;
}

/**
 * Bir düşmanın hedeflenen gezegen ile çarpışıp çarpışmadığını kontrol eder.
 * Nerede kullanılır: Düşman güncellemelerinde (guncelleDusmanlar içinde), can kaybı hesaplamasında.
 * Neden kullanılır: Düşman gezegene ulaştıysa oyuncuya hasar vermek ve düşmanı yok etmek için.
 */
export function enemyHitPlanet(enemy, canvas, bolum) {
    const planet = getPlanetDefenseZone(canvas, bolum);
    const dx = planet.x - enemy.x;
    const dy = planet.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < planet.radius * 0.72 + enemy.boyut / 2;
}

/**
 * Tek bir düşman karesini (veya kendi draw fonksiyonu varsa onu) ve donma (yavaşlama) efektini ekrana çizer.
 * Nerede kullanılır: drawSquareEnemies döngüsü içerisinde her bir düşman için.
 * Neden kullanılır: Düşmanın görsel durumunu ve taretlerden aldığı eksi/artı etkileri göstermek için.
 */
export function drawSquareEnemy(ctx, enemy, color) {
    if (typeof enemy.draw === 'function') {
        enemy.draw(ctx);
    } else {
        const half = enemy.boyut / 2;
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(enemy.x - half, enemy.y - half, enemy.boyut, enemy.boyut);
        ctx.restore();
    }

    if (enemy.donmus) {
        const half = enemy.boyut / 2;
        ctx.save();
        ctx.strokeStyle = '#5ae0ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(enemy.x - half - 5, enemy.y - half - 5, enemy.boyut + 10, enemy.boyut + 10);
        ctx.restore();
    }
}

/**
 * Tüm aktif düşmanları tiplerine göre renklendirerek çizer ve üzerlerine can barlarını ekler.
 * Nerede kullanılır: drawAstraStyleScene, drawSidePlanetScene vb. bölüm çizim fonksiyonlarında.
 * Neden kullanılır: Düşman dizisindeki herkesin ekranda uygun renkte ve can durumuyla belirmesini sağlamak için.
 */
export function drawSquareEnemies(ctx, enemies, drawHealthBar) {
    enemies.forEach(enemy => {
        const color = enemy.tip === '5' ? '#f39c12'
            : enemy.tip === '4' ? '#e67e22'
            : enemy.tip === '3' ? '#5ae0ff'
            : enemy.tip === '2' ? '#8e44ad'
            : '#ff4747';

        drawSquareEnemy(ctx, enemy, color);

        const half = enemy.boyut / 2;
        const barWidth = enemy.tip === '5' || enemy.tip === '4' ? 70 : 40;
        const barX = enemy.tip === '5' || enemy.tip === '4' ? 35 : 20;
        drawHealthBar(ctx, enemy.x - barX, enemy.y - half - 12, barWidth, 5, enemy.can, enemy.maxCan);
    });
}

/**
 * Düşmanların attığı lazerleri (mermileri) pembe neon tarzında ekrana çizer.
 * Nerede kullanılır: Bölüm çizim fonksiyonlarında (drawAstraStyleScene vb.)
 * Neden kullanılır: Oyuncuya gelen tehdidi görselleştirerek ondan kaçmasını sağlamak için.
 */
export function drawEnemyLasers(ctx, lasers = []) {
    lasers.forEach(laser => {
        ctx.save();
        ctx.strokeStyle = '#ff5ef7';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ff5ef7';
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.x - laser.hizX * 4, laser.y - laser.hizY * 4);
        ctx.stroke();
        ctx.restore();
    });
}

/**
 * Standart bir "Astra" tarzı seviye (aşağıda gezegen olan) için genel sahneyi çizer.
 * Nerede kullanılır: astra.js ve kron.js seviyelerinin ciz() fonksiyonunda.
 * Neden kullanılır: Tüm elementleri (gezegen, lazer, düşman) tek fonksiyonda sırayla çizmek için.
 */
export function drawAstraStyleScene(ctx, canvas, bolum, assetSrc) {
    drawPlanetAsset(ctx, canvas, bolum, assetSrc);
    drawEnemyLasers(ctx, bolum.lazerler);
    drawSquareEnemies(ctx, bolum.dusmanlar, bolum.canBariCiz.bind(bolum));
}

/**
 * Yan tarafa (sola/sağa) konumlanmış gezegenlere sahip seviyeler için özel sahne çizimini yapar.
 * Nerede kullanılır: vega.js gibi özel gezegen konumu olan seviyelerde.
 * Neden kullanılır: Gezegen çizimi merkezini ve yönünü standart Astra tipinden farklı şekilde oluşturmak için.
 */
export function drawSidePlanetScene(ctx, canvas, bolum, assetSrc) {
    const radius = bolum.gezegenYaricapi(canvas);
    const centerX = radius * 0.12;
    const centerY = canvas.height / 2;
    const color = bolum.renk || '#5ae0ff';
    const image = getPlanetImage(assetSrc);

    drawPlanetImageAt(ctx, centerX, centerY, radius, color, image);
    drawEnemyLasers(ctx, bolum.lazerler);
    drawSquareEnemies(ctx, bolum.dusmanlar, bolum.canBariCiz.bind(bolum));
}
