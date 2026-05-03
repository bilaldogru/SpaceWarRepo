export const muzikBaslangic = new Audio('audios/oyun_muzgı_baslangic.mp3');
muzikBaslangic.loop = true;

export const muzikSakin = new Audio('audios/oyun_muzgı_sakinOyun.mp3');
muzikSakin.loop = true;

export const muzikAksiyon = new Audio('audios/oyun_muzgı_aksiyon.mp3');
muzikAksiyon.loop = true;

export let muzikAcik = true;
export let sfxAcik = true;

export function muzikDurdurTum() {
    muzikBaslangic.pause();
    muzikBaslangic.currentTime = 0;
    muzikSakin.pause();
    muzikSakin.currentTime = 0;
    muzikAksiyon.pause();
    muzikAksiyon.currentTime = 0;
}

export function sesleriAyarla() {
    // Butonlar artık sayfa yüklendiğinde DOM'da mevcut (fixed position).
    const muzikBtn = document.getElementById('muzik-toggle-btn');
    const sfxBtn = document.getElementById('sfx-toggle-btn');

    if (muzikBtn) {
        muzikBtn.addEventListener('click', () => {
            muzikAcik = !muzikAcik;
            muzikBaslangic.muted = !muzikAcik;
            muzikSakin.muted = !muzikAcik;
            muzikAksiyon.muted = !muzikAcik;
            muzikBtn.textContent = muzikAcik ? '🎵' : '🔕';
        });
    }

    if (sfxBtn) {
        sfxBtn.addEventListener('click', () => {
            sfxAcik = !sfxAcik;
            sfxBtn.textContent = sfxAcik ? '🔊' : '🔇';
        });
    }
}
