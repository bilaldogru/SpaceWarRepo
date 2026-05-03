// --- NORA GEZEGENI (KARADELIK) BOLUM DOSYASI ---

import { NormalEnemy, HighEnemy, QueenEnemy } from './enemy.js';
import { drawSidePlanetScene } from './sceneVisuals.js';
import { muzikAksiyon, muzikDurdurTum, sfxAcik } from './audio.js';

export const noraBolumu = {
    isim: 'Nora',
    renk: '#f39c12',
    gezegenGorseli: 'assets/images/gezegen3.png',
    can: 150,
    maxCan: 150,
    oyuncuCan: 100,
    maxOyuncuCan: 500,
    turn: 1,
    maxTurn: 5,
    mermi: 120,
    maxMermi: 120,
    para: 500,
    gecenSure: 0,
    baslangicZamani: 0,
    // Dalga sistemi
    aktifDalga: 0,
    maxDalga: 5,
    dalgaDusmanlari: [],
    dalgaAraBekleme: 8000,
    dalgaAraBitis: 0,
    dalgaArasiMi: false,
    // Yeniden doldurma
    yenidenDoluyor: false,
    yenidenDolumBaslangic: 0,
    yenidenDolumSuresi: 1800,
    // Oyun durumu
    oyunDevamEdiyor: false,
    oyunBitti: false,
    oyunKazanildi: false,
    // Kalkan
    kalkanAktif: false,
    kalkanZamanlayici: 0,
    kalkanSuresi: 3,
    kalkanAraligi: 5,
    // Can rejenerasyonu
    sonRejenZamani: 0,
    rejenAraligi: 5,
    rejenMiktar: 20,
    // Listeler
    lazerler: [],
    dusmanlar: [],
    koridorlar: [],
    _gemi: null,
    sonOyuncuHasarZamani: -10, // Son hasar zamanı (gecenSure cinsinden)

    baslat: function (canvas) {
        this.can = this.maxCan;
        this.oyuncuCan = this.maxOyuncuCan;
        this.mermi = this.maxMermi;
        this.para = 500;
        this.gecenSure = 0;
        this.yenidenDoluyor = false;
        this.dusmanlar = [];
        this.lazerler = [];
        this.oyunDevamEdiyor = true;
        this.oyunBitti = false;
        this.oyunKazanildi = false;
        this.kalkanAktif = false;
        this.kalkanZamanlayici = 0;
        this.sonRejenZamani = 0;
        this.aktifDalga = 0;
        this.turn = 1;
        this.dalgaDusmanlari = [];
        this.dalgaAraBitis = 0;
        this.dalgaArasiMi = false;
        this.sonOyuncuHasarZamani = -10;
        this._kalkanBaslangic = 0;
        this.baslangicZamani = performance.now();
        this.koridorlariHazirla(canvas);
        this._dalgaBaslat(canvas);
        this.huduGuncelle();
    },

    durdur: function () {
        this.oyunDevamEdiyor = false;
        this.oyunBitti = false;
        this.oyunKazanildi = false;
        this.dusmanlar = [];
        this.lazerler = [];
        this.dalgaDusmanlari = [];
        this.gecenSure = 0;
        this.aktifDalga = 0;
        this.turn = 1;
        this.kalkanAktif = false;
        this.yenidenDoluyor = false;
        this.huduGuncelle();
    },

    koridorlariHazirla: function (canvas) {
        this.koridorlar = [];
        const ustBosluk = 155;
        const altBosluk = 70;
        const alan = canvas.height - ustBosluk - altBosluk;
        for (let i = 0; i < 5; i++) {
            this.koridorlar.push({ y: ustBosluk + (alan / 4) * i });
        }
    },

    dusmanEkle: function (canvas, koridorNo, gecikme, tip = 'normal') {
        if (!this.koridorlar[koridorNo]) return;
        const x = canvas.width + gecikme;
        const y = this.koridorlar[koridorNo].y;
        let dusman;
        if (tip === 'queen') {
            dusman = new QueenEnemy(x, y, koridorNo, 0.50, 90, 200);
        } else if (tip === 'high') {
            dusman = new HighEnemy(x, y, koridorNo, 1.0 + (koridorNo * 0.05), 45, 100);
        } else {
            dusman = new NormalEnemy(x, y, koridorNo, 0.75 + (koridorNo * 0.05), 32, 10);
        }
        this.dusmanlar.push(dusman);
    },

    sureyiYaz: function () {
        const d = Math.floor(this.gecenSure / 60).toString().padStart(2, '0');
        const s = Math.floor(this.gecenSure % 60).toString().padStart(2, '0');
        return d + ':' + s;
    },

    huduGuncelle: function () {
        const ids = ['can', 'oyuncu-can', 'mermi', 'para', 'sure', 'turn', 'dusman'];
        const vals = [
            Math.max(0, Math.ceil(this.can)),
            Math.max(0, Math.ceil(this.oyuncuCan)),
            this.yenidenDoluyor ? 'Doluyor' : this.mermi,
            this.para,
            this.sureyiYaz(),
            this.turn,
            this.dusmanlar.length
        ];
        ids.forEach((id, i) => {
            const el = document.getElementById(`hud-${id}`);
            if (el) el.textContent = vals[i];
        });
    },

    atesEtmeyeIzinVar: function () {
        if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor) return false;
        if (this.mermi <= 0) { this.yenidenDoldur(); return false; }
        this.mermi--;

        const atisSesi = new Audio('audios/atis_sesi_anlik.mp3');
        if (sfxAcik) atisSesi.play().catch(err => console.log("Ses çalınamadı:", err));

        if (this.mermi <= 0) this.yenidenDoldur();
        this.huduGuncelle();
        return true;
    },

    yenidenDoldur: function () {
        if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor || this.mermi >= this.maxMermi) return;
        this.yenidenDoluyor = true;
        this.yenidenDolumBaslangic = performance.now();
        this.huduGuncelle();
    },

    mermiCarpismalariniKontrolEt: function (mermiler) {
        for (let i = mermiler.length - 1; i >= 0; i--) {
            const mermi = mermiler[i];
            for (let j = this.dusmanlar.length - 1; j >= 0; j--) {
                const d = this.dusmanlar[j];
                const yari = d.boyut / 2;
                if (mermi.x > d.x - yari && mermi.x < d.x + yari &&
                    mermi.y > d.y - yari && mermi.y < d.y + yari) {
                    d.can -= 25;
                    mermiler.splice(i, 1);
                    if (d.can <= 0) {
                        this.para += (d.tip === 'queen' ? 300 : (d.tip === 'high' ? 40 : 15));
                        this.dusmanlar.splice(j, 1);
                    }
                    break;
                }
            }
        }
    },

    _dalgaTanimlari: function () {
        return [
            // Dalga 1: Hafif — sadece normal
            [...Array(8)].map((_, i) => ({ koridor: i % 5, tip: 'normal', gecikme: i * 600 })),
            // Dalga 2: Orta — normal + bazı high
            [...Array(10)].map((_, i) => ({ koridor: i % 5, tip: i % 3 === 0 ? 'high' : 'normal', gecikme: i * 500 })),
            // Dalga 3: Ağır — çoğunlukla high + 1 queen
            [
                ...[...Array(8)].map((_, i) => ({ koridor: i % 5, tip: 'high', gecikme: i * 450 })),
                { koridor: 2, tip: 'queen', gecikme: 5000 }
            ],
            // Dalga 4: Yoğun — karışık + 2 queen
            [
                ...[...Array(10)].map((_, i) => ({ koridor: i % 5, tip: i % 2 === 0 ? 'high' : 'normal', gecikme: i * 400 })),
                { koridor: 1, tip: 'queen', gecikme: 5500 },
                { koridor: 3, tip: 'queen', gecikme: 7000 }
            ],
            // Dalga 5: Cehennem — tüm high + 3 queen
            [
                ...[...Array(12)].map((_, i) => ({ koridor: i % 5, tip: 'high', gecikme: i * 350 })),
                { koridor: 0, tip: 'queen', gecikme: 5000 },
                { koridor: 2, tip: 'queen', gecikme: 6500 },
                { koridor: 4, tip: 'queen', gecikme: 8000 }
            ]
        ];
    },

    _dalgaBaslat: function (canvas) {
        if (this.aktifDalga >= this.maxDalga) return;
        this.aktifDalga++;
        this.turn = this.aktifDalga;
        const tanimlar = this._dalgaTanimlari();
        const simdi = performance.now();
        this.dalgaDusmanlari = tanimlar[this.aktifDalga - 1].map(d => ({
            koridor: d.koridor,
            tip: d.tip,
            hedefZaman: simdi + d.gecikme
        }));
        this.dalgaArasiMi = false;

        if (this.aktifDalga === this.maxDalga) {
            muzikDurdurTum();
            muzikAksiyon.play().catch(e => console.log(e));
        }

        this.huduGuncelle();
    },

    guncelle: function (canvas, mermiler, gemi) {
        if (!this.oyunDevamEdiyor) return;

        this._gemi = gemi;
        this.koridorlariHazirla(canvas);
        this.gecenSure = (performance.now() - this.baslangicZamani) / 1000;

        // Yeniden doldurma kontrolü
        if (this.yenidenDoluyor && performance.now() - this.yenidenDolumBaslangic >= this.yenidenDolumSuresi) {
            this.mermi = this.maxMermi;
            this.yenidenDoluyor = false;
        }

        const simdi = performance.now();

        // --- DALGA SPAWN SİSTEMİ ---
        if (!this.dalgaArasiMi && this.dalgaDusmanlari.length > 0) {
            this.dalgaDusmanlari = this.dalgaDusmanlari.filter(d => {
                if (simdi >= d.hedefZaman) {
                    this.dusmanEkle(canvas, d.koridor, 0, d.tip);
                    return false;
                }
                return true;
            });
        } else if (!this.dalgaArasiMi && this.dalgaDusmanlari.length === 0 && this.dusmanlar.length === 0) {
            if (this.aktifDalga >= this.maxDalga) {
                this.oyunKazanildi = true;
                this.oyunDevamEdiyor = false;
                this.oyunBitti = true;
            } else {
                this.dalgaArasiMi = true;
                this.dalgaAraBitis = simdi + this.dalgaAraBekleme;
            }
        } else if (this.dalgaArasiMi && simdi >= this.dalgaAraBitis) {
            this._dalgaBaslat(canvas);
        }

        const savunmaX = this.savunmaUssuX(canvas);

        // --- DÜŞMAN DÖNGÜSÜ ---
        for (let i = this.dusmanlar.length - 1; i >= 0; i--) {
            const d = this.dusmanlar[i];

            // Queen kendi Y'sini ışınlanmayla değiştiriyor; diğerleri koridora kilitli
            if (d.tip !== 'queen') {
                d.y = this.koridorlar[d.koridorNo] ? this.koridorlar[d.koridorNo].y : d.y;
            }

            // Karadelik çekim etkisi
            const ekstraCekim = (canvas.width - d.x) * 0.0003;
            d.x -= (d.hiz + ekstraCekim);

            // Özel yetenekler (lazer atışı / ışınlanma / doğurma) — enemy.js'den gelir
            d.update(canvas, this);

            // Gemiye çarptı mı?
            if (gemi && this.dusmanGemiyeDegdiMi(d, gemi)) {
                this.oyuncuCan -= (d.tip === 'queen' ? 70 : 30);
                this.sonOyuncuHasarZamani = this.gecenSure; // Hasar sayacını sıfırla
                this.dusmanlar.splice(i, 1);
                continue;
            }

            // Üsse ulaştı mı?
            if (d.x < savunmaX + 28) {
                if (!this.kalkanAktif) {
                    this.can -= (d.tip === 'queen' ? 100 : 20);
                }
                this.dusmanlar.splice(i, 1);
            }
        }

        // --- LAZER HAREKETİ VE ÇARPIŞMA ---
        for (let i = this.lazerler.length - 1; i >= 0; i--) {
            const lz = this.lazerler[i];
            lz.x += lz.hizX;
            lz.y += lz.hizY;

            // Gemiye çarptı mı?
            if (this._gemi) {
                const gW = this._gemi.genislik / 2;
                const gH = this._gemi.uzunluk / 2;
                if (lz.x > this._gemi.x - gW && lz.x < this._gemi.x + gW &&
                    lz.y > this._gemi.y - gH && lz.y < this._gemi.y + gH) {
                    this.oyuncuCan -= lz.hasar;
                    this.sonOyuncuHasarZamani = this.gecenSure; // Hasar sayacını sıfırla
                    this.lazerler.splice(i, 1);
                    continue;
                }
            }
            // Üsse çarptı mı?
            if (lz.x < savunmaX + 28) {
                if (!this.kalkanAktif) this.can -= lz.hasar;
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
        // 3 saniye hasar almadıysa saniyede 2 can kazanır (tam iyileşme yok)
        const gemilRejenBekleme = 3;   // sn
        const gemiRejenHizi    = 2;    // can/sn
        const gemiRejenLimiti  = this.maxOyuncuCan * 0.8; // Max'ın %80'ine kadar iyileşir
        if (this.gecenSure - this.sonOyuncuHasarZamani > gemilRejenBekleme &&
            this.oyuncuCan < gemiRejenLimiti) {
            this.oyuncuCan = Math.min(gemiRejenLimiti, this.oyuncuCan + gemiRejenHizi / 60);
        }

        // --- ÜS CAN REJENERASYONU ---
        if (this.gecenSure - this.sonRejenZamani >= this.rejenAraligi) {
            this.can = Math.min(this.maxCan, this.can + this.rejenMiktar);
            this.sonRejenZamani = this.gecenSure;
        }

        // --- KALKAN ---
        if (!this.kalkanAktif && Math.floor(this.gecenSure) % this.kalkanAraligi === 0 &&
            Math.floor(this.gecenSure) > 0 && Math.floor(this.gecenSure) !== this.kalkanZamanlayici) {
            this.kalkanAktif = true;
            this.kalkanZamanlayici = Math.floor(this.gecenSure);
            this._kalkanBaslangic = this.gecenSure;
        }
        if (this.kalkanAktif && (this.gecenSure - this._kalkanBaslangic) >= this.kalkanSuresi) {
            this.kalkanAktif = false;
        }

        // --- OYUN BİTTİ MI? ---
        if (this.can <= 0 || this.oyuncuCan <= 0) {
            this.can = Math.max(0, this.can);
            this.oyuncuCan = Math.max(0, this.oyuncuCan);
            this.oyunDevamEdiyor = false;
            this.oyunBitti = true;
        }

        this.huduGuncelle();
    },

    gezegenYaricapi: function (canvas) {
        return Math.min(175, Math.max(135, canvas.height * 0.22));
    },

    savunmaUssuX: function (canvas) {
        return this.gezegenYaricapi(canvas) + 60;
    },

    dusmanGemiyeDegdiMi: function (d, gemi) {
        const dY = d.boyut / 2, gX = gemi.genislik / 2, gY = gemi.uzunluk / 2;
        return (d.x + dY > gemi.x - gX && d.x - dY < gemi.x + gX &&
                d.y + dY > gemi.y - gY && d.y - dY < gemi.y + gY);
    },

    canBariCiz: function (ctx, x, y, w, h, can, maxCan) {
        ctx.fillStyle = 'rgba(3,8,18,0.8)';  ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#55efc4';            ctx.fillRect(x, y, (can / maxCan) * w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.strokeRect(x, y, w, h);
    },

    ciz: function (ctx, canvas) {
        drawSidePlanetScene(ctx, canvas, this, this.gezegenGorseli);
        return;

        const yariCap  = this.gezegenYaricapi(canvas);
        const merkezY  = canvas.height / 2;
        const savunmaX = this.savunmaUssuX(canvas);

        // 1. KARADELİK: YIĞILMA DİSKİ
        ctx.save();
        ctx.shadowBlur  = 100;
        ctx.shadowColor = '#e67e22';
        ctx.fillStyle   = 'rgba(230,126,34,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, merkezY, canvas.height * 0.9, canvas.height * 0.45, 0, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.shadowBlur  = 50;
        ctx.shadowColor = '#f1c40f';
        ctx.strokeStyle = 'rgba(241,196,15,0.8)';
        ctx.lineWidth   = 15;
        ctx.beginPath();
        ctx.ellipse(0, merkezY, canvas.height * 0.6, canvas.height * 0.3, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();

        // 2. KARADELİK: OLAY UFKU
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, merkezY, yariCap, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.lineWidth   = 8;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur  = 30;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();

        // 3. SAVUNMA ÜSSÜ
        ctx.save();
        ctx.translate(savunmaX, merkezY);
        if (this.kalkanAktif) {
            ctx.beginPath();
            ctx.arc(0, 0, 75, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(90,224,255,0.85)';
            ctx.lineWidth   = 5;
            ctx.shadowBlur  = 30;
            ctx.shadowColor = '#5ae0ff';
            ctx.stroke();
            ctx.shadowBlur  = 0;
        }
        ctx.fillStyle   = '#0f172a';
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth   = 4;
        ctx.shadowBlur  = 25;
        ctx.shadowColor = '#e67e22';
        ctx.beginPath();
        ctx.roundRect(-38, -100, 76, 200, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff4747';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Can barı
        this.canBariCiz(ctx, 36, Math.max(112, merkezY - yariCap + 22), 180, 18, this.can, this.maxCan);

        // 4. DÜŞMAN ÇİZİMLERİ — her sınıf kendi draw() metodunu çalıştırır
        this.dusmanlar.forEach(d => {
            const yari = d.boyut / 2;
            ctx.save();
            ctx.globalAlpha = Math.max(0.6, (d.x / canvas.width) + 0.3);
            d.draw(ctx);
            ctx.restore();
            // Can barı
            const bw = d.tip === 'queen' ? 70 : 40;
            const bx = d.tip === 'queen' ? 35 : 20;
            this.canBariCiz(ctx, d.x - bx, d.y - yari - 12, bw, 5, d.can, d.maxCan);
        });

        // 5. LAZER ÇİZİMLERİ (High düşmanların lazerleri)
        this.lazerler.forEach(lz => {
            ctx.save();
            const grad = ctx.createLinearGradient(lz.x, lz.y, lz.x - 45, lz.y + lz.hizY * 6);
            grad.addColorStop(0, 'rgba(255,80,255,1)');
            grad.addColorStop(1, 'rgba(255,80,255,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth   = 4;
            ctx.shadowBlur  = 18;
            ctx.shadowColor = '#ff50ff';
            ctx.beginPath();
            ctx.moveTo(lz.x, lz.y);
            ctx.lineTo(lz.x - 45, lz.y + lz.hizY * 6);
            ctx.stroke();
            ctx.restore();
        });

        // 6. DALGA ARASI GERİ SAYIM
        if (this.dalgaArasiMi) {
            const kalanMs  = Math.max(0, this.dalgaAraBitis - performance.now());
            const kalanSn  = Math.ceil(kalanMs / 1000);
            const sonDalga = this.aktifDalga + 1;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(canvas.width / 2 - 230, canvas.height / 2 - 70, 460, 130);
            ctx.textAlign   = 'center';
            ctx.font        = "bold 22px 'Orbitron', sans-serif";
            ctx.fillStyle   = '#f39c12';
            ctx.shadowBlur  = 20;
            ctx.shadowColor = '#f39c12';
            ctx.fillText(`DALGA ${sonDalga} HAZIRLANIYOR...`, canvas.width / 2, canvas.height / 2 - 20);
            ctx.font        = "bold 54px 'Orbitron', sans-serif";
            ctx.fillStyle   = '#ffffff';
            ctx.shadowBlur  = 30;
            ctx.shadowColor = '#ffffff';
            ctx.fillText(kalanSn, canvas.width / 2, canvas.height / 2 + 50);
            ctx.restore();
        }
    },

    oyunSonuEkraniCiz: function (ctx, canvas) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        if (this.oyunKazanildi) {
            ctx.font = "700 64px 'Orbitron', sans-serif";
            ctx.fillStyle = '#55efc4';
            ctx.shadowBlur = 40; ctx.shadowColor = '#55efc4';
            ctx.fillText('HAYATTA KALDIN', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "700 26px 'Rajdhani', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.fillText('Nora Sistemini Savundun! 5 Dalgayi Gectin.', canvas.width / 2, canvas.height / 2 + 35);
        } else {
            ctx.font = "700 64px 'Orbitron', sans-serif";
            ctx.fillStyle = '#e67e22';
            ctx.shadowBlur = 40; ctx.shadowColor = '#e67e22';
            ctx.fillText('KARADELIK YUTTU', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "700 26px 'Rajdhani', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.fillText('Nora Sisteminde Hayatta Kalamadin', canvas.width / 2, canvas.height / 2 + 35);
        }
        ctx.restore();
    }
};
