// Klavye ve fare bilgilerini input.js dosyasindan aliyoruz.
import { basilanTuslar, fare } from './input.js';

// Oyuncu gemisinin temel bilgileri burada tutulur.
// x ve y: geminin haritadaki merkezi
// genislik ve uzunluk: geminin ekranda cizilecek boyutu
// hiz: her karede ne kadar hareket edecegi
// aci: geminin fareye bakmak icin kullanacagi donus acisi
export const gemi =
{
    x: 0,
    y: 0,
    genislik: 60,
    uzunluk: 60,
    hiz: 2,
    aci: 0
};

// Ust HUD cubugunun alt sinirini bulur.
// Boylece gemi ust bilgi panelinin altina girmez.
function hudAltSiniri() {
    const hud = document.getElementById('oyun-hud');

    if (hud === null) {
        return 0;
    }

    if (hud.style.display === 'none') {
        return 0;
    }

    const ustBar = hud.querySelector('.hud-top-strip');
    if (ustBar === null) {
        return 0;
    }

    const rect = ustBar.getBoundingClientRect();
    return Math.ceil(rect.bottom + 10);
}

// HUD, alt bar ve sol taret paneli gibi arayuzlerin kapladigi alanlara bakar.
// Gemi sadece bu alanlarin disinda kalan guvenli bolgede gezebilir.
function hudGuvenliAlan(canvas) {
    const alan = {
        sol: 0,
        ust: 0,
        sag: canvas.width,
        alt: canvas.height
    };

    const hud = document.getElementById('oyun-hud');
    if (hud === null) {
        return alan;
    }

    if (hud.style.display === 'none') {
        return alan;
    }

    const ustBar = hud.querySelector('.hud-top-strip');
    if (ustBar !== null) {
        const ustRect = ustBar.getBoundingClientRect();
        if (ustRect.bottom + 8 > alan.ust) {
            alan.ust = ustRect.bottom + 8;
        }
    }

    const altBar = hud.querySelector('.hud-bottom-bar');
    if (altBar !== null) {
        const altRect = altBar.getBoundingClientRect();
        if (altRect.top - 8 < alan.alt) {
            alan.alt = altRect.top - 8;
        }
    }

    const yanMenu = hud.querySelector('.hud-sidebar');
    if (yanMenu !== null) {
        const yanRect = yanMenu.getBoundingClientRect();
        if (yanRect.right + 8 > alan.sol) {
            alan.sol = yanRect.right + 8;
        }
    }

    return alan;
}

// Gemi gorselini yukluyoruz.
// Resim yuklenmezse gemiyiCiz icinde basit ucgen bir yedek cizim kullanilacak.
export const gemiGorseli = new Image();
gemiGorseli.src = 'assets/images/gemi.png';

// Gemi resmi henuz yuklenmediyse oyunun bos kalmamasi icin basit bir gemi cizer.
function gemiYedekGorseliniCiz(ctx) {
    const yarimGenislik = gemi.genislik / 2;
    const yarimUzunluk = gemi.uzunluk / 2;

    ctx.beginPath();
    ctx.moveTo(0, -yarimUzunluk);
    ctx.lineTo(yarimGenislik * 0.72, yarimUzunluk * 0.72);
    ctx.lineTo(0, yarimUzunluk * 0.34);
    ctx.lineTo(-yarimGenislik * 0.72, yarimUzunluk * 0.72);
    ctx.closePath();

    ctx.fillStyle = '#5ae0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#5ae0ff';
    ctx.fill();
    ctx.stroke();
}

