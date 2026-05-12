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

const MUSIC_PREF = 'spacewarMusicOn';
const SFX_PREF = 'spacewarSfxOn';

export let muzikAcik = localStorage.getItem(MUSIC_PREF) !== 'false';
export let sfxAcik = localStorage.getItem(SFX_PREF) !== 'false';

function muzikMutedUygula() {
    muzikBaslangic.muted = !muzikAcik;
    muzikSakin.muted = !muzikAcik;
    muzikAksiyon.muted = !muzikAcik;
}

function sesButonlariniGuncelle() {
    const muzikBtn = document.getElementById('muzik-toggle-btn');
    const sfxBtn = document.getElementById('sfx-toggle-btn');

    if (muzikBtn) {
        muzikBtn.dataset.state = muzikAcik ? 'music-on' : 'music-off';
        muzikBtn.title = muzikAcik ? 'Music On' : 'Music Off';
        muzikBtn.setAttribute('aria-label', muzikBtn.title);
    }

    if (sfxBtn) {
        sfxBtn.dataset.state = sfxAcik ? 'sfx-on' : 'sfx-off';
        sfxBtn.title = sfxAcik ? 'Sound On' : 'Sound Off';
        sfxBtn.setAttribute('aria-label', sfxBtn.title);
    }
}

export function muzikDurdurTum() {
    muzikBaslangic.pause();
    muzikBaslangic.currentTime = 0;
    muzikSakin.pause();
    muzikSakin.currentTime = 0;
    muzikAksiyon.pause();
    muzikAksiyon.currentTime = 0;
}

export function muzikCal(audio) {
    if (!muzikAcik || !audio) return Promise.resolve();
    muzikMutedUygula();
    return audio.play().catch(e => console.log(e));
}

export function atisSesiCal() {
    if (!sfxAcik) return;

    atisSesi.currentTime = 0;
    atisSesi.play().catch(() => {});
}

export function sesleriAyarla() {
    const muzikBtn = document.getElementById('muzik-toggle-btn');
    const sfxBtn = document.getElementById('sfx-toggle-btn');

    muzikMutedUygula();
    sesButonlariniGuncelle();

    if (muzikBtn) {
        muzikBtn.addEventListener('click', () => {
            muzikAcik = !muzikAcik;
            localStorage.setItem(MUSIC_PREF, String(muzikAcik));
            muzikMutedUygula();
            sesButonlariniGuncelle();
        });
    }

    if (sfxBtn) {
        sfxBtn.addEventListener('click', () => {
            sfxAcik = !sfxAcik;
            localStorage.setItem(SFX_PREF, String(sfxAcik));
            sesButonlariniGuncelle();
        });
    }
}
