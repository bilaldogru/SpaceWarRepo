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
const SHOOT_PREF = 'spacewarShootSoundOn';

export let musicEnabled = localStorage.getItem(MUSIC_PREF) !== 'false';
export let shootSoundEnabled = localStorage.getItem(SHOOT_PREF) !== 'false';

/**
 * Müzik seslerinin aktif veya pasif durumunu arka plandaki tüm müzik nesnelerine uygular.
 * Nerede kullanılır: Müzik aç/kapat butonuna basıldığında veya yeni bir müzik çalınırken.
 * Neden kullanılır: Oyuncunun ses tercihine göre (sessiz/sesli) tüm müziklerin senkronize bir şekilde ayarlanmasını sağlamak için.
 */
function muzikMutedUygula() {
    muzikBaslangic.muted = !musicEnabled;
    muzikSakin.muted = !musicEnabled;
    muzikAksiyon.muted = !musicEnabled;
}

/**
 * Arayüzdeki müzik ve atış sesi butonlarının görsel durumlarını günceller.
 * Nerede kullanılır: Oyun ilk yüklendiğinde (sesleriAyarla) ve ses ayarı değiştirildiğinde.
 * Neden kullanılır: Kullanıcıya mevcut ses ayarlarının açık mı kapalı mı olduğunu doğru ikon/renk ile göstermek için.
 */
function sesButonlariniGuncelle() {
    const muzikBtn = document.getElementById('muzik-toggle-btn');
    const shootBtn = document.getElementById('shoot-toggle-btn');

    if (muzikBtn) {
        muzikBtn.dataset.state = musicEnabled ? 'music-on' : 'music-off';
        muzikBtn.title = musicEnabled ? 'Müzik Açık' : 'Müzik Kapalı';
        muzikBtn.setAttribute('aria-label', muzikBtn.title);
    }

    if (shootBtn) {
        shootBtn.dataset.state = shootSoundEnabled ? 'shoot-on' : 'shoot-off';
        shootBtn.title = shootSoundEnabled ? 'Atış Sesi Açık' : 'Atış Sesi Kapalı';
        shootBtn.setAttribute('aria-label', shootBtn.title);
    }
}

/**
 * Çalmakta olan tüm arka plan müziklerini durdurur ve sürelerini sıfırlar.
 * Nerede kullanılır: Menüden oyuna geçerken, bölüm bittiğinde veya farklı bir müzik parçasına geçilirken.
 * Neden kullanılır: Müziklerin birbirine karışmasını önlemek ve temiz bir geçiş yapmak için.
 */
export function muzikDurdurTum() {
    muzikBaslangic.pause();
    muzikBaslangic.currentTime = 0;
    muzikSakin.pause();
    muzikSakin.currentTime = 0;
    muzikAksiyon.pause();
    muzikAksiyon.currentTime = 0;
}

/**
 * Belirtilen ses dosyasını (müziği) oynatmaya başlar.
 * Nerede kullanılır: Bölüm başladığında (muzikCal(muzikAksiyon)) veya ana menüye dönüldüğünde.
 * Neden kullanılır: Olayın gerektirdiği atmosfer müziğini çalmak için. Müzik kapalıysa işlemi yok sayar.
 */
export function muzikCal(audio) {
    if (!musicEnabled || !audio) return Promise.resolve();
    muzikMutedUygula();
    return audio.play().catch(e => console.log(e));
}

/**
 * Lazer/mermi ateşleme ses efektini oynatır.
 * Nerede kullanılır: Oyuncu veya taretler her ateş ettiğinde.
 * Neden kullanılır: Ateş etme hissiyatını artırmak için. Atış sesi kapalıysa çalınmaz.
 */
export function atisSesiCal() {
    if (!shootSoundEnabled) return;

    atisSesi.currentTime = 0;
    atisSesi.play().catch(() => {});
}

/**
 * Müzik ve atış sesi açma/kapatma butonlarının tıklama olaylarını bağlar ve başlangıç ayarlarını uygular.
 * Nerede kullanılır: ui.js veya main.js içinde, arayüz kurulum aşamasında bir kere çağrılır.
 * Neden kullanılır: Kullanıcının sesi açıp kapatabilmesi için gereken buton etkileşimlerini aktif hale getirmek için.
 */
export function sesleriAyarla() {
    const muzikBtn = document.getElementById('muzik-toggle-btn');
    const shootBtn = document.getElementById('shoot-toggle-btn');

    muzikMutedUygula();
    sesButonlariniGuncelle();

    if (muzikBtn) {
        muzikBtn.addEventListener('click', () => {
            musicEnabled = !musicEnabled;
            localStorage.setItem(MUSIC_PREF, String(musicEnabled));
            muzikMutedUygula();
            sesButonlariniGuncelle();
        });
    }

    if (shootBtn) {
        shootBtn.addEventListener('click', () => {
            shootSoundEnabled = !shootSoundEnabled;
            localStorage.setItem(SHOOT_PREF, String(shootSoundEnabled));
            sesButonlariniGuncelle();
        });
    }
}
