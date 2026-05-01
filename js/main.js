// Yazılan kodların daha düzenli olması için ayrı dosyalara ayrıldı ve buradan import edildi.
// Oyun motoru bu dosya üzerinde çalışır.

import { arayuzuBaslat } from './ui.js';
import { gemi, gemiGorseli, gemiyiGuncelle, gemiyiCiz } from './player.js';
import { mermiAtesle, mermileriGuncelleVeCiz } from './projectile.js';

// Canvas ayarları
const canvas = document.getElementById('yildiz-alani');
const ctx = canvas.getContext('2d');

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
    yildizlar.push(
        {
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
        mermiAtesle(gemi);
    }
});
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

    // Diğer dosyalardaki fonksiyonları çalıştır
    gemiyiGuncelle(canvas);
    mermileriGuncelleVeCiz(ctx, canvas);
    gemiyiCiz(ctx);

    // Her karede oyunDongusu fonksiyonunu tekrar çalıştır
    requestAnimationFrame(oyunDongusu);
}

// Oyunu başlatma adımları
arayuzuBaslat();
boyutlandir();

gemiGorseli.onload = () => {
    oyunDongusu();
};