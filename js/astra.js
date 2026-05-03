// --- ASTRA GEZEGENI BOLUM DOSYASI ---

import { NormalEnemy } from './enemy.js';
import { drawSidePlanetScene } from './sceneVisuals.js';

export const astraBolumu = {
    isim: 'Astra',
    renk: '#e056fd',
    gezegenGorseli: 'assets/images/gezegen1.png',
    can: 100,
    maxCan: 100,
    oyuncuCan: 100,
    maxOyuncuCan: 100,
    turn: 1,
    maxTurn: 5,
    mermi: 15,
    maxMermi: 15,
    para: 200,
    gecenSure: 0,
    baslangicZamani: 0,
    sonDusmanZamani: 0,
    dusmanAraligi: 3300,
    yenidenDoluyor: false,
    yenidenDolumBaslangic: 0,
    yenidenDolumSuresi: 3000,
    oyunDevamEdiyor: false,
    oyunBitti: false,
    sonOyuncuHasarZamani: -10,
    dusmanlar: [],
    koridorlar: [],

    // Bolum basladiginda cagrilacak ilk ayarlar
    baslat: function (canvas) {
        this.can = 100;
        this.oyuncuCan = 100;
        this.turn = 1;
        this.mermi = 15;
        this.para = 200;
        this.gecenSure = 0;
        this.yenidenDoluyor = false;
        this.dusmanlar = [];
        this.oyunDevamEdiyor = true;
        this.oyunBitti = false;
        this.sonOyuncuHasarZamani = -10;
        this.baslangicZamani = performance.now();
        this.sonDusmanZamani = performance.now();
        this.koridorlariHazirla(canvas);

        // Her koridordan ilk dusmanlar gelsin.
        for (let i = 0; i < 5; i++) {
            this.dusmanEkle(canvas, i, i * 120);
        }

        this.huduGuncelle();
    },

    durdur: function () {
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
        if (!this.koridorlar[koridorNo]) return;
        const x = canvas.width + 60 + gecikme;
        const y = this.koridorlar[koridorNo].y;
        // Astra'da sadece Normal (kamikaze) düşmanlar var; istatistikler astra'ya özel
        const dusman = new NormalEnemy(x, y, koridorNo, 0.65 + (koridorNo * 0.08), 32, 60);
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
        const hudDusman = document.getElementById('hud-dusman');

        if (hudCan) hudCan.textContent = Math.max(0, Math.ceil(this.can));
        if (hudOyuncuCan) hudOyuncuCan.textContent = Math.max(0, Math.ceil(this.oyuncuCan));
        if (hudMermi) hudMermi.textContent = this.yenidenDoluyor ? 'Doluyor' : this.mermi;
        if (hudPara) hudPara.textContent = this.para;
        if (hudSure) hudSure.textContent = this.sureyiYaz();
        if (hudTurn) hudTurn.textContent = this.turn;
        if (hudDusman) hudDusman.textContent = this.dusmanlar.length;
    },

    atesEtmeyeIzinVar: function () {
        if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor) return false;

        if (this.mermi <= 0) {
            this.yenidenDoldur();
            return false;
        }

        this.mermi--;

        if (this.mermi <= 0) {
            this.yenidenDoldur();
        }

        this.huduGuncelle();
        return true;
    },

    yenidenDoldur: function () {
        if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor) return;
        if (this.mermi >= this.maxMermi) return;

        this.yenidenDoluyor = true;
        this.yenidenDolumBaslangic = performance.now();
        this.huduGuncelle();
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
                        this.para += 10;
                    }

                    break;
                }
            }
        }
    },

    // Her karede calisacak guncelleme mantigi
    guncelle: function (canvas, mermiler, gemi) {
        if (!this.oyunDevamEdiyor) return;

        this.koridorlariHazirla(canvas);
        this.gecenSure = (performance.now() - this.baslangicZamani) / 1000;

        if (this.yenidenDoluyor && performance.now() - this.yenidenDolumBaslangic >= this.yenidenDolumSuresi) {
            this.mermi = this.maxMermi;
            this.yenidenDoluyor = false;
        }

        if (performance.now() - this.sonDusmanZamani > this.dusmanAraligi) {
            for (let i = 0; i < 5; i++) {
                this.dusmanEkle(canvas, i, i * 95);
            }

            this.sonDusmanZamani = performance.now();
        }

        const savunmaX = this.savunmaUssuX(canvas);

        for (let i = this.dusmanlar.length - 1; i >= 0; i--) {
            const dusman = this.dusmanlar[i];
            dusman.y = this.koridorlar[dusman.koridorNo].y;
            dusman.x -= dusman.hiz;

            if (gemi && this.dusmanGemiyeDegdiMi(dusman, gemi)) {
                this.oyuncuCan -= 20;
                this.sonOyuncuHasarZamani = this.gecenSure;
                this.dusmanlar.splice(i, 1);
                continue;
            }

            if (dusman.x < savunmaX + 28) {
                this.can -= 10;
                this.dusmanlar.splice(i, 1);
            }
        }

        this.mermiCarpismalariniKontrolEt(mermiler);

        // --- GEMİ PASİF İYİLEŞMESİ ---
        // 3 saniye hasar almadıysa saniyede 2 can kazanır (%80 limite kadar)
        if (this.gecenSure - this.sonOyuncuHasarZamani > 3 &&
            this.oyuncuCan < this.maxOyuncuCan * 0.8) {
            this.oyuncuCan = Math.min(this.maxOyuncuCan * 0.8, this.oyuncuCan + 2 / 60);
        }

        if (this.can <= 0 || this.oyuncuCan <= 0) {
            if (this.can < 0) this.can = 0;
            if (this.oyuncuCan < 0) this.oyuncuCan = 0;
            this.oyunDevamEdiyor = false;
            this.oyunBitti = true;
        }

        this.huduGuncelle();
    },

    gezegenYaricapi: function (canvas) {
        return Math.min(175, Math.max(135, canvas.height * 0.22));
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

    // Cizim islemi (Gezegenin yarisi, us ve dusmanlar)
    ciz: function (ctx, canvas) {
        drawSidePlanetScene(ctx, canvas, this, this.gezegenGorseli);
        return;

        const gezegenYaricapi = this.gezegenYaricapi(canvas);
        const merkezY = canvas.height / 2;
        const savunmaX = this.savunmaUssuX(canvas);

        // 1. ASTRA GEZEGENI (Sol kenarda yarim daire)
        const gezegenRengi = ctx.createRadialGradient(0, merkezY, 20, 0, merkezY, gezegenYaricapi);
        gezegenRengi.addColorStop(0, '#ffd6ff');
        gezegenRengi.addColorStop(0.45, this.renk);
        gezegenRengi.addColorStop(1, '#4b1458');

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, merkezY, gezegenYaricapi, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fillStyle = gezegenRengi;
        ctx.shadowBlur = 55;
        ctx.shadowColor = this.renk;
        ctx.fill();
        ctx.restore();

        // 2. SAVUNMA USSU
        ctx.save();
        ctx.translate(savunmaX, merkezY);
        ctx.fillStyle = '#16233f';
        ctx.strokeStyle = '#5ae0ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#5ae0ff';
        ctx.beginPath();
        ctx.roundRect(-34, -90, 68, 180, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff4747';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 58, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. ASTRA CAN BARI
        this.canBariCiz(ctx, 36, Math.max(112, merkezY - gezegenYaricapi + 22), 180, 18, this.can, this.maxCan);

        // 4. DUSMANLAR (Görselli çizim)
        this.dusmanlar.forEach(dusman => {
            const yari = dusman.boyut / 2;

            if (dusman.image && dusman.image.complete && dusman.image.naturalWidth > 0) {
                ctx.drawImage(dusman.image, dusman.x - yari, dusman.y - yari, dusman.boyut, dusman.boyut);
            } else {
                // Görsel yüklenmediyse yedek olarak kırmızı kare
                ctx.fillStyle = '#ff4747';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ff4747';
                ctx.fillRect(dusman.x - yari, dusman.y - yari, dusman.boyut, dusman.boyut);
                ctx.shadowBlur = 0;
            }

            this.canBariCiz(ctx, dusman.x - 20, dusman.y - yari - 12, 40, 5, dusman.can, dusman.maxCan);
        });

    },

    oyunSonuEkraniCiz: function (ctx, canvas) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.font = "700 54px 'Orbitron', sans-serif";
        ctx.fillStyle = '#ff4747';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff4747';
        ctx.fillText('END GAME ', canvas.width / 2, canvas.height / 2 - 18);

        ctx.font = "700 26px 'Rajdhani', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillText('Oyun sonlandi', canvas.width / 2, canvas.height / 2 + 34);
        ctx.restore();
    }
};
