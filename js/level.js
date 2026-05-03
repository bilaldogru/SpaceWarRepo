import { astraBolumu } from './astra.js';
import { noraBolumu } from './nora.js';
import { vegaBolumu } from './vega.js';
import { kronBolumu } from './kron.js';
import { NormalEnemy, HighEnemy, QueenEnemy } from './enemy.js';
import { muzikBaslangic, muzikSakin, muzikAksiyon, muzikDurdurTum } from './audio.js';
export let aktifBolum = null;

const taretBilgileri = [
    {
        ad: 'Kalkan Duvari',
        aciklama: 'Gezegen hattina ulasan dusmanlari tutan ana savunma bariyeri.'
    },
    {
        ad: 'Plazma Silahi',
        aciklama: 'Hizli atis yapan temel silah. Ilk dalgalarda ana hasari verir.'
    },
    {
        ad: 'Iyon Tareti',
        aciklama: 'Vega ile acilir. Dondurma ve alan kontrolu icin kullanilir.'
    },
    {
        ad: 'Agir Lazer',
        aciklama: 'Nora ile acilir. Yuksek canli hedeflere karsi daha etkilidir.'
    },
    {
        ad: 'Kron Modulu',
        aciklama: 'Kron eglence modunda tum sistemleri sinirsiz mermiyle calistirir.'
    }
];

function sureyiYazSaniye(sure) {
    const dakika = Math.floor(sure / 60).toString().padStart(2, '0');
    const saniye = Math.floor(sure % 60).toString().padStart(2, '0');
    return `${dakika}:${saniye}`;
}

function kronSkorunuGuncelle() {
    const skorAlani = document.getElementById('kron-en-iyi-skor');
    if (!skorAlani) return;

    const skor = Number(localStorage.getItem('spacewarKronBestTime') || 0);
    skorAlani.textContent = `En iyi: ${sureyiYazSaniye(skor)}`;
}

function taretleriGuncelle(acikSayisi) {
    const slotlar = document.querySelectorAll('.taret-slot');
    slotlar.forEach((slot, index) => {
        const bilgi = taretBilgileri[index];
        slot.title = bilgi ? `${bilgi.ad}: ${bilgi.aciklama}` : '';

        if (index < acikSayisi) {
            slot.classList.remove('kilitli');
        } else {
            slot.classList.add('kilitli');
        }
    });
}

