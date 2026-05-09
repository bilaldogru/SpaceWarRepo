import { createModularLevel } from './modularLevel.js';

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
    baslangicModulleri: ['rapid'],
    dalgaBaslangic: 6,
    dalgaArtis: 2.4,
    spawnGecikmesi: 390,
    zorlukCarpani: 0.055,
    moduleDropEvery: 4,
    dusmanDagilimi: [
        { tip: '1', agirlik: 46 },
        { tip: '2', agirlik: 34 },
        { tip: '3', agirlik: 20 }
    ]
});
