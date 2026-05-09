import { dusmanOlustur, dusmanTipiSec } from './enemy.js';
import { gemi } from './player.js';
import { drawEnemyLasers, drawSquareEnemies } from './sceneVisuals.js';

const MODULES = [
    { id: 'blaster', ad: 'Blaster', renk: '#5ae0ff', fireRate: 58, damage: 24, speed: 6.4, fiyat: 60, sure: 14 },
    { id: 'rapid', ad: 'Seri', renk: '#55efc4', fireRate: 42, damage: 17, speed: 6.8, fiyat: 90, sure: 13 },
    { id: 'chain', ad: 'Zincir', renk: '#e056fd', fireRate: 68, damage: 22, speed: 6.1, chain: true, fiyat: 130, sure: 12 },
    { id: 'armor', ad: 'Zirh', renk: '#f39c12', fireRate: 84, damage: 34, speed: 5.8, armor: true, fiyat: 160, sure: 15 },
    { id: 'pulse', ad: 'Nabiz', renk: '#ff6b6b', fireRate: 98, damage: 28, speed: 5.6, splash: true, fiyat: 210, sure: 11 }
];

function sureyiYaz(sure) {
    const dakika = Math.floor(sure / 60).toString().padStart(2, '0');
    const saniye = Math.floor(sure % 60).toString().padStart(2, '0');
    return `${dakika}:${saniye}`;
}

