// Yazılan kodların daha düzenli olması için ayrı dosyalara ayrıldı ve buradan import edildi.
// Oyun motoru bu dosya üzerinde çalışır.

import { arayuzuBaslat } from './ui.js';
import { gemi, gemiGorseli, gemiyiGuncelle, gemiyiCiz } from './player.js';
import { mermiAtesle, mermiler, mermileriGuncelleVeCiz } from './projectile.js';
import { aktifBolum, bolumleriBaslat } from './level.js';

// Canvas ayarları
const canvas = document.getElementById('yildiz-alani');
const ctx = canvas.getContext('2d');

// Galaxy radar canvas
const radarCanvas = document.getElementById('galaxy-radar');
const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

// Radar için sabit yıldız noktaları (gökada arka plan efekti)
const radarYildizlar = [];
for (let i = 0; i < 80; i++) {
    radarYildizlar.push({
        x: Math.random() * 220,
        y: Math.random() * 140,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.6 + 0.2
    });
}

// Ekran boyutunu ayarlar
function boyutlandir() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Gemiyi merkeze koy
    gemi.x = canvas.width / 2;
    gemi.y = canvas.height / 2;
}
// Pencere yeniden boyutlandırıldığında bunu optimize eder
window.addEventListener('resize', boyutlandir);

// Yıldızlar için değişkenler
const yildizlar = [];
const yildizSayisi = 200;

// Yıldızları oluştur
for (let i = 0; i < yildizSayisi; i++) {
    yildizlar.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        yaricap: Math.random() * 1.5 + 0.5,
        hiz: Math.random() * 0.5 + 0.1,
        parlaklik: Math.random()
    });
}

// Mouse sol tıka basıldığında ateş et
window.addEventListener('mousedown', (olay) => {
    if (olay.button === 0) {
        if (!aktifBolum || aktifBolum.atesEtmeyeIzinVar()) {
            mermiAtesle(gemi);
        }
    }
});

window.addEventListener('keydown', (olay) => {
    if ((olay.key === 'r' || olay.key === 'R') && aktifBolum) {
        aktifBolum.yenidenDoldur();
    }

    // Boşluk tuşu ile ateş et
    if (olay.key === ' ') {
        olay.preventDefault(); // Sayfanın kaymasını önler
        if (!aktifBolum || aktifBolum.atesEtmeyeIzinVar()) {
            mermiAtesle(gemi);
        }
    }
});