// Geminin konumunu ve acisini her karede gunceller.
// Bu fonksiyon main.js icindeki oyun dongusunde surekli calisir.
export function gemiyiGuncelle(canvas, bolum) {
    let haritaGenislik = canvas.width;
    let haritaYukseklik = canvas.height;
    let kamera = { x: 0, y: 0 };

    if (bolum !== undefined && bolum !== null) {
        haritaGenislik = bolum.haritaGenislik;
        haritaYukseklik = bolum.haritaYukseklik;

        if (bolum.kamera !== undefined && bolum.kamera !== null) {
            kamera = bolum.kamera;
        }
    }

    let oyuncuYaricapi = gemi.genislik / 2;
    if (bolum !== undefined && bolum !== null) {
        if (typeof bolum.oyuncuHitboxYaricap === 'function') {
            oyuncuYaricapi = bolum.oyuncuHitboxYaricap();
        }
    }

    let yarimGenislik = gemi.genislik / 2;
    if (oyuncuYaricapi > yarimGenislik) {
        yarimGenislik = oyuncuYaricapi;
    }

    let yarimUzunluk = gemi.uzunluk / 2;
    if (oyuncuYaricapi > yarimUzunluk) {
        yarimUzunluk = oyuncuYaricapi;
    }

    const guvenliAlan = hudGuvenliAlan(canvas);

    let ustSinir = yarimUzunluk;
    let altSinir = haritaYukseklik - yarimUzunluk;
    let solSinir = yarimGenislik;
    let sagSinir = haritaGenislik - yarimGenislik;

    if (bolum !== undefined && bolum !== null) {
        let arayuzUstSiniri = hudAltSiniri();
        if (guvenliAlan.ust > arayuzUstSiniri) {
            arayuzUstSiniri = guvenliAlan.ust;
        }

        ustSinir = kamera.y + arayuzUstSiniri + yarimUzunluk;
        altSinir = kamera.y + guvenliAlan.alt - yarimUzunluk;
        solSinir = kamera.x + guvenliAlan.sol + yarimGenislik;
        sagSinir = kamera.x + guvenliAlan.sag - yarimGenislik;

        if (altSinir > haritaYukseklik - yarimUzunluk) {
            altSinir = haritaYukseklik - yarimUzunluk;
        }

        if (solSinir < yarimGenislik) {
            solSinir = yarimGenislik;
        }

        if (sagSinir > haritaGenislik - yarimGenislik) {
            sagSinir = haritaGenislik - yarimGenislik;
        }
    }

    let kesinSol = solSinir;
    let kesinSag = sagSinir;
    if (sagSinir < solSinir) {
        kesinSol = sagSinir;
        kesinSag = solSinir;
    }

    let kesinUst = ustSinir;
    let kesinAlt = altSinir;
    if (altSinir < ustSinir) {
        kesinUst = altSinir;
        kesinAlt = ustSinir;
    }

    let hareketX = 0;
    let hareketY = 0;

    // Her tus ayri kontrol edilir. Boylece ayni anda W ve D gibi iki tusa basilabilir.
    if (basilanTuslar.w === true) {
        hareketY = hareketY - 1;
    }
    if (basilanTuslar.s === true) {
        hareketY = hareketY + 1;
    }
    if (basilanTuslar.a === true) {
        hareketX = hareketX - 1;
    }
    if (basilanTuslar.d === true) {
        hareketX = hareketX + 1;
    }

    // Capraz giderken hiz artmasin diye hareket vektorunu normal hale getiriyoruz.
    const hareketUzunlugu = Math.hypot(hareketX, hareketY);
    if (hareketUzunlugu > 0) {
        hareketX = hareketX / hareketUzunlugu;
        hareketY = hareketY / hareketUzunlugu;
    }

    gemi.x = gemi.x + hareketX * gemi.hiz;
    gemi.y = gemi.y + hareketY * gemi.hiz;

    // Gemi sinirlarin disina cikarsa sinirin icine geri alinir.
    if (gemi.x < kesinSol) {
        gemi.x = kesinSol;
    }
    else if (gemi.x > kesinSag) {
        gemi.x = kesinSag;
    }

    if (gemi.y < kesinUst) {
        gemi.y = kesinUst;
    }
    else if (gemi.y > kesinAlt) {
        gemi.y = kesinAlt;
    }

    // Fare ekran koordinatidir. Kamera kaymissa fareyi harita koordinatina ceviririz.
    const hedefX = fare.x + kamera.x;
    const hedefY = fare.y + kamera.y;

    // atan2 bize gemiden fareye dogru bakmak icin gereken aciyi verir.
    gemi.aci = Math.atan2(hedefY - gemi.y, hedefX - gemi.x);
}

// Gemiyi canvas uzerine cizer.
// Once cizim merkezini geminin merkezine tasir, sonra gemiyi acisina gore dondurur.
export function gemiyiCiz(ctx, kamera) {
    let kameraX = 0;
    let kameraY = 0;

    if (kamera !== undefined && kamera !== null) {
        kameraX = kamera.x;
        kameraY = kamera.y;
    }

    ctx.save();
    ctx.translate(gemi.x - kameraX, gemi.y - kameraY);
    ctx.rotate(gemi.aci + Math.PI / 2);

    if (gemiGorseli.complete === true && gemiGorseli.naturalWidth > 0) {
        ctx.drawImage(gemiGorseli, -gemi.genislik / 2, -gemi.uzunluk / 2, gemi.genislik, gemi.uzunluk);
    }
    else {
        gemiYedekGorseliniCiz(ctx);
    }

    ctx.restore();
}
