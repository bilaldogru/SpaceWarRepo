// Arayüz kontrol fonksiyonu
export function arayuzuBaslat() {
    // Butonlar ve arayüz elemanları çekilir.
    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const hakkindaAlani = document.getElementById('hakkinda-alani');

    const baslaBtn = document.getElementById('basla-btn');
    const hakkindaBtn = document.getElementById('hakkinda-btn');
    const cikisBtn = document.getElementById('cikis-btn');

    const oyundanGeriBtn = document.getElementById('oyundan-geri-btn');
    const hakkindaGeriBtn = document.getElementById('hakkinda-geri-btn');

    // yeni bir ekran açıldığında mevcut ekranların gizlenmesini sağlanır.
    function tumEkranlariGizle() {
        if (anaMenu) anaMenu.style.display = 'none';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (hakkindaAlani) hakkindaAlani.style.display = 'none';
    }

    // butonların çalışması sağlanır.

    // Başla butonu
    baslaBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        oyunAlani.style.display = 'flex';
    });

    // Hakkında butonu
    hakkindaBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        hakkindaAlani.style.display = 'flex';
    });

    // Çıkış butonu
    cikisBtn?.addEventListener('click', () => {
        if (confirm("Oyundan çıkmak istediğinize emin misiniz?")) {
            window.location.href = "about:blank";
        }
    });

    oyundanGeriBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        anaMenu.style.display = 'flex';
    });

    hakkindaGeriBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        anaMenu.style.display = 'flex';
    });
}