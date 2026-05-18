/**
 * @file index.js
 * @module level
 * @description Modüler oyun seviyesi sisteminin ana giriş noktası.
 *
 * Bu dosya:
 *  1. Alt sistemlerin mixin nesnelerini içe aktarır
 *  2. createModularLevel() fabrika fonksiyonunu dışa aktarır
 *  3. MODULES sabitini yeniden dışa aktarır (level.js gibi üst katmanlar kullanabilir)
 *
 * Mimari Özeti
 * ────────────────────────────────────────────────────────────────────────────
 *  constants.js    → Sabit veriler (MODULES, ödül tabloları, shield config)
 *  utils.js        → Saf yardımcı fonksiyonlar (mesafe, clamp, spawn vb.)
 *  shieldSystem.js → Kalkan modülü toplama, bağlama, hasar emme
 *  waveSystem.js   → Dalga planı, spawn sırası, savaş öncesi panel
 *  moduleSystem.js → Taret satın alma, sürükleme, süreli modül yönetimi
 *  hudSystem.js    → HUD elementleri ve taret slot UI güncellemeleri
 *  combatSystem.js → Mermi/lazer çarpışmaları, düşman hareketi, ödüller
 *  renderSystem.js → Canvas çizim (sahne, taretler, parçacıklar, oyun sonu)
 *  index.js        → Tüm parçaları birleştiren fabrika (bu dosya)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Kullanım:
 *  import { createModularLevel, MODULES } from '../core/level/index.js';
 */

import { MODULES, SHIELD_MODULE_CONFIG } from './constants.js';
import { clamp, mesafe } from './utils.js';
import { gemi } from '../player.js';

import { shieldSystemMixin }  from './shieldSystem.js';
import { waveSystemMixin }    from './waveSystem.js';
import { moduleSystemMixin }  from './moduleSystem.js';
import { hudSystemMixin }     from './hudSystem.js';
import { combatSystemMixin }  from './combatSystem.js';
import { renderSystemMixin }  from './renderSystem.js';

// MODULES sabiti üst katmanlar tarafından kullanılabilir (level.js vb.)
export { MODULES };

// ─────────────────────────────────────────────────────────────────────────────
// FABRİKA FONKSİYONU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Temel bir oyun seviyesi (bölümü) nesnesi oluşturur.
 *
 * Her gezegen bölümü (astra.js, kron.js, nora.js, vega.js) bu fonksiyonu
 * kendi yapılandırma nesnesiyle çağırır. Dönen nesne oyun motoruna verilir.
 *
 * Alt sistem mixin'leri Object.assign ile nivel nesnesine karıştırılır;
 * böylece her metodun doğal `this` erişimi çalışır.
 *
 * @param {Object} config - Bölüm yapılandırması
 * @param {string}   config.isim              - Gezegen adı (ör: 'Astra')
 * @param {string}   config.renk              - Temel renk (HEX)
 * @param {string}   config.gezegenGorseli    - Gezegen sprite yolu
 * @param {number}   config.maxTurn           - Maksimum dalga sayısı
 * @param {number}   config.coreCan           - Başlangıç can değeri
 * @param {number}   config.gemiHizi          - Temel gemi hızı (px/kare)
 * @param {Array}    config.dusmanDagilimi    - Normal mod düşman ağırlık dağılımı
 * @param {number}   config.acikModulSayisi   - Bu bölümde satın alınabilir taret sayısı
 * @param {number}   config.maxModuleSayisi   - Aynı anda aktif tutulabilecek maksimum taret
 * @param {number}   [config.baslangicKron]   - Başlangıç Kron miktarı (varsayılan: 260)
 * @param {number}   [config.dalgaBaslangic]  - 1. dalgadaki temel düşman sayısı (varsayılan: 6)
 * @param {number}   [config.dalgaArtis]      - Her dalgada eklenen düşman artışı (varsayılan: 2)
 * @param {number}   [config.spawnGecikmesi]  - Spawn arası gecikme (ms, varsayılan: 360)
 * @param {number}   [config.zorlukCarpani]   - Hız/can ölçeklendirme katsayısı (varsayılan: 0.055)
 * @param {boolean}  [config.endless]         - Sonsuz mod mu (varsayılan: false)
 * @param {string}   [config.haritaRengi]     - Harita arka plan rengi
 * @param {string}   [config.gridRengi]       - Izgara çizgisi rengi
 * @param {number}   [config.haritaGenislik]  - Harita genişliği (px, minimum canvas*2.25)
 * @param {number}   [config.haritaYukseklik] - Harita yüksekliği (px, minimum canvas*2.15)
 * @param {number}   [config.maxShieldModules]      - Maksimum kalkan modülü (varsayılan: 4)
 * @param {number}   [config.shieldModuleDropChance]- Kalkan düşme şansı (varsayılan: 0.11)
 * @param {number}   [config.maxAktifSatinAlim]     - Aynı anda aktif süreli taret sınırı
 * @returns {Object} Oyun döngüsüne hazır level nesnesi
 */
