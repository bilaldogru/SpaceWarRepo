/**
 * @file renderSystem.js
 * @module level/renderSystem
 * @description Canvas üzerine çizim yapan tüm render metodlarını içerir.
 *
 * Sorumluluklar:
 *  - Ana sahne (ciz): harita, taret alanları, modüller, düşmanlar, lazerler, mermiler
 *  - Kalkan pikap ve modül görsellerini çizer
 *  - Yükselen skor/kron animasyon yazılarını (skorYazilari) render eder
 *  - Sürükleme önizlemesini çizer
 *  - Parçacık (particle) patlamalarını canlandırır
 *  - Harita ızgarası ve dış sınır çerçevesini çizer
 *  - HUD sınırlarını gösteren oynabilir alan çerçevesini çizer
 *  - Oyun sonu ekranını (istatistik kartı) canvas üzerine çizer
 *
 * Bu modül `createModularLevel` nesnesine Object.assign ile karıştırılır (mixin).
 * İçindeki tüm metodlar `this` üzerinden level state'e erişir.
 *
 * Bağımlılıklar: sureyiYaz, clamp (utils.js), gemi, gemiGorseli (player.js),
 *               drawEnemyLasers, drawSquareEnemies (sceneVisuals.js)
 */

import { sureyiYaz, clamp } from './utils.js';
import { gemi, gemiGorseli } from '../player.js';
import { drawEnemyLasers, drawSquareEnemies } from '../sceneVisuals.js';

// ─────────────────────────────────────────────────────────────────────────────
// RENDER SİSTEMİ MİXİN
// ─────────────────────────────────────────────────────────────────────────────

