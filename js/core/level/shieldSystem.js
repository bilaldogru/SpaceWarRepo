/**
 * @file shieldSystem.js
 * @module level/shieldSystem
 * @description Oyuncu gemisinin etrafında dönen kalkan modüllerini yöneten sistem.
 *
 * Kalkan modülleri (shieldModules):
 *  - Haritada düşen pikap nesnelerinden toplanır (shieldPickups)
 *  - Oyuncunun etrafında belirli pozisyonlarda yörüngede takip eder
 *  - Hem hasarı emer (mermi/lazer/çarpma) hem de ek atış fırsatı sağlar
 *  - Oyuncunun hitbox'ını ve ateş hızını etkiler
 *
 * Bu modül `createModularLevel` nesnesine Object.assign ile karıştırılır (mixin).
 * İçindeki tüm metodlar `this` üzerinden level state'e erişir.
 *
 * Bağımlılıklar: SHIELD_MODULE_CONFIG (constants.js), mesafe, clamp (utils.js), gemi (player.js)
 */

import { SHIELD_MODULE_CONFIG } from './constants.js';
import { mesafe, clamp } from './utils.js';
import { gemi, gemiGorseli } from '../player.js';

// ─────────────────────────────────────────────────────────────────────────────
// KALKAN SİSTEMİ MİXİN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kalkan sistemine ait tüm metodları içeren mixin nesnesi.
 * createModularLevel() içinde Object.assign(level, shieldSystemMixin) ile uygulanır.
 */
