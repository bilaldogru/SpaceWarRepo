import { atisSesiCal } from './audio.js';
import { fare } from './input.js';

// Oyuncunun attigi aktif mermiler bu dizide tutulur.
export const mermiler = [];

// Merminin her karede ne kadar hizla ilerleyecegi.
const mermiHizi = 6.8;

// Yeni bolume gecince veya menuye donunce eski mermileri temizler.
export function mermileriTemizle() {
    mermiler.length = 0;
}

// Oyuncu ates ettiginde yeni bir mermi olusturur.
export function mermiAtesle(gemi, bolum) {
    atisSesiCal();

    let kamera = { x: 0, y: 0 };
    if (bolum !== undefined && bolum !== null) {
        if (bolum.kamera !== undefined && bolum.kamera !== null) {
            kamera = bolum.kamera;
        }
    }

    // Fare ekrandaki konumu verir. Kamera kaymissa harita konumuna cevirmek icin kamera eklenir.
    const hedefX = fare.x + kamera.x;
    const hedefY = fare.y + kamera.y;

    // Mermi geminin merkezinden degil, geminin baktigi yondeki ucundan ciksin.
    const namluUzakligi = gemi.uzunluk / 2;
    const namluX = gemi.x + Math.cos(gemi.aci) * namluUzakligi;
    const namluY = gemi.y + Math.sin(gemi.aci) * namluUzakligi;

    // Namlu ile hedef arasindaki farklari buluyoruz.
    const dx = hedefX - namluX;
    const dy = hedefY - namluY;

    // Mesafe sifir olursa bolme hatasi olmasin diye 1 kullaniyoruz.
    let uzaklik = Math.hypot(dx, dy);
    if (uzaklik === 0) {
        uzaklik = 1;
    }

    const yonX = dx / uzaklik;
    const yonY = dy / uzaklik;

    mermiler.push({
        x: namluX,
        y: namluY,
        hizX: yonX * mermiHizi,
        hizY: yonY * mermiHizi,
        yaricap: 4,
        renk: '#5ae0ff'
    });

    // Kalkan modulleri varsa onlarin da ayni hedefe destek atisi yapmasini isteriz.
    if (bolum !== undefined && bolum !== null) {
        if (typeof bolum.fireFromPlayerAndModules === 'function') {
            bolum.fireFromPlayerAndModules({
                yonX: yonX,
                yonY: yonY,
                hiz: mermiHizi
            }, mermiler);
        }
    }
}

// Mermileri hareket ettirir, cizer ve harita disina cikanlari siler.
export function mermileriGuncelleVeCiz(ctx, canvas, bolum) {
    let kamera = { x: 0, y: 0 };
    let haritaGenislik = canvas.width;
    let haritaYukseklik = canvas.height;

    if (bolum !== undefined && bolum !== null) {
        if (bolum.kamera !== undefined && bolum.kamera !== null) {
            kamera = bolum.kamera;
        }

        if (bolum.haritaGenislik !== undefined) {
            haritaGenislik = bolum.haritaGenislik;
        }

        if (bolum.haritaYukseklik !== undefined) {
            haritaYukseklik = bolum.haritaYukseklik;
        }
    }

    // Diziden eleman silecegimiz icin sondan basa dogru geziyoruz.
    // Boylece splice kullaninca index kaymasi problemi olmaz.
    for (let i = mermiler.length - 1; i >= 0; i--) {
        const mermi = mermiler[i];

        ctx.beginPath();
        ctx.arc(mermi.x - kamera.x, mermi.y - kamera.y, mermi.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = mermi.renk;
        ctx.shadowBlur = 15;
        ctx.shadowColor = mermi.renk;
        ctx.fill();
        ctx.shadowBlur = 0;

        mermi.x = mermi.x + mermi.hizX;
        mermi.y = mermi.y + mermi.hizY;

        if (mermi.x < 0 || mermi.x > haritaGenislik || mermi.y < 0 || mermi.y > haritaYukseklik) {
            mermiler.splice(i, 1);
        }
    }
}
