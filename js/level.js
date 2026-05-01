import { astraBolumu } from './astra.js';

export let aktifBolum = null;

export function bolumleriBaslat() {
    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const astraGezegeni = document.querySelector('.astra');
    const gezegenHaritasi = document.querySelector('.gezegen-haritasi');
    const secimBaslik = document.querySelector('.secim-baslik');
    const oyunHud = document.getElementById('oyun-hud');
    const canvas = document.getElementById('yildiz-alani');
    const hudMenuBtn = document.getElementById('hud-ana-menu-btn');

    astraGezegeni?.addEventListener('click', () => {
        aktifBolum = astraBolumu;
        aktifBolum.baslat(canvas);

        // Haritayi gizle, HUD'i ac.
        if (gezegenHaritasi) gezegenHaritasi.style.display = 'none';
        if (secimBaslik) secimBaslik.style.display = 'none';
        if (oyunHud) oyunHud.style.display = 'flex';

        // Astra atmosferi.
        canvas.style.backgroundColor = 'rgba(22, 5, 30, 0.9)';
        canvas.style.boxShadow = `inset 0 0 150px ${aktifBolum.renk}`;
    });

    // Oyun icindeki menu butonuna basinca ana menuye doner.
    hudMenuBtn?.addEventListener('click', () => {
        if (aktifBolum) aktifBolum.durdur();
        aktifBolum = null;

        if (oyunHud) oyunHud.style.display = 'none';
        if (gezegenHaritasi) gezegenHaritasi.style.display = 'block';
        if (secimBaslik) secimBaslik.style.display = 'block';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (anaMenu) anaMenu.style.display = 'flex';

        canvas.style.backgroundColor = 'black';
        canvas.style.boxShadow = 'none';
    });
}
