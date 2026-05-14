import { astraBolumu } from './levels/astra.js';
import { noraBolumu } from './levels/nora.js';
import { vegaBolumu } from './levels/vega.js';
import { kronBolumu } from './levels/kron.js';
import { NormalEnemy, HighEnemy, QueenEnemy } from './core/enemy.js';
import { muzikBaslangic, muzikSakin, muzikAksiyon, muzikDurdurTum, muzikCal } from './core/audio.js';
import { mermileriTemizle } from './core/projectile.js';
export let aktifBolum = null;

const taretBilgileri = [
    {
        ad: 'Yavaşlatıcı Taret',
        gorev: 'Düşman hızını azaltır.',
        aciklama: 'Menziline giren düşmanları kısa süreliğine yavaşlatır. Kalabalık dalgalara karşı stratejik savunma sağlar.'
    },
    {
        ad: 'Hızlı Atış Tareti',
        gorev: 'Yüksek atış hızı.',
        aciklama: 'Düşük hasarlı ama seri atış yapan savunma taretidir. Hızlı düşmanlara karşı etkilidir.'
    },
    {
        ad: 'Kalkan Alanı Tareti',
        gorev: 'Can veya savunma desteği sağlar.',
        aciklama: 'Belirli bir alan içinde oyuncunun savunma gücünü artırır. Etki alanı canvas üzerinde gösterilir.'
    },
    {
        ad: 'Hız Alanı Tareti',
        gorev: 'Hız desteği sağlar.',
        aciklama: 'Belirli bir alanda oyuncunun veya savunma sisteminin hareket ve tepki hızını artırır.'
    },
    {
        ad: 'Kron Enerji Tareti',
        gorev: 'Süreli özel güç.',
        aciklama: 'Kritik anlarda kısa süreliğine sınırsız mermi veya enerji desteği sağlar.'
    }
];

/**
 * Verilen saniye cinsinden süreyi MM:SS (Dakika:Saniye) formatında bir metne dönüştürür.
 * Nerede kullanılır: Kron Eğlence Modu'nda en iyi skoru gösterirken (kronSkorunuGuncelle içinde).
 * Neden kullanılır: Süreyi oyuncuya daha okunabilir ve standart bir formatta sunmak için.
 */
function sureyiYazSaniye(sure) {
    const dakika = Math.floor(sure / 60).toString().padStart(2, '0');
    const saniye = Math.floor(sure % 60).toString().padStart(2, '0');
    return `${dakika}:${saniye}`;
}

/**
 * Yerel depolamada (localStorage) kayıtlı en iyi Kron mod süresini okuyarak ekrana yazdırır.
 * Nerede kullanılır: Menü yüklendiğinde ve oyun sonunda skor güncellenirken (bolumleriBaslat içinde vs.).
 * Neden kullanılır: Oyuncunun Kron modundaki rekorunu kalıcı olarak tutmak ve menüde sergilemek için.
 */
function kronSkorunuGuncelle() {
    const skorAlani = document.getElementById('kron-en-iyi-skor');
    if (!skorAlani) return;

    const skor = Number(localStorage.getItem('spacewarKronBestTime') || 0);
    skorAlani.textContent = `En iyi: ${sureyiYazSaniye(skor)}`;
}

/**
 * Oyuncunun oynamakta olduğu bölüme göre açık ve kilitli taret slotlarını günceller.
 * Nerede kullanılır: Bir bölüm (gezegen) başlatılırken (bolumuBaslat fonksiyonunda).
 * Neden kullanılır: Zorluk seviyesine göre oyuncuya izin verilen taret sayısını sınırlamak için.
 */
function taretleriGuncelle(acikSayisi) {
    const slotlar = document.querySelectorAll('.taret-slot');
    slotlar.forEach((slot, index) => {
        const bilgi = taretBilgileri[index];
        slot.title = bilgi ? `${bilgi.ad}: ${bilgi.gorev} ${bilgi.aciklama}` : '';

        if (index < acikSayisi) {
            slot.classList.remove('kilitli');
        } else {
            slot.classList.add('kilitli');
        }
    });
}

