/**
 * @file waveSystem.js
 * @module level/waveSystem
 * @description Düşman dalga yönetimi, spawn sırası ve savaş öncesi panel kontrolü.
 *
 * Sorumluluklar:
 *  - Her dalga için spawn edilecek düşman listesini oluşturur (dalgaPlaniOlustur)
 *  - Düşman dağılımını endless / normal moda göre ayarlar
 *  - Spawn kuyruğunu zamanlanmış şekilde işler (savasiBaslat / dalgaBaslat)
 *  - Savaş öncesi bilgi panelini (dalga sayısı, düşman türleri) günceller
 *  - Haritaya yeni düşman ekler ve zorluk ölçeklendirmesi yapar
 *
 * Bu modül `createModularLevel` nesnesine Object.assign ile karıştırılır (mixin).
 * İçindeki tüm metodlar `this` üzerinden level state'e erişir.
 *
 * Bağımlılıklar: ENEMY_LABELS (constants.js), dusmanOlustur/dusmanTipiSec (enemy.js),
 *               randomWorldEdgeSpawn (utils.js)
 */

import { ENEMY_LABELS } from './constants.js';
import { dusmanOlustur, dusmanTipiSec } from '../enemy.js';
import { randomWorldEdgeSpawn } from './utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// DALGA SİSTEMİ MİXİN
// ─────────────────────────────────────────────────────────────────────────────

