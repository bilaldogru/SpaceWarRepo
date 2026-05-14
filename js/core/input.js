// Fare bilgisini tek bir yerde tutuyoruz.
// Oyuncu gemisi fareye donecegi ve mermi fareye dogru gidecegi icin bu bilgi surekli guncel kalmali.
export const fare = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};

// WASD tuslarinin basili olup olmadigini burada sakliyoruz.
// true = tus basili, false = tus birakilmis demektir.
export const basilanTuslar = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Fare hareket ettikce ekrandaki yeni konumunu kaydediyoruz.
window.addEventListener('mousemove', function (olay) {
    fare.x = olay.clientX;
    fare.y = olay.clientY;
});

// Tusa basildiginda ilgili tusu true yapiyoruz.
// toLowerCase sayesinde W ve w ayrimi yapmamiza gerek kalmiyor.
window.addEventListener('keydown', function (olay) {
    const tus = olay.key.toLowerCase();

    if (tus === 'w') {
        basilanTuslar.w = true;
    }
    else if (tus === 'a') {
        basilanTuslar.a = true;
    }
    else if (tus === 's') {
        basilanTuslar.s = true;
    }
    else if (tus === 'd') {
        basilanTuslar.d = true;
    }
});

// Tus birakildiginda ilgili tusu false yapiyoruz.
window.addEventListener('keyup', function (olay) {
    const tus = olay.key.toLowerCase();

    if (tus === 'w') {
        basilanTuslar.w = false;
    }
    else if (tus === 'a') {
        basilanTuslar.a = false;
    }
    else if (tus === 's') {
        basilanTuslar.s = false;
    }
    else if (tus === 'd') {
        basilanTuslar.d = false;
    }
});