/**
 * Oyuncunun haritadaki ilerleme durumunu döndürür. (Şu an sabit olarak 3 dönüyor)
 * Nerede kullanılır: Eski ilerleme sisteminde veya haritaIlerlemesiniCiz içerisinde kullanılabilir (kilit mekaniği için).
 * Neden kullanılır: Gezegenlerin kilitli/açık durumunu kontrol etmek için.
 */
function haritaIlerlemesi() {
    return 3;
}

/**
 * Ana gezegenlerin (Astra, Vega, Nora) görsel durumlarını ve kilitlerini haritada günceller.
 * Nerede kullanılır: Oyun ilk yüklendiğinde ve haritaya dönüldüğünde (bolumleriBaslat içinde).
 * Neden kullanılır: Tüm gezegenlerin açık olduğu ayarında zorlukları görsel olarak oyuncuya yansıtmak için.
 */
function haritaIlerlemesiniCiz() {
    document.querySelectorAll('.ana-gezegen').forEach(gezegen => {
        gezegen.classList.remove('kilitli');
        const durum = gezegen.querySelector('.gezegen-durum');
        if (durum && gezegen.classList.contains('astra')) durum.textContent = 'Kolay';
        if (durum && gezegen.classList.contains('vega')) durum.textContent = 'Orta';
        if (durum && gezegen.classList.contains('nora')) durum.textContent = 'Zor';
    });
}

/**
 * Ekranın ortasında kısa süreli kaybolan bir bildirim (tooltip/toast) gösterir.
 * Nerede kullanılır: Yetersiz bütçe, taret yerleştirme hatası gibi uyarılarda.
 * Neden kullanılır: Oyuncuya oyunu durdurmadan anlık geri bildirim vermek için.
 */
function oyunBildirimiGoster(metin) {
    const oyunAlani = document.getElementById('oyun-alani');
    if (!oyunAlani) return;
    const eski = oyunAlani.querySelector('.oyun-bildirimi');
    if (eski) eski.remove();
    const bildirim = document.createElement('div');
    bildirim.className = 'oyun-bildirimi';
    bildirim.textContent = metin;
    oyunAlani.appendChild(bildirim);
    setTimeout(() => bildirim.remove(), 1400);
}

/**
 * Yan paneldeki taret slotlarına tıklama/sürükleme (mousedown) olaylarını dinler.
 * Nerede kullanılır: bolumleriBaslat() fonksiyonunda olay dinleyicileri ayarlanırken.
 * Neden kullanılır: Oyuncunun taretleri seçip canvas üzerine sürüklemesini sağlayan sürükle-bırak sistemini başlatmak için.
 */
function modulSlotTiklamalariniBagla() {
    const slotlar = document.querySelectorAll('.taret-slot');
    const canvas = document.getElementById('yildiz-alani');
    slotlar.forEach((slot, index) => {
        slot.addEventListener('mousedown', (olay) => {
            olay.preventDefault();
            olay.stopPropagation();
            if (olay.button !== 0) return;
            if (aktifBolum && canvas && typeof aktifBolum.modulSuruklemeBaslat === 'function') {
                aktifBolum.modulSuruklemeBaslat(index, canvas, olay.clientX, olay.clientY);
            }
        });
    });
}

/**
 * Tüm bölüm seçimlerini, menü geçişlerini ve bölüm başlatma mantıklarını birbirine bağlar.
 * Nerede kullanılır: main.js dosyasında oyun ilk yüklendiğinde bir kez çağrılır.
 * Neden kullanılır: Gezegen seçim ekranından oyun alanına geçişi yönetmek ve ilgili butonların olaylarını tanımlamak için.
 */
