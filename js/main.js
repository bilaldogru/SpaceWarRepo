import { arayuzuBaslat } from './core/ui.js';
import { gemi, gemiyiGuncelle, gemiyiCiz } from './core/player.js';
import { mermiAtesle, mermiler, mermileriGuncelleVeCiz } from './core/projectile.js';
import { aktifBolum, bolumleriBaslat } from './level.js';
import { fare } from './core/input.js';

// Canvas ve çizim kalemi oyunun ana görsel alanıdır.
const canvas = document.getElementById('yildiz-alani');
const ctx = canvas.getContext('2d');

// Ekran boyutu değiştiğinde canvası ekrana uydurur.
// Oyun ilk açıldığında gemiyi ekranın merkezine koyar.
function boyutlandir() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gemi.x = canvas.width / 2;
    gemi.y = canvas.height / 2;
}

window.addEventListener('resize', boyutlandir);

// Arka planda kayan yıldızlar için basit bir liste oluşturuyoruz.
const yildizlar = [];
const yildizSayisi = 200;

for (let i = 0; i < yildizSayisi; i++) {
    const yeniYildiz = {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        yaricap: Math.random() * 1.5 + 0.5,
        hiz: Math.random() * 0.5 + 0.1,
        parlaklik: Math.random()
    };

    yildizlar.push(yeniYildiz);
}

// Fareye basılınca oyuncu ateş eder.
window.addEventListener('mousedown', function (olay) {
    if (aktifBolum !== null && aktifBolum !== undefined) {
        if (aktifBolum.suruklenenModul !== null && aktifBolum.suruklenenModul !== undefined) {
            return;
        }
    }

    fare.x = olay.clientX;
    fare.y = olay.clientY;

    if (olay.button !== 0) {
        return;
    }

    let atesEdebilir = false;

    if (aktifBolum === null || aktifBolum === undefined) {
        atesEdebilir = true;
    }
    else if (aktifBolum.atesEtmeyeIzinVar() === true) {
        atesEdebilir = true;
    }

    if (atesEdebilir === true) {
        mermiAtesle(gemi, aktifBolum);
    }
});

// Taret sürükleniyorsa fare hareketi ile taretin gölge konumu güncellenir.
window.addEventListener('mousemove', function (olay) {
    if (aktifBolum !== null && aktifBolum !== undefined) {
        if (typeof aktifBolum.modulSuruklemeGuncelle === 'function') {
            aktifBolum.modulSuruklemeGuncelle(canvas, olay.clientX, olay.clientY);
        }
    }
});

// Fare bırakılınca taret yerleştirme işlemi tamamlanır.
window.addEventListener('mouseup', function (olay) {
    if (olay.button === 0) {
        if (aktifBolum !== null && aktifBolum !== undefined) {
            if (typeof aktifBolum.modulSuruklemeBitir === 'function') {
                aktifBolum.modulSuruklemeBitir(canvas, olay.clientX, olay.clientY);
            }
        }
    }
});

// Oyuncu pencere dışına çıkarsa sürükleme yarım kalmasın diye iptal edilir.
window.addEventListener('blur', function () {
    if (aktifBolum !== null && aktifBolum !== undefined) {
        if (typeof aktifBolum.modulSuruklemeIptal === 'function') {
            aktifBolum.modulSuruklemeIptal();
        }
    }
});

window.addEventListener('keydown', function (olay) {
    // R tuşu mermi doldurur.
    if (olay.key === 'r' || olay.key === 'R') {
        if (aktifBolum !== null && aktifBolum !== undefined) {
            aktifBolum.yenidenDoldur();
        }
    }

    // Boşluk tuşu da ateş etmek için kullanılır.
    if (olay.key === ' ') {
        olay.preventDefault();

        let atesEdebilir = false;
        if (aktifBolum === null || aktifBolum === undefined) {
            atesEdebilir = true;
        }
        else if (aktifBolum.atesEtmeyeIzinVar() === true) {
            atesEdebilir = true;
        }

        if (atesEdebilir === true) {
            mermiAtesle(gemi, aktifBolum);
        }
    }

    // Oyun bittiyse Escape veya Enter ile menüye dönülür.
    if (olay.key === 'Escape' || olay.key === 'Enter') {
        if (aktifBolum !== null && aktifBolum !== undefined) {
            if (aktifBolum.oyunBitti === true) {
                const menuButonu = document.getElementById('hud-ana-menu-btn');
                if (menuButonu !== null) {
                    menuButonu.click();
                }
            }
        }
    }
});

// Arka plandaki yıldızları hareket ettirip çizer.
function yildizlariCiz() {
    for (let i = 0; i < yildizSayisi; i++) {
        const yildiz = yildizlar[i];

        ctx.beginPath();
        ctx.arc(yildiz.x, yildiz.y, yildiz.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + yildiz.parlaklik + ')';
        ctx.fill();

        yildiz.x = yildiz.x - yildiz.hiz * 3;

        if (yildiz.x < 0) {
            yildiz.x = canvas.width;
            yildiz.y = Math.random() * canvas.height;
        }
    }
}

// Oyunun ana döngüsü.
// Her karede önce temizler, sonra oyun elemanlarını günceller ve çizer.
function oyunDongusu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    yildizlariCiz();
    gemiyiGuncelle(canvas, aktifBolum);

    if (aktifBolum !== null && aktifBolum !== undefined) {
        aktifBolum.guncelle(canvas, mermiler, gemi);
        aktifBolum.ciz(ctx, canvas);
    }

    mermileriGuncelleVeCiz(ctx, canvas, aktifBolum);

    let kamera = { x: 0, y: 0 };
    if (aktifBolum !== null && aktifBolum !== undefined) {
        if (aktifBolum.kamera !== undefined && aktifBolum.kamera !== null) {
            kamera = aktifBolum.kamera;
        }
    }
    gemiyiCiz(ctx, kamera);

    if (aktifBolum !== null && aktifBolum !== undefined) {
        if (aktifBolum.oyunBitti === true) {
            aktifBolum.oyunSonuEkraniCiz(ctx, canvas);
        }
    }

    requestAnimationFrame(oyunDongusu);
}

// Arayüz, bölümler ve canvas hazırlandıktan sonra oyun döngüsü hemen başlar.
// Gemi resmi geç yüklenirse player.js içinde yedek çizim kullanılır.
arayuzuBaslat();
bolumleriBaslat();
boyutlandir();
oyunDongusu();
