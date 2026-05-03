// --- KRON GEZEGENI (EĞLENCE MODU) BOLUM DOSYASI ---

import { NormalEnemy } from './enemy.js';
import { gemi } from './player.js';
import { drawAstraStyleScene, enemyHitPlanet, moveEnemyToPlanet, randomTopSideSpawn } from './sceneVisuals.js';

export const kronBolumu = {
    isim: 'Kron',
    gezegenGorseli: 'assets/images/gezegen4.png',
    renk: '#55efc4', // Parlak Yeşil
    can: 100,
    maxCan: 100,
    oyuncuCan: 100,
    maxOyuncuCan: 100,
    turn: 1,
    maxTurn: Infinity,
    mermi: Infinity, // Sınırsız mermi (Eğlence Modu)
    maxMermi: Infinity,
    para: 250,
    gecenSure: 0,
    baslangicZamani: 0,
    sonDusmanZamani: 0,
    dusmanAraligi: 2800, // Biraz daha hızlı aksiyon
    yenidenDoluyor: false,
    yenidenDolumBaslangic: 0,
    yenidenDolumSuresi: 0, // Gerek yok ama yapıyı koruyalım
    oyunDevamEdiyor: false,
    oyunBitti: false,
    enIyiSkorGuncellendi: false,
    sonOyuncuHasarZamani: -10,
    dusmanlar: [],
    koridorlar: [],

    // Bolum basladiginda cagrilacak ilk ayarlar
    baslat: function (canvas) {
        // --- EĞLENCE MODU: DAHA KÜÇÜK GEMİ ---
        gemi.genislik = 40;
        gemi.uzunluk = 40;

        this.can = 100;
        this.oyuncuCan = 100;
        this.turn = 1;
        this.mermi = Infinity;
        this.para = 250;
        this.gecenSure = 0;
        this.yenidenDoluyor = false;
        this.dusmanlar = [];
        this.oyunDevamEdiyor = true;
        this.oyunBitti = false;
        this.enIyiSkorGuncellendi = false;
        this.sonOyuncuHasarZamani = -10;
        this.baslangicZamani = performance.now();
        this.sonDusmanZamani = performance.now();
        this.koridorlariHazirla(canvas);

        // Her koridordan ilk dusmanlar gelsin.
        for (let i = 0; i < 5; i++) {
            this.dusmanEkle(canvas, i, i * 100);
        }

        this.huduGuncelle();
    },

    durdur: function () {
        // --- GEMİ BOYUTLARINI NORMALE DÖNDÜR ---
        gemi.genislik = 60;
        gemi.uzunluk = 60;

        this.oyunDevamEdiyor = false;
        this.oyunBitti = false;
        this.dusmanlar = [];
        this.gecenSure = 0;
        this.yenidenDoluyor = false;
        this.huduGuncelle();
    },

    koridorlariHazirla: function (canvas) {
        this.koridorlar = [];
        const ustBosluk = 155;
        const altBosluk = 70;
        const kullanilabilirAlan = canvas.height - ustBosluk - altBosluk;

        for (let i = 0; i < 5; i++) {
            this.koridorlar.push({
                y: ustBosluk + (kullanilabilirAlan / 4) * i
            });
        }
    },

    dusmanEkle: function (canvas, koridorNo, gecikme) {
        const spawn = randomTopSideSpawn(canvas, 70 + gecikme);
        const x = spawn.x;
        const y = spawn.y;
        // Kron istatistikleri
        const dusman = new NormalEnemy(x, y, koridorNo, 0.80 + (koridorNo * 0.1), 32, 50);
        this.dusmanlar.push(dusman);
    },

    sureyiYaz: function () {
        const dakika = Math.floor(this.gecenSure / 60).toString().padStart(2, '0');
        const saniye = Math.floor(this.gecenSure % 60).toString().padStart(2, '0');
        return dakika + ':' + saniye;
    },

    huduGuncelle: function () {
        const hudCan = document.getElementById('hud-can');
        const hudOyuncuCan = document.getElementById('hud-oyuncu-can');
        const hudMermi = document.getElementById('hud-mermi');
        const hudPara = document.getElementById('hud-para');
        const hudSure = document.getElementById('hud-sure');
        const hudTurn = document.getElementById('hud-turn');
        const hudMaxTurn = document.getElementById('hud-max-turn');
        const hudDusman = document.getElementById('hud-dusman');

        if (hudCan) hudCan.textContent = Math.max(0, Math.ceil(this.can));
        if (hudOyuncuCan) hudOyuncuCan.textContent = Math.max(0, Math.ceil(this.oyuncuCan));
        if (hudMermi) hudMermi.textContent = '∞'; // Sınırsız sembolü
        if (hudPara) hudPara.textContent = this.para;
        if (hudSure) hudSure.textContent = this.sureyiYaz();
        if (hudTurn) hudTurn.textContent = this.turn;
        if (hudMaxTurn) hudMaxTurn.textContent = '∞';
        if (hudDusman) hudDusman.textContent = this.dusmanlar.length;
    },

    atesEtmeyeIzinVar: function () {
        if (!this.oyunDevamEdiyor || this.oyunBitti) return false;
        // Sınırsız mermi: Her zaman ateş edebilir, mermi azalmaz.
        this.huduGuncelle();
        return true;
    },

    yenidenDoldur: function () {
        // Sınırsız mermide dolum gerekmez
    },

    mermiCarpismalariniKontrolEt: function (mermiler) {
        for (let i = mermiler.length - 1; i >= 0; i--) {
            const mermi = mermiler[i];

            for (let j = this.dusmanlar.length - 1; j >= 0; j--) {
                const dusman = this.dusmanlar[j];
                const yari = dusman.boyut / 2;

                if (
                    mermi.x > dusman.x - yari &&
                    mermi.x < dusman.x + yari &&
                    mermi.y > dusman.y - yari &&
                    mermi.y < dusman.y + yari
                ) {
                    dusman.can -= 25;
                    mermiler.splice(i, 1);

                    if (dusman.can <= 0) {
                        this.dusmanlar.splice(j, 1);
                        this.para += 15;
                    }

                    break;
                }
            }
        }
    },

    guncelle: function (canvas, mermiler, gemi) {
        if (!this.oyunDevamEdiyor) return;

        this.koridorlariHazirla(canvas);
        this.gecenSure = (performance.now() - this.baslangicZamani) / 1000;
        this.turn = Math.floor(this.gecenSure / 30) + 1;

        if (performance.now() - this.sonDusmanZamani > this.dusmanAraligi) {
            for (let i = 0; i < 5; i++) {
                this.dusmanEkle(canvas, i, i * 80);
            }
            this.sonDusmanZamani = performance.now();
        }

        for (let i = this.dusmanlar.length - 1; i >= 0; i--) {
            const dusman = this.dusmanlar[i];
            moveEnemyToPlanet(dusman, canvas, this);

            if (gemi && this.dusmanGemiyeDegdiMi(dusman, gemi)) {
                this.oyuncuCan -= 15;
                this.sonOyuncuHasarZamani = this.gecenSure;
                this.dusmanlar.splice(i, 1);
                continue;
            }

            if (enemyHitPlanet(dusman, canvas, this)) {
                this.can -= 8;
                this.dusmanlar.splice(i, 1);
            }
        }

        this.mermiCarpismalariniKontrolEt(mermiler);

        if (this.gecenSure - this.sonOyuncuHasarZamani > 2 &&
            this.oyuncuCan < this.maxOyuncuCan) {
            this.oyuncuCan = Math.min(this.maxOyuncuCan, this.oyuncuCan + 5 / 60);
        }

        if (this.can <= 0 || this.oyuncuCan <= 0) {
            this.can = Math.max(0, this.can);
            this.oyuncuCan = Math.max(0, this.oyuncuCan);
            this.oyunDevamEdiyor = false;
            this.oyunBitti = true;
            this.kronSkorunuKaydet();
        }

        this.huduGuncelle();
    },

    kronSkorunuKaydet: function () {
        if (this.enIyiSkorGuncellendi) return;
        this.enIyiSkorGuncellendi = true;

        const skor = Math.floor(this.gecenSure);
        const oncekiSkor = Number(localStorage.getItem('spacewarKronBestTime') || 0);
        if (skor > oncekiSkor) {
            localStorage.setItem('spacewarKronBestTime', String(skor));
        }

        window.dispatchEvent(new CustomEvent('kron-skor-guncellendi'));
    },

    gezegenYaricapi: function (canvas) {
        return Math.min(150, Math.max(90, canvas.height * 0.15));
    },

    savunmaUssuX: function (canvas) {
        return this.gezegenYaricapi(canvas) + 58;
    },

    dusmanGemiyeDegdiMi: function (dusman, gemi) {
        const dusmanYari = dusman.boyut / 2;
        const gemiYariX = gemi.genislik / 2;
        const gemiYariY = gemi.uzunluk / 2;

        return (
            dusman.x + dusmanYari > gemi.x - gemiYariX &&
            dusman.x - dusmanYari < gemi.x + gemiYariX &&
            dusman.y + dusmanYari > gemi.y - gemiYariY &&
            dusman.y - dusmanYari < gemi.y + gemiYariY
        );
    },

    canBariCiz: function (ctx, x, y, genislik, yukseklik, can, maxCan) {
        ctx.fillStyle = 'rgba(3, 8, 18, 0.8)';
        ctx.fillRect(x, y, genislik, yukseklik);
        ctx.fillStyle = '#55efc4';
        ctx.fillRect(x, y, (can / maxCan) * genislik, yukseklik);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.strokeRect(x, y, genislik, yukseklik);
    },

    ciz: function (ctx, canvas) {
        drawAstraStyleScene(ctx, canvas, this, this.gezegenGorseli);
        return;

        const gezegenYaricapi = this.gezegenYaricapi(canvas);
        const merkezY = canvas.height / 2;
        const savunmaX = this.savunmaUssuX(canvas);

        // --- GÖRSELDEKİ TASARIMI REPLİKE ETME (YEŞİL KARALAMALAR) ---
        
        // Arka Plan Kırmızımsı Glow
        ctx.save();
        const backGlow = ctx.createRadialGradient(0, merkezY, 0, 0, merkezY, gezegenYaricapi * 2);
        backGlow.addColorStop(0, 'rgba(60, 10, 10, 0.5)');
        backGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = backGlow;
        ctx.fillRect(0, 0, savunmaX + 100, canvas.height);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = this.renk;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.renk;

        // 1. Ana Karalama Kütlesi (Düzensiz çizgiler)
        ctx.beginPath();
        for (let i = 0; i < 200; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const dist = Math.random() * gezegenYaricapi * 0.8;
            const x = Math.cos(angle) * dist;
            const y = merkezY + Math.sin(angle) * dist;
            
            if (i === 0) ctx.moveTo(x, y);
            else {
                // Hafif kavisli karalama efekti
                ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, x, y);
            }
        }
        ctx.stroke();

        // 2. Belirgin Halkalar/Yaylar (Görseldeki yeşil büyük yay)
        ctx.beginPath();
        ctx.arc(0, merkezY, gezegenYaricapi * 0.75, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.lineWidth = 6;
        ctx.stroke();

        // 3. İç Swirl (Karalama merkezindeki döngü)
        ctx.beginPath();
        for (let i = 0; i < 50; i++) {
            const angle = i * 0.5;
            const r = i * 2;
            const x = Math.cos(angle) * r + 20;
            const y = merkezY + Math.sin(angle) * r - 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Dışarı Yayılan Çizgiler (Görseldeki güneş ışını gibi çizgiler)
        ctx.lineWidth = 4;
        for (let i = 0; i < 10; i++) {
            const angle = -Math.PI / 2.5 + (i * Math.PI / 12);
            const rIn = gezegenYaricapi * 0.85;
            const rOut = gezegenYaricapi * 1.4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * rIn, merkezY + Math.sin(angle) * rIn);
            ctx.lineTo(Math.cos(angle) * rOut, merkezY + Math.sin(angle) * rOut);
            ctx.stroke();
        }

        // 5. Küçük Nokta (Görseldeki gezegenin yanındaki küçük nokta) KALDIRILDI
        /*
        ctx.beginPath();
        ctx.arc(gezegenYaricapi * 0.95, merkezY - 10, 6, 0, Math.PI * 2);
        ctx.fillStyle = this.renk;
        ctx.fill();
        */

        ctx.restore();

        // Savunma Ussu
        ctx.save();
        ctx.translate(savunmaX, merkezY);
        ctx.fillStyle = '#0a192f';
        ctx.strokeStyle = this.renk;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-34, -90, 68, 180, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff4747';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 58, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        this.canBariCiz(ctx, 36, Math.max(112, merkezY - gezegenYaricapi + 22), 180, 18, this.can, this.maxCan);

        this.dusmanlar.forEach(dusman => {
            const yari = dusman.boyut / 2;
            if (dusman.image && dusman.image.complete && dusman.image.naturalWidth > 0) {
                ctx.drawImage(dusman.image, dusman.x - yari, dusman.y - yari, dusman.boyut, dusman.boyut);
            } else {
                ctx.fillStyle = '#ff4747';
                ctx.fillRect(dusman.x - yari, dusman.y - yari, dusman.boyut, dusman.boyut);
            }
            this.canBariCiz(ctx, dusman.x - 20, dusman.y - yari - 12, 40, 5, dusman.can, dusman.maxCan);
        });
    },

    oyunSonuEkraniCiz: function (ctx, canvas) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.font = "700 54px 'Orbitron', sans-serif";
        ctx.fillStyle = '#ff4747';
        ctx.fillText('OLDUNUZ', canvas.width / 2, canvas.height / 2 - 34);
        ctx.font = "700 26px 'Rajdhani', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Dayanilan sure: ${this.sureyiYaz()}`, canvas.width / 2, canvas.height / 2 + 18);
        ctx.fillText('Menuye donerek en iyi skoru gezegen altinda gorebilirsiniz', canvas.width / 2, canvas.height / 2 + 56);
        ctx.restore();
    }
};
