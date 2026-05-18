/**
 * @file moduleSystem.js
 * @module level/moduleSystem
 * @description Taret (modül) satın alma, yerleştirme, sürükleme ve süreli modül yönetimi.
 *
 * Sorumluluklar:
 *  - Kullanıcının Kron harcayarak taret (modül) satın almasını sağlar
 *  - Sürükleme (drag & drop) ile haritaya taret yerleştirmeyi yönetir
 *  - Süreli modüllerin bitiş zamanını takip edip kaldırır
 *  - Taretlerin ateş etme iznini ve mermi yönetimini kontrol eder
 *  - Bildirim popup'larını gösterir
 *
 * Bu modül `createModularLevel` nesnesine Object.assign ile karıştırılır (mixin).
 * İçindeki tüm metodlar `this` üzerinden level state'e erişir.
 *
 * Bağımlılıklar: MODULES (constants.js), mesafe, clamp (utils.js), gemi (player.js)
 */

import { MODULES } from './constants.js';
import { mesafe, clamp } from './utils.js';
import { gemi } from '../player.js';

// ─────────────────────────────────────────────────────────────────────────────
// MODÜL SİSTEMİ MİXİN
// ─────────────────────────────────────────────────────────────────────────────

export const moduleSystemMixin = {

    /**
     * Verilen slot indeksi veya ekleme sırasına göre yeni bir taret konumu hesaplar.
     * Taretler geminin etrafında altıgen sarmalda (Golden Angle) dizilir; halka dolunca dıştaki halkaya geçer.
     * @param {number} slotIndex - Belirli bir slot isteniyorsa ≥0; yoksa -1 (otomatik konum)
     * @returns {{ x: number, y: number, aci: number }}
     */
    taretKonumuBul(slotIndex = -1) {
        const siradaki = this.modules.length;
        // Golden Angle (2.399…) ile sarmal dağılım sağlar; slotIndex verilmişse dairesel dağılım
        const aci = slotIndex >= 0
            ? (-Math.PI / 2) + slotIndex * (Math.PI * 2 / 5)
            : siradaki * 2.399963229728653;
        const halka    = Math.floor(siradaki / 6);
        const uzaklik  = 120 + halka * 58;

        return {
            x: clamp(gemi.x + Math.cos(aci) * uzaklik, 32, this.haritaGenislik - 32),
            y: clamp(gemi.y + Math.sin(aci) * uzaklik, 32, this.haritaYukseklik - 32),
            aci
        };
    },

    /**
     * Aktif taret listesine yeni bir modül ekler.
     * Taret sınırı doluysa Kron iade edip bildirim gösterir.
     * @param {string|null} tip       - MODULES listesindeki id ('slow', 'rapid' vb.) veya null (otomatik seç)
     * @param {boolean}     sureli    - Süreli modül mü (bitiş zamanı takip edilir)
     * @param {number}      slotIndex - Yerleştirme slot konumu (-1 = otomatik)
     * @returns {Object|undefined} Eklenen modül nesnesi; eklenemezse undefined
     */
    modulEkle(tip = null, sureli = false, slotIndex = -1) {
        if (this.modules.length >= this.maxModuleSayisi) {
            // Sınır doluyken satın alındıysa küçük telafi ver
            this.can  = Math.min(this.maxCan, this.can + 12);
            this.kron += 25;
            this.bildirimGoster('Taret sınırı dolu. 25 Kron iade desteği verildi.');
            return;
        }

        const aciklar  = MODULES.slice(0, this.acikModulSayisi);
        const secilen  = tip
            ? MODULES.find(m => m.id === tip)
            : aciklar[this.modules.length % aciklar.length];
        if (!secilen) return;

        const konum    = this.taretKonumuBul(slotIndex);
        const yeniModul = {
            ...secilen,
            x: konum.x,
            y: konum.y,
            aci: konum.aci,
            // Başlangıç cooldown'unu rastgele ofsetle, tüm taretlerin aynı anda ateş etmesi engellenir
            cooldown: secilen.fireRate ? Math.floor(Math.random() * secilen.fireRate) : 0,
            can: secilen.maxCan,
            sureli,
            slotIndex
        };

        this.modules.push(yeniModul);
        return yeniModul;
    },

    /**
     * Oyuncunun ateş edebilme iznini kontrol eder; mermi tüketimini ve yeniden dolumu yönetir.
     * @returns {boolean} Ateş edilebilirse true
     */
    atesEtmeyeIzinVar() {
        if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor || !this.savasBasladi) return false;

        const simdi = performance.now();
        if (simdi < this.sonrakiOyuncuAtisZamani) return false;

        // Sonraki ateş zamanını ayarla (tüm durumlarda geçerli)
        const sonrakiAtis = () => {
            this.sonrakiOyuncuAtisZamani = performance.now() + this.oyuncuAtisGecikmesi();
        };

        // Sınırsız mermi aktifse hemen izin ver
        if (this.sinirsizMermiAktifMi()) {
            sonrakiAtis();
            this.huduGuncelle();
            return true;
        }

        // Normal mermi kontrolü
        if (this.mermi <= 0) {
            this.yenidenDoldur();
            return false;
        }

        this.mermi--;
        if (this.mermi <= 0) this.yenidenDoldur();
        sonrakiAtis();
        this.huduGuncelle();
        return true;
    },

    /**
     * Aktif "Kron Enerji Tareti" menzilindeyse sınırsız mermi modunu döndürür.
     * @returns {boolean}
     */
    sinirsizMermiAktifMi() {
        return this.modules.some(modul => modul.unlimitedAmmo && mesafe(modul, gemi) <= modul.radius);
    },

    /**
     * Mermi yeniden dolum sürecini başlatır (zaten doluyorsa veya mermi doluysa çalışmaz).
     */
    yenidenDoldur() {
        if (this.yenidenDoluyor || this.mermi >= this.maxMermi) return;
        this.yenidenDoluyor          = true;
        this.yenidenDolumBaslangic   = performance.now();
        this.huduGuncelle();
    },

    /**
     * Belirtilen indeksteki modülü Kron harcayarak satın alır ve haritaya ekler.
     * Zaten aktif bir modül varsa süresini uzatır.
     * Maksimum eş zamanlı modül sınırı aşılırsa redder.
     * @param {number}  index  - MODULES dizisindeki taret indeksi
     * @param {{ x: number, y: number }|null} konum - Manuel yerleştirme konumu (null = otomatik)
     * @returns {boolean} Satın alma başarılı mı
     */
    modulSatinal(index, konum = null) {
        if (!this.oyunDevamEdiyor || this.oyunBitti) return false;

        if (index >= this.acikModulSayisi) {
            this.bildirimGoster('Bu taret bu bölümde kullanılamıyor.');
            return false;
        }

        const modul = MODULES[index];
        if (!modul || this.kron < modul.fiyat) {
            this.bildirimGoster('Yeterli Kron yok.');
            return false;
        }

        const simdi        = performance.now();
        const aktif        = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
        const mevcutModul  = this.modules.find(kayit => kayit.id === modul.id);
        const sureMs       = (modul.sure || 0) * 1000;

        this.kron -= modul.fiyat;

        // Aynı taret zaten aktifse yalnızca süresini uzat
        if (aktif || mevcutModul) {
            const kayit = aktif || { index, modul: mevcutModul, bitis: simdi, sureMs };
            kayit.bitis  = Math.max(kayit.bitis, simdi) + sureMs;
            kayit.sureMs = Math.max(kayit.sureMs || 0, sureMs);
            if (!aktif) this.aktifSatinAlimlar.push(kayit);
            this.bildirimGoster(`${modul.ad} süresi +${modul.sure} sn`);
            this.huduGuncelle();
            return true;
        }

        // Eş zamanlı aktif modül sınırı kontrolü
        if (this.aktifSatinAlimlar.length >= this.maxAktifSatinAlim) {
            this.kron += modul.fiyat; // Para iadesi
            this.huduGuncelle();
            this.bildirimGoster('Aynı anda çok fazla özel taret aktif.');
            return false;
        }

        const eklenen = this.modulEkle(modul.id, Boolean(modul.gecici), index);
        if (!eklenen) {
            this.kron += modul.fiyat;
            return false;
        }

        // Manuel konum verilmişse uygula (sürükleme ile yerleştirmede kullanılır)
        if (konum) {
            eklenen.x = konum.x;
            eklenen.y = konum.y;
        }

        // Süreli modül kaydını tut
        if (modul.gecici) {
            this.aktifSatinAlimlar.push({
                index,
                modul:  eklenen,
                bitis:  simdi + sureMs,
                sureMs
            });
        }

        this.bildirimGoster(`${modul.ad} yerleştirildi.`);
        this.huduGuncelle();
        return true;
    },

    /**
     * Geçici bir bildirim popup'ı oluşturur ve 1.4 saniye sonra kaldırır.
     * @param {string} metin - Gösterilecek mesaj
     */
    bildirimGoster(metin) {
        const oyunAlani = document.getElementById('oyun-alani');
        if (!oyunAlani) return;

        // Önceki bildirimi temizle (üst üste binmesin)
        const eski = oyunAlani.querySelector('.oyun-bildirimi');
        if (eski) eski.remove();

        const bildirim       = document.createElement('div');
        bildirim.className   = 'oyun-bildirimi';
        bildirim.textContent = metin;
        oyunAlani.appendChild(bildirim);
        setTimeout(() => bildirim.remove(), 1400);
    },

    /**
     * Belirtilen indeksteki modülün şu an satın alınıp alınamayacağını kontrol eder.
     * Oyun devam ediyor mu, kilit mi, yeterli Kron mu, slot dolu mu sorularını yanıtlar.
     * @param {number} index - MODULES dizisindeki taret indeksi
     * @returns {boolean}
     */
    modulSatinAlinabilirMi(index) {
        if (!this.oyunDevamEdiyor || this.oyunBitti) return false;
        if (index >= this.acikModulSayisi) return false;

        const modul = MODULES[index];
        if (!modul || this.kron < modul.fiyat) return false;

        const aktif       = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
        const mevcutModul = this.modules.some(kayit => kayit.id === modul.id);

        // Zaten aktif modül varsa süre uzatılabilir
        if (aktif || mevcutModul) return true;

        // Yeni modül eklenebilir mi?
        if (this.modules.length >= this.maxModuleSayisi) return false;
        return this.aktifSatinAlimlar.length < this.maxAktifSatinAlim;
    },

    /**
     * Ekran koordinatlarını (clientX/Y) dünya koordinatlarına çevirir.
     * Kamera ofseti ve canvas/ekran ölçeği gözetilir.
     * @param {HTMLCanvasElement} canvas
     * @param {number} clientX
     * @param {number} clientY
     * @returns {{ x: number, y: number, ekranX: number, ekranY: number }}
     */
    ekranKonumunuDunya(canvas, clientX, clientY) {
        const rect = canvas.getBoundingClientRect
            ? canvas.getBoundingClientRect()
            : { left: 0, top: 0, width: canvas.width, height: canvas.height };

        const oranX = canvas.width  / (rect.width  || canvas.width);
        const oranY = canvas.height / (rect.height || canvas.height);

        return {
            x:      (clientX - rect.left) * oranX + this.kamera.x,
            y:      (clientY - rect.top)  * oranY + this.kamera.y,
            ekranX: clientX,
            ekranY: clientY
        };
    },

    /**
     * Bir dünya konumunun taret yerleştirmek için geçerli olup olmadığını kontrol eder.
     * Harita sınırları ve HUD element bölgeleri dikkate alınır.
     * @param {{ x, y, ekranX, ekranY }|null} konum
     * @returns {boolean}
     */
    yerlestirmeGecerliMi(konum) {
        if (!konum) return false;

        const { x, y, ekranX, ekranY } = konum;
        const guvenliBosluk = 34;

        const dunyaIci = x > guvenliBosluk && x < this.haritaGenislik - guvenliBosluk &&
                         y > guvenliBosluk && y < this.haritaYukseklik - guvenliBosluk;
        if (!dunyaIci) return false;

        // HUD elementlerinin üzerine bırakılamaz
        const engeller = ['.hud-sidebar', '.hud-bottom-bar', '.hud-top-strip', '.savas-oncesi-kutu'];
        return !engeller.some(secici => {
            const el = document.querySelector(secici);
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return ekranX >= rect.left && ekranX <= rect.right &&
                   ekranY >= rect.top  && ekranY <= rect.bottom;
        });
    },

    /**
     * Sürükleme işlemini başlatır: taret satın alınabilir mi kontrol eder, önizleme oluşturur.
     * Taret zaten aktifse doğrudan satın alır (süre uzatma).
     * @param {number} index    - MODULES dizisindeki taret indeksi
     * @param {HTMLCanvasElement} canvas
     * @param {number} clientX
     * @param {number} clientY
     * @returns {boolean}
     */
    modulSuruklemeBaslat(index, canvas, clientX, clientY) {
        if (!this.modulSatinAlinabilirMi(index)) {
            const modul = MODULES[index];
            this.bildirimGoster(
                modul && this.kron < modul.fiyat ? 'Yeterli Kron yok.' : 'Bu taret şimdi alınamaz.'
            );
            return false;
        }

        const modul = MODULES[index];

        // Taret zaten haritadaysa sürükleme yerine satın al (süre uzatma)
        if (this.modules.some(kayit => kayit.id === modul.id)) {
            return this.modulSatinal(index);
        }

        const konum = this.ekranKonumunuDunya(canvas, clientX, clientY);
        this.suruklenenModul = {
            index,
            ad:     modul.ad,
            renk:   modul.renk,
            radius: modul.radius,
            x:      clamp(konum.x, 34, this.haritaGenislik - 34),
            y:      clamp(konum.y, 34, this.haritaYukseklik - 34),
            gecerli: this.yerlestirmeGecerliMi(konum)
        };

        return true;
    },

    /**
     * Sürükleme sırasında her hareket olayında çağrılır; önizleme konumunu günceller.
     */
    modulSuruklemeGuncelle(canvas, clientX, clientY) {
        if (!this.suruklenenModul) return false;

        const konum = this.ekranKonumunuDunya(canvas, clientX, clientY);
        this.suruklenenModul.x      = clamp(konum.x, 34, this.haritaGenislik - 34);
        this.suruklenenModul.y      = clamp(konum.y, 34, this.haritaYukseklik - 34);
        this.suruklenenModul.gecerli = this.yerlestirmeGecerliMi(konum);

        return true;
    },

    /**
     * Kullanıcı bıraktığında (mouseup/touchend) sürüklemeyi bitirir.
     * Geçersiz alana bırakıldıysa satın alınmaz ve bildirim gösterilir.
     */
    modulSuruklemeBitir(canvas, clientX, clientY) {
        if (!this.suruklenenModul) return false;

        this.modulSuruklemeGuncelle(canvas, clientX, clientY);
        const { index, x, y, gecerli } = this.suruklenenModul;
        this.suruklenenModul = null;

        if (!gecerli) {
            this.bildirimGoster('Taret bu alana yerlestirilemez.');
            return false;
        }

        return this.modulSatinal(index, { x, y });
    },

    /** Sürüklemeyi iptal eder (ESC veya başka bir kesinti). */
    modulSuruklemeIptal() {
        this.suruklenenModul = null;
    },

    /**
     * Her kare: süresi dolmuş geçici modülleri kaldırır.
     * aktifSatinAlimlar listesi üzerinden bitiş zamanı geçmiş modüller temizlenir.
     */
    sureliModulleriGuncelle() {
        const simdi = performance.now();

        for (let i = this.aktifSatinAlimlar.length - 1; i >= 0; i--) {
            const kayit = this.aktifSatinAlimlar[i];
            if (simdi < kayit.bitis) continue; // Henüz dolmadı

            const modulIndex = this.modules.indexOf(kayit.modul);
            if (modulIndex !== -1) this.modules.splice(modulIndex, 1);
            this.aktifSatinAlimlar.splice(i, 1);
        }
    },

    /**
     * Bir modül yok edildiğinde (hasar vs.) ilgili satın alım kaydını siler.
     * @param {Object} modul - Kaldırılan modül nesnesi
     */
    satinAlimKaydiniSil(modul) {
        const index = this.aktifSatinAlimlar.findIndex(kayit => kayit.modul === modul);
        if (index !== -1) this.aktifSatinAlimlar.splice(index, 1);
    }
};
