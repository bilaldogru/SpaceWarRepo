import { muzikBaslangic, muzikDurdurTum, muzikCal, sesleriAyarla } from './audio.js';

/**
 * Oyunun ana arayüz olaylarını (buton tıklamaları, menü geçişleri) ayarlar.
 * Nerede kullanılır: main.js çalışmaya başladığında ilk kurulum aşamasında çağrılır.
 * Neden kullanılır: Arayüz elemanları (başla, eğitim ve çıkış butonları) ile oyun mantığı arasındaki bağı kurmak için.
 */
export function arayuzuBaslat() {
    sesleriAyarla();

    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const ogreticiAlani = document.getElementById('ogretici-alani');
    const sesKontrolleri = document.getElementById('ses-kontrolleri');

    const baslaBtn = document.getElementById('basla-btn');
    const ogreticiBtn = document.getElementById('ogretici-btn');
    const cikisBtn = document.getElementById('cikis-btn');
    const ogreticiGeriBtn = document.getElementById('ogretici-geri-btn');

    const playBaslangic = () => {
        if (muzikBaslangic.paused) {
            muzikDurdurTum();
            muzikCal(muzikBaslangic);
        }
    };

    document.addEventListener('click', playBaslangic, { once: true });

    /**
     * Müzik ve ses açma/kapama butonlarının bulunduğu konteyneri gösterir veya gizler.
     * Nerede kullanılır: Menü geçişlerinde (anaMenuyeDon, tumEkranlariGizle vb.).
     * Neden kullanılır: Oyun ekranında veya diğer sayfalarda ses butonlarının görünürlüğünü dinamik yönetmek için.
     */
    function sesKontrolleriniGoster(goster) {
        if (sesKontrolleri) sesKontrolleri.style.display = goster ? 'flex' : 'none';
    }

    /**
     * Ekranda açık olan tüm panelleri ve menüleri gizler.
     * Nerede kullanılır: Yeni bir menü ekranına veya oyuna geçiş yapmadan hemen önce.
     * Neden kullanılır: Birden fazla ekranın üst üste binmesini engelleyip temiz bir çalışma alanı sağlamak için.
     */
    function tumEkranlariGizle() {
        if (anaMenu) anaMenu.style.display = 'none';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (ogreticiAlani) ogreticiAlani.style.display = 'none';
        sesKontrolleriniGoster(false);
    }

    /**
     * Oyunu ana menü ekranına geri döndürür.
     * Nerede kullanılır: "Geri" veya "Ana Menü" butonlarına tıklandığında.
     * Neden kullanılır: Kullanıcının oyun içinden veya bilgi ekranlarından başlangıç durumuna dönebilmesi için.
     */
    function anaMenuyeDon() {
        tumEkranlariGizle();
        if (anaMenu) anaMenu.style.display = 'flex';
        sesKontrolleriniGoster(true);
        playBaslangic();
    }

    sesKontrolleriniGoster(true);

    baslaBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        if (oyunAlani) oyunAlani.style.display = 'flex';
        sesKontrolleriniGoster(true);
        playBaslangic();
    });

    ogreticiBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        if (ogreticiAlani) ogreticiAlani.style.display = 'flex';
        sesKontrolleriniGoster(true);
        playBaslangic();
    });

    cikisBtn?.addEventListener('click', () => {
        if (confirm('Oyundan çıkmak istediğinize emin misiniz?')) {
            window.location.href = 'about:blank';
        }
    });

    ogreticiGeriBtn?.addEventListener('click', anaMenuyeDon);
}
