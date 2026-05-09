import { createModularLevel } from './modularLevel.js';

export const noraBolumu = createModularLevel({
    isim: 'Nora',
    renk: '#f39c12',
    gezegenGorseli: 'assets/images/gezegen3.png',
    haritaRengi: 'rgba(28, 18, 8, 0.96)',
    gridRengi: 'rgba(243, 156, 18, 0.14)',
    coreCan: 130,
    maxTurn: 7,
    acikModulSayisi: 4,
    maxModuleSayisi: 6,
    baslangicModulleri: ['rapid', 'chain'],
    dalgaBaslangic: 7,
    dalgaArtis: 2.8,
    spawnGecikmesi: 350,
    zorlukCarpani: 0.065,
    moduleDropEvery: 4,
    dusmanDagilimi: [
        { tip: '1', agirlik: 34 },
        { tip: '2', agirlik: 28 },
        { tip: '3', agirlik: 23 },
        { tip: '4', agirlik: 15 }
    ]
});
