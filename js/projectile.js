import { atisSesiCal } from './audio.js';
import { fare } from './input.js';

export const mermiler = [];
const mermiHizi = 6.8;

export function mermileriTemizle() {
    mermiler.length = 0;
}

export function mermiAtesle(gemi, bolum = null) {
    atisSesiCal();

    const kamera = bolum?.kamera || { x: 0, y: 0 };
    const hedefX = fare.x + kamera.x;
    const hedefY = fare.y + kamera.y;
    const namluUzakligi = gemi.uzunluk / 2;
    const namluX = gemi.x + Math.cos(gemi.aci) * namluUzakligi;
    const namluY = gemi.y + Math.sin(gemi.aci) * namluUzakligi;
    const dx = hedefX - namluX;
    const dy = hedefY - namluY;
    const uzaklik = Math.hypot(dx, dy) || 1;
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
}

export function mermileriGuncelleVeCiz(ctx, canvas, bolum = null) {
    const kamera = bolum?.kamera || { x: 0, y: 0 };
    const haritaGenislik = bolum?.haritaGenislik || canvas.width;
    const haritaYukseklik = bolum?.haritaYukseklik || canvas.height;

    for (let i = 0; i < mermiler.length; i++) {
        const mermi = mermiler[i];

        ctx.beginPath();
        ctx.arc(mermi.x - kamera.x, mermi.y - kamera.y, mermi.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = mermi.renk;
        ctx.shadowBlur = 15;
        ctx.shadowColor = mermi.renk;
        ctx.fill();
        ctx.shadowBlur = 0;

        mermi.x += mermi.hizX;
        mermi.y += mermi.hizY;

        if (mermi.x < 0 || mermi.x > haritaGenislik || mermi.y < 0 || mermi.y > haritaYukseklik) {
            mermiler.splice(i, 1);
            i--;
        }
    }
}
