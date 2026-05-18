/**
 * @file combatSystem.js
 * @module level/combatSystem
 * @description Savaş mekaniği: mermi-düşman çarpışması, düşman hareketi, lazer yönetimi ve patlama efektleri.
 *
 * Sorumluluklar:
 *  - Düşmanları her karede gemi yönünde hareket ettirir
 *  - Yavaşlatma, hız alanı ve iyileşme etkilerini uygular
 *  - Taret mermilerini (moduleShots) ve oyuncu lazerlerini günceller
 *  - Mermi–düşman, lazer–oyuncu/taret çarpışmalarını çözer
 *  - Düşman ölümlerinde ödül, kombo ve patlama parçacıkları üretir
 *  - İlerleme ve skor kayıtlarını yönetir
 *
 * Bu modül `createModularLevel` nesnesine Object.assign ile karıştırılır (mixin).
 * İçindeki tüm metodlar `this` üzerinden level state'e erişir.
 *
 * Bağımlılıklar: ENEMY_KRON_REWARD, ENEMY_KRON_MAX_REWARD, ENEMY_SCORE_REWARD (constants.js),
 *               mesafe (utils.js), gemi (player.js)
 */

import { ENEMY_KRON_REWARD, ENEMY_KRON_MAX_REWARD, ENEMY_SCORE_REWARD } from './constants.js';
import { mesafe } from './utils.js';
import { gemi } from '../player.js';

// ─────────────────────────────────────────────────────────────────────────────
// SAVAŞ SİSTEMİ MİXİN
// ─────────────────────────────────────────────────────────────────────────────

