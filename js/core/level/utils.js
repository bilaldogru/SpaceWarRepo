/**
 * @file utils.js
 * @module level/utils
 * @description Oyun seviyesi boyunca kullanılan saf (state bağımsız) yardımcı fonksiyonlar.
 *
 * Bu dosyadaki fonksiyonlar:
 *  - Oyun durumuna (this) erişmez, parametre alarak çalışır
 *  - Birden fazla sistem tarafından paylaşılır
 *  - Kolayca test edilebilir ve yeniden kullanılabilir
 */

// ─────────────────────────────────────────────────────────────────────────────
// ZAMAN VE MATEMATİK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Saniye cinsinden verilen süreyi "MM:SS" (Dakika:Saniye) formatında metne çevirir.
 * @param {number} sure - Saniye cinsinden süre
 * @returns {string} "MM:SS" formatında string (ör: "02:45")
 *
 * Nerede kullanılır: huduGuncelle() ve oyunSonuEkraniCiz() — geçen süreyi gösterirken.
 */
export function sureyiYaz(sure) {
    const dakika = Math.floor(sure / 60).toString().padStart(2, '0');
    const saniye = Math.floor(sure % 60).toString().padStart(2, '0');
    return `${dakika}:${saniye}`;
}

/**
 * İki 2D nokta (x,y) arasındaki öklid (düz çizgi) mesafesini hesaplar.
 * @param {{ x: number, y: number }} a - Birinci nokta
 * @param {{ x: number, y: number }} b - İkinci nokta
 * @returns {number} Piksel cinsinden mesafe
 *
 * Nerede kullanılır: daireCarpisti(), enYakinDusman(), collectModule(), updateModules() vb.
 */
export function mesafe(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * İki dairesel nesnenin çarpışıp çarpışmadığını kontrol eder.
 * Nesnelerin yarıçapı `boyut/2` veya `yaricap` alanından okunur.
 * @param {Object} a    - Birinci nesne ({ x, y, boyut? veya yaricap? })
 * @param {Object} b    - İkinci nesne
 * @param {number} ekstra - İsteğe bağlı ek çarpışma toleransı (piksel)
 * @returns {boolean}   Nesneler çarpışıyorsa true
 *
 * Nerede kullanılır: mermi-düşman, gemi-düşman, lazer-taret çarpışma kontrollerinde.
 */
export function daireCarpisti(a, b, ekstra = 0) {
    return mesafe(a, b) < (a.boyut || a.yaricap || 0) / 2 + (b.boyut || b.yaricap || 0) / 2 + ekstra;
}

/**
 * Bir sayıyı [min, max] aralığına kilitler.
 * @param {number} deger - Sınırlandırılacak değer
 * @param {number} min   - Minimum değer
 * @param {number} max   - Maksimum değer
 * @returns {number} min ile max arasında kalan değer
 *
 * Nerede kullanılır: Kamera pozisyonu, can barı yüzdesi, spawn koordinatları vb.
 */
export function clamp(deger, min, max) {
    return Math.max(min, Math.min(max, deger));
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD VE EKRAN YARDIMCILARI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Oyun içi üst HUD çubuğunun (skor, can, dalga bilgisi) alt sınırını piksel cinsinden döndürür.
 * HUD görünmüyorsa (örn. menüde) 0 döndürür.
 *
 * @returns {number} Üst HUD barının ekrandaki alt kenar Y koordinatı
 *
 * Nerede kullanılır: randomWorldEdgeSpawn() — düşmanların HUD'ın arkasına spawn olmaması için.
 */
export function hudAltSiniri() {
    const hud = document.getElementById('oyun-hud');
    if (!hud || hud.style.display === 'none') return 0;
    const ustBar = hud.querySelector('.hud-top-strip');
    const rect = ustBar?.getBoundingClientRect();
    return rect ? Math.ceil(rect.bottom + 10) : 0;
}

/**
 * Kameranın mevcut görüş alanının hemen dışından rastgele bir spawn noktası üretir.
 * 4 kenar (üst/alt/sol/sağ) arasından biri seçilir, o kenarda rasgele bir koordinat döndürülür.
 *
 * @param {Object} bolum         - Aktif level nesnesi (kamera ve harita bilgisi için)
 * @param {HTMLCanvasElement} canvas
 * @param {number} margin        - Ekran kenarının kaç piksel dışına spawn edilebileceği
 * @returns {{ x: number, y: number }} Dünya koordinatlarında spawn noktası
 *
 * Nerede kullanılır: dusmanEkle() — her yeni düşmanın başlangıç pozisyonunu belirler.
 */
export function randomWorldEdgeSpawn(bolum, canvas, margin = 90) {
    const kamera = bolum.kamera || { x: 0, y: 0 };
    const edge = Math.floor(Math.random() * 4); // 0=üst, 1=sağ, 2=alt, 3=sol

    const minX = Math.max(0, kamera.x - margin);
    const maxX = Math.min(bolum.haritaGenislik, kamera.x + canvas.width + margin);
    const minY = Math.max(0, kamera.y - margin, kamera.y + hudAltSiniri() + 42);
    const maxY = Math.min(bolum.haritaYukseklik, kamera.y + canvas.height + margin);

    if (edge === 0) return { x: minX + Math.random() * (maxX - minX), y: minY };         // üst
    if (edge === 1) return { x: maxX, y: minY + Math.random() * (maxY - minY) };          // sağ
    if (edge === 2) return { x: minX + Math.random() * (maxX - minX), y: maxY };          // alt
    return           { x: minX, y: minY + Math.random() * (maxY - minY) };                // sol
}
