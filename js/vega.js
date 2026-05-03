// --- VEGA GEZEGENI BOLUM DOSYASI ---

import { NormalEnemy, HighEnemy, QueenEnemy } from './enemy.js';
import { drawSidePlanetScene } from './sceneVisuals.js';
import { sfxAcik } from './audio.js';

export const vegaBolumu = {
    isim: 'Vega',
    renk: '#00d2ff', // Cyan
    gezegenGorseli: 'assets/images/gezegen2.png',
    can: 100,
    maxCan: 100,
    oyuncuCan: 100,
    maxOyuncuCan: 100,
    turn: 1,
    maxTurn: 5,
    mermi: 25, // Vega biraz daha ileri seviye olduğu için mermi kapasitesini artırdık
    maxMermi: 25,
    para: 300, // Başlangıç parası biraz daha fazla
    gecenSure: 0,
    baslangicZamani: 0,
    sonDusmanZamani: 0,
    dusmanAraligi: 5500, // Vega dalga aralığı (ms) — Astra'dan daha zor ama boğulmayan bir tempo
    yenidenDoluyor: false,
    yenidenDolumBaslangic: 0,
    yenidenDolumSuresi: 2800, // Biraz daha hızlı dolum
    oyunDevamEdiyor: false,
    oyunBitti: false,
    sonOyuncuHasarZamani: -10,
    dusmanlar: [],
    koridorlar: [],
    
    // --- YENİ ÖZELLİKLER ---
    firtinaAraligi: 12000, // 12 saniyede bir
    firtinaSuresi: 3000,   // 3 saniye sürer
    sonFirtinaZamani: 0,   // Son fırtına bitişi (bir sonraki için bekleme başlangıcı)
    firtinaBaslamaZamani: 0, // Fırtına ne zaman başladı (süre ölçümü için)
    firtinaAktif: false,
    firtinaHalkasi: 0,
    zincirler: [],        // Görsel efektler için
    lazerler: [],         // HighEnemy lazer listesi

    // Bolum basladiginda cagrilacak ilk ayarlar
    baslat: function (canvas) {
        this.can = 100;
        this.oyuncuCan = 100;
        this.turn = 1;
        this.mermi = 25;
        this.para = 300;
        this.gecenSure = 0;
        this.yenidenDoluyor = false;
        this.dusmanlar = [];
        this.oyunDevamEdiyor = true;
        this.oyunBitti = false;
        this.sonOyuncuHasarZamani = -10;
        this.baslangicZamani = performance.now();
        this.sonDusmanZamani = performance.now();
        this.sonFirtinaZamani = performance.now();
        this.firtinaBaslamaZamani = 0;
        this.firtinaAktif = false;
        this.firtinaHalkasi = 0;
        this.zincirler = [];
        this.lazerler = [];
        this.koridorlariHazirla(canvas);

        // Vega başlangıç: 3 koridor, aralıklı geliş
        for (let i = 0; i < 3; i++) {
            this.dusmanEkle(canvas, i * 2, i * 180); // 0, 2, 4 numaralı koridorlar
        }

        this.huduGuncelle();
    },

    durdur: function () {
        this.oyunDevamEdiyor = false;
        this.oyunBitti = false;
        this.dusmanlar = [];
        this.lazerler = [];
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
        // Vega'da karma düşman tipleri: %55 Normal, %35 High, %10 Queen
        const rnd = Math.random();
        let dusman;
        if (rnd < 0.55) {
            dusman = new NormalEnemy(x, y, koridorNo, 0.75 + (koridorNo * 0.08), 32, 60);
        } else if (rnd < 0.90) {
            dusman = new HighEnemy(x, y, koridorNo, 0.90 + (koridorNo * 0.05), 40, 100);
        } else {
            dusman = new QueenEnemy(x, y, koridorNo, 0.55, 80, 180);
        }
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

        const atisSesi = new Audio('audios/atis_sesi_anlik.mp3');
        if (sfxAcik) atisSesi.play().catch(err => console.log("Ses çalınamadı:", err));

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

    // En yakın düşmanı bulma (Zincirleme atış için)
    enYakinDusmanBul: function (kaynakDusman, haricIndex) {
        let enYakin = null;
        let minMesafe = 250; // Sıçrama menzili

        this.dusmanlar.forEach((d, index) => {
            if (index === haricIndex) return;
            const mesafe = Math.sqrt(Math.pow(d.x - kaynakDusman.x, 2) + Math.pow(d.y - kaynakDusman.y, 2));
            if (mesafe < minMesafe) {
                minMesafe = mesafe;
                enYakin = { dusman: d, index: index };
            }
        });
        return enYakin;
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
                    // Ana düşmana hasar
                    dusman.can -= 25;
                    
                    // --- ZİNCİRLEME ATIŞ (CHAIN SHOT) ---
                    // Sıçramayı ANA düşmana hasar vermeden önce hesapla (index güvenli olsun)
                    const sicrama = this.enYakinDusmanBul(dusman, j);
                    if (sicrama) {
                        sicrama.dusman.can -= 15; // Sıçrama hasarı biraz daha az
                        this.zincirler.push({
                            x1: dusman.x,
                            y1: dusman.y,
                            x2: sicrama.dusman.x,
                            y2: sicrama.dusman.y,
                            zaman: performance.now()
                        });

                        if (sicrama.dusman.can <= 0) {
                            this.dusmanlar.splice(sicrama.index, 1);
                            this.para += 12;
                            // Sıçrama hedefi, ana düşmandan (j) önce geliyorsa j'yi kaydır
                            // (splice yapılınca j'nin gösterdiği eleman kayar)
                        }
                    }

                    mermiler.splice(i, 1);

                    if (dusman.can <= 0) {
                        // Eğer sıçrama hedefi daha düşük bir index'teyse j kayar, ama
                        // dusman ref'i hâlâ geçerli olduğundan splice güvenle yapılabilir
                        const jDuzeltilmis = this.dusmanlar.indexOf(dusman);
                        if (jDuzeltilmis !== -1) {
                            this.dusmanlar.splice(jDuzeltilmis, 1);
                            this.para += 12;
                        }
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
            // Her dalgada 3 düşman (5 yerine) — daha dengeli yoğunluk
            for (let i = 0; i < 3; i++) {
                const koridor = Math.floor(Math.random() * 5); // rastgele koridor
                this.dusmanEkle(canvas, koridor, i * 150);
            }

            this.sonDusmanZamani = performance.now();
        }

        // --- İYON FIRTINASI KONTROLÜ ---
        const savunmaX = this.savunmaUssuX(canvas);
        const simdi = performance.now();
        if (!this.firtinaAktif && simdi - this.sonFirtinaZamani > this.firtinaAraligi) {
            this.firtinaAktif = true;
            this.firtinaHalkasi = 0;
            this.firtinaBaslamaZamani = simdi; // Fırtına başladı, ayrı timer
        }

        if (this.firtinaAktif && simdi - this.firtinaBaslamaZamani > this.firtinaSuresi) {
            this.firtinaAktif = false;
            this.sonFirtinaZamani = simdi; // Bitti, bir sonraki fırtına için beklemeyi başlat
        }

        // Zincir efektlerini temizle (0.2 saniye sonra)
        this.zincirler = this.zincirler.filter(z => simdi - z.zaman < 200);

        for (let i = this.dusmanlar.length - 1; i >= 0; i--) {
            const dusman = this.dusmanlar[i];

            // Queen kendi Y'sini ışınlanmayla değiştirebilir; diğerleri koridora kilitli
            if (!dusman.tip || dusman.tip !== 'queen') {
                dusman.y = this.koridorlar[dusman.koridorNo] ? this.koridorlar[dusman.koridorNo].y : dusman.y;
            }

            // Eğer fırtına aktifse düşmanlar hareket edemez
            if (!this.firtinaAktif) {
                dusman.x -= dusman.hiz;
                dusman.donmus = false;
            } else {
                dusman.donmus = true;
            }

            // Özel yetenekler (lazer atışı / ışınlanma / doğurma)
            dusman.update(canvas, this);

            if (gemi && this.dusmanGemiyeDegdiMi(dusman, gemi)) {
                this.oyuncuCan -= (dusman.tip === 'queen' ? 60 : 20);
                this.sonOyuncuHasarZamani = this.gecenSure;
                this.dusmanlar.splice(i, 1);
                continue;
            }

            if (dusman.x < savunmaX + 28) {
                this.can -= (dusman.tip === 'queen' ? 80 : 10);
                this.dusmanlar.splice(i, 1);
            }
        }

        // --- LAZER HAREKETİ VE ÇARPIŞMA ---
        for (let i = this.lazerler.length - 1; i >= 0; i--) {
            const lz = this.lazerler[i];
            lz.x += lz.hizX;
            lz.y += lz.hizY;

            // Gemiye çarptı mı?
            if (gemi) {
                const gW = gemi.genislik / 2;
                const gH = gemi.uzunluk / 2;
                if (lz.x > gemi.x - gW && lz.x < gemi.x + gW &&
                    lz.y > gemi.y - gH && lz.y < gemi.y + gH) {
                    this.oyuncuCan -= lz.hasar;
                    this.sonOyuncuHasarZamani = this.gecenSure;
                    this.lazerler.splice(i, 1);
                    continue;
                }
            }
            // Üsse çarptı mı?
            if (lz.x < savunmaX + 28) {
                this.can -= lz.hasar;
                this.lazerler.splice(i, 1);
                continue;
            }
            // Ekrandan çıktı mı?
            if (lz.x < 0 || lz.y < 0 || lz.y > canvas.height) {
                this.lazerler.splice(i, 1);
            }
        }

        this.mermiCarpismalariniKontrolEt(mermiler);

        // --- GEMİ PASİF İYİLEŞMESİ ---
        if (this.gecenSure - this.sonOyuncuHasarZamani > 3 &&
            this.oyuncuCan < this.maxOyuncuCan * 0.8) {
            this.oyuncuCan = Math.min(this.maxOyuncuCan * 0.8, this.oyuncuCan + 2.5 / 60);
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

        // 1. VEGA GEZEGENI (Sol kenarda yarim daire)
        const gezegenRengi = ctx.createRadialGradient(0, merkezY, 20, 0, merkezY, gezegenYaricapi);
        gezegenRengi.addColorStop(0, '#e0f7fa'); // Çok açık cyan
        gezegenRengi.addColorStop(0.45, this.renk); // #00d2ff
        gezegenRengi.addColorStop(1, '#004e92'); // Derinlik rengi

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, merkezY, gezegenYaricapi, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fillStyle = gezegenRengi;
        ctx.shadowBlur = 55;
        ctx.shadowColor = '#5ae0ff'; // Parlama efekti
        ctx.fill();
        ctx.restore();

        // 2. SAVUNMA USSU
        ctx.save();
        ctx.translate(savunmaX, merkezY);
        ctx.fillStyle = '#0a192f'; // Daha koyu lacivert
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

        // 3. VEGA CAN BARI
        this.canBariCiz(ctx, 36, Math.max(112, merkezY - gezegenYaricapi + 22), 180, 18, this.can, this.maxCan);

        // 4. DUSMANLAR
        this.dusmanlar.forEach(dusman => {
            const yari = dusman.boyut / 2;

            if (dusman.image && dusman.image.complete && dusman.image.naturalWidth > 0) {
                ctx.drawImage(dusman.image, dusman.x - yari, dusman.y - yari, dusman.boyut, dusman.boyut);
            } else {
                ctx.fillStyle = '#ff4747';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ff4747';
                ctx.fillRect(dusman.x - yari, dusman.y - yari, dusman.boyut, dusman.boyut);
                ctx.shadowBlur = 0;
            }

            this.canBariCiz(ctx, dusman.x - 20, dusman.y - yari - 12, 40, 5, dusman.can, dusman.maxCan);
            
            // Eğer donmuşsa efekt ekle
            if (dusman.donmus) {
                ctx.save();
                ctx.strokeStyle = '#5ae0ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(dusman.x, dusman.y, yari + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });

        // 5. İYON FIRTINASI HALKASI
        if (this.firtinaAktif) {
            this.firtinaHalkasi += 15;
            ctx.save();
            ctx.beginPath();
            ctx.arc(savunmaX, merkezY, this.firtinaHalkasi, -Math.PI / 2, Math.PI / 2);
            ctx.strokeStyle = 'rgba(90, 224, 255, 0.4)';
            ctx.lineWidth = 10;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#5ae0ff';
            ctx.stroke();
            
            // Ekran parlaması
            ctx.fillStyle = 'rgba(90, 224, 255, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        // 6. ZİNCİRLEME EFEKTLERİ
        this.zincirler.forEach(z => {
            ctx.save();
            ctx.strokeStyle = '#5ae0ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00d2ff';
            ctx.beginPath();
            ctx.moveTo(z.x1, z.y1);
            // Zikzak efekti için araya nokta ekleyelim
            const midX = (z.x1 + z.x2) / 2 + (Math.random() - 0.5) * 20;
            const midY = (z.y1 + z.y2) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(z.x2, z.y2);
            ctx.stroke();
            ctx.restore();
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
        ctx.fillText('Vega Savunmasi Basarisiz Oldu', canvas.width / 2, canvas.height / 2 + 34);
        ctx.restore();
    }
};
