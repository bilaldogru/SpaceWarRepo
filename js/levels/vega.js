import { createModularLevel } from '../core/modularLevel.js';

/**
 * Vega gezegeninin bölüm ayarlarını içerir.
 * Bu modül, oyun motoruna (modularLevel.js) gönderilecek yapılandırma verilerini içerir.
 */
export const vegaBolumu = createModularLevel({
    isim: 'Vega',
    renk: '#00d2ff',
    gezegenGorseli: 'assets/images/gezegen2.png',
    haritaRengi: 'rgba(5, 22, 42, 0.96)',
    gridRengi: 'rgba(0, 210, 255, 0.14)',
    coreCan: 110,
    maxTurn: 6,
    acikModulSayisi: 3,
    maxModuleSayisi: 5,
    baslangicKron: 150,
    dalgaBaslangic: 10,
    dalgaArtis: 3.6,
    spawnGecikmesi: 330,
    zorlukCarpani: 0.058,
    dusmanDagilimi: [
        { tip: '1', agirlik: 48 },
        { tip: '2', agirlik: 30 },
        { tip: '3', agirlik: 22 }
    ]
});