export const waveSystemMixin = {

    /**
     * Geçen süreye ve turn sayısına göre düşman dağılım ağırlıklarını döndürür.
     * Endless modda zaman ilerledikçe güçlü düşman oranı artar.
     * Normal modda config'deki sabit dağılım kullanılır.
     * @param {number} turn - Mevcut dalga sırası
     * @returns {Array<{ tip: string, agirlik: number }>}
     */
    dusmanDagilimiGetir(turn) {
        // Normal modda her zaman config'deki sabit dağılımı kullan
        if (!this.endless) return this.dusmanDagilimi;

        // Endless mod: geçen süreye göre giderek zorlaşan dağılımlar
        if (this.gecenSure < 30) {
            // Erken oyun — ağırlıklı olarak temel düşmanlar
            return [
                { tip: '1', agirlik: 34 },
                { tip: '2', agirlik: 46 },
                { tip: '3', agirlik: 20 }
            ];
        }
        if (this.gecenSure < 60) {
            // Orta oyun — tip4 girmeye başlar
            return [
                { tip: '1', agirlik: 26 },
                { tip: '2', agirlik: 38 },
                { tip: '3', agirlik: 28 },
                { tip: '4', agirlik: 8 }
            ];
        }
        if (this.gecenSure < 120) {
            // İleri oyun — boss/özel düşmanlar (tip5) dahil olur
            return [
                { tip: '1', agirlik: 18 },
                { tip: '2', agirlik: 30 },
                { tip: '3', agirlik: 30 },
                { tip: '4', agirlik: 16 },
                { tip: '5', agirlik: 6 }
            ];
        }

        // Geç oyun — tüm tipler, ağırlıklar turn ile dinamik olarak ölçeklenir
        return [
            { tip: '1', agirlik: Math.max(10, 26 - turn) },
            { tip: '2', agirlik: 24 + Math.min(18, turn) },
            { tip: '3', agirlik: 28 + Math.min(20, turn * 1.2) },
            { tip: '4', agirlik: 18 + Math.min(24, turn * 1.4) },
            { tip: '5', agirlik: 6  + Math.min(22, turn * 1.1) }
        ];
    },

    /**
     * Verilen turn için spawn edilecek düşman listesini (planı) oluşturur.
     * Endless modda geçen süreye bağlı bir çarpan ile düşman sayısı artar.
     * Geç endless aşamalarda ek "özel" düşmanlar (tip4/5) eklenir.
     * @param {number} turn
     * @returns {Array<{ tip: string, offset: number }>} Sıralı spawn kayıtları
     */
    dalgaPlaniOlustur(turn) {
        const temelAdet = Math.round(
            (this._config.dalgaBaslangic || 6) + turn * (this._config.dalgaArtis || 2)
        );

        // Endless modda zamanla artan çarpan
        const endlessCarpan = !this.endless ? 1
            : this.gecenSure < 30  ? 0.85
            : this.gecenSure < 60  ? 1
            : this.gecenSure < 120 ? 1.18
            : 1.36;

        const adet = Math.max(3, Math.round(temelAdet * endlessCarpan));
        const dagilim = this.dusmanDagilimiGetir(turn);

        // Her slot için düşman tipini ağırlıklı rasgelede seç
        const plan = Array.from({ length: adet }, (_, i) => ({
            tip: dusmanTipiSec(dagilim),
            offset: i
        }));

        // Endless geç evrede ekstra güçlü düşmanlar ekle
        if (this.endless && this.gecenSure >= 60) {
            const ozelAdet = Math.max(1, Math.floor((turn - 1) / 3));
            for (let i = 0; i < ozelAdet; i++) {
                plan.push({
                    tip: dusmanTipiSec([{ tip: '4', agirlik: 55 }, { tip: '5', agirlik: 45 }]),
                    offset: adet + i
                });
            }
        }

        return plan;
    },

    /**
     * Verilen turn için kaç düşman spawn edileceğini döndürür (endless çarpanı olmadan).
     * @param {number} turn
     * @returns {number}
     */
    dalgaDusmanSayisi(turn) {
        return Math.round(
            (this._config.dalgaBaslangic || 6) + turn * (this._config.dalgaArtis || 2)
        );
    },

    /**
     * Şu andan itibaren kaç dalga kaldığını döndürür.
     * Endless modda Infinity döner.
     * @param {number} baslangicTurn
     * @returns {number}
     */
    gelecekDalgaSayisiAl(baslangicTurn = this.turn) {
        if (this.endless) return Infinity;
        return Math.max(0, this.maxTurn - baslangicTurn + 1);
    },

    /**
     * Şu andan itibaren toplam kaç düşman geleceğini döndürür.
     * Endless modda Infinity döner.
     * @param {number} baslangicTurn
     * @returns {number}
     */
    toplamDusmanSayisiAl(baslangicTurn = this.turn) {
        if (this.endless) return Infinity;
        let toplam = 0;
        for (let dalga = baslangicTurn; dalga <= this.maxTurn; dalga++) {
            toplam += this.dalgaDusmanSayisi(dalga);
        }
        return toplam;
    },

    /**
     * Bir dalga planındaki her düşman tipinin kaç adet olduğunu sayar.
     * @param {Array} plan - dalgaPlaniOlustur() çıktısı (varsayılan: bekleyenDalgaPlani)
     * @returns {{ '1': number, '2': number, … }} Tipe göre sayım nesnesi
     */
    dalgaOzetiniAl(plan = this.bekleyenDalgaPlani) {
        const sayac = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        plan.forEach(kayit => {
            sayac[String(kayit.tip)] = (sayac[String(kayit.tip)] || 0) + 1;
        });
        return sayac;
    },

    /**
     * Savaş öncesi bilgi panelini (HTML) günceller:
     * dalga başlığı, toplam düşman sayısı, düşman türü listesi.
     * Panel gizliyse (DOM'da yoksa) sessizce çıkar.
     */
    savasOncesiPaneliniGuncelle() {
        const panel     = document.getElementById('savas-oncesi-panel');
        const baslik    = document.getElementById('savas-oncesi-baslik');
        const metin     = document.getElementById('savas-oncesi-metin');
        const toplamAlani = document.getElementById('savas-oncesi-toplam');
        const liste     = document.getElementById('savas-oncesi-dusmanlar');
        if (!panel) return;

        const ozet              = this.dalgaOzetiniAl();
        const gelecekDalgaSayisi = this.gelecekDalgaSayisiAl();
        const toplamGelecekDusman = this.toplamDusmanSayisiAl();

        if (baslik) baslik.textContent = `${this.isim} - ${this.turn}. Dalga`;

        if (this.endless) {
            if (metin) metin.textContent = 'Zamana karşı savaşmaya hazır mısın?';
            if (toplamAlani) toplamAlani.innerHTML = `
                <span>Sonsuz Turn</span>
                <span>Sonsuz Düşman</span>
            `;
        } else {
            if (metin) metin.textContent =
                'Düşmanlar beklemede. Kron bütçeni kullanarak taretlerini yerleştir, hazır olunca savaşı başlat.';
            if (toplamAlani) toplamAlani.innerHTML = `
                <span>Gelecek Dalga Sayısı: ${gelecekDalgaSayisi}</span>
                <span>Toplam Düşman Sayısı: ${toplamGelecekDusman}</span>
            `;
        }

        if (liste) {
            liste.innerHTML = Object.entries(ENEMY_LABELS)
                .filter(([tip]) => ozet[tip] > 0)
                .map(([tip, ad]) => `
                    <div class="savas-dusman-satiri">
                        <span>${ad}</span>
                        <strong>${ozet[tip]} adet</strong>
                    </div>
                `).join('');
        }

        panel.style.display = 'flex';
    },

    /** Savaş öncesi paneli gizler. */
    savasOncesiPaneliniGizle() {
        const panel = document.getElementById('savas-oncesi-panel');
        if (panel) panel.style.display = 'none';
    },

    /**
     * İlk dalga için spawn kuyruğunu oluşturur ve savaşı başlatır.
     * Zaten başlamışsa veya oyun bittiyse tekrar çalışmaz.
     * @param {HTMLCanvasElement} canvas
     */
    savasiBaslat(canvas) {
        if (this.savasBasladi || this.oyunBitti) return;

        const simdi   = performance.now();
        const gecikme = Math.max(180, this._config.spawnGecikmesi || 360);

        // Bekleyen dalga planını zamanlı spawn kuyruğuna dönüştür
        this.spawnQueue = this.bekleyenDalgaPlani.map((kayit, index) => ({
            ...kayit,
            hedefZaman: simdi + index * gecikme
        }));

        this.bekleyenDalgaPlani = [];
        this.dalgaToplamDusman  = this.spawnQueue.length;
        this.savasBasladi       = true;
        this.baslangicZamani    = performance.now();

        this.savasOncesiPaneliniGizle();
        this.bildirimGoster('Savaş başladı. Dalgalar yaklaşıyor!');
        this.huduGuncelle();
    },

    /**
     * Mevcut turn için yeni bir spawn kuyruğu oluşturur (dalga geçişinde çağrılır).
     * Endless modda spawn gecikme süresi giderek kısalır.
     * @param {HTMLCanvasElement} canvas
     */
    dalgaBaslat(canvas) {
        const simdi   = performance.now();
        const gecikme = Math.max(
            170,
            (this._config.spawnGecikmesi || 360) - (this.endless ? Math.min(140, this.turn * 5) : 0)
        );

        const plan = this.dalgaPlaniOlustur(this.turn);

        // 700 ms başlangıç gecikmesi ile sıralı spawn zamanları
        this.spawnQueue = plan.map((kayit, index) => ({
            ...kayit,
            hedefZaman: simdi + 700 + index * gecikme
        }));

        this.dalgaToplamDusman = this.spawnQueue.length;
        this.bildirimGoster(`${this.turn}. dalga geliyor`);
        this.huduGuncelle();
    },

    /**
     * Haritaya tek bir düşman ekler; spawn konumunu ekranın kenarından seçer.
     * Zorluk ölçeklendirmesi: hem hız hem can, turn ve geçen süreye göre artar.
     * @param {HTMLCanvasElement} canvas
     * @param {string} tip - Düşman tipi ('1'–'5')
     * @param {number} offset - Spawn marjına eklenen ofset (kalabalığı dağıtır)
     */
    dusmanEkle(canvas, tip, offset = 0) {
        const spawn = randomWorldEdgeSpawn(this, canvas, 80 + offset * 6);
        const dusman = dusmanOlustur(tip, spawn.x, spawn.y, 0);

        // Endless modda zamana bağlı hız çarpanı (erken oyunda daha yavaş)
        const endlessHizCarpani = this.gecenSure < 30  ? 0.55
                                : this.gecenSure < 60  ? 0.8
                                : this.gecenSure < 120 ? 1.05
                                : 1.28;

        const zorluk = this.endless
            ? this.turn * (this._config.zorlukCarpani || 0.055) * endlessHizCarpani
            : Math.min(1.4, this.turn * (this._config.zorlukCarpani || 0.055));

        dusman.hiz     += zorluk;
        dusman.temelHiz = dusman.hiz;

        // Can ölçeklendirmesi: endless modda zamanla daha hızlı büyür
        const endlessCanArtis = this.gecenSure < 30  ? 0.045
                              : this.gecenSure < 60  ? 0.07
                              : this.gecenSure < 120 ? 0.095
                              : 0.125;

        const canCarpani = this.endless
            ? 1 + this.turn * endlessCanArtis
            : 1 + this.turn * 0.08;

        dusman.can    = Math.round(dusman.can * canCarpani);
        dusman.maxCan = dusman.can;

        this.dusmanlar.push(dusman);
    }
};