export const renderSystemMixin = {

    /**
     * Küçük dikdörtgen can barı çizer (taretler ve düşmanlar için kullanılır).
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x        - Sol kenar X
     * @param {number} y        - Üst kenar Y
     * @param {number} genislik - Bar genişliği (px)
     * @param {number} yukseklik - Bar yüksekliği (px)
     * @param {number} can      - Mevcut can değeri
     * @param {number} maxCan   - Maksimum can değeri
     */
    canBariCiz(ctx, x, y, genislik, yukseklik, can, maxCan) {
        ctx.fillStyle = 'rgba(3, 8, 18, 0.82)';
        ctx.fillRect(x, y, genislik, yukseklik);
        ctx.fillStyle = '#55efc4';
        ctx.fillRect(x, y, Math.max(0, can / maxCan) * genislik, yukseklik);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.strokeRect(x, y, genislik, yukseklik);
    },

    /**
     * Ana sahne çizim fonksiyonu — her animasyon karesinde çağrılır.
     * Kamera dönüşümü uygulanır: dünya koordinatlarında çizim yapılır,
     * HUD sınırları kamera dışında (ekran koordinatlarında) çizilir.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     */
    ciz(ctx, canvas) {
        this.kamera = this.kameraHesapla(canvas);

        ctx.save();
        ctx.translate(-this.kamera.x, -this.kamera.y); // Dünya koordinatı dönüşümü

        // ── Arka plan ve ızgara ──────────────────────────────────────────────
        ctx.fillStyle = this.haritaRengi;
        ctx.fillRect(0, 0, this.haritaGenislik, this.haritaYukseklik);
        this.haritaIzgarasiCiz(ctx);

        // ── Kalkan pikap nesneleri ───────────────────────────────────────────
        this._kalkanPikaplariCiz(ctx);

        // ── Oyuncuya bağlı kalkan modülleri ─────────────────────────────────
        this._kalkanModulleriniCiz(ctx);

        // ── Yükselen skor/kron animasyon yazıları ────────────────────────────
        this._skorYazilariniCiz(ctx);

        // ── Taret etki alanı daireleri ───────────────────────────────────────
        this._taretAlanlariniCiz(ctx);

        // ── Taretleri (modülleri) çiz ────────────────────────────────────────
        this._taretleriCiz(ctx);

        // ── Sürükleme önizlemesi ─────────────────────────────────────────────
        this._suruklemeonizlemesiCiz(ctx);

        // ── Taret mermileri ──────────────────────────────────────────────────
        this._taretMermileriniCiz(ctx);

        // ── Parçacık patlamaları ─────────────────────────────────────────────
        this.parcaciklariCiz(ctx);

        // ── Düşman lazerleri ve kareleri (sceneVisuals) ──────────────────────
        drawEnemyLasers(ctx, this.lazerler);
        drawSquareEnemies(ctx, this.dusmanlar, this.canBariCiz.bind(this));

        // ── Oyuncu hitbox halkası ────────────────────────────────────────────
        ctx.save();
        ctx.strokeStyle  = this.renk;
        ctx.globalAlpha  = this.shieldModules.length > 0 ? 0.4 : 0.22;
        ctx.lineWidth    = 2;
        ctx.setLineDash(this.shieldModules.length > 0 ? [8, 7] : []);
        ctx.beginPath();
        ctx.arc(gemi.x, gemi.y, this.oyuncuHitboxYaricap(), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.restore(); // Kamera dönüşümü sona erer

        // ── Ekran oynanabilir alan çerçevesi (HUD koordinatları) ─────────────
        this.ekranSinirlariniCiz(ctx, canvas);
    },

    // ─── ÖZEL ÇİZİM YARDIMCILARI ────────────────────────────────────────────

    /** Kalkan pikaplarını animasyonlu halkalar ve mini gemi ikonuyla çizer. */
    _kalkanPikaplariCiz(ctx) {
        this.shieldPickups.forEach((pickup) => {
            const pulse = Math.sin((performance.now() - pickup.dogum) / 230 + pickup.pulse) * 0.18 + 0.82;

            ctx.save();
            ctx.translate(pickup.x, pickup.y);

            // Dış titreşim halkası
            ctx.beginPath();
            ctx.arc(0, 0, pickup.yaricap * 1.75 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(90, 224, 255, 0.12)';
            ctx.fill();

            // Ana daire
            ctx.beginPath();
            ctx.arc(0, 0, pickup.yaricap, 0, Math.PI * 2);
            ctx.fillStyle   = '#5ae0ff';
            ctx.shadowBlur  = 22;
            ctx.shadowColor = '#5ae0ff';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2;
            ctx.stroke();

            // Mini gemi ikonu (döndürülmüş)
            ctx.rotate(-Math.PI / 2);
            if (gemiGorseli.complete && gemiGorseli.naturalWidth > 0) {
                ctx.globalAlpha = 0.9;
                ctx.drawImage(gemiGorseli, -11, -11, 22, 22);
            } else {
                ctx.beginPath();
                ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8);
                ctx.closePath();
                ctx.fillStyle = 'rgba(3, 8, 18, 0.72)';
                ctx.fill();
            }

            ctx.restore();
        });
    },

    /** Oyuncuya bağlı kalkan modüllerini gemi görseli veya ok şekliyle çizer. */
    _kalkanModulleriniCiz(ctx) {
        this.shieldModules.forEach((modul) => {
            ctx.save();
            ctx.translate(modul.x, modul.y);
            ctx.rotate(gemi.aci + Math.PI / 2);

            // Glow halkası
            ctx.beginPath();
            ctx.arc(0, 0, modul.yaricap + 4, 0, Math.PI * 2);
            ctx.fillStyle   = 'rgba(90, 224, 255, 0.10)';
            ctx.fill();
            ctx.shadowBlur  = 16;
            ctx.shadowColor = '#5ae0ff';

            if (gemiGorseli.complete && gemiGorseli.naturalWidth > 0) {
                ctx.globalAlpha = 0.92;
                ctx.drawImage(gemiGorseli, -12, -12, 24, 24);
            } else {
                ctx.beginPath();
                ctx.moveTo(14, 0); ctx.lineTo(-10, -9); ctx.lineTo(-5, 0); ctx.lineTo(-10, 9);
                ctx.closePath();
                ctx.fillStyle   = '#5ae0ff';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth   = 2;
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        });
    },

    /** Yükselen "+X Kron / +Y Skor" animasyon yazılarını çizer. */
    _skorYazilariniCiz(ctx) {
        this.skorYazilari.forEach(yazi => {
            const yas  = performance.now() - yazi.baslangic;
            const oran = clamp(yas / yazi.sure, 0, 1);

            ctx.save();
            ctx.translate(yazi.x, yazi.y - oran * 34); // Yukarı doğru kayar
            ctx.globalAlpha = 1 - oran;                  // Soluklaşır

            // Kron yazısı
            ctx.font        = "900 24px 'Rajdhani', sans-serif";
            ctx.textAlign   = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth   = 4;
            ctx.strokeStyle = 'rgba(3, 8, 18, 0.85)';
            ctx.fillStyle   = '#55efc4';
            ctx.shadowBlur  = 14;
            ctx.shadowColor = '#55efc4';
            ctx.strokeText(`+${yazi.deger} Kron`, 0, 0);
            ctx.fillText(`+${yazi.deger} Kron`, 0, 0);

            // Skor yazısı (altında, daha küçük)
            ctx.font      = "700 15px 'Rajdhani', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`+${yazi.skor} Skor`, 0, 19);

            ctx.restore();
        });
    },

    /** Radius'lu taretlerin etki alanı dairelerini (içi şeffaf, kenarı kesik çizgi) çizer. */
    _taretAlanlariniCiz(ctx) {
        this.modules.forEach((modul) => {
            if (!modul.radius) return;

            ctx.save();
            ctx.beginPath();
            ctx.arc(modul.x, modul.y, modul.radius, 0, Math.PI * 2);
            ctx.fillStyle   = modul.renk;
            ctx.globalAlpha = this.oyuncuAlaninda(modul) ? 0.13 : 0.07; // Oyuncu içindeyse daha parlak
            ctx.fill();
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = modul.renk;
            ctx.lineWidth   = 2;
            ctx.setLineDash([10, 8]);
            ctx.stroke();
            ctx.restore();
        });
    },

    /** Taret gövdelerini (dönen kare + can barı + süre geri sayımı) çizer. */
    _taretleriCiz(ctx) {
        this.modules.forEach((modul) => {
            // Dönen elmas şekli
            ctx.save();
            ctx.translate(modul.x, modul.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle   = modul.renk;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2;
            ctx.shadowBlur  = 14;
            ctx.shadowColor = modul.renk;
            ctx.fillRect(-13, -13, 26, 26);
            ctx.strokeRect(-13, -13, 26, 26);
            ctx.rotate(-Math.PI / 4);       // Geri döndür — iç kare düz durur
            ctx.fillStyle = 'rgba(3,8,18,0.78)';
            ctx.fillRect(-6, -6, 12, 12);
            ctx.restore();

            // Can barı (taret üstünde)
            this.canBariCiz(ctx, modul.x - 18, modul.y - 32, 36, 5, modul.can, modul.maxCan);

            // Süreli modül süre göstergesi (taret altında)
            const sureKaydi = this.aktifSatinAlimlar.find(kayit => kayit.modul === modul);
            if (sureKaydi) {
                const kalanMs = Math.max(0, sureKaydi.bitis - performance.now());
                const kalanSn = Math.ceil(kalanMs / 1000);
                const oran    = clamp(kalanMs / (sureKaydi.sureMs || 1), 0, 1);

                ctx.save();
                ctx.fillStyle = 'rgba(3, 8, 18, 0.82)';
                ctx.fillRect(modul.x - 20, modul.y + 25, 40, 12);
                ctx.fillStyle = modul.renk;
                ctx.fillRect(modul.x - 18, modul.y + 34, 36 * oran, 3);  // Küçülen bar
                ctx.font          = "700 10px 'Orbitron', sans-serif";
                ctx.textAlign     = 'center';
                ctx.textBaseline  = 'middle';
                ctx.fillStyle     = '#ffffff';
                ctx.fillText(`${kalanSn}s`, modul.x, modul.y + 31);
                ctx.restore();
            }
        });
    },

    /** Sürükleme ile haritaya yerleştirilmekte olan taret önizlemesini çizer. */
    _suruklemeonizlemesiCiz(ctx) {
        if (!this.suruklenenModul) return;

        const suruklemeRengi = this.suruklenenModul.gecerli
            ? this.suruklenenModul.renk
            : '#ff4d6d'; // Geçersiz → kırmızı

        // Etki alanı önizlemesi
        if (this.suruklenenModul.radius) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.suruklenenModul.x, this.suruklenenModul.y, this.suruklenenModul.radius, 0, Math.PI * 2);
            ctx.fillStyle   = suruklemeRengi;
            ctx.globalAlpha = this.suruklenenModul.gecerli ? 0.08 : 0.13;
            ctx.fill();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = suruklemeRengi;
            ctx.setLineDash([8, 7]);
            ctx.stroke();
            ctx.restore();
        }

        // Taret gövdesi önizlemesi (yarı şeffaf)
        ctx.save();
        ctx.translate(this.suruklenenModul.x, this.suruklenenModul.y);
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = 0.68;
        ctx.fillStyle   = suruklemeRengi;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2;
        ctx.setLineDash([6, 5]);
        ctx.shadowBlur  = 20;
        ctx.shadowColor = suruklemeRengi;
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeRect(-15, -15, 30, 30);
        ctx.restore();
    },

    /** Taret mermilerini (moduleShots) parlayan daireler olarak çizer. */
    _taretMermileriniCiz(ctx) {
        this.moduleShots.forEach(mermi => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(mermi.x, mermi.y, mermi.yaricap, 0, Math.PI * 2);
            ctx.fillStyle   = mermi.renk;
            ctx.shadowBlur  = 16;
            ctx.shadowColor = mermi.renk;
            ctx.fill();
            ctx.restore();
        });
    },

    /**
     * HUD sınırlarına göre oynanabilir ekran alanını turkuaz kesik çizgiyle işaretler.
     * HUD görünmüyorsa çizmez.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     */
    ekranSinirlariniCiz(ctx, canvas) {
        const hud = document.getElementById('oyun-hud');
        if (!hud || hud.style.display === 'none') return;

        const ustBar   = hud.querySelector('.hud-top-strip')?.getBoundingClientRect();
        const altBar   = hud.querySelector('.hud-bottom-bar')?.getBoundingClientRect();
        const yanMenu  = hud.querySelector('.hud-sidebar')?.getBoundingClientRect();

        const sol = yanMenu ? yanMenu.right + 8 : 8;
        const ust = ustBar  ? ustBar.bottom  + 8 : 8;
        const sag = canvas.width  - 8;
        const alt = altBar  ? altBar.top     - 8 : canvas.height - 8;

        if (sag <= sol || alt <= ust) return; // Geçersiz boyutsa çizme

        ctx.save();
        ctx.strokeStyle = 'rgba(85, 239, 196, 0.34)';
        ctx.lineWidth   = 2;
        ctx.setLineDash([12, 10]);
        ctx.shadowBlur  = 12;
        ctx.shadowColor = '#55efc4';
        ctx.strokeRect(sol, ust, sag - sol, alt - ust);
        ctx.restore();
    },

    /**
     * Patlama parçacıklarını canlandırır ve ömrü dolanlara temizler.
     * Her kare: konum güncellenir, hız sönümlenir (%94), alpha ve boyut küçülür.
     * @param {CanvasRenderingContext2D} ctx
     */
    parcaciklariCiz(ctx) {
        const simdi = performance.now();
        this.particles = this.particles.filter(p => simdi - p.baslangic < p.sure);

        this.particles.forEach(p => {
            const oran = (simdi - p.baslangic) / p.sure;

            // Konum güncelle
            p.x += p.hizX;
            p.y += p.hizY;

            // Hız sönümleme (sürtünme simülasyonu)
            p.hizX *= 0.94;
            p.hizY *= 0.94;

            ctx.save();
            ctx.globalAlpha = (1 - oran) * 0.88;          // Soluklaşma
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (1 - oran * 0.6), 0, Math.PI * 2); // Küçülme
            ctx.fillStyle   = p.renk;
            ctx.shadowBlur  = 10;
            ctx.shadowColor = p.renk;
            ctx.fill();
            ctx.restore();
        });
    },

    /**
     * Harita arka planına eşit aralıklı kılavuz ızgarası çizer.
     * Merkez çizgiler bölüm renginde, kenar çerçeve kalın çizgide gösterilir.
     * @param {CanvasRenderingContext2D} ctx
     */
    haritaIzgarasiCiz(ctx) {
        ctx.save();
        ctx.strokeStyle = this.gridRengi;
        ctx.lineWidth   = 1;
        const grid      = 90; // Izgara hücresi genişliği (px)

        // Dikey çizgiler
        for (let x = 0; x <= this.haritaGenislik; x += grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.haritaYukseklik);
            ctx.stroke();
        }

        // Yatay çizgiler
        for (let y = 0; y <= this.haritaYukseklik; y += grid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.haritaGenislik, y);
            ctx.stroke();
        }

        // Harita dış sınır çerçevesi (bölüm rengiyle belirgin)
        ctx.strokeStyle = this.renk;
        ctx.lineWidth   = 6;
        ctx.globalAlpha = 0.9;
        ctx.strokeRect(0, 0, this.haritaGenislik, this.haritaYukseklik);
        ctx.restore();
    },

    /**
     * Oyun sonu ekranını (kazanma/kaybetme kartı) canvas ortasına çizer.
     * İstatistikler, başlık, ayıraç çizgileri ve ipucu metni içerir.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     */
    oyunSonuEkraniCiz(ctx, canvas) {
        const cx     = canvas.width  / 2;
        const cy     = canvas.height / 2;
        const kazandi = this.oyunKazanildi;
        const renkAna = kazandi ? '#55efc4' : '#ff4d6d';
        const sure    = sureyiYaz(this.gecenSure);

        // ── Karartma arka planı ──────────────────────────────────────────────
        ctx.save();
        ctx.fillStyle = 'rgba(4, 9, 20, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ── Kart boyutları ve konumu ─────────────────────────────────────────
        const kW = Math.min(560, canvas.width - 48);
        const kH = 370;
        const kX = cx - kW / 2;
        const kY = cy - kH / 2;
        const r  = 14; // Köşe yarıçapı

        // ── Glassmorphism kart ───────────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(kX + r, kY);
        ctx.lineTo(kX + kW - r, kY);
        ctx.arcTo(kX + kW, kY,        kX + kW, kY + r,        r);
        ctx.lineTo(kX + kW, kY + kH - r);
        ctx.arcTo(kX + kW, kY + kH,   kX + kW - r, kY + kH,   r);
        ctx.lineTo(kX + r,  kY + kH);
        ctx.arcTo(kX,       kY + kH,   kX, kY + kH - r,        r);
        ctx.lineTo(kX,      kY + r);
        ctx.arcTo(kX,       kY,        kX + r, kY,              r);
        ctx.closePath();
        ctx.fillStyle   = 'rgba(7, 16, 30, 0.92)';
        ctx.fill();
        ctx.strokeStyle = `${renkAna}66`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 30;
        ctx.shadowColor = renkAna;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // ── Başlık ───────────────────────────────────────────────────────────
        ctx.textAlign = 'center';
        ctx.font      = "900 38px 'Orbitron', sans-serif";
        ctx.fillStyle = renkAna;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = renkAna;
        ctx.fillText(kazandi ? 'DALGALAR TEMİZLENDİ' : 'GEMİ YOK OLDU', cx, kY + 52);
        ctx.shadowBlur = 0;

        // ── Ayıraç çizgisi ───────────────────────────────────────────────────
        ctx.strokeStyle = `${renkAna}44`;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(kX + 24,       kY + 70);
        ctx.lineTo(kX + kW - 24, kY + 70);
        ctx.stroke();

        // ── İstatistik satırları ─────────────────────────────────────────────
        const satirlar = [
            { etiket: 'TOPLAM SÜRE',     deger: sure,                             renk: '#41e0ff' },
            { etiket: 'YOK EDİLEN',      deger: `${this.killCount} düşman`,       renk: '#ffffff' },
            {
                etiket: 'EN YÜKSEK KOMBO',
                deger: `x${this.maxCombo}`,
                renk: this.maxCombo >= 7 ? '#ff4d6d' : this.maxCombo >= 4 ? '#ff8c00' : '#f9ca24'
            },
            { etiket: 'TOPLAM SKOR',     deger: this.skor.toLocaleString(),       renk: '#ffffff' },
            { etiket: 'KAZANILAN KRON',  deger: `${this.kron} Kron`,              renk: '#f9ca24' },
            { etiket: 'ALINAN HASAR',    deger: `${Math.round(this.alinanHasar)}`, renk: '#ff4d6d' },
        ];

        const satirBasY  = kY + 100;
        const satirAraligi = 38;
        ctx.font = "500 15px 'Orbitron', sans-serif";

        satirlar.forEach((satir, i) => {
            const satY = satirBasY + i * satirAraligi;

            // Etiket (sol hizalı)
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(160,180,210,0.65)';
            ctx.fillText(satir.etiket, kX + 36, satY);

            // Değer (sağ hizalı, renkli, glow)
            ctx.textAlign   = 'right';
            ctx.fillStyle   = satir.renk;
            ctx.shadowBlur  = satir.renk !== '#ffffff' ? 10 : 0;
            ctx.shadowColor = satir.renk;
            ctx.fillText(satir.deger, kX + kW - 36, satY);
            ctx.shadowBlur  = 0;

            // Satır altı ince çizgi
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(kX + 24,       satY + 10);
            ctx.lineTo(kX + kW - 24, satY + 10);
            ctx.stroke();
        });

        // ── Alt klavye ipucu ──────────────────────────────────────────────────
        ctx.textAlign = 'center';
        ctx.font      = "500 12px 'Orbitron', sans-serif";
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillText('[ ESC / ENTER ]  →  Ana Menüye Dön', cx, kY + kH - 18);

        ctx.restore();
    }
};
