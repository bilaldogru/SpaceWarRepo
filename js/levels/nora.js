import { createModularLevel } from '../core/level/index.js';

/**
 * Nora gezegeninin bölüm ayarlarını içerir.
 * Bu modül, oyun motoruna (modularLevel.js) gönderilecek yapılandırma verilerini içerir.
 */
export const noraBolumu = createModularLevel({
    isim: 'Nora',
    renk: '#f39c12',
    gezegenGorseli: 'assets/images/gezegen3.png',
    haritaRengi: 'rgba(28, 18, 8, 0.96)',
    gridRengi: 'rgba(243, 156, 18, 0.22)',
    coreCan: 120,
    maxTurn: 7,
    acikModulSayisi: 4,
    maxModuleSayisi: 5,
    baslangicKron: 150,
    dalgaBaslangic: 12,
    dalgaArtis: 4.2,
    spawnGecikmesi: 270,
    zorlukCarpani: 0.078,
    dusmanDagilimi: [
        { tip: '1', agirlik: 28 },
        { tip: '2', agirlik: 25 },
        { tip: '3', agirlik: 24 },
        { tip: '4', agirlik: 15 },
        { tip: '5', agirlik: 8 }
    ]
});
