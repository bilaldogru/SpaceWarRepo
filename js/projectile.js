// Uzay gemimize ait mermilerin tanımlanması
import { atisSesiCal } from './audio.js';

export const mermiler = [];
const mermiHizi = 6.8;

export function mermileriTemizle() {
    mermiler.length = 0;
}

// Mermi atma fonksiyonu
export function mermiAtesle(gemi) {
    atisSesiCal();

    // merminin çapraz atış için açısının hesaplanması.
    const hizX = Math.cos(gemi.aci) * mermiHizi;
    const hizY = Math.sin(gemi.aci) * mermiHizi;

    // Merminin oluşturulması ve mermi dizisine eklenmesi yapılır.
    mermiler.push({
        x: gemi.x + Math.cos(gemi.aci) * (gemi.uzunluk / 2),
        y: gemi.y + Math.sin(gemi.aci) * (gemi.uzunluk / 2),
        hizX: hizX,
        hizY: hizY,
        yaricap: 4,
        renk: '#5ae0ff'
    });
}

// Mermilerin güncellenmesi ve çizilmesi sağlanır.
export function mermileriGuncelleVeCiz(ctx, canvas, bolum = null) {
    const kamera = bolum?.kamera || { x: 0, y: 0 };
    const haritaGenislik = bolum?.haritaGenislik || canvas.width;
    const haritaYukseklik = bolum?.haritaYukseklik || canvas.height;

    for (let i = 0; i < mermiler.length; i++) {
        let mermi = mermiler[i];

        ctx.beginPath();
        ctx.arc(mermi.x - kamera.x, mermi.y - kamera.y, mermi.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = mermi.renk;
        ctx.shadowBlur = 15;
        ctx.shadowColor = mermi.renk;
        ctx.fill();
        ctx.shadowBlur = 0;

        mermi.x += mermi.hizX;
        mermi.y += mermi.hizY;

        // Ekrandan çıkan mermiyi sil
        if (mermi.x < 0 || mermi.x > haritaGenislik || mermi.y < 0 || mermi.y > haritaYukseklik) {
            mermiler.splice(i, 1);
            i--;
        }
    }
}
