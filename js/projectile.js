// Uzay gemimize ait mermilerin tanımlanması
export const mermiler = [];
const mermiHizi = 10;

// Mermi atma fonksiyonu
export function mermiAtesle(gemi) {
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
export function mermileriGuncelleVeCiz(ctx, canvas) {
    for (let i = 0; i < mermiler.length; i++) {
        let mermi = mermiler[i];

        ctx.beginPath();
        ctx.arc(mermi.x, mermi.y, mermi.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = mermi.renk;
        ctx.shadowBlur = 15;
        ctx.shadowColor = mermi.renk;
        ctx.fill();
        ctx.shadowBlur = 0;

        mermi.x += mermi.hizX;
        mermi.y += mermi.hizY;

        // Ekrandan çıkan mermiyi sil
        if (mermi.x < 0 || mermi.x > canvas.width || mermi.y < 0 || mermi.y > canvas.height) {
            mermiler.splice(i, 1);
            i--;
        }
    }
}