// --- GALAXY RADAR ÇİZİMİ ---
function galaxyRadarCiz() {
    if (!radarCtx || !aktifBolum || !aktifBolum.dusmanlar) {
        if (radarCanvas) radarCanvas.style.display = 'none';
        return;
    }
    radarCanvas.style.display = 'block';

    const rw = radarCanvas.width;   // 220
    const rh = radarCanvas.height;  // 140

    radarCtx.clearRect(0, 0, rw, rh);

    // Arka Plan: Karanlık uzay
    radarCtx.fillStyle = 'rgba(3, 8, 20, 0.95)';
    radarCtx.fillRect(0, 0, rw, rh);

    // Gökada ışıltısı (merkez parlama)
    const galaxyGlow = radarCtx.createRadialGradient(rw / 2, rh / 2, 5, rw / 2, rh / 2, 85);
    galaxyGlow.addColorStop(0, 'rgba(90, 224, 255, 0.07)');
    galaxyGlow.addColorStop(1, 'rgba(0,0,0,0)');
    radarCtx.fillStyle = galaxyGlow;
    radarCtx.fillRect(0, 0, rw, rh);

    // Arka plan yıldızları
    radarYildizlar.forEach(s => {
        radarCtx.beginPath();
        radarCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        radarCtx.fillStyle = `rgba(255,255,255,${s.a})`;
        radarCtx.fill();
    });

    // Izgara çizgileri
    radarCtx.strokeStyle = 'rgba(90, 224, 255, 0.09)';
    radarCtx.lineWidth = 1;
    for (let gx = 0; gx < rw; gx += 44) {
        radarCtx.beginPath(); radarCtx.moveTo(gx, 0); radarCtx.lineTo(gx, rh); radarCtx.stroke();
    }
    for (let gy = 0; gy < rh; gy += 35) {
        radarCtx.beginPath(); radarCtx.moveTo(0, gy); radarCtx.lineTo(rw, gy); radarCtx.stroke();
    }

    // 1. GEZEGEN (Sol taraf — Yarım daire)
    radarCtx.beginPath();
    radarCtx.arc(0, rh / 2, 42, -Math.PI / 2, Math.PI / 2);
    const planetGrad = radarCtx.createLinearGradient(0, 0, 36, 0);
    planetGrad.addColorStop(0, aktifBolum.renk || '#5ae0ff');
    planetGrad.addColorStop(1, 'transparent');
    radarCtx.fillStyle = planetGrad;
    radarCtx.globalAlpha = 0.6;
    radarCtx.fill();
    radarCtx.globalAlpha = 1.0;
    
    // Gezegen sınır çizgisi
    radarCtx.strokeStyle = aktifBolum.renk || '#5ae0ff';
    radarCtx.lineWidth = 1.5;
    radarCtx.stroke();

    // 2. OYUNCU GEMİSİ (Mavi büyük nokta)
    if (gemi) {
        const prx = (gemi.x / canvas.width) * (rw - 28) + 14;
        const pry = (gemi.y / canvas.height) * rh;

        radarCtx.beginPath();
        radarCtx.arc(prx, pry, 5, 0, Math.PI * 2);
        radarCtx.fillStyle = '#5ae0ff';
        radarCtx.shadowBlur = 15;
        radarCtx.shadowColor = '#5ae0ff';
        radarCtx.fill();
        
        // Merkez beyaz nokta (daha şık durması için)
        radarCtx.beginPath();
        radarCtx.arc(prx, pry, 1.5, 0, Math.PI * 2);
        radarCtx.fillStyle = '#ffffff';
        radarCtx.fill();
        
        radarCtx.shadowBlur = 0;
    }

    // 3. DÜŞMAN NOKTALARI
    const dusmanlar = aktifBolum.dusmanlar;
    dusmanlar.forEach(d => {
        // Oyun koordinatlarını radar koordinatlarına dönüştür
        const rx = (d.x / canvas.width) * (rw - 28) + 14;
        const ry = (d.y / canvas.height) * rh;

        // Tip bazlı renk: Queen=altın, High=mor, Normal=kırmızı
        let renk;
        if (d.tip === 'queen') renk = '#f39c12';
        else if (d.tip === 'high') renk = '#8e44ad';
        else renk = '#ff4747';

        const boyut = d.tip === 'queen' ? 4.5 : (d.tip === 'high' ? 3 : 2);

        radarCtx.beginPath();
        radarCtx.arc(rx, ry, boyut, 0, Math.PI * 2);
        radarCtx.fillStyle = renk;
        radarCtx.shadowBlur = d.tip === 'queen' ? 12 : 6;
        radarCtx.shadowColor = renk;
        radarCtx.fill();
        radarCtx.shadowBlur = 0;
    });

    // Etiket
    radarCtx.font = "bold 9px 'Orbitron', sans-serif";
    radarCtx.fillStyle = 'rgba(90, 224, 255, 0.5)';
    radarCtx.textAlign = 'left';
    radarCtx.fillText('GALAXY RADAR', 6, 12);
}

// Ana oyun döngüsü
function oyunDongusu() {
    // Ekranı temizler
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Yıldız animasyonu
    for (let i = 0; i < yildizSayisi; i++) {
        let yildiz = yildizlar[i];

        ctx.beginPath();
        ctx.arc(yildiz.x, yildiz.y, yildiz.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${yildiz.parlaklik})`;
        ctx.fill();

        yildiz.x -= yildiz.hiz * 3;

        if (yildiz.x < 0) {
            yildiz.x = canvas.width;
            yildiz.y = Math.random() * canvas.height;
        }
    }

    if (aktifBolum) {
        aktifBolum.guncelle(canvas, mermiler, gemi);
        aktifBolum.ciz(ctx, canvas);
    }

    // Diğer dosyalardaki fonksiyonları çalıştır
    gemiyiGuncelle(canvas);
    mermileriGuncelleVeCiz(ctx, canvas);
    gemiyiCiz(ctx);

    if (aktifBolum && aktifBolum.oyunBitti) {
        aktifBolum.oyunSonuEkraniCiz(ctx, canvas);
    }

    // Galaxy radar her karede güncellenir
    galaxyRadarCiz();

    // Her karede oyunDongusu fonksiyonunu tekrar çalıştır
    requestAnimationFrame(oyunDongusu);
}

// Oyunu başlatma adımları
arayuzuBaslat();
bolumleriBaslat();
boyutlandir();

if (gemiGorseli.complete) {
    oyunDongusu();
}
else gemiGorseli.onload = () => {
    oyunDongusu();
};