export function bolumleriBaslat() {
    const anaMenu = document.getElementById('ana-menu');
    const oyunAlani = document.getElementById('oyun-alani');
    const astraGezegeni = document.querySelector('.astra');
    const noraGezegeni = document.querySelector('.nora');
    const vegaGezegeni = document.querySelector('.vega');
    const kronGezegeni = document.querySelector('.kron');
    const gezegenHaritasi = document.querySelector('.gezegen-haritasi');
    const secimBaslik = document.querySelector('.secim-baslik');
    const oyunHud = document.getElementById('oyun-hud');
    const sesKontrolleri = document.getElementById('ses-kontrolleri');
    const canvas = document.getElementById('yildiz-alani');
    const hudMenuBtn = document.getElementById('hud-ana-menu-btn');
    const hudMaxTurn = document.getElementById('hud-max-turn');
    const bilgiPaneli = document.getElementById('bolum-bilgi-paneli');
    const bilgiAsama = document.getElementById('bolum-bilgi-asama');
    const bilgiBaslik = document.getElementById('bolum-bilgi-baslik');
    const bilgiMetin = document.getElementById('bolum-bilgi-metin');
    const bilgiDetaylar = document.getElementById('bolum-bilgi-detaylar');
    const bilgiTaretler = document.getElementById('bolum-bilgi-taretler');
    const bilgiBaslat = document.getElementById('bolum-bilgi-baslat');
    const bilgiIptal = document.getElementById('bolum-bilgi-iptal');
    const savasBaslatBtn = document.getElementById('savas-baslat-btn');
    let secilenAyar = null;

    modulSlotTiklamalariniBagla();

    const bolumAyarlari = {
        astra: {
            bolum: astraBolumu,
            stage: 1,
            asama: 'Aşama 1',
            zorluk: 'Kolay',
            dusmanOzeti: 'Zayıf ve normal düşmanlar',
            taretSayisi: 2,
            maxTurnLabel: '5',
            metin: 'Astra savaşın girişidir. Daha yavaş düşmanlar temel savunma ve taret yerleştirme mantığını öğretir.',
            arkaPlan: 'rgba(22, 5, 30, 0.9)'
        },
        vega: {
            bolum: vegaBolumu,
            stage: 2,
            asama: 'Aşama 2',
            zorluk: 'Orta',
            dusmanOzeti: 'Normal, hızlı ve dayanıklı düşmanlar',
            taretSayisi: 3,
            maxTurnLabel: '6',
            metin: 'Vega oyuncuyu farklı taretleri birlikte kullanmaya zorlayan orta zorlukta bir arenadır.',
            arkaPlan: 'rgba(5, 20, 35, 0.95)'
        },
        nora: {
            bolum: noraBolumu,
            stage: 3,
            asama: 'Aşama 3',
            zorluk: 'Zor',
            dusmanOzeti: 'Hızlı, zırhlı, kalabalık ve özel düşmanlar',
            taretSayisi: 4,
            maxTurnLabel: '7',
            metin: 'Nora yoğun dalgalar ve özel düşmanlarla stratejik savunma kurmayı gerektirir.',
            arkaPlan: 'rgba(5, 5, 5, 0.95)'
        },
        kron: {
            bolum: kronBolumu,
            asama: 'Eğlence Modu',
            zorluk: 'Sonsuz',
            dusmanOzeti: 'Her dalgada artan karma dalgalar',
            taretSayisi: 5,
            maxTurnLabel: 'Sonsuz',
            metin: 'Kron Eğlence Modu sonsuzdur. Dalga sayısı arttıkça düşman canı, hızı ve özel düşman ihtimali durmadan yükselir.',
            arkaPlan: 'rgba(10, 20, 10, 0.95)'
        }
    };

    /**
     * Seçilen gezegenin bilgi panelini (zorluk, dalga sayısı, taretler) ekrana getirir.
     * Nerede kullanılır: Haritadan bir gezegene tıklandığında.
     * Neden kullanılır: Oyuncuya bölüm hakkında ön bilgi vermek ve savaşa hazırlanmasını sağlamak için.
     */
    function bilgiPaneliniAc(ayar) {
        secilenAyar = ayar;
        if (bilgiAsama) bilgiAsama.textContent = ayar.asama;
        if (bilgiBaslik) bilgiBaslik.textContent = ayar.bolum.isim;
        if (bilgiMetin) bilgiMetin.textContent = ayar.metin;
        if (bilgiDetaylar) {
            const gelecekDalga = ayar.bolum.endless ? 'Sonsuz Turn' : ayar.bolum.gelecekDalgaSayisiAl(1);
            const toplamDusman = ayar.bolum.endless ? 'Sonsuz Düşman' : ayar.bolum.toplamDusmanSayisiAl(1);
            bilgiDetaylar.innerHTML = `
                <div class="bolum-bilgi-detay"><strong>Zorluk</strong><span>${ayar.zorluk}</span></div>
                <div class="bolum-bilgi-detay"><strong>Gelecek Dalga Sayısı</strong><span>${gelecekDalga}</span></div>
                <div class="bolum-bilgi-detay"><strong>Toplam Düşman Sayısı</strong><span>${toplamDusman}</span></div>
                <div class="bolum-bilgi-detay"><strong>Beklenen Düşman</strong><span>${ayar.dusmanOzeti}</span></div>
            `;
        }

        if (bilgiTaretler) {
            bilgiTaretler.innerHTML = taretBilgileri.map((taret, index) => {
                const acik = index < ayar.taretSayisi;
                return `
                    <div class="bilgi-taret ${acik ? '' : 'kapali'}">
                        <div class="bilgi-taret-numara">${index + 1}</div>
                        <div>
                            <strong>${taret.ad}</strong>
                        </div>
                        <div class="bilgi-taret-durum">${acik ? 'Açık' : 'Kapalı'}</div>
                    </div>
                `;
            }).join('');
        }

        if (bilgiPaneli) bilgiPaneli.style.display = 'flex';
    }

    /**
     * Seçili ayarlara (gezegen) göre oyun HUD'ını ve canvas'ı başlatır.
     * Nerede kullanılır: Bilgi panelindeki 'Hazırlan' butonuna tıklandığında.
     * Neden kullanılır: Menü arayüzünü gizleyip oyun ekranına, taretlere ve savaş moduna geçişi sağlamak için.
     */
    function bolumuBaslat(ayar) {
        aktifBolum = ayar.bolum;
        mermileriTemizle();
        taretleriGuncelle(ayar.taretSayisi);
        if (hudMaxTurn) hudMaxTurn.textContent = ayar.maxTurnLabel;
        aktifBolum.baslat(canvas);

        if (bilgiPaneli) bilgiPaneli.style.display = 'none';
        if (gezegenHaritasi) gezegenHaritasi.style.display = 'none';
        if (secimBaslik) secimBaslik.style.display = 'none';
        if (oyunHud) oyunHud.style.display = 'flex';
        if (sesKontrolleri) sesKontrolleri.style.display = 'none';

        canvas.style.backgroundColor = ayar.arkaPlan;
        canvas.style.boxShadow = `inset 0 0 150px ${aktifBolum.renk}`;

        muzikDurdurTum();
        muzikCal(ayar.bolum === kronBolumu ? muzikAksiyon : muzikSakin);
    }

    kronSkorunuGuncelle();
    haritaIlerlemesiniCiz();
    window.addEventListener('storage', haritaIlerlemesiniCiz);
    window.addEventListener('spacewar-ilerleme-guncellendi', haritaIlerlemesiniCiz);
    window.addEventListener('kron-skor-guncellendi', kronSkorunuGuncelle);

    bilgiBaslat?.addEventListener('click', () => {
        if (secilenAyar) bolumuBaslat(secilenAyar);
    });

    bilgiIptal?.addEventListener('click', () => {
        secilenAyar = null;
        if (bilgiPaneli) bilgiPaneli.style.display = 'none';
    });

    /**
     * Ana gezegen tıklandığında ilgili bilgi panelini açmak için sarmalayıcı (wrapper) fonksiyon.
     * Nerede kullanılır: Gezegen tıklama olaylarında.
     * Neden kullanılır: Olay dinleyicisi içinde kod karmaşasını önlemek için.
     */
    function anaGezegeniAc(ayar) {
        bilgiPaneliniAc(ayar);
    }

    savasBaslatBtn?.addEventListener('click', () => {
        if (aktifBolum && canvas && typeof aktifBolum.savasiBaslat === 'function') {
            aktifBolum.savasiBaslat(canvas);
        }
    });

    astraGezegeni?.addEventListener('click', () => anaGezegeniAc(bolumAyarlari.astra));
    vegaGezegeni?.addEventListener('click', () => anaGezegeniAc(bolumAyarlari.vega));
    noraGezegeni?.addEventListener('click', () => anaGezegeniAc(bolumAyarlari.nora));
    kronGezegeni?.addEventListener('click', () => bilgiPaneliniAc(bolumAyarlari.kron));

    hudMenuBtn?.addEventListener('click', () => {
        if (aktifBolum) aktifBolum.durdur();
        mermileriTemizle();
        aktifBolum = null;
        secilenAyar = null;
        kronSkorunuGuncelle();

        if (oyunHud) oyunHud.style.display = 'none';
        if (bilgiPaneli) bilgiPaneli.style.display = 'none';
        if (gezegenHaritasi) gezegenHaritasi.style.display = 'block';
        if (secimBaslik) secimBaslik.style.display = 'block';
        if (oyunAlani) oyunAlani.style.display = 'none';
        if (anaMenu) anaMenu.style.display = 'flex';
        if (sesKontrolleri) sesKontrolleri.style.display = 'flex';

        canvas.style.backgroundColor = 'black';
        canvas.style.boxShadow = 'none';

        muzikDurdurTum();
        haritaIlerlemesiniCiz();
        muzikCal(muzikBaslangic);
    });
}

