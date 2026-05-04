export const muzikBaslangic = new Audio('audios/oyun_muzgı_baslangic.mp3');
muzikBaslangic.loop = true;
muzikBaslangic.volume = 0.28;

export const muzikSakin = new Audio('audios/oyun_muzgı_sakinOyun.mp3');
muzikSakin.loop = true;
muzikSakin.volume = 0.24;

export const muzikAksiyon = new Audio('audios/oyun_muzgı_aksiyon.mp3');
muzikAksiyon.loop = true;
muzikAksiyon.volume = 0.24;

const atisSesi = new Audio('audios/atis_sesi_anlik.mp3');
atisSesi.volume = 0.55;

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

export function atisSesiCal() {
    if (!sfxAcik) return;

    atisSesi.currentTime = 0;
    atisSesi.play().catch(() => {});
}

export function sesleriAyarla() {
    const muzikBtn = document.getElementById('muzik-toggle-btn');
    const sfxBtn = document.getElementById('sfx-toggle-btn');

    if (muzikBtn) {
        muzikBtn.textContent = muzikAcik ? 'M' : 'M-';
        muzikBtn.addEventListener('click', () => {
            muzikAcik = !muzikAcik;
            muzikBaslangic.muted = !muzikAcik;
            muzikSakin.muted = !muzikAcik;
            muzikAksiyon.muted = !muzikAcik;
            muzikBtn.textContent = muzikAcik ? 'M' : 'M-';
        });
    }

    if (sfxBtn) {
        sfxBtn.textContent = sfxAcik ? 'S' : 'S-';
        sfxBtn.addEventListener('click', () => {
            sfxAcik = !sfxAcik;
            sfxBtn.textContent = sfxAcik ? 'S' : 'S-';
        });
    }
}