export const combatSystemMixin = {

    /**
     * Belirtilen koordinata en yakın düşmanı döndürür; menzil dışındakiler göz ardı edilir.
     * Taret ateşleme mantığında hedef seçimi için kullanılır.
     * @param {number} x
     * @param {number} y
     * @param {number} menzil - Arama yarıçapı (varsayılan: Infinity = tüm harita)
     * @returns {Object|null} Düşman nesnesi veya bulunamazsa null
     */
    enYakinDusman(x, y, menzil = Infinity) {
        let hedef  = null;
        let enKisa = menzil;

        this.dusmanlar.forEach(dusman => {
            const uzaklik = Math.hypot(dusman.x - x, dusman.y - y);
            if (uzaklik < enKisa) {
                enKisa = uzaklik;
                hedef  = dusman;
            }
        });

        return hedef;
    },

    /**
     * Belirtilen taretden en yakın düşmana doğru bir mermi atar.
     * Menzil içinde düşman yoksa işlem yapılmaz.
     * @param {Object} modul - Ateş eden taret nesnesi (fireRate, speed, damage, renk alanları gerekli)
     */
    moduleAtesle(modul) {
        if (!modul.fireRate) return;

        const pos   = { x: modul.x, y: modul.y };
        const hedef = this.enYakinDusman(pos.x, pos.y, 520); // 520 px menzil
        if (!hedef) return;

        const dx      = hedef.x - pos.x;
        const dy      = hedef.y - pos.y;
        const uzaklik = Math.sqrt(dx * dx + dy * dy) || 1;

        this.moduleShots.push({
            x:      pos.x,
            y:      pos.y,
            hizX:   (dx / uzaklik) * modul.speed,
            hizY:   (dy / uzaklik) * modul.speed,
            yaricap: modul.splash ? 6 : 4,  // Splash modülü daha büyük mermi kullanır
            renk:   modul.renk,
            hasar:  modul.damage
        });
    },

    /**
     * Verilen mermi listesindeki her mermiyi düşmanlara çarptırıp çarptırmadığını kontrol eder.
     * Çarpan mermiler listeden kaldırılır.
     * @param {Object[]} mermiler - Kontrol edilecek mermi dizisi (lazerler gibi)
     */
    mermiCarpismalariniKontrolEt(mermiler) {
        for (let i = mermiler.length - 1; i >= 0; i--) {
            const mermi       = mermiler[i];
            const hedefVuruldu = this.mermiDusmanaCarpti(mermi, 25);
            if (hedefVuruldu) mermiler.splice(i, 1);
        }
    },

    /**
     * Tek bir merminin herhangi bir düşmana çarpıp çarpmadığını kontrol eder.
     * Çarptıysa hasarı uygular; düşman ölürse dusmanYokEt() çağrılır.
     * @param {Object} mermi
     * @param {number} varsayilanHasar - mermi.hasar yoksa kullanılacak değer
     * @returns {boolean} Çarpma gerçekleştiyse true
     */
    mermiDusmanaCarpti(mermi, varsayilanHasar) {
        for (let j = this.dusmanlar.length - 1; j >= 0; j--) {
            const dusman = this.dusmanlar[j];

            if (mesafe(mermi, dusman) < dusman.boyut / 2 + (mermi.yaricap || 4)) {
                dusman.can -= mermi.hasar || varsayilanHasar;

                if (dusman.can <= 0) this.dusmanYokEt(j, dusman);

                // Hasarın yayılma etkisiyle 0 altına düşen ek düşmanları temizle
                for (let k = this.dusmanlar.length - 1; k >= 0; k--) {
                    if (this.dusmanlar[k].can <= 0) this.dusmanYokEt(k, this.dusmanlar[k]);
                }

                return true;
            }
        }
        return false;
    },

    /**
     * Düşman öldürme Kron ödülünü hesaplar (dalga bonusu ile sınır içinde).
     * @param {Object} dusman
     * @returns {number} Kazanılacak Kron miktarı
     */
    dusmanKronOdulu(dusman) {
        const tip       = String(dusman.tip);
        const temelOdul = ENEMY_KRON_REWARD[tip]     || 5;
        const ustSinir  = ENEMY_KRON_MAX_REWARD[tip] || Math.round(temelOdul * 1.5);

        // Dalga ilerledikçe bonus artar; endless modda biraz daha yavaş büyür
        const dalgaBonusu = this.endless
            ? 1 + Math.min(0.35, Math.max(0, this.turn - 1) * 0.025)
            : 1 + Math.min(0.45, Math.max(0, this.turn - 1) * 0.05);

        return Math.min(ustSinir, Math.round(temelOdul * dalgaBonusu));
    },

    /**
     * Düşman öldürme skor ödülünü sabit tablodan döndürür.
     * @param {Object} dusman
     * @returns {number}
     */
    dusmanSkorOdulu(dusman) {
        return ENEMY_SCORE_REWARD[String(dusman.tip)] || 100;
    },

    /**
     * Düşmanı listeden kaldırır, ödülleri hesaplar ve patlama efekti üretir.
     * Kombo sayacını günceller; skor yazısı animasyonu başlatır.
     * @param {number} index - dusmanlar dizisindeki indeks
     * @param {Object} dusman
     */
    dusmanYokEt(index, dusman) {
        this.dusmanlar.splice(index, 1);
        this.killCount++;

        // Kombo penceresi açıksa komboyu artır, yoksa sıfırla
        if (performance.now() < this.comboBitis) {
            this.combo = Math.min(9, this.combo + 1);
        } else {
            this.combo = 1;
        }
        this.comboBitis = performance.now() + 2500; // 2.5 saniyelik kombo penceresi

        const kronOdulu  = this.dusmanKronOdulu(dusman);
        const skorOdulu  = this.dusmanSkorOdulu(dusman) * this.combo;

        this.kron += kronOdulu;
        this.skor += skorOdulu;

        // Şans varsa kalkan modülü pikapı bırak
        this.tryDropShieldModule(dusman);

        // Yükselen skor animasyonu için kayıt ekle
        this.skorYazilari.push({
            x:        dusman.x,
            y:        dusman.y - dusman.boyut / 2,
            deger:    kronOdulu,
            skor:     skorOdulu,
            baslangic: performance.now(),
            sure:     900
        });

        this.patlamaOlustur(dusman);
    },

    /**
     * Öldürülen düşmanın tipine göre renkli parçacık patlaması üretir.
     * @param {Object} dusman
     */
    patlamaOlustur(dusman) {
        const renkler = {
            '1': '#ff4d6d',  // Zayıf: kırmızı
            '2': '#ff8c00',  // Zırhlı: turuncu
            '3': '#8b5cf6',  // Hızlı: mor
            '4': '#f9ca24',  // Özel: sarı
            '5': '#ffffff'   // Boss: beyaz
        };
        const renk = renkler[String(dusman.tip)] || '#ff4d6d';
        const adet = dusman.tip >= 4 ? 18 : 10;  // Boss düşmanlar daha büyük patlama
        const simdi = performance.now();

        for (let i = 0; i < adet; i++) {
            const aci = (Math.PI * 2 / adet) * i + Math.random() * 0.5;
            const hiz = 1.2 + Math.random() * 2.8;

            this.particles.push({
                x:        dusman.x,
                y:        dusman.y,
                hizX:     Math.cos(aci) * hiz,
                hizY:     Math.sin(aci) * hiz,
                r:        3 + Math.random() * 3,
                renk,
                baslangic: simdi,
                sure:     480 + Math.random() * 280
            });
        }
    },

    /**
     * Tek bir düşmanı bir kare ilerletir: gemi yönünde hareket, yavaşlatma efekti ve kendi update().
     * @param {HTMLCanvasElement} canvas
     * @param {Object} dusman
     */
    dusmanGuncelle(canvas, dusman) {
        const dx      = gemi.x - dusman.x;
        const dy      = gemi.y - dusman.y;
        const uzaklik = Math.sqrt(dx * dx + dy * dy) || 1;

        // Yavaşlatma taretlerinden gelen hız çarpanını uygula
        const yavaslatma = this.dusmanYavaslatmaCarpani(dusman);
        const hiz        = (dusman.temelHiz || dusman.hiz) * yavaslatma;

        dusman.hiz = hiz;
        dusman.x  += (dx / uzaklik) * hiz;
        dusman.y  += (dy / uzaklik) * hiz;
        dusman.aci = Math.atan2(dy, dx);

        // Düşmana özgü ek mantığı çalıştır (örn. lazer atma)
        dusman.update(canvas, this);

        // Hareket bittikten sonra temel hıza geri dön
        dusman.hiz = dusman.temelHiz || dusman.hiz;
    },

    /**
     * Bir düşman için aktif yavaşlatma taretlerinin toplam çarpanını hesaplar.
     * Birden fazla yavaşlatma tareti varsa en düşük olanı (en sert yavaşlatma) seçilir.
     * @param {Object} dusman
     * @returns {number} 0–1 arası çarpan (1 = tam hız, küçüldükçe yavaşlar)
     */
    dusmanYavaslatmaCarpani(dusman) {
        let carpani = 1;
        this.modules.forEach(modul => {
            if (modul.slowFactor && mesafe(modul, dusman) <= modul.radius) {
                carpani = Math.min(carpani, modul.slowFactor);
            }
        });
        return carpani;
    },

    /**
     * Oyuncunun belirtilen modülün etki alanında (radius içinde) olup olmadığını kontrol eder.
     * @param {Object} modul - Radius alanı olan taret
     * @returns {boolean}
     */
    oyuncuAlaninda(modul) {
        return Boolean(modul.radius) && mesafe(modul, gemi) <= modul.radius;
    },

    /**
     * Her kare: iyileşme, hız desteği gibi pasif taret etkilerini oyuncuya uygular.
     * Birden fazla hız tareti varsa en yüksek olanı kullanılır (yığılmaz).
     */
    destekEtkileriniUygula() {
        let hizCarpani = 1;

        this.modules.forEach(modul => {
            if (!this.oyuncuAlaninda(modul)) return;

            // İyileşme: saniyede healPerSecond kadar can ekle (60fps'e böl)
            if (modul.healPerSecond) {
                this.can = Math.min(this.maxCan, this.can + modul.healPerSecond / 60);
            }

            // Hız alanı: en yüksek aktif boost'u al
            if (modul.speedBoost) {
                hizCarpani = Math.max(hizCarpani, modul.speedBoost);
            }
        });

        // Temel hız × hız tareti × kalkan ağırlık cezası
        gemi.hiz = (this._config.gemiHizi || 2.2) * hizCarpani * this.shieldHizCarpani();
    },

    /**
     * Bir düşmanın taret (modül) nesnesine çarpıp çarpmadığını kontrol eder.
     * Çarptıysa hasarı uygular; taret ölürse modül listesinden çıkarılır.
     * @param {Object} dusman
     * @returns {boolean} Çarpma gerçekleştiyse true
     */
    moduleCarpismasi(dusman) {
        for (let i = this.modules.length - 1; i >= 0; i--) {
            const modul = this.modules[i];
            const pos   = { x: modul.x, y: modul.y };

            if (mesafe(dusman, { ...pos, boyut: 24 }) < dusman.boyut / 2 + 12) {
                modul.can -= 42 + Number(dusman.tip) * 8; // Güçlü düşman daha fazla hasar verir

                if (modul.can <= 0) {
                    this.satinAlimKaydiniSil(modul);
                    this.modules.splice(i, 1);
                }
                return true;
            }
        }
        return false;
    },

    /**
     * Tüm düşman lazerlerini ilerletir ve çarpışmalarını çözer:
     *  1. Kalkan modülüne değdiyse kalkan kırılır
     *  2. Tarete değdiyse taret hasar alır (veya yok edilir)
     *  3. Oyuncuya değdiyse önce kalkan sonra can kontrolü yapılır
     *  4. Harita dışına çıkanlara kaldırılır
     * @param {HTMLCanvasElement} canvas
     */
    lazerleriGuncelle(canvas) {
        for (let i = this.lazerler.length - 1; i >= 0; i--) {
            const lazer = this.lazerler[i];
            lazer.x += lazer.hizX;
            lazer.y += lazer.hizY;

            // 1. Kalkan modülü çarpışması
            if (this.handleModuleDamage(lazer, 5)) {
                this.lazerler.splice(i, 1);
                continue;
            }

            // 2. Taret çarpışması
            let vuruldu = false;
            for (let j = this.modules.length - 1; j >= 0; j--) {
                const modul = this.modules[j];
                const pos   = { x: modul.x, y: modul.y };

                if (mesafe(lazer, { ...pos, boyut: 22 }) < 15) {
                    modul.can -= lazer.hasar;
                    if (modul.can <= 0) {
                        this.satinAlimKaydiniSil(modul);
                        this.modules.splice(j, 1);
                    }
                    vuruldu = true;
                    break;
                }
            }
            if (vuruldu) { this.lazerler.splice(i, 1); continue; }

            // 3. Oyuncu çarpışması
            if (mesafe(lazer, gemi) < this.oyuncuHitboxYaricap() + 6) {
                if (this.absorbPlayerHit(lazer)) {
                    this.lazerler.splice(i, 1);
                    continue;
                }
                // Kalkansız çarpma — direkt can hasarı
                const hasar = lazer.hasar;
                this.can               -= hasar;
                this.alinanHasar       += hasar;
                this.sonOyuncuHasarZamani = this.gecenSure;
                this.lazerler.splice(i, 1);
                continue;
            }

            // 4. Harita sınırı dışı temizleme
            if (lazer.x < -120 || lazer.x > this.haritaGenislik  + 120 ||
                lazer.y < -120 || lazer.y > this.haritaYukseklik + 120) {
                this.lazerler.splice(i, 1);
            }
        }
    },

    /**
     * Endless mod bitişinde en iyi süreyi (saniye) localStorage'a kaydeder.
     * İlerleme zaten kaydedilmişse (enIyiSkorGuncellendi) tekrar çalışmaz.
     */
    kronSkorunuKaydet() {
        if (!this.endless || this.enIyiSkorGuncellendi) return;
        this.enIyiSkorGuncellendi = true;

        const skor       = Math.floor(this.gecenSure);
        const oncekiSkor = Number(localStorage.getItem('spacewarKronBestTime') || 0);

        if (skor > oncekiSkor) localStorage.setItem('spacewarKronBestTime', String(skor));
        window.dispatchEvent(new CustomEvent('kron-skor-guncellendi'));
    },

    /**
     * Normal mod tamamlanınca sonraki bölümün kilidini açar (localStorage güncellenir).
     * Endless modda veya zaten kaydedilmişse çalışmaz.
     */
    ilerlemeKaydet() {
        if (this.endless || this.ilerlemeKaydedildi) return;
        this.ilerlemeKaydedildi = true;

        // Hangi gezegen tamamlandı → hangi bölüm açılacak
        const siradaki = this.isim === 'Astra' ? 2 : this.isim === 'Vega' ? 3 : 3;
        const mevcut   = Number(localStorage.getItem('spacewarUnlockedStage') || 1);

        if (siradaki > mevcut) {
            localStorage.setItem('spacewarUnlockedStage', String(siradaki));
            window.dispatchEvent(new CustomEvent('spacewar-ilerleme-guncellendi'));
        }
    }
};
