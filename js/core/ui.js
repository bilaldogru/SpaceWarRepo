import { muzikBaslangic, muzikDurdurTum, muzikCal, sesleriAyarla } from './audio.js';

export function arayuzuBaslat() {
    sesleriAyarla();

    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const hakkindaAlani = document.getElementById('hakkinda-alani');
    const ogreticiAlani = document.getElementById('ogretici-alani');
    const sesKontrolleri = document.getElementById('ses-kontrolleri');

    const baslaBtn = document.getElementById('basla-btn');
    const ogreticiBtn = document.getElementById('ogretici-btn');
    const hakkindaBtn = document.getElementById('hakkinda-btn');
    const cikisBtn = document.getElementById('cikis-btn');
    const hakkindaGeriBtn = document.getElementById('hakkinda-geri-btn');
    const ogreticiGeriBtn = document.getElementById('ogretici-geri-btn');

    const playBaslangic = () => {
        if (muzikBaslangic.paused) {
            muzikDurdurTum();
            muzikCal(muzikBaslangic);
        }
    };

    document.addEventListener('click', playBaslangic, { once: true });

    function sesKontrolleriniGoster(goster) {
        if (sesKontrolleri) sesKontrolleri.style.display = goster ? 'flex' : 'none';
    }

    function tumEkranlariGizle() {
        if (anaMenu) anaMenu.style.display = 'none';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (hakkindaAlani) hakkindaAlani.style.display = 'none';
        if (ogreticiAlani) ogreticiAlani.style.display = 'none';
        sesKontrolleriniGoster(false);
    }

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

    hakkindaBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        if (hakkindaAlani) hakkindaAlani.style.display = 'flex';
        sesKontrolleriniGoster(false);
        playBaslangic();

        fetch('Hikaye.txt')
            .then(response => response.text())
            .then(data => {
                const hikayeIcerik = document.getElementById('hikaye-icerik');
                if (hikayeIcerik) hikayeIcerik.innerHTML = data;
            })
            .catch(err => {
                console.error('Hikaye yuklenemedi:', err);
                const hikayeIcerik = document.getElementById('hikaye-icerik');
                if (hikayeIcerik) hikayeIcerik.textContent = 'Hikaye su an yuklenemiyor...';
            });
    });

    cikisBtn?.addEventListener('click', () => {
        if (confirm('Oyundan cikmak istediginize emin misiniz?')) {
            window.location.href = 'about:blank';
        }
    });

    hakkindaGeriBtn?.addEventListener('click', anaMenuyeDon);
    ogreticiGeriBtn?.addEventListener('click', anaMenuyeDon);
}
