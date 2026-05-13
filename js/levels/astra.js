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
    maxModuleSayisi: 4,
    dalgaBaslangic: 5,
    dalgaArtis: 2,
    spawnGecikmesi: 440,
    zorlukCarpani: 0.045,
    moduleDropEvery: 3,
    dusmanDagilimi: [
        { tip: '1', agirlik: 72 },
        { tip: '2', agirlik: 28 }
    ]
});
