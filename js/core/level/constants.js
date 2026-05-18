/**
 * @file constants.js
 * @module level/constants
 * @description Oyun seviyelerinde kullanılan tüm sabit veri tanımlarını içerir.
 *
 * İçerikler:
 *  - MODULES           : Satın alınabilir taret (modül) listesi ve özellikleri
 *  - ENEMY_LABELS      : Düşman tipi açıklamaları (UI gösterimi için)
 *  - ENEMY_KRON_REWARD : Düşman öldürme başına taban Kron ödülü
 *  - ENEMY_KRON_MAX_REWARD : Düşman öldürme için maksimum Kron ödülü
 *  - ENEMY_SCORE_REWARD : Düşman öldürme başına skor ödülü
 *  - SHIELD_MODULE_CONFIG : Kalkan modülü sistemi için sayısal parametreler
 */

// ─────────────────────────────────────────────────────────────────────────────
// TARET (MODÜL) TANIMLARI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Oyuncunun Kron harcayarak satın alabileceği taret türlerinin tam listesi.
 * Her obje bir taret tipini ve özelliklerini tanımlar.
 * Nerede kullanılır: modulSatinal(), modulEkle(), huduGuncelle(), modulSlotlariniGuncelle()
 */
export const MODULES = [
    {
        id: 'slow',
        ad: 'Yavaşlatıcı Taret',
        gorev: 'Düşman hızını azaltır',
        aciklama: 'Menziline giren düşmanları kısa süreliğine yavaşlatır.',
        ozellik: 'Yavaşlatma: %52',
        renk: '#5ae0ff',
        radius: 180,       // Yavaşlatma etkisinin uygulandığı alan yarıçapı (px)
        slowFactor: 0.48,  // Düşman hızının kaçta kaçına düşeceği (1 = tam hız, 0.48 = %52 yavaşlatma)
        fiyat: 70,
        sure: 20,          // Aktif kalma süresi (saniye)
        gecici: true,
        maxCan: 130
    },
    {
        id: 'rapid',
        ad: 'Hızlı Atış Tareti',
        gorev: 'Yüksek atış hızı',
        aciklama: 'Düşük hasarlı ama seri atış yapan savunma taretidir.',
        ozellik: 'Hasar: 15 / Hız: yüksek',
        renk: '#55efc4',
        fireRate: 26,      // Atış arası bekleme süresi (kare sayısı)
        damage: 15,
        speed: 7.2,        // Taretden çıkan merminin uçuş hızı (px/kare)
        fiyat: 105,
        sure: 15,
        gecici: true,
        maxCan: 115
    },
    {
        id: 'heal',
        ad: 'Kalkan Alanı Tareti',
        gorev: 'Can desteği sağlar',
        aciklama: 'Belirli bir alan içinde oyuncunun savunma gücünü artırır.',
        ozellik: 'Etki alanı: 150',
        renk: '#e056fd',
        radius: 150,
        healPerSecond: 9,  // Oyuncu bu alanda iken saniyede kazanacağı can miktarı
        fiyat: 120,
        sure: 25,
        gecici: true,
        maxCan: 180
    },
    {
        id: 'speed',
        ad: 'Hız Alanı Tareti',
        gorev: 'Tepki hızı artırır',
        aciklama: 'Belirli bir alanda hareket ve tepki hızını artırır.',
        ozellik: 'Hız desteği: x1.55',
        renk: '#f39c12',
        radius: 155,
        speedBoost: 1.55,  // Oyuncunun temel hızına uygulanacak çarpan
        fiyat: 95,
        sure: 18,
        gecici: true,
        maxCan: 140
    },
    {
        id: 'ammo',
        ad: 'Kron Enerji Tareti',
        gorev: 'Süreli özel güç',
        aciklama: 'Kritik anlarda kısa süreliğine sınırsız enerji desteği sağlar.',
        ozellik: 'Süre: 18 sn',
        renk: '#ff6b6b',
        radius: 145,
        unlimitedAmmo: true, // true iken mermi tüketimi devre dışı kalır
        fiyat: 150,
        sure: 10,
        gecici: true,
        maxCan: 120
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// DÜŞMAN TİPİ TANIMLARI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Düşman tipi numarasından okunabilir Türkçe etikete eşleme.
 * Nerede kullanılır: savasOncesiPaneliniGuncelle() — dalga özeti listesinde.
 */
export const ENEMY_LABELS = {
    '1': 'Zayıf düşman',
    '2': 'Zırhlı düşman',
    '3': 'Hızlı düşman',
    '4': 'Özel zırhlı düşman',
    '5': 'Boss veya özel düşman'
};

/**
 * Düşman öldürme başına minimum (taban) Kron ödülü.
 * Nerede kullanılır: dusmanKronOdulu() — dalga bonusu ile çarpılarak nihai ödül hesaplanır.
 */
export const ENEMY_KRON_REWARD = {
    '1': 5,
    '2': 9,
    '3': 12,
    '4': 18,
    '5': 50
};

/**
 * Düşman öldürme başına maksimum Kron ödülü (dalga bonusu bu değeri aşamaz).
 * Nerede kullanılır: dusmanKronOdulu() — Math.min ile tavan belirlemek için.
 */
export const ENEMY_KRON_MAX_REWARD = {
    '1': 9,
    '2': 16,
    '3': 22,
    '4': 32,
    '5': 70
};

/**
 * Düşman öldürme başına kazanılan temel skor değeri.
 * Nerede kullanılır: dusmanSkorOdulu() — combo çarpanı ile birleştirilir.
 */
export const ENEMY_SCORE_REWARD = {
    '1': 100,
    '2': 160,
    '3': 180,
    '4': 280,
    '5': 600
};

// ─────────────────────────────────────────────────────────────────────────────
// KALKAN MODÜLÜ KONFİGÜRASYONU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kalkan modülü (shield module) sisteminin tüm sayısal parametrelerini tek noktada toplar.
 * Bir değeri değiştirmek tüm shield davranışlarını etkiler — buradan güncellemek yeterli.
 *
 * maxCount          : Oyuncunun aynı anda sahip olabileceği maksimum kalkan modülü
 * pickupRadius      : Yerden toplanabilir kalkan pikap nesnesinin görsel/çarpışma yarıçapı
 * moduleRadius      : Oyuncuya bağlı kalkan modülünün görsel/çarpışma yarıçapı
 * collectDistance   : Oyuncunun kaç piksel yaklaşınca otomatik toplayacağı mesafe
 * maxPickups        : Aynı anda alanda bulunabilecek maksimum pikap sayısı
 * dropChance        : Normal düşmanların ölünce kalkan bırakma olasılığı (0–1)
 * bossDropBonus     : Boss/tip5 düşmanlara eklenen ek drop şansı
 * hitboxGrowth      : Her kalkan modülü başına oyuncu hitbox yarıçapına eklenen piksel
 * speedPenalty      : Her kalkan modülü başına hıza uygulanan yavaşlatma oranı (0–1)
 * shotCooldownBase  : Temel ateş etme gecikmesi (ms) — modül yokken
 * shotCooldownPerModule : Her kalkan modülü başına azalan ateş gecikmesi (negatif = hızlanır)
 */
export const SHIELD_MODULE_CONFIG = {
    maxCount: 4,
    pickupRadius: 18,
    moduleRadius: 15,
    collectDistance: 42,
    maxPickups: 3,
    dropChance: 0.11,
    bossDropBonus: 0.16,
    hitboxGrowth: 10,
    speedPenalty: 0.07,
    shotCooldownBase: 210,
    shotCooldownPerModule: -16
};
