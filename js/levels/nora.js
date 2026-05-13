import { createModularLevel } from '../core/modularLevel.js';

export const noraBolumu = createModularLevel({
    isim: 'Nora',
    renk: '#f39c12',
    gezegenGorseli: 'assets/images/gezegen3.png',
    haritaRengi: 'rgba(28, 18, 8, 0.96)',
    gridRengi: 'rgba(243, 156, 18, 0.22)',    // daha parlak grid
    coreCan: 115,                               // azaltildi: 130 -> 115
    maxTurn: 7,
    acikModulSayisi: 6,                         // chain modulu icin 6'ya cikarildi
    maxModuleSayisi: 5,                         // azaltildi: 6 -> 5
    baslangicModulleri: ['rapid'],              // heal kaldirildi — baslangic zor
    dalgaBaslangic: 9,                          // artirildi: 7 -> 9
    dalgaArtis: 3.5,                            // artirildi: 3.0 -> 3.5
    spawnGecikmesi: 280,                        // azaltildi: 350 -> 280
    zorlukCarpani: 0.078,                       // artirildi: 0.065 -> 0.078
    moduleDropEvery: 5,                         // azaltildi: 4 -> 5
    dusmanDagilimi: [
        { tip: '1', agirlik: 28 },
        { tip: '2', agirlik: 25 },
        { tip: '3', agirlik: 24 },
        { tip: '4', agirlik: 15 },
        { tip: '5', agirlik: 8  }               // yeni: boss tipi eklendi
    ]
});
