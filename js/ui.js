export function arayuzuBaslat() {
    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const hakkindaAlani = document.getElementById('hakkinda-alani');

    const baslaBtn = document.getElementById('basla-btn');
    const hakkindaBtn = document.getElementById('hakkinda-btn');
    const cikisBtn = document.getElementById('cikis-btn');

    const oyundanGeriBtn = document.getElementById('oyundan-geri-btn');
    const hakkindaGeriBtn = document.getElementById('hakkinda-geri-btn');

    function tumEkranlariGizle() {
        if (anaMenu) anaMenu.style.display = 'none';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (hakkindaAlani) hakkindaAlani.style.display = 'none';
    }

    baslaBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        oyunAlani.style.display = 'flex';
    });

    hakkindaBtn?.addEventListener('click', () => {
        tumEkranlariGizle();
        hakkindaAlani.style.display = 'flex';
    });

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