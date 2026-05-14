import { dusmanOlustur, dusmanTipiSec } from './enemy.js';
import { gemi, gemiGorseli } from './player.js';
import { drawEnemyLasers, drawSquareEnemies } from './sceneVisuals.js';

export const MODULES = [
    {
        id: 'slow',
        ad: 'Yavaşlatıcı Taret',
        gorev: 'Düşman hızını azaltır',
        aciklama: 'Menziline giren düşmanları kısa süreliğine yavaşlatır.',
        ozellik: 'Yavaşlatma: %52',
        renk: '#5ae0ff',
        radius: 180,
        slowFactor: 0.48,
        fiyat: 70,
        sure: 20,
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
        fireRate: 26,
        damage: 15,
        speed: 7.2,
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
        healPerSecond: 9,
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
        speedBoost: 1.55,
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
        unlimitedAmmo: true,
        fiyat: 150,
        sure: 10,
        gecici: true,
        maxCan: 120
    }
];

const ENEMY_LABELS = {
    '1': 'Zayıf düşman',
    '2': 'Zırhlı düşman',
    '3': 'Hızlı düşman',
    '4': 'Özel zırhlı düşman',
    '5': 'Boss veya özel düşman'
};

const ENEMY_KRON_REWARD = {
    '1': 5,
    '2': 9,
    '3': 12,
    '4': 18,
    '5': 50
};

const ENEMY_KRON_MAX_REWARD = {
    '1': 9,
    '2': 16,
    '3': 22,
    '4': 32,
    '5': 70
};

const ENEMY_SCORE_REWARD = {
    '1': 100,
    '2': 160,
    '3': 180,
    '4': 280,
    '5': 600
};