/**
 * Kullanılmayan klasik seviye yöneticisi sınıfıdır. 
 * Nerede kullanılır: Eski bir seviye ilerleme veya sonsuz mod prototipinde kullanılıyordu.
 * Neden kullanılır: Düşmanların periyodik olarak spawn edilmesini ve zamanla zorluğun artmasını yönetmek için.
 */
export class LevelManager {
    /**
     * Level yöneticisinin başlangıç değerlerini kurar.
     * Nerede kullanılır: Sınıftan yeni bir nesne oluşturulurken.
     * Neden kullanılır: Seviye, zamanlayıcı ve spawn aralıkları gibi değişkenleri sıfırlamak için.
     */
    constructor() {
        this.currentLevel = 1;
        this.enemies = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2000;
        this.minimumSpawnInterval = 600;
    }

    /**
     * Zamanlayıcıyı ilerletir ve yeni düşman yaratma veya temizleme işlemlerini yapar.
     * Nerede kullanılır: Oyun döngüsü içinde düşman yöneticisini güncellerken.
     * Neden kullanılır: Sürekli olarak artan zorlukla düşman akışını sağlamak için.
     */
    update(deltaTime) {
        this.spawnTimer += deltaTime;

        const calculatedInterval = this.baseSpawnInterval - (this.currentLevel * 150);
        const currentSpawnInterval = Math.max(this.minimumSpawnInterval, calculatedInterval);

        if (this.spawnTimer > currentSpawnInterval) {
            this.spawnRandomEnemy();
            this.spawnTimer = 0;
        }

        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }

