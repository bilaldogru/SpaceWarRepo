import { basilanTuslar, fare } from './input.js';

export const gemi = {
    x: 0,
    y: 0,
    genislik: 60,
    uzunluk: 60,
    hiz: 2,
    aci: 0
};

export const gemiGorseli = new Image();

gemiGorseli.src = "assets/images/gemi.png";

export function gemiyiGuncelle(canvas) {
    if (basilanTuslar.w && gemi.y - (gemi.uzunluk / 2) > 0) gemi.y -= gemi.hiz;
    if (basilanTuslar.s && gemi.y + (gemi.uzunluk / 2) < canvas.height) gemi.y += gemi.hiz;
    if (basilanTuslar.a && gemi.x - (gemi.genislik / 2) > 0) gemi.x -= gemi.hiz;
    if (basilanTuslar.d && gemi.x + (gemi.genislik / 2) < canvas.width) gemi.x += gemi.hiz;

    gemi.aci = Math.atan2(fare.y - gemi.y, fare.x - gemi.x);
}

export function gemiyiCiz(ctx) {
    ctx.save();
    ctx.translate(gemi.x, gemi.y);
    ctx.rotate(gemi.aci + Math.PI / 2);
    ctx.drawImage(gemiGorseli, -gemi.genislik / 2, -gemi.uzunluk / 2, gemi.genislik, gemi.uzunluk);
    ctx.restore();
}