export function bolumleriBaslat() {
    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const astraGezegeni = document.querySelector('.astra');
    const noraGezegeni = document.querySelector('.nora');
    const vegaGezegeni = document.querySelector('.vega');
    const kronGezegeni = document.querySelector('.kron');
    const gezegenHaritasi = document.querySelector('.gezegen-haritasi');
    const secimBaslik = document.querySelector('.secim-baslik');
    const oyunHud = document.getElementById('oyun-hud');
    const canvas = document.getElementById('yildiz-alani');
    const hudMenuBtn = document.getElementById('hud-ana-menu-btn');
    const hudMaxTurn = document.getElementById('hud-max-turn');
    const bilgiPaneli = document.getElementById('bolum-bilgi-paneli');
    const bilgiAsama = document.getElementById('bolum-bilgi-asama');
    const bilgiBaslik = document.getElementById('bolum-bilgi-baslik');
    const bilgiMetin = document.getElementById('bolum-bilgi-metin');
    const bilgiTaretler = document.getElementById('bolum-bilgi-taretler');
    const bilgiBaslat = document.getElementById('bolum-bilgi-baslat');
    const bilgiIptal = document.getElementById('bolum-bilgi-iptal');
    let secilenAyar = null;

    const bolumAyarlari = {
        astra: {
            bolum: astraBolumu,
            asama: 'Asama 1',
            taretSayisi: 2,
            maxTurnLabel: '5',
            metin: 'Astra ilk savunma gezegenidir. Temel mekaniklerle baslar: duvar hattini koru, dusman karelerini gemi ve plazma atislariyla durdur.',
            arkaPlan: 'rgba(22, 5, 30, 0.9)'
        },
        vega: {
            bolum: vegaBolumu,
            asama: 'Asama 2',
            taretSayisi: 3,
            maxTurnLabel: '5',
            metin: 'Vega ikinci asamadir. Astra sistemlerine ek olarak 3. taret yeri acilir ve alan kontrolu daha onemli hale gelir.',
            arkaPlan: 'rgba(5, 20, 35, 0.95)'
        },
        nora: {
            bolum: noraBolumu,
            asama: 'Asama 3',
            taretSayisi: 4,
            maxTurnLabel: '5',
            metin: 'Nora ileri savunma bolumudur. Bir taret yeri daha acilir, dalgalar daha agir gelir ve dayanma suresi kritik olur.',
            arkaPlan: 'rgba(5, 5, 5, 0.95)'
        },
        kron: {
            bolum: kronBolumu,
            asama: 'Eglence Modu',
            taretSayisi: 5,
            maxTurnLabel: '∞',
            metin: 'Kron gezegeninde tum taretler acik. Sinirsiz mermi ile olene kadar dayan; en iyi suren gezegenin altinda saklanir.',
            arkaPlan: 'rgba(10, 20, 10, 0.95)'
        }
    };

    function bilgiPaneliniAc(ayar) {
        secilenAyar = ayar;
        if (bilgiAsama) bilgiAsama.textContent = ayar.asama;
        if (bilgiBaslik) bilgiBaslik.textContent = ayar.bolum.isim;
        if (bilgiMetin) bilgiMetin.textContent = ayar.metin;

        if (bilgiTaretler) {
            bilgiTaretler.innerHTML = taretBilgileri.map((taret, index) => {
                const acik = index < ayar.taretSayisi;
                return `
                    <div class="bilgi-taret ${acik ? '' : 'kapali'}">
                        <div class="bilgi-taret-numara">${index + 1}</div>
                        <div>
                            <strong>${taret.ad}</strong>
                            <span>${taret.aciklama}</span>
                        </div>
                        <div class="bilgi-taret-durum">${acik ? 'Acik' : 'Kapali'}</div>
                    </div>
                `;
            }).join('');
        }

        if (bilgiPaneli) bilgiPaneli.style.display = 'flex';
    }

    function bolumuBaslat(ayar) {
        aktifBolum = ayar.bolum;
        taretleriGuncelle(ayar.taretSayisi);
        if (hudMaxTurn) hudMaxTurn.textContent = ayar.maxTurnLabel;
        aktifBolum.baslat(canvas);

        if (bilgiPaneli) bilgiPaneli.style.display = 'none';
        if (gezegenHaritasi) gezegenHaritasi.style.display = 'none';
        if (secimBaslik) secimBaslik.style.display = 'none';
        if (oyunHud) oyunHud.style.display = 'flex';

        canvas.style.backgroundColor = ayar.arkaPlan;
        canvas.style.boxShadow = `inset 0 0 150px ${aktifBolum.renk}`;

        muzikDurdurTum();
        if (ayar.bolum === kronBolumu) {
            muzikAksiyon.play().catch(e => console.log(e));
        } else {
            muzikSakin.play().catch(e => console.log(e));
        }
    }

    kronSkorunuGuncelle();
    window.addEventListener('kron-skor-guncellendi', kronSkorunuGuncelle);

    bilgiBaslat?.addEventListener('click', () => {
        if (secilenAyar) bolumuBaslat(secilenAyar);
    });

    bilgiIptal?.addEventListener('click', () => {
        secilenAyar = null;
        if (bilgiPaneli) bilgiPaneli.style.display = 'none';
    });

    astraGezegeni?.addEventListener('click', () => bilgiPaneliniAc(bolumAyarlari.astra));
    vegaGezegeni?.addEventListener('click', () => bilgiPaneliniAc(bolumAyarlari.vega));
    noraGezegeni?.addEventListener('click', () => bilgiPaneliniAc(bolumAyarlari.nora));
    kronGezegeni?.addEventListener('click', () => bilgiPaneliniAc(bolumAyarlari.kron));

    hudMenuBtn?.addEventListener('click', () => {
        if (aktifBolum) aktifBolum.durdur();
        aktifBolum = null;
        secilenAyar = null;
        kronSkorunuGuncelle();

        if (oyunHud) oyunHud.style.display = 'none';
        if (bilgiPaneli) bilgiPaneli.style.display = 'none';
        if (gezegenHaritasi) gezegenHaritasi.style.display = 'block';
        if (secimBaslik) secimBaslik.style.display = 'block';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (anaMenu) anaMenu.style.display = 'flex';

        canvas.style.backgroundColor = 'black';
        canvas.style.boxShadow = 'none';

        muzikDurdurTum();
        muzikBaslangic.play().catch(e => console.log(e));
    });
}

export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.enemies = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2000;
        this.minimumSpawnInterval = 600;
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;

        const calculatedInterval = this.baseSpawnInterval - (this.currentLevel * 150);
        const currentSpawnInterval = Math.max(this.minimumSpawnInterval, calculatedInterval);

        if (this.spawnTimer > currentSpawnInterval) {
            this.spawnRandomEnemy();
            this.spawnTimer = 0;
        }

        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    spawnRandomEnemy() {
        const x = Math.random() * (window.innerWidth - 80);
        const y = -100;
        const randomVal = Math.random();
        let newEnemy;

        if (randomVal < 0.70) {
            newEnemy = new NormalEnemy(x, y, this.currentLevel);
        } else if (randomVal < 0.95) {
            newEnemy = new HighEnemy(x, y, this.currentLevel);
        } else if (this.currentLevel >= 3) {
            newEnemy = new QueenEnemy(x, y, this.currentLevel);
        } else {
            newEnemy = new HighEnemy(x, y, this.currentLevel);
        }

        this.enemies.push(newEnemy);
    }

    levelUp() {
        this.currentLevel++;
        console.log('Seviye Atlandi! Yeni Seviye: ' + this.currentLevel);
    }
}
