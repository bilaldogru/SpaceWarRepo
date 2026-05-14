import { createModularLevel } from '../core/modularLevel.js';

export const astraBolumu = createModularLevel({
    isim: 'Astra',
    renk: '#e056fd',
    gezegenGorseli: 'assets/images/gezegen1.png',
    haritaRengi: 'rgba(28, 10, 38, 0.96)',
    gridRengi: 'rgba(224, 86, 253, 0.13)',
    coreCan: 100,
    maxTurn: 5,
    acikModulSayisi: 2,
    maxModuleSayisi: 5,
    baslangicKron: 140,
    dalgaBaslangic: 8,
    dalgaArtis: 2.8,
    spawnGecikmesi: 405,
    zorlukCarpani: 0.04,
    dusmanDagilimi: [
        { tip: '1', agirlik: 78 },
        { tip: '2', agirlik: 22 }
    ]
});
