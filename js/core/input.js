// Klavye ve fare kontrolü için gerekli kod bloğu

// Fare koordinatları tutulur
export const fare = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Basılan tuşlar tutulur
export const basilanTuslar = { w: false, a: false, s: false, d: false };

// Fare hareketlerini yakalar
window.addEventListener('mousemove', (olay) => {
    fare.x = olay.clientX;
    fare.y = olay.clientY;
});

// Tuşa basıldığında WASD tuşlarını true yap
window.addEventListener('keydown', (olay) => {
    if (olay.key === 'w' || olay.key === 'W') basilanTuslar.w = true;
    if (olay.key === 'a' || olay.key === 'A') basilanTuslar.a = true;
    if (olay.key === 's' || olay.key === 'S') basilanTuslar.s = true;
    if (olay.key === 'd' || olay.key === 'D') basilanTuslar.d = true;
});

// Tuş bırakıldığında WASD tuşlarını false yap
window.addEventListener('keyup', (olay) => {
    if (olay.key === 'w' || olay.key === 'W') basilanTuslar.w = false;
    if (olay.key === 'a' || olay.key === 'A') basilanTuslar.a = false;
    if (olay.key === 's' || olay.key === 'S') basilanTuslar.s = false;
    if (olay.key === 'd' || olay.key === 'D') basilanTuslar.d = false;
});