export const shieldSystemMixin = {

    /**
     * Kalkan modül sayısına göre oyuncu hitbox yarıçapını döndürür.
     * Her modül hitboxu SHIELD_MODULE_CONFIG.hitboxGrowth kadar büyütür.
     */
    oyuncuHitboxYaricap() {
        return gemi.genislik / 2 + this.shieldModules.length * SHIELD_MODULE_CONFIG.hitboxGrowth;
    },

    /**
     * Kalkan modül sayısına göre gemi hız çarpanını döndürür.
     * Her modül SHIELD_MODULE_CONFIG.speedPenalty kadar hızı düşürür; minimum 0.46.
     */
    shieldHizCarpani() {
        return Math.max(0.46, 1 - this.shieldModules.length * SHIELD_MODULE_CONFIG.speedPenalty);
    },

    /**
     * Mevcut kalkan modül sayısına göre oyuncu ateş gecikme süresini (ms) döndürür.
     * Modül arttıkça ateş hızlanır; minimum 125 ms sabitlenmiştir.
     */
    oyuncuAtisGecikmesi() {
        return Math.max(
            125,
            SHIELD_MODULE_CONFIG.shotCooldownBase +
            this.shieldModules.length * SHIELD_MODULE_CONFIG.shotCooldownPerModule
        );
    },

    /**
     * Verilen indeksteki kalkan modülünün hedef pozisyonunu hesaplar.
     * Modüller geminin yan taraflarına, çift sıra düzeninde yerleştirilir.
     * @param {number} index - Kalkan modülünün dizideki sırası
     * @returns {{ x: number, y: number }} Dünya koordinatlarında hedef konum
     */
    shieldModulHedefKonumu(index) {
        const ileriX = Math.cos(gemi.aci);
        const ileriY = Math.sin(gemi.aci);
        const sagX = -ileriY;
        const sagY = ileriX;
        const sira = Math.floor(index / 2);        // Hangi halka (0=iç, 1=dış, …)
        const yon = index % 2 === 0 ? 1 : -1;      // Sağ (+1) veya Sol (-1)
        const yanMesafe = yon * (42 + sira * 30);
        const arkaMesafe = sira * 20;

        return {
            x: gemi.x - ileriX * arkaMesafe + sagX * yanMesafe,
            y: gemi.y - ileriY * arkaMesafe + sagY * yanMesafe
        };
    },

    /** Oyuncunun hitbox yarıçapını günceller (modül sayısı değişince çağrılır). */
    updatePlayerBoundsOrSize() {
        gemi.hitboxYaricap = this.oyuncuHitboxYaricap();
    },

    /**
     * Haritaya yeni bir kalkan pikapı (toplanabilir nesne) ekler.
     * Maksimum pikap veya maksimum modül sınırına ulaşılmışsa işlem yapılmaz.
     * @param {{ x: number, y: number }|null} konum - Pikap için başlangıç konumu (null → gemi pozisyonu)
     */
    spawnShieldModule(konum) {
        if (this.shieldModules.length >= this.maxShieldModules) return;
        if (this.shieldPickups.length >= SHIELD_MODULE_CONFIG.maxPickups) return;

        const x = clamp(
            (konum?.x || gemi.x) + (Math.random() - 0.5) * 34,
            80, this.haritaGenislik - 80
        );
        const y = clamp(
            (konum?.y || gemi.y) + (Math.random() - 0.5) * 34,
            90, this.haritaYukseklik - 90
        );

        this.shieldPickups.push({
            x,
            y,
            yaricap: SHIELD_MODULE_CONFIG.pickupRadius,
            dogum: performance.now(),
            pulse: Math.random() * Math.PI * 2  // Animasyon faz ofseti
        });
    },

    /**
     * Öldürülen düşmanın kalkan modülü bırakma olasılığını hesaplar ve gerekirse spawn eder.
     * Tip 4 ve 5 düşmanların drop şansı arttırılmıştır.
     * @param {Object} dusman - Öldürülen düşman nesnesi
     */
    tryDropShieldModule(dusman) {
        if (this.shieldModules.length >= this.maxShieldModules) return;
        if (this.shieldPickups.length >= SHIELD_MODULE_CONFIG.maxPickups) return;

        const tip = String(dusman.tip);
        const bonus = tip === '5' ? SHIELD_MODULE_CONFIG.bossDropBonus
                    : tip === '4' ? 0.05
                    : 0;
        const sans = Math.min(0.28, this.shieldModuleDropChance + bonus);

        if (Math.random() <= sans) this.spawnShieldModule(dusman);
    },

    /**
     * Belirtilen indeksteki pikap nesnesini kaldırır ve oyuncuya yeni bir kalkan modülü bağlar.
     * Maksimum modül sınırına ulaşılmışsa bildirim gösterir, modül eklemez.
     * @param {number} index - shieldPickups dizisindeki pikap sırası
     * @returns {boolean} Modül başarıyla eklendi mi
     */
    collectModule(index) {
        if (this.shieldModules.length >= this.maxShieldModules) {
            this.bildirimGoster('Maksimum kalkan modülü dolu.');
            return false;
        }

        const pickup = this.shieldPickups[index];
        if (!pickup) return false;

        this.shieldPickups.splice(index, 1);
        const yeniIndex = this.shieldModules.length;
        const hedef = this.shieldModulHedefKonumu(yeniIndex);

        this.shieldModules.push({
            id: ++this.shieldModuleId,
            x: hedef.x,
            y: hedef.y,
            yaricap: SHIELD_MODULE_CONFIG.moduleRadius,
            can: 1,
            maxCan: 1,
            renk: '#5ae0ff'
        });

        this.updatePlayerBoundsOrSize();
        this.bildirimGoster(`Kalkan modülü bağlandı: ${this.shieldModules.length}/${this.maxShieldModules}`);
        return true;
    },

    /**
     * Her kare: pikap toplama kontrolü yapar, bağlı modülleri gemiye doğru kaydırır.
     * @param {HTMLCanvasElement} canvas
     */
    updateModules(canvas) {
        // Yeterince yakın pikapları otomatik topla
        for (let i = this.shieldPickups.length - 1; i >= 0; i--) {
            const pickup = this.shieldPickups[i];
            const toplamaMesafesi = this.oyuncuHitboxYaricap() + SHIELD_MODULE_CONFIG.collectDistance;
            if (mesafe(pickup, gemi) <= toplamaMesafesi) this.collectModule(i);
        }

        // Bağlı modülleri hedef pozisyonlarına doğru yumuşatılmış şekilde taşı (%38 interpolasyon)
        this.shieldModules.forEach((modul, index) => {
            const hedef = this.shieldModulHedefKonumu(index);
            modul.x += (hedef.x - modul.x) * 0.38;
            modul.y += (hedef.y - modul.y) * 0.38;
        });

        this.updatePlayerBoundsOrSize();
    },

    /**
     * Belirtilen indeksteki kalkan modülünü kaldırır ve küçük bir parçacık patlaması üretir.
     * @param {number} index - shieldModules dizisindeki modül sırası
     * @returns {boolean} Modül başarıyla kaldırıldı mı
     */
    removeModule(index) {
        const modul = this.shieldModules[index];
        if (!modul) return false;

        // Kırılma efekti için parçacık ekle
        this.particles.push({
            x: modul.x, y: modul.y,
            hizX: 0, hizY: 0,
            r: 12,
            renk: '#5ae0ff',
            baslangic: performance.now(),
            sure: 260
        });

        this.shieldModules.splice(index, 1);
        this.updatePlayerBoundsOrSize();
        this.bildirimGoster('Kalkan modülü kırıldı.');
        return true;
    },

    /**
     * Vuran nesne (lazer/düşman) bir kalkan modülüne değdi mi kontrol eder; değdiyse kaldırır.
     * @param {Object} vuran - Çarpışma testi yapılacak nesne ({ x, y, boyut|yaricap })
     * @param {number} ekstra - İsteğe bağlı ek çarpışma toleransı
     * @returns {boolean} Bir modül vurulduysa true
     */
    handleModuleDamage(vuran, ekstra = 0) {
        for (let i = this.shieldModules.length - 1; i >= 0; i--) {
            const modul = this.shieldModules[i];
            const vuranYaricap = (vuran.boyut || vuran.yaricap || 0) / 2;
            if (mesafe(vuran, modul) <= vuranYaricap + modul.yaricap + ekstra) {
                this.removeModule(i);
                return true;
            }
        }
        return false;
    },

    /**
     * Oyuncuyu vuracak bir nesneyi (lazer/düşman) kalkan modülüne yönlendirir.
     * En yakın modül hasarı emer; modül yoksa false döner (hasar oyuncuya geçer).
     * @param {Object} vuran - Oyuncuya çarpan nesne
     * @returns {boolean} Hasar absorbe edildiyse true
     */
    absorbPlayerHit(vuran) {
        if (this.shieldModules.length <= 0) return false;

        // En yakın kalkan modülünü bul
        let hedefIndex = 0;
        let enKisa = Infinity;
        this.shieldModules.forEach((modul, index) => {
            const uzaklik = mesafe(vuran, modul);
            if (uzaklik < enKisa) {
                enKisa = uzaklik;
                hedefIndex = index;
            }
        });

        return this.removeModule(hedefIndex);
    },

    /**
     * Oyuncu ateş ettiğinde kalkan modüllerini de tetikler; her modül biraz açılı ek mermi atar.
     * @param {{ yonX: number, yonY: number, hiz: number }} atis - Oyuncunun orijinal atış vektörü
     * @param {Object[]} mermiListesi - Mermilerin eklendiği dizi (level.lazerler gibi)
     */
    fireFromPlayerAndModules(atis, mermiListesi) {
        this.shieldModules.forEach((modul, index) => {
            // Çift-tek indekse göre ±0.07 radyan açı sapması
            const aci = Math.atan2(atis.yonY, atis.yonX) + (index % 2 === 0 ? 0.07 : -0.07);
            const yonX = Math.cos(aci);
            const yonY = Math.sin(aci);

            mermiListesi.push({
                x: modul.x + yonX * 18,
                y: modul.y + yonY * 18,
                hizX: yonX * (atis.hiz + 0.35),
                hizY: yonY * (atis.hiz + 0.35),
                yaricap: 3.6,
                renk: '#8eeeff',
                hasar: 22
            });
        });
    }
};