export function createModularLevel(config) {
    // ── Temel durum nesnesi ──────────────────────────────────────────────────
    const level = {
        // Config referansını sakla (alt sistemler erişebilir)
        _config: config,

        // ── Kimlik ve görsel ────────────────────────────────────────────────
        isim:           config.isim,
        renk:           config.renk,
        gezegenGorseli: config.gezegenGorseli,

        // ── Dalga/tur bilgisi ────────────────────────────────────────────────
        maxTurn:  config.maxTurn,
        turn:     1,
        endless:  Boolean(config.endless),

        // ── Can ve kaynak yönetimi ───────────────────────────────────────────
        maxCan:         config.coreCan,
        maxOyuncuCan:   config.coreCan,
        can:            config.coreCan,
        oyuncuCan:      config.coreCan,
        kron:           0,
        skor:           0,
        mermi:          20,
        maxMermi:       20,

        // ── Zamanlama ────────────────────────────────────────────────────────
        gecenSure:               0,
        baslangicZamani:         0,
        sonrakiOyuncuAtisZamani: 0,
        yenidenDolumBaslangic:   0,
        yenidenDolumSuresi:      1600,
        sonOyuncuHasarZamani:    -10,
        comboBitis:              0,

        // ── Oyun akış bayrakları ─────────────────────────────────────────────
        oyunDevamEdiyor:     false,
        oyunBitti:           false,
        oyunKazanildi:       false,
        yenidenDoluyor:      false,
        serbestHareketModu:  true,
        savasBasladi:        false,
        ilerlemeKaydedildi:  false,
        enIyiSkorGuncellendi: false,

        // ── Varlık dizileri ──────────────────────────────────────────────────
        dusmanlar:        [],
        lazerler:         [],
        moduleShots:      [],
        pickups:          [],
        shieldPickups:    [],
        shieldModules:    [],
        particles:        [],
        skorYazilari:     [],
        modules:          [],
        spawnQueue:       [],
        bekleyenDalgaPlani: [],
        aktifSatinAlimlar:  [],

        // ── Sayaçlar ve istatistik ───────────────────────────────────────────
        shieldModuleId:    0,
        dalgaToplamDusman: 0,
        killCount:         0,
        combo:             1,
        maxCombo:          1,
        alinanHasar:       0,
        suruklenenModul:   null,

        // ── Modül sistem parametreleri ───────────────────────────────────────
        dusmanDagilimi:   config.dusmanDagilimi,
        acikModulSayisi:  config.acikModulSayisi,
        maxModuleSayisi:  config.maxModuleSayisi,
        maxShieldModules: config.maxShieldModules     || SHIELD_MODULE_CONFIG.maxCount,
        shieldModuleDropChance: config.shieldModuleDropChance || SHIELD_MODULE_CONFIG.dropChance,
        maxAktifSatinAlim: config.maxAktifSatinAlim  || MODULES.length,

        // ── Harita ve kamera ─────────────────────────────────────────────────
        haritaGenislik:  2400,
        haritaYukseklik: 1600,
        kamera:          { x: 0, y: 0 },
        haritaRengi:     config.haritaRengi || 'rgba(8, 14, 28, 0.96)',
        gridRengi:       config.gridRengi   || 'rgba(90, 224, 255, 0.12)',

        // ────────────────────────────────────────────────────────────────────
        // TEMEL METODLAR (level özgü, mixin dışında kalır)
        // ────────────────────────────────────────────────────────────────────

        /**
         * Canvas boyutuna göre gezegen çizim yarıçapını hesaplar.
         * Nerede kullanılır: sceneVisuals.js — gezegen ve savunma bölgesi çiziminde.
         */
        gezegenYaricapi(canvas) {
            return Math.min(170, Math.max(105, canvas.height * 0.17));
        },

        /**
         * Bölümü başlatır: harita boyutunu ayarlar, tüm durum değişkenlerini sıfırlar,
         * ilk dalga planını hazırlar ve HUD'ı günceller.
         * @param {HTMLCanvasElement} canvas
         */
        baslat(canvas) {
            this.haritaGenislik  = Math.max(canvas.width  * 2.25, config.haritaGenislik  || 2300);
            this.haritaYukseklik = Math.max(canvas.height * 2.15, config.haritaYukseklik || 1500);

            gemi.genislik = 48;
            gemi.uzunluk  = 48;
            gemi.hiz      = config.gemiHizi || 2.2;
            gemi.x        = this.haritaGenislik  / 2;
            gemi.y        = this.haritaYukseklik / 2;
            this.kamera   = this.kameraHesapla(canvas);

            // Durum sıfırlama
            this.can              = this.maxCan;
            this.oyuncuCan        = this.maxOyuncuCan;
            this.kron             = config.baslangicKron || 260;
            this.skor             = 0;
            this.mermi            = this.maxMermi;
            this.turn             = 1;
            this.gecenSure        = 0;
            this.oyunDevamEdiyor  = true;
            this.oyunBitti        = false;
            this.oyunKazanildi    = false;
            this.savasBasladi     = false;
            this.yenidenDoluyor   = false;
            this.dusmanlar        = [];
            this.lazerler         = [];
            this.moduleShots      = [];
            this.pickups          = [];
            this.shieldPickups    = [];
            this.shieldModules    = [];
            this.shieldModuleId   = 0;
            this.sonrakiOyuncuAtisZamani = 0;
            this.particles        = [];
            this.skorYazilari     = [];
            this.modules          = [];
            this.spawnQueue       = [];
            this.bekleyenDalgaPlani = [];
            this.aktifSatinAlimlar  = [];
            this.suruklenenModul  = null;
            this.dalgaToplamDusman = 0;
            this.killCount        = 0;
            this.combo            = 1;
            this.maxCombo         = 1;
            this.alinanHasar      = 0;
            this.comboBitis       = 0;
            this.sonOyuncuHasarZamani = -10;
            this.enIyiSkorGuncellendi = false;
            this.ilerlemeKaydedildi   = false;
            this.baslangicZamani      = performance.now();

            // İlk dalga planını hazırla (savaş başlamadan oyuncu taretlerini yerleştirir)
            this.bekleyenDalgaPlani = this.dalgaPlaniOlustur(this.turn);
            this.dalgaToplamDusman  = this.bekleyenDalgaPlani.length;
            this.savasOncesiPaneliniGuncelle();
            this.huduGuncelle();
        },

        /**
         * Bölümü durdurur: oyun bayraklarını sıfırlar, tüm varlıkları temizler,
         * savaş öncesi panelini gizler.
         */
        durdur() {
            gemi.genislik = 60;
            gemi.uzunluk  = 60;
            gemi.hiz      = 2;

            this.oyunDevamEdiyor = false;
            this.oyunBitti       = false;
            this.savasBasladi    = false;
            this.dusmanlar       = [];
            this.lazerler        = [];
            this.moduleShots     = [];
            this.pickups         = [];
            this.shieldPickups   = [];
            this.shieldModules   = [];
            this.particles       = [];
            this.skorYazilari    = [];
            this.spawnQueue      = [];
            this.bekleyenDalgaPlani = [];
            this.aktifSatinAlimlar  = [];
            this.suruklenenModul = null;

            this.savasOncesiPaneliniGizle();
            this.huduGuncelle();
        },

        /**
         * Gemi pozisyonuna göre kamera başlangıç noktasını (sol-üst köşe) hesaplar.
         * Kamera harita sınırları dışına çıkmaz.
         */
        kameraHesapla(canvas) {
            return {
                x: clamp(gemi.x - canvas.width  / 2, 0, Math.max(0, this.haritaGenislik  - canvas.width)),
                y: clamp(gemi.y - canvas.height / 2, 0, Math.max(0, this.haritaYukseklik - canvas.height))
            };
        },

        /**
         * Ana oyun döngüsü güncelleme fonksiyonu — her animasyon karesinde çağrılır.
         *
         * Sırasıyla:
         *  1. Yeniden dolum ve süreli modül zamanlaması
         *  2. Destek efektleri (iyileşme, hız)
         *  3. Kalkan modülü güncellemesi
         *  4. Spawn kuyruğu işleme
         *  5. Taret ateşleme
         *  6. Taret mermisi hareketi ve çarpışmaları
         *  7. Düşman hareketi ve çarpışmaları
         *  8. Lazer güncellemesi
         *  9. Oyuncu mermisi çarpışmaları
         * 10. Kombo zaman aşımı
         * 11. Dalga/oyun bitis kontrolü
         * 12. Pasif can yenileme
         * 13. Ölüm kontrolü
         * 14. HUD güncelleme
         *
         * @param {HTMLCanvasElement} canvas
         * @param {Object[]} mermiler - Oyuncu mermileri (lazerler) dizisi
         */
        guncelle(canvas, mermiler) {
            if (!this.oyunDevamEdiyor) return;

            this._gemi  = gemi;
            this.kamera = this.kameraHesapla(canvas);

            // Savaş başlamadıysa yalnızca HUD ve paneli güncelle
            if (!this.savasBasladi) {
                this.gecenSure = 0;
                this.savasOncesiPaneliniGuncelle();
                this.huduGuncelle();
                return;
            }

            this.gecenSure = (performance.now() - this.baslangicZamani) / 1000;
            const simdi    = performance.now();

            // 1. Yeniden dolum tamamlandı mı?
            if (this.yenidenDoluyor && simdi - this.yenidenDolumBaslangic >= this.yenidenDolumSuresi) {
                this.mermi        = this.maxMermi;
                this.yenidenDoluyor = false;
            }

            // 2–4. Alt sistem güncellemeleri
            this.sureliModulleriGuncelle();
            this.destekEtkileriniUygula();
            this.updateModules(canvas);

            // 5. Spawn kuyruğu: zamanı gelen düşmanları haritaya ekle
            this.spawnQueue = this.spawnQueue.filter(kayit => {
                if (simdi >= kayit.hedefZaman) {
                    this.dusmanEkle(canvas, kayit.tip, kayit.offset);
                    return false;
                }
                return true;
            });

            // 6. Taret ateşleme (cooldown tabanlı)
            this.modules.forEach((modul) => {
                if (!modul.fireRate) return;
                modul.cooldown--;
                if (modul.cooldown <= 0) {
                    this.moduleAtesle(modul);
                    modul.cooldown = modul.fireRate;
                }
            });

            // 7. Taret mermileri: hareket + çarpışma + harita dışı temizleme
            for (let i = this.moduleShots.length - 1; i >= 0; i--) {
                const mermi = this.moduleShots[i];
                mermi.x += mermi.hizX;
                mermi.y += mermi.hizY;

                if (this.mermiDusmanaCarpti(mermi, mermi.hasar) ||
                    mermi.x < 0 || mermi.x > this.haritaGenislik  ||
                    mermi.y < 0 || mermi.y > this.haritaYukseklik) {
                    this.moduleShots.splice(i, 1);
                }
            }

            // 8. Düşman güncelleme + çarpışma zinciri
            for (let i = this.dusmanlar.length - 1; i >= 0; i--) {
                const dusman = this.dusmanlar[i];
                this.dusmanGuncelle(canvas, dusman);

                // Kalkan modülüne çarptı mı?
                if (this.handleModuleDamage(dusman, 0)) {
                    this.dusmanlar.splice(i, 1);
                    continue;
                }

                // Taret nesnesine çarptı mı?
                if (this.moduleCarpismasi(dusman)) {
                    this.dusmanlar.splice(i, 1);
                    continue;
                }

                // Oyuncuya çarptı mı?
                if (mesafe(dusman, gemi) < dusman.boyut / 2 + this.oyuncuHitboxYaricap()) {
                    if (this.absorbPlayerHit(dusman)) {
                        this.dusmanlar.splice(i, 1);
                        continue;
                    }
                    const hasar = 18 + Number(dusman.tip) * 4;
                    this.can               -= hasar;
                    this.alinanHasar       += hasar;
                    this.sonOyuncuHasarZamani = this.gecenSure;
                    this.dusmanlar.splice(i, 1);
                }
            }

            // 9–10. Lazer + oyuncu mermisi çarpışmaları
            this.lazerleriGuncelle(canvas);
            this.mermiCarpismalariniKontrolEt(mermiler);

            // 11. Ömrü dolan skor yazılarını temizle
            this.skorYazilari = this.skorYazilari.filter(yazi => simdi - yazi.baslangic < yazi.sure);

            // 12. Kombo zaman aşımı
            if (performance.now() > this.comboBitis) {
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                this.combo = 1;
            }

            // 13. Dalga/oyun bitis kontrolü
            if (this.spawnQueue.length === 0 && this.dusmanlar.length === 0) {
                if (!this.endless && this.turn >= this.maxTurn) {
                    // Normal mod tamamlandı — kazanma
                    this.oyunKazanildi  = true;
                    this.oyunBitti      = true;
                    this.oyunDevamEdiyor = false;
                    this.ilerlemeKaydet();
                } else {
                    // Sonraki dalga
                    this.turn++;
                    this.dalgaBaslat(canvas);
                }
            }

            // 14. Pasif can yenileme (son hasardan 3 sn sonra başlar)
            if (this.gecenSure - this.sonOyuncuHasarZamani > 3 && this.can < this.maxCan) {
                this.can = Math.min(this.maxCan, this.can + 2 / 60);
            }

            // 15. Ölüm kontrolü
            if (this.can <= 0) {
                this.can             = 0;
                this.oyunBitti       = true;
                this.oyunDevamEdiyor = false;
                if (this.endless) this.kronSkorunuKaydet();
            }

            this.huduGuncelle();
        }
    };

    // ── Alt sistem metodlarını birleştir (mixin) ─────────────────────────────
    Object.assign(
        level,
        shieldSystemMixin,
        waveSystemMixin,
        moduleSystemMixin,
        hudSystemMixin,
        combatSystemMixin,
        renderSystemMixin
    );

    return level;
}