function mesafe(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function daireCarpisti(a, b, ekstra = 0) {
    return mesafe(a, b) < (a.boyut || a.yaricap || 0) / 2 + (b.boyut || b.yaricap || 0) / 2 + ekstra;
}

function clamp(deger, min, max) {
    return Math.max(min, Math.min(max, deger));
}

function randomWorldEdgeSpawn(bolum, canvas, margin = 90) {
    const kamera = bolum.kamera || { x: 0, y: 0 };
    const edge = Math.floor(Math.random() * 4);
    const minX = Math.max(0, kamera.x - margin);
    const maxX = Math.min(bolum.haritaGenislik, kamera.x + canvas.width + margin);
    const minY = Math.max(0, kamera.y - margin);
    const maxY = Math.min(bolum.haritaYukseklik, kamera.y + canvas.height + margin);

    if (edge === 0) return { x: minX + Math.random() * (maxX - minX), y: minY };
    if (edge === 1) return { x: maxX, y: minY + Math.random() * (maxY - minY) };
    if (edge === 2) return { x: minX + Math.random() * (maxX - minX), y: maxY };
    return { x: minX, y: minY + Math.random() * (maxY - minY) };
}

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
        para: 0,
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
        skorYazilari: [],
        modules: [],
        spawnQueue: [],
        aktifSatinAlimlar: [],
        suruklenenModul: null,
        dalgaToplamDusman: 0,
        killCount: 0,
        combo: 1,
        comboBitis: 0,
        sonOyuncuHasarZamani: -10,
        enIyiSkorGuncellendi: false,
        dusmanDagilimi: config.dusmanDagilimi,
        acikModulSayisi: config.acikModulSayisi,
        maxModuleSayisi: config.maxModuleSayisi,
        endless: Boolean(config.endless),
        moduleDropEvery: config.moduleDropEvery || 4,
        maxAktifSatinAlim: 2,
        yenidenDolumBaslangic: 0,
        yenidenDolumSuresi: 1600,
        haritaGenislik: 2400,
        haritaYukseklik: 1600,
        kamera: { x: 0, y: 0 },
        haritaRengi: config.haritaRengi || 'rgba(8, 14, 28, 0.96)',
        gridRengi: config.gridRengi || 'rgba(90, 224, 255, 0.12)',

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
            this.para = 0;
            this.mermi = this.maxMermi;
            this.turn = 0;
            this.gecenSure = 0;
            this.oyunDevamEdiyor = true;
            this.oyunBitti = false;
            this.oyunKazanildi = false;
            this.yenidenDoluyor = false;
            this.dusmanlar = [];
            this.lazerler = [];
            this.moduleShots = [];
            this.pickups = [];
            this.skorYazilari = [];
            this.modules = [];
            this.spawnQueue = [];
            this.aktifSatinAlimlar = [];
            this.suruklenenModul = null;
            this.dalgaToplamDusman = 0;
            this.killCount = 0;
            this.combo = 1;
            this.comboBitis = 0;
            this.sonOyuncuHasarZamani = -10;
            this.enIyiSkorGuncellendi = false;
            this.baslangicZamani = performance.now();

            this.modulEkle('blaster', false);
            if (config.baslangicModulleri) {
                config.baslangicModulleri.forEach(tip => this.modulEkle(tip, false));
            }

            this.dalgaBaslat(canvas);
            this.huduGuncelle();
        },

        durdur() {
            gemi.genislik = 60;
            gemi.uzunluk = 60;
            gemi.hiz = 2;
            this.oyunDevamEdiyor = false;
            this.oyunBitti = false;
            this.dusmanlar = [];
            this.lazerler = [];
            this.moduleShots = [];
            this.pickups = [];
            this.skorYazilari = [];
            this.spawnQueue = [];
            this.aktifSatinAlimlar = [];
            this.suruklenenModul = null;
            this.huduGuncelle();
        },

        kameraHesapla(canvas) {
            return {
                x: clamp(gemi.x - canvas.width / 2, 0, Math.max(0, this.haritaGenislik - canvas.width)),
                y: clamp(gemi.y - canvas.height / 2, 0, Math.max(0, this.haritaYukseklik - canvas.height))
            };
        },

        dalgaBaslat(canvas) {
            this.turn++;
            const simdi = performance.now();
            const adet = Math.round((config.dalgaBaslangic || 6) + this.turn * (config.dalgaArtis || 2));
            this.spawnQueue = [];

            for (let i = 0; i < adet; i++) {
                this.spawnQueue.push({
                    hedefZaman: simdi + i * (config.spawnGecikmesi || 360),
                    tip: dusmanTipiSec(this.dusmanDagilimi),
                    offset: i
                });
            }

            if (this.endless && this.turn > 1) {
                this.spawnQueue.push({
                    hedefZaman: simdi + adet * 260,
                    tip: dusmanTipiSec([{ tip: '4', agirlik: 60 }, { tip: '5', agirlik: 40 }]),
                    offset: adet
                });
            }

            this.dalgaToplamDusman = this.spawnQueue.length;
            this.huduGuncelle();
        },

        dusmanEkle(canvas, tip, offset = 0) {
            const spawn = randomWorldEdgeSpawn(this, canvas, 80 + offset * 6);
            const dusman = dusmanOlustur(tip, spawn.x, spawn.y, 0);
            const zorluk = Math.min(1.4, this.turn * (config.zorlukCarpani || 0.055));
            dusman.hiz += zorluk;
            dusman.can = Math.round(dusman.can * (1 + this.turn * 0.08));
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
                this.para += 25;
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
                cooldown: Math.floor(Math.random() * secilen.fireRate),
                sureli,
                slotIndex
            };
            this.modules.push(yeniModul);

            if (secilen.armor) {
                this.can = Math.min(this.maxCan + 40, this.can + 20);
            }

            return yeniModul;
        },

        atesEtmeyeIzinVar() {
            if (!this.oyunDevamEdiyor || this.oyunBitti || this.yenidenDoluyor) return false;
            if (this.mermi <= 0) {
                this.yenidenDoldur();
                return false;
            }

            this.mermi--;
            if (this.mermi <= 0) this.yenidenDoldur();
            this.huduGuncelle();
            return true;
        },

        yenidenDoldur() {
            if (this.yenidenDoluyor || this.mermi >= this.maxMermi) return;
            this.yenidenDoluyor = true;
            this.yenidenDolumBaslangic = performance.now();
            this.huduGuncelle();
        },

        modulSatinal(index, konum = null) {
            if (!this.oyunDevamEdiyor || this.oyunBitti) return false;
            if (index >= this.acikModulSayisi) return false;

            const modul = MODULES[index];
            if (!modul || this.para < modul.fiyat) return false;

            const simdi = performance.now();
            const aktif = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
            this.para -= modul.fiyat;

            if (aktif) {
                aktif.bitis += modul.sure * 1000;
                if (konum) {
                    aktif.modul.x = konum.x;
                    aktif.modul.y = konum.y;
                }
                this.huduGuncelle();
                return true;
            }

            if (this.aktifSatinAlimlar.length >= this.maxAktifSatinAlim) {
                this.para += modul.fiyat;
                this.huduGuncelle();
                return false;
            }

            const eklenen = this.modulEkle(modul.id, true, index);
            if (!eklenen) {
                this.para += modul.fiyat;
                return false;
            }

            if (konum) {
                eklenen.x = konum.x;
                eklenen.y = konum.y;
            }

            this.aktifSatinAlimlar.push({
                index,
                modul: eklenen,
                bitis: simdi + modul.sure * 1000
            });
            this.huduGuncelle();
            return true;
        },

        modulSatinAlinabilirMi(index) {
            if (!this.oyunDevamEdiyor || this.oyunBitti) return false;
            if (index >= this.acikModulSayisi) return false;
            const modul = MODULES[index];
            if (!modul || this.para < modul.fiyat) return false;
            const aktif = this.aktifSatinAlimlar.find(kayit => kayit.index === index);
            if (!aktif && this.modules.length >= this.maxModuleSayisi) return false;
            return Boolean(aktif) || this.aktifSatinAlimlar.length < this.maxAktifSatinAlim;
        },

        ekranKonumunuDunya(canvas, clientX, clientY) {
            const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
            const oranX = canvas.width / (rect.width || canvas.width);
            const oranY = canvas.height / (rect.height || canvas.height);
            return {
                x: clamp((clientX - rect.left) * oranX + this.kamera.x, 34, this.haritaGenislik - 34),
                y: clamp((clientY - rect.top) * oranY + this.kamera.y, 34, this.haritaYukseklik - 34)
            };
        },

        modulSuruklemeBaslat(index, canvas, clientX, clientY) {
            if (!this.modulSatinAlinabilirMi(index)) return false;
            const modul = MODULES[index];
            const konum = this.ekranKonumunuDunya(canvas, clientX, clientY);
            this.suruklenenModul = {
                index,
                ad: modul.ad,
                renk: modul.renk,
                x: konum.x,
                y: konum.y
            };
            return true;
        },

        modulSuruklemeGuncelle(canvas, clientX, clientY) {
            if (!this.suruklenenModul) return false;
            const konum = this.ekranKonumunuDunya(canvas, clientX, clientY);
            this.suruklenenModul.x = konum.x;
            this.suruklenenModul.y = konum.y;
            return true;
        },

        modulSuruklemeBitir(canvas, clientX, clientY) {
            if (!this.suruklenenModul) return false;
            this.modulSuruklemeGuncelle(canvas, clientX, clientY);
            const { index, x, y } = this.suruklenenModul;
            this.suruklenenModul = null;
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
            const hudPara = document.getElementById('hud-para');
            const hudSure = document.getElementById('hud-sure');
            const hudTurn = document.getElementById('hud-turn');
            const hudDusman = document.getElementById('hud-dusman');
            const hudMaxTurn = document.getElementById('hud-max-turn');
            const hudDusmanBar = document.getElementById('hud-dusman-bar');
            const hudDusmanKalan = document.getElementById('hud-dusman-kalan');

            const kalanDusman = this.dusmanlar.length + this.spawnQueue.length;
            const dalgaToplam = Math.max(1, this.dalgaToplamDusman || kalanDusman || 1, kalanDusman);
            const dusmanOrani = clamp(kalanDusman / dalgaToplam, 0, 1);
            const kalanDolum = Math.max(0, this.yenidenDolumSuresi - (performance.now() - this.yenidenDolumBaslangic));
            if (hudCan) hudCan.textContent = Math.max(0, Math.ceil(this.can));
            if (hudOyuncuCan) hudOyuncuCan.textContent = `${this.modules.length}/${this.maxModuleSayisi}`;
            if (hudMermi) hudMermi.textContent = this.yenidenDoluyor
                ? `Doluyor ${Math.ceil(kalanDolum / 1000)}sn`
                : `${this.mermi}/${this.maxMermi}`;
            if (hudPara) hudPara.textContent = this.para;
            if (hudSure) hudSure.textContent = sureyiYaz(this.gecenSure);
            if (hudTurn) hudTurn.textContent = this.turn;
            if (hudMaxTurn) hudMaxTurn.textContent = this.endless ? '∞' : this.maxTurn;
            if (hudDusman) hudDusman.textContent = kalanDusman;
            if (hudDusmanKalan) hudDusmanKalan.textContent = `${kalanDusman}/${dalgaToplam}`;
            if (hudDusmanBar) hudDusmanBar.style.width = `${dusmanOrani * 100}%`;
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
                slot.classList.toggle('alinabilir', !kilitli && this.para >= modul.fiyat);
                slot.title = kilitli
                    ? `${modul.ad}: Bu modul bu gezegende kapali.`
                    : `${modul.ad} | ${modul.fiyat} skor | ${modul.sure} sn`;

                slot.innerHTML = `
                    <span class="taret-numara">${index + 1}</span>
                    <span class="modul-ad">${modul.ad}</span>
                    <span class="modul-fiyat">${kilitli ? 'Kapali' : modul.fiyat}</span>
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
                hasar: modul.damage,
                chain: modul.chain,
                splash: modul.splash
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
                    if (mermi.splash) {
                        this.dusmanlar.forEach(yan => {
                            if (yan !== dusman && mesafe(yan, dusman) < 90) yan.can -= 12;
                        });
                    }
                    if (mermi.chain) {
                        let zincir = null;
                        let zincirMesafe = 120;
                        this.dusmanlar.forEach(yan => {
                            if (yan === dusman) return;
                            const uzaklik = mesafe(yan, dusman);
                            if (uzaklik < zincirMesafe) {
                                zincirMesafe = uzaklik;
                                zincir = yan;
                            }
                        });
                        if (zincir) zincir.can -= 14;
                    }
                    if (dusman.can <= 0) this.dusmanYokEt(j, dusman);
                    for (let k = this.dusmanlar.length - 1; k >= 0; k--) {
                        if (this.dusmanlar[k].can <= 0) this.dusmanYokEt(k, this.dusmanlar[k]);
                    }
                    return true;
                }
            }
            return false;
        },

        dusmanOdulu(dusman) {
            const tip = Number(dusman.tip) || 1;
            return 100 + (tip - 1) * 50;
        },

        dusmanYokEt(index, dusman) {
            this.dusmanlar.splice(index, 1);
            this.killCount++;
            if (performance.now() < this.comboBitis) this.combo = Math.min(9, this.combo + 1);
            else this.combo = 1;
            this.comboBitis = performance.now() + 2500;
            const odul = this.dusmanOdulu(dusman) * this.combo;
            this.para += odul;
            this.skorYazilari.push({
                x: dusman.x,
                y: dusman.y - dusman.boyut / 2,
                deger: odul,
                baslangic: performance.now(),
                sure: 900
            });
        },

        dusmanGuncelle(canvas, dusman) {
            const dx = gemi.x - dusman.x;
            const dy = gemi.y - dusman.y;
            const uzaklik = Math.sqrt(dx * dx + dy * dy) || 1;
            dusman.x += (dx / uzaklik) * dusman.hiz;
            dusman.y += (dy / uzaklik) * dusman.hiz;
            dusman.update(canvas, this);
        },

        moduleCarpismasi(dusman) {
            for (let i = this.modules.length - 1; i >= 0; i--) {
                const pos = { x: this.modules[i].x, y: this.modules[i].y };
                if (mesafe(dusman, { ...pos, boyut: 24 }) < dusman.boyut / 2 + 12) {
                    this.satinAlimKaydiniSil(this.modules[i]);
                    this.modules.splice(i, 1);
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

                let vuruldu = false;
                for (let j = this.modules.length - 1; j >= 0; j--) {
                    const pos = { x: this.modules[j].x, y: this.modules[j].y };
                    if (mesafe(lazer, { ...pos, boyut: 22 }) < 15) {
                        this.satinAlimKaydiniSil(this.modules[j]);
                        this.modules.splice(j, 1);
                        vuruldu = true;
                        break;
                    }
                }
                if (vuruldu) {
                    this.lazerler.splice(i, 1);
                    continue;
                }

                if (mesafe(lazer, { x: gemi.x, y: gemi.y, boyut: gemi.genislik }) < 26) {
                    this.can -= lazer.hasar;
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
            this.gecenSure = (performance.now() - this.baslangicZamani) / 1000;
            const simdi = performance.now();
            if (this.yenidenDoluyor && simdi - this.yenidenDolumBaslangic >= this.yenidenDolumSuresi) {
                this.mermi = this.maxMermi;
                this.yenidenDoluyor = false;
            }
            this.sureliModulleriGuncelle();

            this.spawnQueue = this.spawnQueue.filter(kayit => {
                if (simdi >= kayit.hedefZaman) {
                    this.dusmanEkle(canvas, kayit.tip, kayit.offset);
                    return false;
                }
                return true;
            });

            this.modules.forEach((modul) => {
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

                if (this.moduleCarpismasi(dusman)) {
                    this.dusmanlar.splice(i, 1);
                    continue;
                }

                if (daireCarpisti(dusman, { x: gemi.x, y: gemi.y, boyut: gemi.genislik }, 2)) {
                    this.can -= 18 + Number(dusman.tip) * 4;
                    this.sonOyuncuHasarZamani = this.gecenSure;
                    this.dusmanlar.splice(i, 1);
                }
            }

            this.lazerleriGuncelle(canvas);
            this.mermiCarpismalariniKontrolEt(mermiler);

            this.skorYazilari = this.skorYazilari.filter(yazi => simdi - yazi.baslangic < yazi.sure);

            if (performance.now() > this.comboBitis) this.combo = 1;

            if (this.spawnQueue.length === 0 && this.dusmanlar.length === 0) {
                if (!this.endless && this.turn >= this.maxTurn) {
                    this.oyunKazanildi = true;
                    this.oyunBitti = true;
                    this.oyunDevamEdiyor = false;
                } else {
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
                ctx.strokeText(`+${yazi.deger}`, 0, 0);
                ctx.fillText(`+${yazi.deger}`, 0, 0);
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
            });

            if (this.suruklenenModul) {
                ctx.save();
                ctx.translate(this.suruklenenModul.x, this.suruklenenModul.y);
                ctx.rotate(Math.PI / 4);
                ctx.globalAlpha = 0.68;
                ctx.fillStyle = this.suruklenenModul.renk;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 5]);
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.suruklenenModul.renk;
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

            drawEnemyLasers(ctx, this.lazerler);
            drawSquareEnemies(ctx, this.dusmanlar, this.canBariCiz.bind(this));

            ctx.save();
            ctx.strokeStyle = this.renk;
            ctx.globalAlpha = 0.28;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gemi.x, gemi.y, 108, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            ctx.restore();
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

        oyunSonuEkraniCiz(ctx, canvas) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.textAlign = 'center';
            ctx.font = "700 56px 'Orbitron', sans-serif";
            ctx.fillStyle = this.oyunKazanildi ? '#55efc4' : '#ff4747';
            ctx.shadowBlur = 28;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillText(this.oyunKazanildi ? 'DALGALAR TEMIZLENDI' : 'CEKIRDEK PARCALANDI', canvas.width / 2, canvas.height / 2 - 28);
            ctx.font = "700 24px 'Rajdhani', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fillText(`Skor: ${this.para} | Sure: ${sureyiYaz(this.gecenSure)} | Modul: ${this.modules.length}`, canvas.width / 2, canvas.height / 2 + 24);
            ctx.fillText('Menuye donerek baska gezegende daha zor dalgalari deneyebilirsin', canvas.width / 2, canvas.height / 2 + 62);
            ctx.restore();
        }
    };
}
