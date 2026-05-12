import { arayuzuBaslat } from './ui.js';
import { gemi, gemiGorseli, gemiyiGuncelle, gemiyiCiz } from './player.js';
import { mermiAtesle, mermiler, mermileriGuncelleVeCiz } from './projectile.js';
import { aktifBolum, bolumleriBaslat } from './level.js';
import { fare } from './input.js';

const canvas = document.getElementById('yildiz-alani');
const ctx = canvas.getContext('2d');

function boyutlandir() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gemi.x = canvas.width / 2;
    gemi.y = canvas.height / 2;
}

window.addEventListener('resize', boyutlandir);

const yildizlar = [];
const yildizSayisi = 200;

for (let i = 0; i < yildizSayisi; i++) {
    yildizlar.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        yaricap: Math.random() * 1.5 + 0.5,
        hiz: Math.random() * 0.5 + 0.1,
        parlaklik: Math.random()
    });
}

window.addEventListener('mousedown', (olay) => {
    if (aktifBolum?.suruklenenModul) return;
    fare.x = olay.clientX;
    fare.y = olay.clientY;
    if (olay.button === 0 && (!aktifBolum || aktifBolum.atesEtmeyeIzinVar())) {
        mermiAtesle(gemi, aktifBolum);
    }
});

window.addEventListener('mousemove', (olay) => {
    if (aktifBolum && typeof aktifBolum.modulSuruklemeGuncelle === 'function') {
        aktifBolum.modulSuruklemeGuncelle(canvas, olay.clientX, olay.clientY);
    }
});

window.addEventListener('mouseup', (olay) => {
    if (olay.button === 0 && aktifBolum && typeof aktifBolum.modulSuruklemeBitir === 'function') {
        aktifBolum.modulSuruklemeBitir(canvas, olay.clientX, olay.clientY);
    }
});

window.addEventListener('blur', () => {
    if (aktifBolum && typeof aktifBolum.modulSuruklemeIptal === 'function') {
        aktifBolum.modulSuruklemeIptal();
    }
});

window.addEventListener('keydown', (olay) => {
    if ((olay.key === 'r' || olay.key === 'R') && aktifBolum) {
        aktifBolum.yenidenDoldur();
    }

    if (olay.key === ' ') {
        olay.preventDefault();
        if (!aktifBolum || aktifBolum.atesEtmeyeIzinVar()) {
            mermiAtesle(gemi, aktifBolum);
        }
    }
});

function yildizlariCiz() {
    for (let i = 0; i < yildizSayisi; i++) {
        const yildiz = yildizlar[i];

        ctx.beginPath();
        ctx.arc(yildiz.x, yildiz.y, yildiz.yaricap, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${yildiz.parlaklik})`;
        ctx.fill();

        yildiz.x -= yildiz.hiz * 3;

        if (yildiz.x < 0) {
            yildiz.x = canvas.width;
            yildiz.y = Math.random() * canvas.height;
        }
    }
}

function oyunDongusu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    yildizlariCiz();
    gemiyiGuncelle(canvas, aktifBolum);

    if (aktifBolum) {
        aktifBolum.guncelle(canvas, mermiler, gemi);
        aktifBolum.ciz(ctx, canvas);
    }

    mermileriGuncelleVeCiz(ctx, canvas, aktifBolum);
    gemiyiCiz(ctx, aktifBolum?.kamera);

    if (aktifBolum && aktifBolum.oyunBitti) {
        aktifBolum.oyunSonuEkraniCiz(ctx, canvas);
    }

    requestAnimationFrame(oyunDongusu);
}

arayuzuBaslat();
bolumleriBaslat();
boyutlandir();

if (gemiGorseli.complete) {
    oyunDongusu();
} else {
    gemiGorseli.onload = () => {
        oyunDongusu();
    };
}