const SHIELD_MODULE_CONFIG = {
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

/**
 * Saniye cinsinden verilen süreyi "MM:SS" (Dakika:Saniye) formatında metne çevirir.
 * Nerede kullanılır: Oyun içi HUD'da geçen süreyi gösterirken.
 * Neden kullanılır: Süreyi oyuncu için standart ve okunabilir bir saate dönüştürmek amacıyla.
 */
function sureyiYaz(sure) {
    const dakika = Math.floor(sure / 60).toString().padStart(2, '0');
    const saniye = Math.floor(sure % 60).toString().padStart(2, '0');
    return `${dakika}:${saniye}`;
}

/**
 * İki nesne (nokta) arasındaki öklid mesafesini (hipotenüs) hesaplar.
 * Nerede kullanılır: Çarpışma tespitlerinde, taretlerin menzil kontrollerinde (daireCarpisti, enYakinDusman vb.).
 * Neden kullanılır: Nesnelerin birbirine ne kadar uzak olduğunu matematiksel olarak bulmak için.
 */
function mesafe(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * İki dairesel nesnenin (yarıçap veya boyutlarına göre) birbirine çarpıp çarpmadığını kontrol eder.
 * Nerede kullanılır: Mermi-düşman, gemi-düşman gibi fiziksel etkileşim durumlarında.
 * Neden kullanılır: Nesnelerin hitbox'larının (çarpışma alanlarının) kesişip kesişmediğini belirlemek için.
 */
function daireCarpisti(a, b, ekstra = 0) {
    return mesafe(a, b) < (a.boyut || a.yaricap || 0) / 2 + (b.boyut || b.yaricap || 0) / 2 + ekstra;
}

/**
 * Bir sayıyı verilen minimum ve maksimum değerler arasına sınırlandırır (kilitler).
 * Nerede kullanılır: Gemi pozisyonu, kamera sınırları ve hesaplanan oranlarda (örn. can barı yüzdesi).
 * Neden kullanılır: Değerlerin istenen güvenli veya mantıksal aralıkların dışına çıkmasını engellemek için.
 */
function clamp(deger, min, max) {
    return Math.max(min, Math.min(max, deger));
}

/**
 * Oyun içi üst HUD çubuğunun (skor, can, dalga vs. yazan alan) alt sınırını piksel cinsinden döndürür.
 * Nerede kullanılır: randomWorldEdgeSpawn vb. alan hesaplamalarında HUD'ın arkasına düşman spawn olmaması için.
 * Neden kullanılır: Ekranın kullanılamayan/görünmeyen bölümlerini oyun alanından dışlamak için.
 */
function hudAltSiniri() {
    const hud = document.getElementById('oyun-hud');
    if (!hud || hud.style.display === 'none') return 0;
    const ustBar = hud.querySelector('.hud-top-strip');
    const rect = ustBar?.getBoundingClientRect();
    return rect ? Math.ceil(rect.bottom + 10) : 0;
}

/**
 * Kameranın baktığı mevcut ekranın hemen dışındaki bir kenardan (üst, alt, sol, sağ) rastgele bir spawn (doğma) noktası üretir.
 * Nerede kullanılır: modularLevel'da dusmanEkle() çağrılırken düşmanlara başlangıç pozisyonu atamak için.
 * Neden kullanılır: Düşmanların aniden ekranın ortasında belirip haksızlık yaratmasını engellemek, dışarıdan geliyormuş hissi vermek için.
 */
function randomWorldEdgeSpawn(bolum, canvas, margin = 90) {
    const kamera = bolum.kamera || { x: 0, y: 0 };
    const edge = Math.floor(Math.random() * 4);
    const minX = Math.max(0, kamera.x - margin);
    const maxX = Math.min(bolum.haritaGenislik, kamera.x + canvas.width + margin);
    const minY = Math.max(0, kamera.y - margin, kamera.y + hudAltSiniri() + 42);
    const maxY = Math.min(bolum.haritaYukseklik, kamera.y + canvas.height + margin);

    if (edge === 0) return { x: minX + Math.random() * (maxX - minX), y: minY };
    if (edge === 1) return { x: maxX, y: minY + Math.random() * (maxY - minY) };
    if (edge === 2) return { x: minX + Math.random() * (maxX - minX), y: maxY };
    return { x: minX, y: minY + Math.random() * (maxY - minY) };
}

/**
 * Temel bir oyun seviyesi (bölümü) nesnesi oluşturur. Bölümlerin ana mantığını (fizik, çizim, dalga yönetimi) barındırır.
 * Nerede kullanılır: astra.js, kron.js, nora.js, vega.js gibi özel bölüm dosyalarında her bir gezegenin konfigürasyonunu sarmalamak için.
 * Neden kullanılır: Her bölüm için aynı kodları (update, draw, spawn vs.) tekrar yazmak yerine merkezi (modüler) bir oyun motoru yapısı kullanmak için.
 */
export function createModularLevel(config) {
    return {
        isim: config.isim,
        renk: config.renk,
        gezegenGorseli: config.gezegenGorseli,
        maxTurn: config.maxTurn,
        maxCan: config.coreCan,
        maxOyuncuCan: config.coreCan,
        can: config.coreCan,
        oyuncuCan: config.coreCan,
        kron: 0,
        skor: 0,
        mermi: 20,
        maxMermi: 20,
        turn: 1,
        gecenSure: 0,
        baslangicZamani: 0,
        oyunDevamEdiyor: false,
        oyunBitti: false,
        oyunKazanildi: false,
        yenidenDoluyor: false,
        serbestHareketModu: true,
        dusmanlar: [],
        lazerler: [],
        moduleShots: [],
        pickups: [],
        shieldPickups: [],
        shieldModules: [],
        shieldModuleId: 0,
        sonrakiOyuncuAtisZamani: 0,
        particles: [],
        skorYazilari: [],
        modules: [],
        spawnQueue: [],
        bekleyenDalgaPlani: [],
        aktifSatinAlimlar: [],
        suruklenenModul: null,
        dalgaToplamDusman: 0,
        killCount: 0,
        combo: 1,
        comboBitis: 0,
        sonOyuncuHasarZamani: -10,
        enIyiSkorGuncellendi: false,
        maxCombo: 1,
        alinanHasar: 0,
        dusmanDagilimi: config.dusmanDagilimi,
        acikModulSayisi: config.acikModulSayisi,
        maxModuleSayisi: config.maxModuleSayisi,
        endless: Boolean(config.endless),
        savasBasladi: false,
        maxShieldModules: config.maxShieldModules || SHIELD_MODULE_CONFIG.maxCount,
        shieldModuleDropChance: config.shieldModuleDropChance || SHIELD_MODULE_CONFIG.dropChance,
        maxAktifSatinAlim: config.maxAktifSatinAlim || MODULES.length,
        yenidenDolumBaslangic: 0,
        yenidenDolumSuresi: 1600,
        haritaGenislik: 2400,
        haritaYukseklik: 1600,
        kamera: { x: 0, y: 0 },
        haritaRengi: config.haritaRengi || 'rgba(8, 14, 28, 0.96)',
        gridRengi: config.gridRengi || 'rgba(90, 224, 255, 0.12)',

        /**
         * Canvas boyutuna göre gezegenin çizim yarıçapını dinamik olarak hesaplar.
         * Nerede kullanılır: sceneVisuals.js'deki gezegen çizim ve savunma bölgesi (getPlanetDefenseZone) fonksiyonlarında.
         * Neden kullanılır: Farklı ekran çözünürlüklerinde gezegenin boyutunu orantılı tutmak için.
         */
        gezegenYaricapi(canvas) {
            return Math.min(170, Math.max(105, canvas.height * 0.17));
        },

        baslat(canvas) {
            this.haritaGenislik = Math.max(canvas.width * 2.25, config.haritaGenislik || 2300);
            this.haritaYukseklik = Math.max(canvas.height * 2.15, config.haritaYukseklik || 1500);
            gemi.genislik = 48;
            gemi.uzunluk = 48;
            gemi.hiz = config.gemiHizi || 2.2;
            gemi.x = this.haritaGenislik / 2;
            gemi.y = this.haritaYukseklik / 2;
            this.kamera = this.kameraHesapla(canvas);

            this.can = this.maxCan;
            this.oyuncuCan = this.maxOyuncuCan;
            this.kron = config.baslangicKron || 260;
            this.skor = 0;
            this.mermi = this.maxMermi;
            this.turn = 1;
            this.gecenSure = 0;
            this.oyunDevamEdiyor = true;
            this.oyunBitti = false;
            this.oyunKazanildi = false;
            this.savasBasladi = false;
            this.yenidenDoluyor = false;
            this.dusmanlar = [];
            this.lazerler = [];
            this.moduleShots = [];
            this.pickups = [];
            this.shieldPickups = [];
            this.shieldModules = [];
            this.shieldModuleId = 0;
            this.sonrakiOyuncuAtisZamani = 0;
            this.particles = [];
            this.skorYazilari = [];
            this.modules = [];
            this.spawnQueue = [];
            this.bekleyenDalgaPlani = [];
            this.aktifSatinAlimlar = [];
            this.suruklenenModul = null;
            this.dalgaToplamDusman = 0;
            this.killCount = 0;
            this.combo = 1;
            this.maxCombo = 1;
            this.alinanHasar = 0;
            this.comboBitis = 0;
            this.sonOyuncuHasarZamani = -10;
            this.enIyiSkorGuncellendi = false;
            this.ilerlemeKaydedildi = false;
            this.baslangicZamani = performance.now();

            // Bölümler oyuncuya taret vermeden başlar; ilk dalga oyuncu hazır olana kadar bekletilir.
            this.bekleyenDalgaPlani = this.dalgaPlaniOlustur(this.turn);
            this.dalgaToplamDusman = this.bekleyenDalgaPlani.length;
            this.savasOncesiPaneliniGuncelle();
            this.huduGuncelle();
        },

        durdur() {
            gemi.genislik = 60;
            gemi.uzunluk = 60;
            gemi.hiz = 2;
            this.oyunDevamEdiyor = false;
            this.oyunBitti = false;
            this.savasBasladi = false;
            this.dusmanlar = [];
            this.lazerler = [];
            this.moduleShots = [];
            this.pickups = [];
            this.shieldPickups = [];
            this.shieldModules = [];
            this.particles = [];
            this.skorYazilari = [];
            this.spawnQueue = [];
            this.bekleyenDalgaPlani = [];
            this.aktifSatinAlimlar = [];
            this.suruklenenModul = null;
            this.savasOncesiPaneliniGizle();
            this.huduGuncelle();
        },

        kameraHesapla(canvas) {
            return {
                x: clamp(gemi.x - canvas.width / 2, 0, Math.max(0, this.haritaGenislik - canvas.width)),
                y: clamp(gemi.y - canvas.height / 2, 0, Math.max(0, this.haritaYukseklik - canvas.height))
            };
        },

        oyuncuHitboxYaricap() {
            return gemi.genislik / 2 + this.shieldModules.length * SHIELD_MODULE_CONFIG.hitboxGrowth;
        },

        shieldHizCarpani() {
            return Math.max(0.46, 1 - this.shieldModules.length * SHIELD_MODULE_CONFIG.speedPenalty);
        },

        oyuncuAtisGecikmesi() {
            return Math.max(125, SHIELD_MODULE_CONFIG.shotCooldownBase +
                this.shieldModules.length * SHIELD_MODULE_CONFIG.shotCooldownPerModule);
        },

        shieldModulHedefKonumu(index) {
            const ileriX = Math.cos(gemi.aci);
            const ileriY = Math.sin(gemi.aci);
            const sagX = -ileriY;
            const sagY = ileriX;
            const sira = Math.floor(index / 2);
            const yon = index % 2 === 0 ? 1 : -1;
            const yanMesafe = yon * (42 + sira * 30);
            const arkaMesafe = sira * 20;

            return {
                x: gemi.x - ileriX * arkaMesafe + sagX * yanMesafe,
                y: gemi.y - ileriY * arkaMesafe + sagY * yanMesafe
            };
        },

        updatePlayerBoundsOrSize() {
            gemi.hitboxYaricap = this.oyuncuHitboxYaricap();
        },

        spawnShieldModule(konum) {
            if (this.shieldModules.length >= this.maxShieldModules) return;
            if (this.shieldPickups.length >= SHIELD_MODULE_CONFIG.maxPickups) return;

            const x = clamp((konum?.x || gemi.x) + (Math.random() - 0.5) * 34, 80, this.haritaGenislik - 80);
            const y = clamp((konum?.y || gemi.y) + (Math.random() - 0.5) * 34, 90, this.haritaYukseklik - 90);

            this.shieldPickups.push({
                x,
                y,
                yaricap: SHIELD_MODULE_CONFIG.pickupRadius,
                dogum: performance.now(),
                pulse: Math.random() * Math.PI * 2
            });
        },

        tryDropShieldModule(dusman) {
            if (this.shieldModules.length >= this.maxShieldModules) return;
            if (this.shieldPickups.length >= SHIELD_MODULE_CONFIG.maxPickups) return;

            const tip = String(dusman.tip);
            const bonus = tip === '5' ? SHIELD_MODULE_CONFIG.bossDropBonus : tip === '4' ? 0.05 : 0;
            const sans = Math.min(0.28, this.shieldModuleDropChance + bonus);
            if (Math.random() <= sans) this.spawnShieldModule(dusman);
        },

        collectModule(index) {
            if (this.shieldModules.length >= this.maxShieldModules) {
                this.bildirimGoster('Maksimum kalkan modülü dolu.');
                return false;
            }

            const pickup = this.shieldPickups[index];
            if (!pickup) return false;
            this.shieldPickups.splice(index, 1);
            const yeniIndex = this.shieldModules.length;
            const hedef = this.shieldModulHedefKonumu(yeniIndex);
            this.shieldModules.push({
                id: ++this.shieldModuleId,
                x: hedef.x,
                y: hedef.y,
                yaricap: SHIELD_MODULE_CONFIG.moduleRadius,
                can: 1,
                maxCan: 1,
                renk: '#5ae0ff'
            });
            this.updatePlayerBoundsOrSize();
            this.bildirimGoster(`Kalkan modülü bağlandı: ${this.shieldModules.length}/${this.maxShieldModules}`);
            return true;
        },

        updateModules(canvas) {
            for (let i = this.shieldPickups.length - 1; i >= 0; i--) {
                const pickup = this.shieldPickups[i];
                const toplamaMesafesi = this.oyuncuHitboxYaricap() + SHIELD_MODULE_CONFIG.collectDistance;
                if (mesafe(pickup, gemi) <= toplamaMesafesi) this.collectModule(i);
            }

            this.shieldModules.forEach((modul, index) => {
                const hedef = this.shieldModulHedefKonumu(index);
                modul.x += (hedef.x - modul.x) * 0.38;
                modul.y += (hedef.y - modul.y) * 0.38;
            });
            this.updatePlayerBoundsOrSize();
        },

        removeModule(index) {
            const modul = this.shieldModules[index];
            if (!modul) return false;
            this.particles.push({
                x: modul.x,
                y: modul.y,
                hizX: 0,
                hizY: 0,
                r: 12,
                renk: '#5ae0ff',
                baslangic: performance.now(),
                sure: 260
            });
            this.shieldModules.splice(index, 1);
            this.updatePlayerBoundsOrSize();
            this.bildirimGoster('Kalkan modülü kırıldı.');
            return true;
        },

        handleModuleDamage(vuran, ekstra = 0) {
            for (let i = this.shieldModules.length - 1; i >= 0; i--) {
                const modul = this.shieldModules[i];
                const vuranYaricap = (vuran.boyut || vuran.yaricap || 0) / 2;
                if (mesafe(vuran, modul) <= vuranYaricap + modul.yaricap + ekstra) {
                    this.removeModule(i);
                    return true;
                }
            }
            return false;
        },

        absorbPlayerHit(vuran) {
            if (this.shieldModules.length <= 0) return false;
            let hedefIndex = 0;
            let enKisa = Infinity;
            this.shieldModules.forEach((modul, index) => {
                const uzaklik = mesafe(vuran, modul);
                if (uzaklik < enKisa) {
                    enKisa = uzaklik;
                    hedefIndex = index;
                }
            });
            return this.removeModule(hedefIndex);
        },

        fireFromPlayerAndModules(atis, mermiListesi) {
            this.shieldModules.forEach((modul, index) => {
                const aci = Math.atan2(atis.yonY, atis.yonX) + (index % 2 === 0 ? 0.07 : -0.07);
                const yonX = Math.cos(aci);
                const yonY = Math.sin(aci);
                mermiListesi.push({
                    x: modul.x + yonX * 18,
                    y: modul.y + yonY * 18,
                    hizX: yonX * (atis.hiz + 0.35),
                    hizY: yonY * (atis.hiz + 0.35),
                    yaricap: 3.6,
                    renk: '#8eeeff',
                    hasar: 22
                });
            });
        },

        dusmanDagilimiGetir(turn) {
            if (!this.endless) return this.dusmanDagilimi;

            if (this.gecenSure < 30) {
                return [
                    { tip: '1', agirlik: 34 },
                    { tip: '2', agirlik: 46 },
                    { tip: '3', agirlik: 20 }
                ];
            }

            if (this.gecenSure < 60) {
                return [
                    { tip: '1', agirlik: 26 },
                    { tip: '2', agirlik: 38 },
                    { tip: '3', agirlik: 28 },
                    { tip: '4', agirlik: 8 }
                ];
            }

            if (this.gecenSure < 120) {
                return [
                    { tip: '1', agirlik: 18 },
                    { tip: '2', agirlik: 30 },
                    { tip: '3', agirlik: 30 },
                    { tip: '4', agirlik: 16 },
                    { tip: '5', agirlik: 6 }
                ];
            }

            return [
                { tip: '1', agirlik: Math.max(10, 26 - turn) },
                { tip: '2', agirlik: 24 + Math.min(18, turn) },
                { tip: '3', agirlik: 28 + Math.min(20, turn * 1.2) },
                { tip: '4', agirlik: 18 + Math.min(24, turn * 1.4) },
                { tip: '5', agirlik: 6 + Math.min(22, turn * 1.1) }
            ];
        },

        dalgaPlaniOlustur(turn) {
            const temelAdet = Math.round((config.dalgaBaslangic || 6) + turn * (config.dalgaArtis || 2));
            const endlessCarpan = !this.endless
                ? 1
                : this.gecenSure < 30
                    ? 0.85
                    : this.gecenSure < 60
                        ? 1
                        : this.gecenSure < 120
                            ? 1.18
                            : 1.36;
            const adet = Math.max(3, Math.round(temelAdet * endlessCarpan));
            const dagilim = this.dusmanDagilimiGetir(turn);
            const plan = [];

            for (let i = 0; i < adet; i++) {
                plan.push({
                    tip: dusmanTipiSec(dagilim),
                    offset: i
                });
            }

            if (this.endless && this.gecenSure >= 60) {
                const ozelAdet = Math.max(1, Math.floor((turn - 1) / 3));
                for (let i = 0; i < ozelAdet; i++) {
                    plan.push({
                        tip: dusmanTipiSec([{ tip: '4', agirlik: 55 }, { tip: '5', agirlik: 45 }]),
                        offset: adet + i
                    });
                }
            }

            return plan;
        },

        dalgaDusmanSayisi(turn) {
            return Math.round((config.dalgaBaslangic || 6) + turn * (config.dalgaArtis || 2));
        },

        gelecekDalgaSayisiAl(baslangicTurn = this.turn) {
            if (this.endless) return Infinity;
            return Math.max(0, this.maxTurn - baslangicTurn + 1);
        },

        toplamDusmanSayisiAl(baslangicTurn = this.turn) {
            if (this.endless) return Infinity;
            let toplam = 0;
            for (let dalga = baslangicTurn; dalga <= this.maxTurn; dalga++) {
                toplam += this.dalgaDusmanSayisi(dalga);
            }
            return toplam;
        },

        dalgaOzetiniAl(plan = this.bekleyenDalgaPlani) {
            const sayac = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
            plan.forEach(kayit => {
                sayac[String(kayit.tip)] = (sayac[String(kayit.tip)] || 0) + 1;
            });
            return sayac;
        },

        savasOncesiPaneliniGuncelle() {
            const panel = document.getElementById('savas-oncesi-panel');
            const baslik = document.getElementById('savas-oncesi-baslik');
            const metin = document.getElementById('savas-oncesi-metin');
            const toplamAlani = document.getElementById('savas-oncesi-toplam');
            const liste = document.getElementById('savas-oncesi-dusmanlar');
            if (!panel) return;

            const ozet = this.dalgaOzetiniAl();
            const toplamDusman = Object.values(ozet).reduce((toplam, adet) => toplam + adet, 0);
            const gelecekDalgaSayisi = this.gelecekDalgaSayisiAl();
            const toplamGelecekDusman = this.toplamDusmanSayisiAl();
            if (baslik) baslik.textContent = `${this.isim} - ${this.turn}. Dalga`;
            if (this.endless) {
                if (metin) metin.textContent = 'Zamana karşı savaşmaya hazır mısın?';
                if (toplamAlani) {
                    toplamAlani.innerHTML = `
                        <span>Sonsuz Turn</span>
                        <span>Sonsuz Düşman</span>
                    `;
                }
            } else {
                if (metin) {
                    metin.textContent = 'Düşmanlar beklemede. Kron bütçeni kullanarak taretlerini yerleştir, hazır olunca savaşı başlat.';
                }
                if (toplamAlani) {
                    toplamAlani.innerHTML = `
                        <span>Gelecek Dalga Sayısı: ${gelecekDalgaSayisi}</span>
                        <span>Toplam Düşman Sayısı: ${toplamGelecekDusman}</span>
                    `;
                }
            }
            if (liste) {
                liste.innerHTML = Object.entries(ENEMY_LABELS)
                    .filter(([tip]) => ozet[tip] > 0)
                    .map(([tip, ad]) => `
                        <div class="savas-dusman-satiri">
                            <span>${ad}</span>
                            <strong>${ozet[tip]} adet</strong>
                        </div>
                    `).join('');
            }
            panel.style.display = 'flex';
        },

        savasOncesiPaneliniGizle() {
            const panel = document.getElementById('savas-oncesi-panel');
            if (panel) panel.style.display = 'none';
        },

        savasiBaslat(canvas) {
            if (this.savasBasladi || this.oyunBitti) return;
            const simdi = performance.now();
            const gecikme = Math.max(180, config.spawnGecikmesi || 360);
            this.spawnQueue = this.bekleyenDalgaPlani.map((kayit, index) => ({
                ...kayit,
                hedefZaman: simdi + index * gecikme
            }));
            this.bekleyenDalgaPlani = [];
            this.dalgaToplamDusman = this.spawnQueue.length;
            this.savasBasladi = true;
            this.baslangicZamani = performance.now();
            this.savasOncesiPaneliniGizle();
            this.bildirimGoster('Savaş başladı. Dalgalar yaklaşıyor!');
            this.huduGuncelle();
        },

        dalgaBaslat(canvas) {
            const simdi = performance.now();
            const gecikme = Math.max(170, (config.spawnGecikmesi || 360) - (this.endless ? Math.min(140, this.turn * 5) : 0));
            const plan = this.dalgaPlaniOlustur(this.turn);
            this.spawnQueue = plan.map((kayit, index) => ({
                ...kayit,
                hedefZaman: simdi + 700 + index * gecikme
            }));
            this.dalgaToplamDusman = this.spawnQueue.length;
            this.bildirimGoster(`${this.turn}. dalga geliyor`);
            this.huduGuncelle();
        },

        dusmanEkle(canvas, tip, offset = 0) {
            const spawn = randomWorldEdgeSpawn(this, canvas, 80 + offset * 6);
            const dusman = dusmanOlustur(tip, spawn.x, spawn.y, 0);
            const endlessHizCarpani = this.gecenSure < 30
                ? 0.55
                : this.gecenSure < 60
                    ? 0.8
                    : this.gecenSure < 120
                        ? 1.05
                        : 1.28;
            const zorluk = this.endless
                ? this.turn * (config.zorlukCarpani || 0.055) * endlessHizCarpani
                : Math.min(1.4, this.turn * (config.zorlukCarpani || 0.055));
            dusman.hiz += zorluk;
            dusman.temelHiz = dusman.hiz;
            const endlessCanArtis = this.gecenSure < 30
                ? 0.045
                : this.gecenSure < 60
                    ? 0.07
                    : this.gecenSure < 120
                        ? 0.095
                        : 0.125;
            const canCarpani = this.endless ? 1 + this.turn * endlessCanArtis : 1 + this.turn * 0.08;
            dusman.can = Math.round(dusman.can * canCarpani);
            dusman.maxCan = dusman.can;
            this.dusmanlar.push(dusman);
        },

        taretKonumuBul(slotIndex = -1) {
            const siradaki = this.modules.length;
            const aci = slotIndex >= 0
                ? (-Math.PI / 2) + slotIndex * (Math.PI * 2 / 5)
                : siradaki * 2.399963229728653;
            const halka = Math.floor(siradaki / 6);
            const uzaklik = 120 + halka * 58;
            return {
                x: clamp(gemi.x + Math.cos(aci) * uzaklik, 32, this.haritaGenislik - 32),
                y: clamp(gemi.y + Math.sin(aci) * uzaklik, 32, this.haritaYukseklik - 32),
                aci
            };
        },

        modulEkle(tip = null, sureli = false, slotIndex = -1) {
            if (this.modules.length >= this.maxModuleSayisi) {
                this.can = Math.min(this.maxCan, this.can + 12);
                this.kron += 25;
                this.bildirimGoster('Taret sınırı dolu. 25 Kron iade desteği verildi.');
                return;
            }

            const aciklar = MODULES.slice(0, this.acikModulSayisi);
            const secilen = tip ? MODULES.find(m => m.id === tip) : aciklar[this.modules.length % aciklar.length];
            if (!secilen) return;
            const konum = this.taretKonumuBul(slotIndex);

            const yeniModul = {
                ...secilen,
                x: konum.x,
                y: konum.y,
                aci: konum.aci,
                cooldown: secilen.fireRate ? Math.floor(Math.random() * secilen.fireRate) : 0,
                can: secilen.maxCan,
                sureli,
                slotIndex
            };
            this.modules.push(yeniModul);

            return yeniModul;
        },

        atesEtmeyeIzinVar() {
            if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor || !this.savasBasladi) return false;
            const simdi = performance.now();
            if (simdi < this.sonrakiOyuncuAtisZamani) return false;
            const sonrakiAtis = () => {
                this.sonrakiOyuncuAtisZamani = performance.now() + this.oyuncuAtisGecikmesi();
            };

            if (this.sinirsizMermiAktifMi()) {
                sonrakiAtis();
                this.huduGuncelle();
                return true;
            }
            if (this.mermi <= 0) {
                this.yenidenDoldur();
                return false;
            }

            this.mermi--;
            if (this.mermi <= 0) this.yenidenDoldur();
            sonrakiAtis();
            this.huduGuncelle();
            return true;
        },

        sinirsizMermiAktifMi() {
            return this.modules.some(modul => modul.unlimitedAmmo && mesafe(modul, gemi) <= modul.radius);
        },

        yenidenDoldur() {
            if (this.yenidenDoluyor || this.mermi >= this.maxMermi) return;
            this.yenidenDoluyor = true;
            this.yenidenDolumBaslangic = performance.now();
            this.huduGuncelle();
        },

        modulSatinal(index, konum = null) {
            if (!this.oyunDevamEdiyor || this.oyunBitti) return false;
            if (index >= this.acikModulSayisi) {
                this.bildirimGoster('Bu taret bu bölümde kullanılamıyor.');
                return false;
            }

            const modul = MODULES[index];
            if (!modul || this.kron < modul.fiyat) {
                this.bildirimGoster('Yeterli Kron yok.');
                return false;
            }

            const simdi = performance.now();
            const aktif = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
            const mevcutModul = this.modules.find(kayit => kayit.id === modul.id);
            this.kron -= modul.fiyat;
            const sureMs = (modul.sure || 0) * 1000;

            if (aktif || mevcutModul) {
                const kayit = aktif || {
                    index,
                    modul: mevcutModul,
                    bitis: simdi,
                    sureMs
                };
                kayit.bitis = Math.max(kayit.bitis, simdi) + sureMs;
                kayit.sureMs = Math.max(kayit.sureMs || 0, sureMs);
                if (!aktif) this.aktifSatinAlimlar.push(kayit);
                this.bildirimGoster(`${modul.ad} süresi +${modul.sure} sn`);
                this.huduGuncelle();
                return true;
            }

            if (this.aktifSatinAlimlar.length >= this.maxAktifSatinAlim) {
                this.kron += modul.fiyat;
                this.huduGuncelle();
                this.bildirimGoster('Aynı anda çok fazla özel taret aktif.');
                return false;
            }

            const eklenen = this.modulEkle(modul.id, Boolean(modul.gecici), index);
            if (!eklenen) {
                this.kron += modul.fiyat;
                return false;
            }

            if (konum) {
                eklenen.x = konum.x;
                eklenen.y = konum.y;
            }

            if (modul.gecici) {
                this.aktifSatinAlimlar.push({
                    index,
                    modul: eklenen,
                    bitis: simdi + sureMs,
                    sureMs
                });
            }
            this.bildirimGoster(`${modul.ad} yerleştirildi.`);
            this.huduGuncelle();
            return true;
        },

        bildirimGoster(metin) {
            const oyunAlani = document.getElementById('oyun-alani');
            if (!oyunAlani) return;
            const eski = oyunAlani.querySelector('.oyun-bildirimi');
            if (eski) eski.remove();
            const bildirim = document.createElement('div');
            bildirim.className = 'oyun-bildirimi';
            bildirim.textContent = metin;
            oyunAlani.appendChild(bildirim);
            setTimeout(() => bildirim.remove(), 1400);
        },

        modulSatinAlinabilirMi(index) {
            if (!this.oyunDevamEdiyor || this.oyunBitti) return false;
            if (index >= this.acikModulSayisi) return false;
            const modul = MODULES[index];
            if (!modul || this.kron < modul.fiyat) return false;
            const aktif = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
            const mevcutModul = this.modules.some(kayit => kayit.id === modul.id);
            if (aktif || mevcutModul) return true;
            if (this.modules.length >= this.maxModuleSayisi) return false;
            return this.aktifSatinAlimlar.length < this.maxAktifSatinAlim;
        },

        ekranKonumunuDunya(canvas, clientX, clientY) {
            const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
            const oranX = canvas.width / (rect.width || canvas.width);
            const oranY = canvas.height / (rect.height || canvas.height);
            return {
                x: (clientX - rect.left) * oranX + this.kamera.x,
                y: (clientY - rect.top) * oranY + this.kamera.y,
                ekranX: clientX,
                ekranY: clientY
            };
        },

        yerlestirmeGecerliMi(konum) {
            if (!konum) return false;
            const x = konum.x;
            const y = konum.y;
            const ekranX = konum.ekranX;
            const ekranY = konum.ekranY;
            const guvenliBosluk = 34;
            const dunyaIci = x > guvenliBosluk && x < this.haritaGenislik - guvenliBosluk &&
                y > guvenliBosluk && y < this.haritaYukseklik - guvenliBosluk;
            if (!dunyaIci) return false;

            // HUD, taret paneli ve bilgilendirme kutusu üzerine bırakılan taretler geçersiz sayılır.
            const engeller = ['.hud-sidebar', '.hud-bottom-bar', '.hud-top-strip', '.savas-oncesi-kutu'];
            return !engeller.some(secici => {
                const el = document.querySelector(secici);
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                return ekranX >= rect.left && ekranX <= rect.right && ekranY >= rect.top && ekranY <= rect.bottom;
            });
        },

        modulSuruklemeBaslat(index, canvas, clientX, clientY) {
            if (!this.modulSatinAlinabilirMi(index)) {
                const modul = MODULES[index];
                this.bildirimGoster(modul && this.kron < modul.fiyat ? 'Yeterli Kron yok.' : 'Bu taret şimdi alınamaz.');
                return false;
            }
            const modul = MODULES[index];
            if (this.modules.some(kayit => kayit.id === modul.id)) {
                return this.modulSatinal(index);
            }
            const konum = this.ekranKonumunuDunya(canvas, clientX, clientY);
            this.suruklenenModul = {
                index,
                ad: modul.ad,
                renk: modul.renk,
                radius: modul.radius,
                x: clamp(konum.x, 34, this.haritaGenislik - 34),
                y: clamp(konum.y, 34, this.haritaYukseklik - 34),
                gecerli: this.yerlestirmeGecerliMi(konum)
            };
            return true;
        },

        modulSuruklemeGuncelle(canvas, clientX, clientY) {
            if (!this.suruklenenModul) return false;
            const konum = this.ekranKonumunuDunya(canvas, clientX, clientY);
            this.suruklenenModul.x = clamp(konum.x, 34, this.haritaGenislik - 34);
            this.suruklenenModul.y = clamp(konum.y, 34, this.haritaYukseklik - 34);
            this.suruklenenModul.gecerli = this.yerlestirmeGecerliMi(konum);
            return true;
        },

        modulSuruklemeBitir(canvas, clientX, clientY) {
            if (!this.suruklenenModul) return false;
            this.modulSuruklemeGuncelle(canvas, clientX, clientY);
            const { index, x, y, gecerli } = this.suruklenenModul;
            this.suruklenenModul = null;
            if (!gecerli) {
                this.bildirimGoster('Taret bu alana yerlestirilemez.');
                return false;
            }
            return this.modulSatinal(index, { x, y });
        },

        modulSuruklemeIptal() {
            this.suruklenenModul = null;
        },

        sureliModulleriGuncelle() {
            const simdi = performance.now();
            for (let i = this.aktifSatinAlimlar.length - 1; i >= 0; i--) {
                const kayit = this.aktifSatinAlimlar[i];
                if (simdi < kayit.bitis) continue;

                const modulIndex = this.modules.indexOf(kayit.modul);
                if (modulIndex !== -1) this.modules.splice(modulIndex, 1);
                this.aktifSatinAlimlar.splice(i, 1);
            }
        },

        satinAlimKaydiniSil(modul) {
            const index = this.aktifSatinAlimlar.findIndex(kayit => kayit.modul === modul);
            if (index !== -1) this.aktifSatinAlimlar.splice(index, 1);
        },

        huduGuncelle() {
            const hudCan = document.getElementById('hud-can');
            const hudOyuncuCan = document.getElementById('hud-oyuncu-can');
            const hudMermi = document.getElementById('hud-mermi');
            const hudKron = document.getElementById('hud-kron');
            const hudSkor = document.getElementById('hud-skor');
            const hudKombo = document.getElementById('hud-kombo');
            const hudSure = document.getElementById('hud-sure');
            const hudTurn = document.getElementById('hud-turn');
            const hudDusman = document.getElementById('hud-dusman');
            const hudMaxTurn = document.getElementById('hud-max-turn');
            const hudDusmanBar = document.getElementById('hud-dusman-bar');
            const hudDusmanKalan = document.getElementById('hud-dusman-kalan');

            const kalanDusman = this.savasBasladi
                ? this.dusmanlar.length + this.spawnQueue.length
                : this.bekleyenDalgaPlani.length;
            const dalgaToplam = Math.max(1, this.dalgaToplamDusman || kalanDusman || 1, kalanDusman);
            const dusmanOrani = clamp(kalanDusman / dalgaToplam, 0, 1);
            const kalanDolum = Math.max(0, this.yenidenDolumSuresi - (performance.now() - this.yenidenDolumBaslangic));
            if (hudCan) hudCan.textContent = Math.max(0, Math.ceil(this.can));
            if (hudOyuncuCan) hudOyuncuCan.textContent = `${this.modules.length}/${this.maxModuleSayisi}`;
            if (hudMermi) hudMermi.textContent = this.yenidenDoluyor
                ? `Doluyor ${Math.ceil(kalanDolum / 1000)}sn`
                : this.sinirsizMermiAktifMi()
                    ? 'Sınırsız'
                    : `${this.mermi}/${this.maxMermi}`;
            if (hudKron) hudKron.textContent = this.kron;
            if (hudSkor) hudSkor.textContent = this.skor;
            if (hudKombo) hudKombo.textContent = `x${this.combo}`;
            if (hudSure) hudSure.textContent = sureyiYaz(this.gecenSure);
            if (hudTurn) hudTurn.textContent = this.turn;
            if (hudMaxTurn) hudMaxTurn.textContent = this.endless ? 'Sonsuz' : this.maxTurn;
            if (hudDusman) hudDusman.textContent = kalanDusman;
            if (hudDusmanKalan) hudDusmanKalan.textContent = `${kalanDusman}/${dalgaToplam}`;
            if (hudDusmanBar) hudDusmanBar.style.width = `${dusmanOrani * 100}%`;

            const canBar = document.getElementById('hud-can-bar');
            if (canBar) canBar.style.width = `${clamp(this.can / this.maxCan, 0, 1) * 100}%`;

            const comboEl = document.getElementById('hud-kombo-gosterge');
            if (comboEl) {
                const c = Math.min(this.combo, 9);
                comboEl.textContent = `x${this.combo}`;
                comboEl.dataset.combo = c;
            }

            this.modulSlotlariniGuncelle();
        },

        modulSlotlariniGuncelle() {
            const slotlar = document.querySelectorAll('.taret-slot');
            slotlar.forEach((slot, index) => {
                const modul = MODULES[index];
                const aktif = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
                const kalan = aktif ? Math.ceil((aktif.bitis - performance.now()) / 1000) : 0;
                const kilitli = index >= this.acikModulSayisi;

                slot.classList.toggle('kilitli', kilitli);
                slot.classList.toggle('aktif-modul', Boolean(aktif));
                slot.classList.toggle('alinabilir', !kilitli && this.kron >= modul.fiyat);
                slot.title = kilitli
                    ? `${modul.ad}: Bu taret bu gezegende kapalı. ${modul.aciklama}`
                    : `${modul.ad} | ${modul.gorev} | ${modul.fiyat} Kron | ${modul.ozellik}`;

                slot.innerHTML = `
                    <span class="taret-numara">${index + 1}</span>
                    <span class="modul-ad">${modul.ad}</span>
                    <span class="modul-gorev">${modul.gorev}</span>
                    <span class="modul-fiyat">${kilitli ? 'Sonraki gezegen' : modul.fiyat + ' Kron'}</span>
                    <span class="modul-sure">${aktif ? kalan + 'sn' : modul.sure + 'sn'}</span>
                `;
            });
        },

        enYakinDusman(x, y, menzil = Infinity) {
            let hedef = null;
            let enKisa = menzil;
            this.dusmanlar.forEach(dusman => {
                const uzaklik = Math.hypot(dusman.x - x, dusman.y - y);
                if (uzaklik < enKisa) {
                    enKisa = uzaklik;
                    hedef = dusman;
                }
            });
            return hedef;
        },

        moduleAtesle(modul) {
            if (!modul.fireRate) return;
            const pos = { x: modul.x, y: modul.y };
            const hedef = this.enYakinDusman(pos.x, pos.y, 520);
            if (!hedef) return;

            const dx = hedef.x - pos.x;
            const dy = hedef.y - pos.y;
            const uzaklik = Math.sqrt(dx * dx + dy * dy) || 1;
            this.moduleShots.push({
                x: pos.x,
                y: pos.y,
                hizX: (dx / uzaklik) * modul.speed,
                hizY: (dy / uzaklik) * modul.speed,
                yaricap: modul.splash ? 6 : 4,
                renk: modul.renk,
                hasar: modul.damage
            });
        },

        mermiCarpismalariniKontrolEt(mermiler) {
            for (let i = mermiler.length - 1; i >= 0; i--) {
                const mermi = mermiler[i];
                const hedefVuruldu = this.mermiDusmanaCarpti(mermi, 25);
                if (hedefVuruldu) mermiler.splice(i, 1);
            }
        },

        mermiDusmanaCarpti(mermi, varsayilanHasar) {
            for (let j = this.dusmanlar.length - 1; j >= 0; j--) {
                const dusman = this.dusmanlar[j];
                if (mesafe(mermi, dusman) < dusman.boyut / 2 + (mermi.yaricap || 4)) {
                    dusman.can -= mermi.hasar || varsayilanHasar;
                    if (dusman.can <= 0) this.dusmanYokEt(j, dusman);
                    for (let k = this.dusmanlar.length - 1; k >= 0; k--) {
                        if (this.dusmanlar[k].can <= 0) this.dusmanYokEt(k, this.dusmanlar[k]);
                    }
                    return true;
                }
            }
            return false;
        },

        dusmanKronOdulu(dusman) {
            const tip = String(dusman.tip);
            const temelOdul = ENEMY_KRON_REWARD[tip] || 5;
            const ustSinir = ENEMY_KRON_MAX_REWARD[tip] || Math.round(temelOdul * 1.5);
            const dalgaBonusu = this.endless
                ? 1 + Math.min(0.35, Math.max(0, this.turn - 1) * 0.025)
                : 1 + Math.min(0.45, Math.max(0, this.turn - 1) * 0.05);
            return Math.min(ustSinir, Math.round(temelOdul * dalgaBonusu));
        },

        dusmanSkorOdulu(dusman) {
            return ENEMY_SCORE_REWARD[String(dusman.tip)] || 100;
        },

        dusmanYokEt(index, dusman) {
            this.dusmanlar.splice(index, 1);
            this.killCount++;
            if (performance.now() < this.comboBitis) this.combo = Math.min(9, this.combo + 1);
            else this.combo = 1;
            this.comboBitis = performance.now() + 2500;
            const kronOdulu = this.dusmanKronOdulu(dusman);
            const skorOdulu = this.dusmanSkorOdulu(dusman) * this.combo;
            this.kron += kronOdulu;
            this.skor += skorOdulu;
            this.tryDropShieldModule(dusman);
            this.skorYazilari.push({
                x: dusman.x,
                y: dusman.y - dusman.boyut / 2,
                deger: kronOdulu,
                skor: skorOdulu,
                baslangic: performance.now(),
                sure: 900
            });
            this.patlamaOlustur(dusman);
        },

        patlamaOlustur(dusman) {
            const renkler = {
                '1': '#ff4d6d',
                '2': '#ff8c00',
                '3': '#8b5cf6',
                '4': '#f9ca24',
                '5': '#ffffff'
            };
            const renk = renkler[String(dusman.tip)] || '#ff4d6d';
            const adet = dusman.tip >= 4 ? 18 : 10;
            const simdi = performance.now();
            for (let i = 0; i < adet; i++) {
                const aci = (Math.PI * 2 / adet) * i + Math.random() * 0.5;
                const hiz = 1.2 + Math.random() * 2.8;
                this.particles.push({
                    x: dusman.x,
                    y: dusman.y,
                    hizX: Math.cos(aci) * hiz,
                    hizY: Math.sin(aci) * hiz,
                    r: 3 + Math.random() * 3,
                    renk,
                    baslangic: simdi,
                    sure: 480 + Math.random() * 280
                });
            }
        },

        dusmanGuncelle(canvas, dusman) {
            const dx = gemi.x - dusman.x;
            const dy = gemi.y - dusman.y;
            const uzaklik = Math.sqrt(dx * dx + dy * dy) || 1;
            const yavaslatma = this.dusmanYavaslatmaCarpani(dusman);
            const hiz = (dusman.temelHiz || dusman.hiz) * yavaslatma;
            dusman.hiz = hiz;
            dusman.x += (dx / uzaklik) * hiz;
            dusman.y += (dy / uzaklik) * hiz;
            dusman.aci = Math.atan2(dy, dx);
            dusman.update(canvas, this);
            dusman.hiz = dusman.temelHiz || dusman.hiz;
        },

        dusmanYavaslatmaCarpani(dusman) {
            let carpani = 1;
            this.modules.forEach(modul => {
                if (modul.slowFactor && mesafe(modul, dusman) <= modul.radius) {
                    carpani = Math.min(carpani, modul.slowFactor);
                }
            });
            return carpani;
        },

        oyuncuAlaninda(modul) {
            return Boolean(modul.radius) && mesafe(modul, gemi) <= modul.radius;
        },

        destekEtkileriniUygula() {
            let hizCarpani = 1;
            this.modules.forEach(modul => {
                if (!this.oyuncuAlaninda(modul)) return;

                if (modul.healPerSecond) {
                    this.can = Math.min(this.maxCan, this.can + modul.healPerSecond / 60);
                }

                if (modul.speedBoost) {
                    hizCarpani = Math.max(hizCarpani, modul.speedBoost);
                }
            });

            gemi.hiz = (config.gemiHizi || 2.2) * hizCarpani * this.shieldHizCarpani();
        },

        moduleCarpismasi(dusman) {
            for (let i = this.modules.length - 1; i >= 0; i--) {
                const modul = this.modules[i];
                const pos = { x: modul.x, y: modul.y };
                if (mesafe(dusman, { ...pos, boyut: 24 }) < dusman.boyut / 2 + 12) {
                    modul.can -= 42 + Number(dusman.tip) * 8;
                    if (modul.can <= 0) {
                        this.satinAlimKaydiniSil(modul);
                        this.modules.splice(i, 1);
                    }
                    return true;
                }
            }
            return false;
        },

        lazerleriGuncelle(canvas) {
            for (let i = this.lazerler.length - 1; i >= 0; i--) {
                const lazer = this.lazerler[i];
                lazer.x += lazer.hizX;
                lazer.y += lazer.hizY;

                if (this.handleModuleDamage(lazer, 5)) {
                    this.lazerler.splice(i, 1);
                    continue;
                }

                let vuruldu = false;
                for (let j = this.modules.length - 1; j >= 0; j--) {
                    const modul = this.modules[j];
                    const pos = { x: modul.x, y: modul.y };
                    if (mesafe(lazer, { ...pos, boyut: 22 }) < 15) {
                        modul.can -= lazer.hasar;
                        if (modul.can <= 0) {
                            this.satinAlimKaydiniSil(modul);
                            this.modules.splice(j, 1);
                        }
                        vuruldu = true;
                        break;
                    }
                }
                if (vuruldu) {
                    this.lazerler.splice(i, 1);
                    continue;
                }

                if (mesafe(lazer, gemi) < this.oyuncuHitboxYaricap() + 6) {
                    if (this.absorbPlayerHit(lazer)) {
                        this.lazerler.splice(i, 1);
                        continue;
                    }
                    const hasar = lazer.hasar;
                    this.can -= hasar;
                    this.alinanHasar += hasar;
                    this.sonOyuncuHasarZamani = this.gecenSure;
                    this.lazerler.splice(i, 1);
                    continue;
                }

                if (lazer.x < -120 || lazer.x > this.haritaGenislik + 120 ||
                    lazer.y < -120 || lazer.y > this.haritaYukseklik + 120) {
                    this.lazerler.splice(i, 1);
                }
            }
        },

        guncelle(canvas, mermiler) {
            if (!this.oyunDevamEdiyor) return;

            this._gemi = gemi;
            this.kamera = this.kameraHesapla(canvas);
            if (!this.savasBasladi) {
                this.gecenSure = 0;
                this.savasOncesiPaneliniGuncelle();
                this.huduGuncelle();
                return;
            }
            this.gecenSure = (performance.now() - this.baslangicZamani) / 1000;
            const simdi = performance.now();
            if (this.yenidenDoluyor && simdi - this.yenidenDolumBaslangic >= this.yenidenDolumSuresi) {
                this.mermi = this.maxMermi;
                this.yenidenDoluyor = false;
            }
            this.sureliModulleriGuncelle();
            this.destekEtkileriniUygula();
            this.updateModules(canvas);

            this.spawnQueue = this.spawnQueue.filter(kayit => {
                if (simdi >= kayit.hedefZaman) {
                    this.dusmanEkle(canvas, kayit.tip, kayit.offset);
                    return false;
                }
                return true;
            });

            this.modules.forEach((modul) => {
                if (!modul.fireRate) return;
                modul.cooldown--;
                if (modul.cooldown <= 0) {
                    this.moduleAtesle(modul);
                    modul.cooldown = modul.fireRate;
                }
            });

            for (let i = this.moduleShots.length - 1; i >= 0; i--) {
                const mermi = this.moduleShots[i];
                mermi.x += mermi.hizX;
                mermi.y += mermi.hizY;
                if (this.mermiDusmanaCarpti(mermi, mermi.hasar) ||
                    mermi.x < 0 || mermi.x > this.haritaGenislik || mermi.y < 0 || mermi.y > this.haritaYukseklik) {
                    this.moduleShots.splice(i, 1);
                }
            }

            for (let i = this.dusmanlar.length - 1; i >= 0; i--) {
                const dusman = this.dusmanlar[i];
                this.dusmanGuncelle(canvas, dusman);

                if (this.handleModuleDamage(dusman, 0)) {
                    this.dusmanlar.splice(i, 1);
                    continue;
                }

                if (this.moduleCarpismasi(dusman)) {
                    this.dusmanlar.splice(i, 1);
                    continue;
                }

                if (mesafe(dusman, gemi) < dusman.boyut / 2 + this.oyuncuHitboxYaricap()) {
                    if (this.absorbPlayerHit(dusman)) {
                        this.dusmanlar.splice(i, 1);
                        continue;
                    }
                    const hasar = 18 + Number(dusman.tip) * 4;
                    this.can -= hasar;
                    this.alinanHasar += hasar;
                    this.sonOyuncuHasarZamani = this.gecenSure;
                    this.dusmanlar.splice(i, 1);
                }
            }

            this.lazerleriGuncelle(canvas);
            this.mermiCarpismalariniKontrolEt(mermiler);

            this.skorYazilari = this.skorYazilari.filter(yazi => simdi - yazi.baslangic < yazi.sure);

            if (performance.now() > this.comboBitis) {
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                this.combo = 1;
            }

            if (this.spawnQueue.length === 0 && this.dusmanlar.length === 0) {
                if (!this.endless && this.turn >= this.maxTurn) {
                    this.oyunKazanildi = true;
                    this.oyunBitti = true;
                    this.oyunDevamEdiyor = false;
                    this.ilerlemeKaydet();
                } else {
                    this.turn++;
                    this.dalgaBaslat(canvas);
                }
            }

            if (this.gecenSure - this.sonOyuncuHasarZamani > 3 && this.can < this.maxCan) {
                this.can = Math.min(this.maxCan, this.can + 2 / 60);
            }

            if (this.can <= 0) {
                this.can = 0;
                this.oyunBitti = true;
                this.oyunDevamEdiyor = false;
                if (this.endless) this.kronSkorunuKaydet();
            }

            this.huduGuncelle();
        },

        canBariCiz(ctx, x, y, genislik, yukseklik, can, maxCan) {
            ctx.fillStyle = 'rgba(3, 8, 18, 0.82)';
            ctx.fillRect(x, y, genislik, yukseklik);
            ctx.fillStyle = '#55efc4';
            ctx.fillRect(x, y, Math.max(0, can / maxCan) * genislik, yukseklik);
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.strokeRect(x, y, genislik, yukseklik);
        },

        ciz(ctx, canvas) {
            this.kamera = this.kameraHesapla(canvas);

            ctx.save();
            ctx.translate(-this.kamera.x, -this.kamera.y);

            ctx.fillStyle = this.haritaRengi;
            ctx.fillRect(0, 0, this.haritaGenislik, this.haritaYukseklik);
            this.haritaIzgarasiCiz(ctx);

            this.shieldPickups.forEach((pickup) => {
                const pulse = Math.sin((performance.now() - pickup.dogum) / 230 + pickup.pulse) * 0.18 + 0.82;
                ctx.save();
                ctx.translate(pickup.x, pickup.y);
                ctx.beginPath();
                ctx.arc(0, 0, pickup.yaricap * 1.75 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(90, 224, 255, 0.12)';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, 0, pickup.yaricap, 0, Math.PI * 2);
                ctx.fillStyle = '#5ae0ff';
                ctx.shadowBlur = 22;
                ctx.shadowColor = '#5ae0ff';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.rotate(-Math.PI / 2);
                if (gemiGorseli.complete && gemiGorseli.naturalWidth > 0) {
                    ctx.globalAlpha = 0.9;
                    ctx.drawImage(gemiGorseli, -11, -11, 22, 22);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(12, 0);
                    ctx.lineTo(-8, -8);
                    ctx.lineTo(-4, 0);
                    ctx.lineTo(-8, 8);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(3, 8, 18, 0.72)';
                    ctx.fill();
                }
                ctx.restore();
            });

            this.shieldModules.forEach((modul, index) => {
                ctx.save();
                ctx.translate(modul.x, modul.y);
                ctx.rotate(gemi.aci + Math.PI / 2);
                ctx.beginPath();
                ctx.arc(0, 0, modul.yaricap + 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(90, 224, 255, 0.10)';
                ctx.fill();
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#5ae0ff';
                if (gemiGorseli.complete && gemiGorseli.naturalWidth > 0) {
                    ctx.globalAlpha = 0.92;
                    ctx.drawImage(gemiGorseli, -12, -12, 24, 24);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(14, 0);
                    ctx.lineTo(-10, -9);
                    ctx.lineTo(-5, 0);
                    ctx.lineTo(-10, 9);
                    ctx.closePath();
                    ctx.fillStyle = '#5ae0ff';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            });

            this.skorYazilari.forEach(yazi => {
                const yas = performance.now() - yazi.baslangic;
                const oran = clamp(yas / yazi.sure, 0, 1);
                ctx.save();
                ctx.translate(yazi.x, yazi.y - oran * 34);
                ctx.globalAlpha = 1 - oran;
                ctx.font = "900 24px 'Rajdhani', sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(3, 8, 18, 0.85)';
                ctx.fillStyle = '#55efc4';
                ctx.shadowBlur = 14;
                ctx.shadowColor = '#55efc4';
                ctx.strokeText(`+${yazi.deger} Kron`, 0, 0);
                ctx.fillText(`+${yazi.deger} Kron`, 0, 0);
                ctx.font = "700 15px 'Rajdhani', sans-serif";
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`+${yazi.skor} Skor`, 0, 19);
                ctx.restore();
            });

            this.modules.forEach((modul) => {
                if (!modul.radius) return;
                ctx.save();
                ctx.beginPath();
                ctx.arc(modul.x, modul.y, modul.radius, 0, Math.PI * 2);
                ctx.fillStyle = modul.renk;
                ctx.globalAlpha = this.oyuncuAlaninda(modul) ? 0.13 : 0.07;
                ctx.fill();
                ctx.globalAlpha = 0.45;
                ctx.strokeStyle = modul.renk;
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 8]);
                ctx.stroke();
                ctx.restore();
            });

            this.modules.forEach((modul) => {
                ctx.save();
                ctx.translate(modul.x, modul.y);
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = modul.renk;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 14;
                ctx.shadowColor = modul.renk;
                ctx.fillRect(-13, -13, 26, 26);
                ctx.strokeRect(-13, -13, 26, 26);
                ctx.rotate(-Math.PI / 4);
                ctx.fillStyle = 'rgba(3,8,18,0.78)';
                ctx.fillRect(-6, -6, 12, 12);
                ctx.restore();

                this.canBariCiz(ctx, modul.x - 18, modul.y - 32, 36, 5, modul.can, modul.maxCan);
                const sureKaydi = this.aktifSatinAlimlar.find(kayit => kayit.modul === modul);
                if (sureKaydi) {
                    const kalanMs = Math.max(0, sureKaydi.bitis - performance.now());
                    const kalanSn = Math.ceil(kalanMs / 1000);
                    const oran = clamp(kalanMs / (sureKaydi.sureMs || 1), 0, 1);
                    ctx.save();
                    ctx.fillStyle = 'rgba(3, 8, 18, 0.82)';
                    ctx.fillRect(modul.x - 20, modul.y + 25, 40, 12);
                    ctx.fillStyle = modul.renk;
                    ctx.fillRect(modul.x - 18, modul.y + 34, 36 * oran, 3);
                    ctx.font = "700 10px 'Orbitron', sans-serif";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`${kalanSn}s`, modul.x, modul.y + 31);
                    ctx.restore();
                }
            });

            if (this.suruklenenModul) {
                const suruklemeRengi = this.suruklenenModul.gecerli ? this.suruklenenModul.renk : '#ff4d6d';
                if (this.suruklenenModul.radius) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.suruklenenModul.x, this.suruklenenModul.y, this.suruklenenModul.radius, 0, Math.PI * 2);
                    ctx.fillStyle = suruklemeRengi;
                    ctx.globalAlpha = this.suruklenenModul.gecerli ? 0.08 : 0.13;
                    ctx.fill();
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = suruklemeRengi;
                    ctx.setLineDash([8, 7]);
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.save();
                ctx.translate(this.suruklenenModul.x, this.suruklenenModul.y);
                ctx.rotate(Math.PI / 4);
                ctx.globalAlpha = 0.68;
                ctx.fillStyle = suruklemeRengi;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 5]);
                ctx.shadowBlur = 20;
                ctx.shadowColor = suruklemeRengi;
                ctx.fillRect(-15, -15, 30, 30);
                ctx.strokeRect(-15, -15, 30, 30);
                ctx.restore();
            }

            this.moduleShots.forEach(mermi => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(mermi.x, mermi.y, mermi.yaricap, 0, Math.PI * 2);
                ctx.fillStyle = mermi.renk;
                ctx.shadowBlur = 16;
                ctx.shadowColor = mermi.renk;
                ctx.fill();
                ctx.restore();
            });

            this.parcaciklariCiz(ctx);
            drawEnemyLasers(ctx, this.lazerler);
            drawSquareEnemies(ctx, this.dusmanlar, this.canBariCiz.bind(this));

            ctx.save();
            ctx.strokeStyle = this.renk;
            ctx.globalAlpha = this.shieldModules.length > 0 ? 0.4 : 0.22;
            ctx.lineWidth = 2;
            ctx.setLineDash(this.shieldModules.length > 0 ? [8, 7] : []);
            ctx.beginPath();
            ctx.arc(gemi.x, gemi.y, this.oyuncuHitboxYaricap(), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            ctx.restore();
            this.ekranSinirlariniCiz(ctx, canvas);
        },

        ekranSinirlariniCiz(ctx, canvas) {
            const hud = document.getElementById('oyun-hud');
            if (!hud || hud.style.display === 'none') return;

            const ustBar = hud.querySelector('.hud-top-strip')?.getBoundingClientRect();
            const altBar = hud.querySelector('.hud-bottom-bar')?.getBoundingClientRect();
            const yanMenu = hud.querySelector('.hud-sidebar')?.getBoundingClientRect();
            const sol = yanMenu ? yanMenu.right + 8 : 8;
            const ust = ustBar ? ustBar.bottom + 8 : 8;
            const sag = canvas.width - 8;
            const alt = altBar ? altBar.top - 8 : canvas.height - 8;

            if (sag <= sol || alt <= ust) return;

            // Turkuaz çizgi, oyuncuya HUD dışındaki oynanabilir ekran sınırını gösterir.
            ctx.save();
            ctx.strokeStyle = 'rgba(85, 239, 196, 0.34)';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 10]);
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#55efc4';
            ctx.strokeRect(sol, ust, sag - sol, alt - ust);
            ctx.restore();
        },

        parcaciklariCiz(ctx) {
            const simdi = performance.now();
            this.particles = this.particles.filter(p => simdi - p.baslangic < p.sure);
            this.particles.forEach(p => {
                const oran = (simdi - p.baslangic) / p.sure;
                p.x += p.hizX;
                p.y += p.hizY;
                p.hizX *= 0.94;
                p.hizY *= 0.94;
                ctx.save();
                ctx.globalAlpha = (1 - oran) * 0.88;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * (1 - oran * 0.6), 0, Math.PI * 2);
                ctx.fillStyle = p.renk;
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.renk;
                ctx.fill();
                ctx.restore();
            });
        },

        haritaIzgarasiCiz(ctx) {
            ctx.save();
            ctx.strokeStyle = this.gridRengi;
            ctx.lineWidth = 1;
            const grid = 90;
            for (let x = 0; x <= this.haritaGenislik; x += grid) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.haritaYukseklik);
                ctx.stroke();
            }
            for (let y = 0; y <= this.haritaYukseklik; y += grid) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.haritaGenislik, y);
                ctx.stroke();
            }
            ctx.strokeStyle = this.renk;
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.9;
            ctx.strokeRect(0, 0, this.haritaGenislik, this.haritaYukseklik);
            ctx.restore();
        },

        kronSkorunuKaydet() {
            if (!this.endless || this.enIyiSkorGuncellendi) return;
            this.enIyiSkorGuncellendi = true;
            const skor = Math.floor(this.gecenSure);
            const oncekiSkor = Number(localStorage.getItem('spacewarKronBestTime') || 0);
            if (skor > oncekiSkor) localStorage.setItem('spacewarKronBestTime', String(skor));
            window.dispatchEvent(new CustomEvent('kron-skor-guncellendi'));
        },

        ilerlemeKaydet() {
            if (this.endless || this.ilerlemeKaydedildi) return;
            this.ilerlemeKaydedildi = true;
            const siradaki = this.isim === 'Astra' ? 2 : this.isim === 'Vega' ? 3 : 3;
            const mevcut = Number(localStorage.getItem('spacewarUnlockedStage') || 1);
            if (siradaki > mevcut) {
                localStorage.setItem('spacewarUnlockedStage', String(siradaki));
                window.dispatchEvent(new CustomEvent('spacewar-ilerleme-guncellendi'));
            }
        },

        oyunSonuEkraniCiz(ctx, canvas) {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const kazandi = this.oyunKazanildi;
            const renkAna = kazandi ? '#55efc4' : '#ff4d6d';
            const sure = sureyiYaz(this.gecenSure);

            // Arka plan overlay
            ctx.save();
            ctx.fillStyle = 'rgba(4, 9, 20, 0.88)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Kart boyutları
            const kW = Math.min(560, canvas.width - 48);
            const kH = 370;
            const kX = cx - kW / 2;
            const kY = cy - kH / 2;
            const r = 14;

            // Kart arka planı (glassmorphism)
            ctx.beginPath();
            ctx.moveTo(kX + r, kY);
            ctx.lineTo(kX + kW - r, kY);
            ctx.arcTo(kX + kW, kY, kX + kW, kY + r, r);
            ctx.lineTo(kX + kW, kY + kH - r);
            ctx.arcTo(kX + kW, kY + kH, kX + kW - r, kY + kH, r);
            ctx.lineTo(kX + r, kY + kH);
            ctx.arcTo(kX, kY + kH, kX, kY + kH - r, r);
            ctx.lineTo(kX, kY + r);
            ctx.arcTo(kX, kY, kX + r, kY, r);
            ctx.closePath();
            ctx.fillStyle = 'rgba(7, 16, 30, 0.92)';
            ctx.fill();
            ctx.strokeStyle = `${renkAna}66`;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 30;
            ctx.shadowColor = renkAna;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Başlık
            ctx.textAlign = 'center';
            ctx.font = "900 38px 'Orbitron', sans-serif";
            ctx.fillStyle = renkAna;
            ctx.shadowBlur = 20;
            ctx.shadowColor = renkAna;
            ctx.fillText(kazandi ? 'DALGALAR TEMİZLENDİ' : 'GEMİ YOK OLDU', cx, kY + 52);
            ctx.shadowBlur = 0;

            // Ayıraç çizgi
            ctx.strokeStyle = `${renkAna}44`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(kX + 24, kY + 70);
            ctx.lineTo(kX + kW - 24, kY + 70);
            ctx.stroke();

            // İstatistik satırları
            const satirlar = [
                { etiket: 'TOPLAM SÜRE',     deger: sure,                               renk: '#41e0ff' },
                { etiket: 'YOK EDİLEN',      deger: `${this.killCount} düşman`,         renk: '#ffffff' },
                { etiket: 'EN YÜKSEK KOMBO', deger: `x${this.maxCombo}`,               renk: this.maxCombo >= 7 ? '#ff4d6d' : this.maxCombo >= 4 ? '#ff8c00' : '#f9ca24' },
                { etiket: 'TOPLAM SKOR',     deger: this.skor.toLocaleString(),         renk: '#ffffff' },
                { etiket: 'KAZANILAN KRON',  deger: `${this.kron} Kron`,                renk: '#f9ca24' },
                { etiket: 'ALINAN HASAR',    deger: `${Math.round(this.alinanHasar)}`,  renk: '#ff4d6d' },
            ];

            const satirBasY = kY + 100;
            const satirAraligi = 38;
            ctx.font = "500 15px 'Orbitron', sans-serif";

            satirlar.forEach((satir, i) => {
                const satY = satirBasY + i * satirAraligi;
                // Etiket
                ctx.textAlign = 'left';
                ctx.fillStyle = 'rgba(160,180,210,0.65)';
                ctx.fillText(satir.etiket, kX + 36, satY);
                // Değer
                ctx.textAlign = 'right';
                ctx.fillStyle = satir.renk;
                ctx.shadowBlur = satir.renk !== '#ffffff' ? 10 : 0;
                ctx.shadowColor = satir.renk;
                ctx.fillText(satir.deger, kX + kW - 36, satY);
                ctx.shadowBlur = 0;
                // Alt çizgi
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(kX + 24, satY + 10);
                ctx.lineTo(kX + kW - 24, satY + 10);
                ctx.stroke();
            });

            // Alt ipucu
            ctx.textAlign = 'center';
            ctx.font = "500 12px 'Orbitron', sans-serif";
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.fillText('[ ESC / ENTER ]  →  Ana Menüye Dön', cx, kY + kH - 18);

            ctx.restore();
        }
    };
}
