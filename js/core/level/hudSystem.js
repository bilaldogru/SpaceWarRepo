/**
 * @file hudSystem.js
 * @module level/hudSystem
 * @description Oyun içi HUD (Heads-Up Display) elementlerinin güncellenmesini yönetir.
 *
 * Sorumluluklar:
 *  - Can barı, mermi sayısı, Kron, skor, kombo, süre, turn ve düşman sayacını günceller
 *  - Taret slot UI kartlarını (kilitli/aktif/satın alınabilir durumları) yeniler
 *  - Tüm DOM okuma/yazma işlemlerini tek bir fonksiyon üzerinden yönlendirir (huduGuncelle)
 *
 * Bu modül `createModularLevel` nesnesine Object.assign ile karıştırılır (mixin).
 * İçindeki tüm metodlar `this` üzerinden level state'e erişir.
 *
 * Bağımlılıklar: MODULES (constants.js), sureyiYaz, clamp (utils.js)
 */

import { MODULES } from './constants.js';
import { sureyiYaz, clamp } from './utils.js';

// ─────────────────────────────────────────────────────────────────────────────
// HUD SİSTEMİ MİXİN
// ─────────────────────────────────────────────────────────────────────────────

export const hudSystemMixin = {

    /**
     * Tüm HUD elementlerini oyunun mevcut durumuna göre günceller.
     * Her oyun döngüsü karesinde (guncelle) ve durum değişikliklerinde çağrılır.
     *
     * Güncellenen elementler:
     *  hud-can        → gezegen/üs can sayısı
     *  hud-oyuncu-can → aktif taret sayısı / max taret
     *  hud-mermi      → mermi sayısı veya dolum geri sayımı
     *  hud-kron       → mevcut Kron miktarı
     *  hud-skor       → toplam skor
     *  hud-kombo      → mevcut kombo çarpanı
     *  hud-sure       → MM:SS formatında geçen süre
     *  hud-turn       → mevcut dalga numarası
     *  hud-max-turn   → toplam dalga sayısı (Endless → "Sonsuz")
     *  hud-dusman     → kalan düşman sayısı (sayı)
     *  hud-dusman-kalan / hud-dusman-bar → ilerleme çubuğu
     *  hud-can-bar    → can ilerleme çubuğu genişliği
     *  hud-kombo-gosterge → görsel kombo göstergesi (data-combo ile renklendirme)
     */
    huduGuncelle() {
        // DOM referansları — null kontrolü her atamada yapılır
        const hudCan          = document.getElementById('hud-can');
        const hudOyuncuCan    = document.getElementById('hud-oyuncu-can');
        const hudMermi        = document.getElementById('hud-mermi');
        const hudKron         = document.getElementById('hud-kron');
        const hudSkor         = document.getElementById('hud-skor');
        const hudKombo        = document.getElementById('hud-kombo');
        const hudSure         = document.getElementById('hud-sure');
        const hudTurn         = document.getElementById('hud-turn');
        const hudDusman       = document.getElementById('hud-dusman');
        const hudMaxTurn      = document.getElementById('hud-max-turn');
        const hudDusmanBar    = document.getElementById('hud-dusman-bar');
        const hudDusmanKalan  = document.getElementById('hud-dusman-kalan');

        // Kalan düşman sayısı: savaş başladıysa aktif liste + kuyruk, yoksa bekleyen plan
        const kalanDusman = this.savasBasladi
            ? this.dusmanlar.length + this.spawnQueue.length
            : this.bekleyenDalgaPlani.length;

        const dalgaToplam   = Math.max(1, this.dalgaToplamDusman || kalanDusman || 1, kalanDusman);
        const dusmanOrani   = clamp(kalanDusman / dalgaToplam, 0, 1);
        const kalanDolum    = Math.max(0, this.yenidenDolumSuresi - (performance.now() - this.yenidenDolumBaslangic));

        if (hudCan)        hudCan.textContent       = Math.max(0, Math.ceil(this.can));
        if (hudOyuncuCan)  hudOyuncuCan.textContent = `${this.modules.length}/${this.maxModuleSayisi}`;

        // Mermi: doluyorsa geri sayım, sınırsızsa "Sınırsız", yoksa XX/max
        if (hudMermi) hudMermi.textContent = this.yenidenDoluyor
            ? `Doluyor ${Math.ceil(kalanDolum / 1000)}sn`
            : this.sinirsizMermiAktifMi()
                ? 'Sınırsız'
                : `${this.mermi}/${this.maxMermi}`;

        if (hudKron)        hudKron.textContent    = this.kron;
        if (hudSkor)        hudSkor.textContent    = this.skor;
        if (hudKombo)       hudKombo.textContent   = `x${this.combo}`;
        if (hudSure)        hudSure.textContent    = sureyiYaz(this.gecenSure);
        if (hudTurn)        hudTurn.textContent    = this.turn;
        if (hudMaxTurn)     hudMaxTurn.textContent = this.endless ? 'Sonsuz' : this.maxTurn;
        if (hudDusman)      hudDusman.textContent  = kalanDusman;
        if (hudDusmanKalan) hudDusmanKalan.textContent = `${kalanDusman}/${dalgaToplam}`;
        if (hudDusmanBar)   hudDusmanBar.style.width   = `${dusmanOrani * 100}%`;

        // Can barı genişliği (CSS width %)
        const canBar = document.getElementById('hud-can-bar');
        if (canBar) canBar.style.width = `${clamp(this.can / this.maxCan, 0, 1) * 100}%`;

        // Kombo göstergesi: 1–9 arası data-combo ile CSS renklendirmesi tetiklenir
        const comboEl = document.getElementById('hud-kombo-gosterge');
        if (comboEl) {
            const c = Math.min(this.combo, 9);
            comboEl.textContent  = `x${this.combo}`;
            comboEl.dataset.combo = c;
        }

        // Taret slot kartlarını güncelle
        this.modulSlotlariniGuncelle();
    },

    /**
     * Taret seçim arayüzündeki (.taret-slot) her kartı günceller:
     *  - Kilitli mi (bu gezegende kullanılamaz)
     *  - Aktif mi (süreli modül çalışıyor)
     *  - Satın alınabilir mi (yeterli Kron)
     *  - Kalan süre göstergesi
     *  - Tooltip içeriği
     */
    modulSlotlariniGuncelle() {
        const slotlar = document.querySelectorAll('.taret-slot');

        slotlar.forEach((slot, index) => {
            const modul  = MODULES[index];
            const aktif  = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
            const kalan  = aktif ? Math.ceil((aktif.bitis - performance.now()) / 1000) : 0;
            const kilitli = index >= this.acikModulSayisi;

            // CSS sınıfları
            slot.classList.toggle('kilitli',    kilitli);
            slot.classList.toggle('aktif-modul', Boolean(aktif));
            slot.classList.toggle('alinabilir',  !kilitli && this.kron >= modul.fiyat);

            // Tooltip
            slot.title = kilitli
                ? `${modul.ad}: Bu taret bu gezegende kapalı. ${modul.aciklama}`
                : `${modul.ad} | ${modul.gorev} | ${modul.fiyat} Kron | ${modul.ozellik}`;

            // Kart içeriği
            slot.innerHTML = `
                <span class="taret-numara">${index + 1}</span>
                <span class="modul-ad">${modul.ad}</span>
                <span class="modul-gorev">${modul.gorev}</span>
                <span class="modul-fiyat">${kilitli ? 'Sonraki gezegen' : modul.fiyat + ' Kron'}</span>
                <span class="modul-sure">${aktif ? kalan + 'sn' : modul.sure + 'sn'}</span>
            `;
        });
    }
};
