import { createModularLevel } from '../core/modularLevel.js';

export const kronBolumu = createModularLevel({
    isim: 'Kron',
    renk: '#55efc4',
    gezegenGorseli: 'assets/images/gezegen4.png',
    haritaRengi: 'rgba(6, 28, 21, 0.96)',
    gridRengi: 'rgba(85, 239, 196, 0.14)',
    coreCan: 140,
    maxTurn: Infinity,
    endless: true,
    acikModulSayisi: 5,
    maxModuleSayisi: 8,
    baslangicModulleri: ['rapid', 'heal', 'speed'],
    dalgaBaslangic: 8,
    dalgaArtis: 3,
    spawnGecikmesi: 320,
    zorlukCarpani: 0.072,
    moduleDropEvery: 5,
    gemiHizi: 2.35,
    dusmanDagilimi: [
        { tip: '1', agirlik: 32 },
        { tip: '2', agirlik: 24 },
        { tip: '3', agirlik: 20 },
        { tip: '4', agirlik: 15 },
        { tip: '5', agirlik: 9 }
    ]
});