    /**
     * Mevcut düşmanları ekrana çizer.
     * Nerede kullanılır: Oyun döngüsü içinde çizim aşamasında.
     * Neden kullanılır: Düşman nesnelerini görselleştirmek için.
     */
    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    /**
     * Rastgele bir X koordinatından rastgele bir düşman tipi spawn eder.
     * Nerede kullanılır: update() metodunda belirli bir süre geçtiğinde.
     * Neden kullanılır: Farklı tipte düşmanların oyuncuya doğru gelmesini sağlamak için.
     */
    spawnRandomEnemy() {
        const x = Math.random() * (window.innerWidth - 80);
        const y = -100;
        const randomVal = Math.random();
        let newEnemy;

        if (randomVal < 0.70) {
            newEnemy = new NormalEnemy(x, y, this.currentLevel);
        } else if (randomVal < 0.95) {
            newEnemy = new HighEnemy(x, y, this.currentLevel);
        } else if (this.currentLevel >= 3) {
            newEnemy = new QueenEnemy(x, y, this.currentLevel);
        } else {
            newEnemy = new HighEnemy(x, y, this.currentLevel);
        }

        this.enemies.push(newEnemy);
    }

    /**
     * Seviyeyi bir artırır.
     * Nerede kullanılır: Belli bir skor veya zaman geçtikten sonra çağrılır.
     * Neden kullanılır: Zorluğu aşamalı olarak yükseltmek için.
     */
    levelUp() {
        this.currentLevel++;
        console.log('Seviye Atlandı! Yeni Seviye: ' + this.currentLevel);
    }
}
