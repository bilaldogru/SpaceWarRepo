import { astraBolumu } from './astra.js';
import { noraBolumu } from './nora.js';
import { NormalEnemy, HighEnemy, QueenEnemy } from './enemy.js';

export let aktifBolum = null;

export function bolumleriBaslat() {
    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const astraGezegeni = document.querySelector('.astra');
    const noraGezegeni = document.querySelector('.nora');
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

    // Nora gezegeni tiklama
    noraGezegeni?.addEventListener('click', () => {
        aktifBolum = noraBolumu;
        aktifBolum.baslat(canvas);

        if (gezegenHaritasi) gezegenHaritasi.style.display = 'none';
        if (secimBaslik) secimBaslik.style.display = 'none';
        if (oyunHud) oyunHud.style.display = 'flex';

        // Nora atmosferi (karadelik rengi)
        canvas.style.backgroundColor = 'rgba(5, 5, 5, 0.95)';
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
export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.enemies = [];
        
        // Düşman doğma ayarları (Milisaniye cinsinden)
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2000; // Başlangıçta 2 saniyede bir düşman
        this.minimumSpawnInterval = 600; // Ne olursa olsun 0.6 saniyeden hızlı gelmesin (İMKANSIZLIĞI ÖNLER)
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;

        // Seviyeye göre süreyi kısaltıyoruz (Her levelda 150ms daha hızlı gelir)
        // Math.max sayesinde calculatedInterval hiçbir zaman minimumSpawnInterval'in altına düşemez.
        let calculatedInterval = this.baseSpawnInterval - (this.currentLevel * 150);
        let currentSpawnInterval = Math.max(this.minimumSpawnInterval, calculatedInterval);

        if (this.spawnTimer > currentSpawnInterval) {
            this.spawnRandomEnemy();
            this.spawnTimer = 0;
        }

        // Düşmanları güncelle ve ölenleri diziden temizle
        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    spawnRandomEnemy() {
        // Ekranın üst kısmında rastgele bir X koordinatı
        let x = Math.random() * (window.innerWidth - 80);
        let y = -100; // Ekranın hemen üstünden başlasın

        let randomVal = Math.random();
        let newEnemy;

        // Çıkma ihtimalleri: %70 Normal, %25 Yüksek, %5 Kraliçe
        if (randomVal < 0.70) {
            newEnemy = new NormalEnemy(x, y, this.currentLevel);
        } else if (randomVal < 0.95) {
            newEnemy = new HighEnemy(x, y, this.currentLevel);
        } else {
            // Kraliçe sadece level 3 ve sonrasında çıkabilsin (Taktiksel zorluk)
            if (this.currentLevel >= 3) {
                newEnemy = new QueenEnemy(x, y, this.currentLevel);
            } else {
                newEnemy = new HighEnemy(x, y, this.currentLevel); // Kraliçe çıkamıyorsa Yüksek çıksın
            }
        }

        this.enemies.push(newEnemy);
    }
    
    // Seviye atlama fonksiyonunu kendi oyun döngünde bir şarta bağlayabilirsin (örn: her 30 saniyede bir veya belirli bir skorda)
    levelUp() {
        this.currentLevel++;
        console.log("Seviye Atlandı! Yeni Seviye: " + this.currentLevel);
    }
}