player.js - Oyuncu ve Gemi Mekanikleri
Prompt

Geminin burnunun her zaman fare imlecine dönmesi için nasıl bir yol izlemeliyim? Fare ile gemi arasındaki açıyı hesaplamak için Math.atan2 fonksiyonunu nasıl kullanabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, oyuncu gemisinin fareye doğru dönebilmesi için önce geminin merkez noktası ile farenin ekrandaki konumu arasındaki yatay ve dikey farkın hesaplanması gerektiğini açıkladı. Bu farklar kullanılarak Math.atan2(dy, dx) fonksiyonu ile açı değeri radyan cinsinden elde edildi. Bu açı daha sonra canvas üzerinde gemiyi döndürmek için kullanıldı.

Bu yöntem sayesinde gemi sabit bir yöne bakmak yerine oyuncunun fareyle gösterdiği hedefe doğru dönebilmektedir. Özellikle mouse ile nişan alma sisteminin temelini bu açı hesabı oluşturmuştur.

Örnek Kod Mantığı
// Oyuncu ile fare arasındaki yön farkını hesaplıyoruz.
const dx = fare.x - oyuncu.x;
const dy = fare.y - oyuncu.y;

// atan2 fonksiyonu bize fareye doğru bakılması gereken açıyı verir.
oyuncu.aci = Math.atan2(dy, dx);

Canvas üzerinde gemiyi döndürmek için:

ctx.save();

// Çizim merkezini geminin merkezine taşıyoruz.
ctx.translate(oyuncu.x, oyuncu.y);

// Gemiyi hesaplanan açı kadar döndürüyoruz.
ctx.rotate(oyuncu.aci);

// Görseli merkezden çizmek için genişlik ve yüksekliğin yarısı kadar geri kaydırıyoruz.
ctx.drawImage(
    oyuncuResmi,
    -oyuncu.genislik / 2,
    -oyuncu.yukseklik / 2,
    oyuncu.genislik,
    oyuncu.yukseklik
);

ctx.restore();
Prompt

Oyuncu WASD tuşlarına bastığında geminin X ve Y koordinatlarını nasıl güncellemeliyim? Çapraz harekette geminin kontrolü bozulmadan nasıl hareket ettirebilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, her tuşun ayrı ayrı kontrol edilmesi gerektiğini ve basılı olan tuşlara göre oyuncunun X/Y koordinatlarının güncellenebileceğini açıkladı. Ancak çapraz hareket sırasında oyuncunun normalden daha hızlı gitmemesi için yön vektörünün normalize edilmesi gerektiği belirtildi.

Bu bilgi projedeki oyuncu hareket sistemine uyarlandı. Böylece W ve D tuşlarına aynı anda basıldığında gemi çapraz hareket edebilmekte, fakat düz harekete göre haksız bir hız avantajı kazanmamaktadır.

Örnek Kod Mantığı
let hareketX = 0;
let hareketY = 0;

// Basılı tuşlara göre hareket yönünü belirliyoruz.
if (basilanTuslar["w"] || basilanTuslar["W"]) hareketY -= 1;
if (basilanTuslar["s"] || basilanTuslar["S"]) hareketY += 1;
if (basilanTuslar["a"] || basilanTuslar["A"]) hareketX -= 1;
if (basilanTuslar["d"] || basilanTuslar["D"]) hareketX += 1;

// Çapraz harekette hızın artmaması için vektörü normalize ediyoruz.
const uzunluk = Math.hypot(hareketX, hareketY);

if (uzunluk > 0) {
    hareketX /= uzunluk;
    hareketY /= uzunluk;
}

// Oyuncunun yeni konumunu güncelliyoruz.
oyuncu.x += hareketX * oyuncu.hiz;
oyuncu.y += hareketY * oyuncu.hiz;
Prompt

Geminin HUD, alt bar veya yan menü gibi arayüzlerin altına girip görünmez olmasını nasıl engelleyebilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, canvas üzerinde oyuncunun hareket edebileceği güvenli alanın belirlenmesi gerektiğini açıkladı. Bunun için arayüz elemanlarının konumları getBoundingClientRect() ile alınabilir ve oyuncunun hareket sınırları buna göre daraltılabilir.

Bu fikir projeye, oyuncunun ekran dışına veya arayüz panellerinin altına taşmasını engelleyen sınırlandırma sistemi olarak uyarlandı.

Örnek Kod Mantığı
// Oyuncunun canvas sınırları dışına çıkmasını engelliyoruz.
oyuncu.x = Math.max(oyuncu.yaricap, Math.min(canvas.width - oyuncu.yaricap, oyuncu.x));
oyuncu.y = Math.max(oyuncu.yaricap, Math.min(canvas.height - oyuncu.yaricap, oyuncu.y));

Eğer alt panel varsa:

const altPanelYuksekligi = 90;

// Oyuncunun alt panelin içine girmesini engelliyoruz.
oyuncu.y = Math.min(
    oyuncu.y,
    canvas.height - altPanelYuksekligi - oyuncu.yaricap
);
input.js - Girdi ve Kontroller
Prompt

Fare ekranda hareket ettikçe güncel X ve Y konumunu sürekli saklamak için mousemove olayını nasıl kullanabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, fare konumunun oyun boyunca sürekli güncel tutulabilmesi için bir fare nesnesi oluşturulmasını ve mousemove olayı ile bu nesnenin X/Y değerlerinin güncellenmesini önerdi.

Bu yapı, oyuncu gemisinin fareye doğru dönmesi ve mermilerin hedef yönünün belirlenmesi için kullanıldı.

Örnek Kod Mantığı
const fare = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

canvas.addEventListener("mousemove", function (event) {
    const rect = canvas.getBoundingClientRect();

    // Fare konumunu canvas koordinat sistemine çeviriyoruz.
    fare.x = event.clientX - rect.left;
    fare.y = event.clientY - rect.top;
});

Bu kodda clientX ve clientY tarayıcı penceresine göre konumu verir. Canvas’ın sayfadaki konumu çıkarılarak gerçek canvas içi koordinat bulunur.

Prompt

Oyuncunun aynı anda birden fazla tuşa bastığını takip etmek için nasıl bir yapı kurmalıyım?

Alınan Cevap / Kullanım Şekli

Yapay zeka, basılan tuşları tek tek kontrol etmek yerine her tuşun durumunu saklayan bir obje kullanılmasını önerdi. Bu sayede bir tuş basılıyken başka bir tuşa da basıldığında iki hareket aynı anda algılanabildi.

Bu sistem özellikle WASD ile çapraz hareket için kullanıldı.

Örnek Kod Mantığı
const basilanTuslar = {};

window.addEventListener("keydown", function (event) {
    basilanTuslar[event.key] = true;
});

window.addEventListener("keyup", function (event) {
    basilanTuslar[event.key] = false;
});

Daha temiz kullanım için:

window.addEventListener("keydown", function (event) {
    basilanTuslar[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", function (event) {
    basilanTuslar[event.key.toLowerCase()] = false;
});

Böylece W ve w ayrı ayrı kontrol edilmek zorunda kalmaz.

enemy.js - Düşman Yapay Zekası ve Sınıfları
Prompt

Bazı düşmanların düz gelmek yerine hafif zikzak çizerek ilerlemesini istiyorum. Bunu Math.sin kullanarak nasıl yapabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, düşmanın temel hareket yönüne ek olarak zamana bağlı bir sinüs değeri kullanılabileceğini açıkladı. Math.sin fonksiyonu düzenli olarak -1 ile 1 arasında değer üretir. Bu değer belli bir genişlikle çarpıldığında düşman sağa sola veya yukarı aşağı dalgalı hareket eder.

Bu yöntem özellikle hızlı düşmanların daha tahmin edilmesi zor ve canlı görünmesi için kullanıldı.

Örnek Kod Mantığı
// Düşmanın kendi zaman sayacını artırıyoruz.
dusman.zaman += 0.05;

// Normal ilerleme hareketi
dusman.x -= dusman.hiz;

// Sinüs ile dikey zikzak hareketi
dusman.y += Math.sin(dusman.zaman) * dusman.zikzakGucu;

Daha kontrollü kullanım:

dusman.x += dusman.vx;
dusman.y += dusman.vy + Math.sin(dusman.zaman) * 2;

Bu yapı sayesinde düşman tamamen rastgele değil, düzenli ama dinamik bir hareket yapar.

Prompt

Uzaktan saldıran düşmanın geminin o anki konumunu hesaplayıp o yöne lazer göndermesi için nasıl bir yön vektörü hesaplamalıyım?

Alınan Cevap / Kullanım Şekli

Yapay zeka, düşman ile oyuncu arasındaki X ve Y farklarının alınmasını, ardından bu farkların toplam mesafeye bölünerek birim yön vektörü oluşturulmasını önerdi. Bu birim vektör lazerin hız değeriyle çarpılarak merminin X/Y hızları hesaplandı.

Bu yöntem, düşman mermilerinin oyuncunun bulunduğu yöne doğru ilerlemesini sağladı.

Örnek Kod Mantığı
const dx = oyuncu.x - dusman.x;
const dy = oyuncu.y - dusman.y;

const mesafe = Math.hypot(dx, dy);

// Sıfıra bölünme hatasını engelliyoruz.
if (mesafe > 0) {
    const yonX = dx / mesafe;
    const yonY = dy / mesafe;

    dusmanMermileri.push({
        x: dusman.x,
        y: dusman.y,
        vx: yonX * lazerHizi,
        vy: yonY * lazerHizi,
        yaricap: 5,
        hasar: 1
    });
}

Burada yonX ve yonY, düşmandan oyuncuya giden yönü temsil eder.

Prompt

Farklı düşman tiplerinin çıkma ihtimallerini ağırlıklı rastgele seçim ile nasıl belirleyebilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, her düşman tipine bir ağırlık değeri verilebileceğini açıkladı. Ağırlık değeri yüksek olan düşmanların seçilme ihtimali daha fazla olur. Toplam ağırlık üzerinden rastgele bir sayı üretilir ve bu sayı hangi düşman aralığına denk gelirse o düşman tipi seçilir.

Bu sistem, her düşmanın tamamen eşit ihtimalle çıkmasını engelleyerek daha dengeli dalga yapısı oluşturmak için kullanıldı.

Örnek Kod Mantığı
const dusmanTipleri = [
    { tip: "normal", agirlik: 50 },
    { tip: "hizli", agirlik: 25 },
    { tip: "tank", agirlik: 15 },
    { tip: "uzakci", agirlik: 10 }
];

function agirlikliDusmanSec() {
    const toplamAgirlik = dusmanTipleri.reduce((toplam, dusman) => {
        return toplam + dusman.agirlik;
    }, 0);

    let rastgele = Math.random() * toplamAgirlik;

    for (const dusman of dusmanTipleri) {
        rastgele -= dusman.agirlik;

        if (rastgele <= 0) {
            return dusman.tip;
        }
    }

    return "normal";
}

Bu sistemde normal düşman daha sık, uzakci veya tank gibi özel düşmanlar daha seyrek çıkar.

projectile.js - Mermi ve Atış Fiziği
Prompt

Mermi geminin merkezinden değil, namlusunun ucundan çıksın istiyorum. Bunu Math.cos ve Math.sin ile nasıl hesaplayabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, geminin baktığı açı kullanılarak namlu ucunun konumunun hesaplanabileceğini açıkladı. Math.cos(aci) yatay eksendeki uzaklığı, Math.sin(aci) dikey eksendeki uzaklığı verir. Bu değerler geminin merkez konumuna eklenerek merminin başlangıç noktası belirlenir.

Bu yöntem sayesinde mermi geminin ortasından değil, görsel olarak namluya yakın bir noktadan çıkmaktadır.

Örnek Kod Mantığı
const namluUzunlugu = 35;

const baslangicX = oyuncu.x + Math.cos(oyuncu.aci) * namluUzunlugu;
const baslangicY = oyuncu.y + Math.sin(oyuncu.aci) * namluUzunlugu;

mermiler.push({
    x: baslangicX,
    y: baslangicY,
    vx: Math.cos(oyuncu.aci) * mermiHizi,
    vy: Math.sin(oyuncu.aci) * mermiHizi,
    yaricap: 4,
    hasar: 1
});
Prompt

Merminin tıklanan hedefe doğru sabit hızla gitmesi için mesafe ve birim vektör hesabını nasıl yapmalıyım?

Alınan Cevap / Kullanım Şekli

Yapay zeka, merminin hedefe doğru gitmesi için hedef noktası ile mermi başlangıç noktası arasındaki farkın alınması gerektiğini açıkladı. Daha sonra bu fark mesafeye bölünerek yön vektörü elde edilir. Bu yön vektörü hız ile çarpıldığında mermi sabit hızla hedefe doğru ilerler.

Örnek Kod Mantığı
function mermiOlustur(baslangicX, baslangicY, hedefX, hedefY) {
    const dx = hedefX - baslangicX;
    const dy = hedefY - baslangicY;

    const mesafe = Math.hypot(dx, dy);

    if (mesafe === 0) return;

    const yonX = dx / mesafe;
    const yonY = dy / mesafe;

    mermiler.push({
        x: baslangicX,
        y: baslangicY,
        vx: yonX * mermiHizi,
        vy: yonY * mermiHizi,
        yaricap: 4
    });
}

Bu yapı fareyle nişan alma sisteminde kullanışlıdır.

Prompt

Dizi içinde gezerken ekran dışına çıkan mermileri splice ile siliyorum. Index kayması olmaması için nasıl bir yöntem kullanmalıyım?

Alınan Cevap / Kullanım Şekli

Yapay zeka, dizi içinde eleman silinirken index kayması oluşabileceğini açıkladı. Bunun için ya döngünün sondan başa doğru kurulması ya da silme işleminden sonra i-- yapılması önerildi.

Projede ekran dışına çıkan mermilerin silinmesi için bu mantık kullanıldı.

Örnek Kod Mantığı
for (let i = mermiler.length - 1; i >= 0; i--) {
    const mermi = mermiler[i];

    mermi.x += mermi.vx;
    mermi.y += mermi.vy;

    const ekranDisinda =
        mermi.x < 0 ||
        mermi.x > canvas.width ||
        mermi.y < 0 ||
        mermi.y > canvas.height;

    if (ekranDisinda) {
        mermiler.splice(i, 1);
    }
}

Sondan başa gidildiği için eleman silinse bile sıradaki kontroller bozulmaz.

modularLevel.js - Oyun Motoru, Çarpışma ve Seviye Tasarımı
Prompt

Gemi, düşman, mermi ve taret gibi dairesel hitboxlara sahip nesnelerin çarpışmasını Öklid mesafesiyle nasıl kontrol edebilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, iki dairesel nesnenin çarpışıp çarpışmadığını anlamak için merkezleri arasındaki mesafenin hesaplanması gerektiğini açıkladı. Eğer bu mesafe, iki nesnenin yarıçaplarının toplamından küçükse çarpışma gerçekleşmiş kabul edilir.

Bu yöntem mermi-düşman, düşman-oyuncu, oyuncu-eşya ve taret-düşman gibi kontrollerde kullanılabilecek temel çarpışma mantığıdır.

Örnek Kod Mantığı
function daireCarpisiyorMu(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    const mesafe = Math.sqrt(dx * dx + dy * dy);

    return mesafe < a.yaricap + b.yaricap;
}

Daha kısa kullanım:

function daireCarpisiyorMu(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.yaricap + b.yaricap;
}

Örnek kullanım:

if (daireCarpisiyorMu(mermi, dusman)) {
    dusman.can -= mermi.hasar;
    mermi.silinecek = true;
}
Prompt

Düşmanların aniden ekran ortasında doğmaması için onları kameranın gördüğü alanın dış kenarlarından nasıl üretebilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, düşmanların görünür alanın biraz dışında oluşturulmasını önerdi. Böylece düşmanlar oyuncunun gözünün önünde bir anda belirmez, sahneye dışarıdan geliyormuş gibi görünür.

Bu yöntem oyun hissini daha doğal yapar ve düşman doğma sistemini daha profesyonel gösterir.

Örnek Kod Mantığı
function dusmanSpawnNoktasiUret() {
    const kenar = Math.floor(Math.random() * 4);
    const bosluk = 80;

    let x;
    let y;

    if (kenar === 0) {
        // Üst kenar
        x = Math.random() * canvas.width;
        y = -bosluk;
    } else if (kenar === 1) {
        // Sağ kenar
        x = canvas.width + bosluk;
        y = Math.random() * canvas.height;
    } else if (kenar === 2) {
        // Alt kenar
        x = Math.random() * canvas.width;
        y = canvas.height + bosluk;
    } else {
        // Sol kenar
        x = -bosluk;
        y = Math.random() * canvas.height;
    }

    return { x, y };
}
Prompt

Saniye cinsinden tutulan süreyi ekranda 00:00 biçiminde nasıl gösterebilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, toplam saniyenin dakikaya ve kalan saniyeye ayrılmasını önerdi. Daha sonra padStart(2, "0") kullanılarak tek basamaklı değerlerin başına sıfır eklendi.

Bu yöntem oyun süresi, hayatta kalma süresi veya dalga zamanlayıcısı gibi alanlarda kullanıldı.

Örnek Kod Mantığı
function sureFormatla(toplamSaniye) {
    const dakika = Math.floor(toplamSaniye / 60);
    const saniye = toplamSaniye % 60;

    return `${String(dakika).padStart(2, "0")}:${String(saniye).padStart(2, "0")}`;
}

Kullanım:

ctx.fillText("Süre: " + sureFormatla(oyunSuresi), 20, 30);
Prompt

Kamera gemiyi takip etsin ama harita sınırlarının dışına çıkıp boş alan göstermesin. Bunu clamp mantığıyla nasıl yapabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, kameranın oyuncuyu merkezde tutacak şekilde hesaplanmasını, ardından harita sınırlarının dışına çıkmaması için minimum ve maksimum değerler arasında sıkıştırılmasını önerdi.

Bu mantık sayesinde kamera oyuncuyu takip ederken haritanın dışındaki boş alanları göstermez.

Örnek Kod Mantığı
function clamp(deger, min, max) {
    return Math.max(min, Math.min(max, deger));
}

kamera.x = oyuncu.x - canvas.width / 2;
kamera.y = oyuncu.y - canvas.height / 2;

kamera.x = clamp(kamera.x, 0, harita.genislik - canvas.width);
kamera.y = clamp(kamera.y, 0, harita.yukseklik - canvas.height);

Çizim yaparken kamera konumu çıkarılır:

ctx.drawImage(
    oyuncuResmi,
    oyuncu.x - kamera.x,
    oyuncu.y - kamera.y,
    oyuncu.genislik,
    oyuncu.yukseklik
);
Prompt

Yerdeki kalkan eşyası gemiye yaklaşınca bir anda yok olmak yerine gemiye doğru yavaşça gelsin. Bunu interpolasyon veya lerp mantığıyla nasıl yapabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, eşyanın mevcut konumunun hedef konuma küçük oranlarla yaklaştırılabileceğini açıkladı. Bu yönteme lerp, yani doğrusal interpolasyon denir. Her karede eşya oyuncuya biraz daha yaklaşır ve bu da daha yumuşak bir toplama animasyonu oluşturur.

Örnek Kod Mantığı
function lerp(baslangic, hedef, oran) {
    return baslangic + (hedef - baslangic) * oran;
}

kalkan.x = lerp(kalkan.x, oyuncu.x, 0.08);
kalkan.y = lerp(kalkan.y, oyuncu.y, 0.08);

Oyuncuya yeterince yaklaşınca toplama işlemi yapılabilir:

const mesafe = Math.hypot(kalkan.x - oyuncu.x, kalkan.y - oyuncu.y);

if (mesafe < 20) {
    oyuncu.kalkanSayisi++;
    kalkan.silinecek = true;
}
Prompt

Toplanan kalkan modüllerinin geminin çevresinde düzgün bir sıra halinde durması için hedef noktaları nasıl hesaplayabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, geminin baktığı açıya göre ön, arka ve yan yönlerin hesaplanabileceğini açıkladı. Modüller doğrudan oyuncunun üstüne konulmak yerine geminin arkasında veya yanında sıralanabilir. Böylece hem görsel düzen oluşur hem de modüllerin kalkan görevi daha anlaşılır hale gelir.

Örnek Kod Mantığı
function modulHedefKonumuHesapla(oyuncu, index) {
    const mesafe = 35 + index * 25;

    // Geminin baktığı yönün tersine doğru modülleri diziyoruz.
    const arkaAci = oyuncu.aci + Math.PI;

    return {
        x: oyuncu.x + Math.cos(arkaAci) * mesafe,
        y: oyuncu.y + Math.sin(arkaAci) * mesafe
    };
}

Modülü hedef noktaya yumuşak taşımak için:

const hedef = modulHedefKonumuHesapla(oyuncu, i);

modul.x += (hedef.x - modul.x) * 0.1;
modul.y += (hedef.y - modul.y) * 0.1;
Prompt

Gemi hasar aldığında canın hemen azalması yerine en yakındaki kalkan modülünün kırılmasını nasıl yapabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, oyuncuya gelen saldırıya en yakın kalkan modülünün bulunmasını önerdi. Eğer oyuncunun kalkan modülü varsa önce bu modül yok edilir, oyuncunun canı daha sonra azalır. Böylece kalkan sistemi gerçekten savunma mekaniği gibi çalışır.

Örnek Kod Mantığı
function enYakinModuluBul(saldiri, moduller) {
    let enYakinIndex = -1;
    let enKisaMesafe = Infinity;

    for (let i = 0; i < moduller.length; i++) {
        const modul = moduller[i];
        const mesafe = Math.hypot(saldiri.x - modul.x, saldiri.y - modul.y);

        if (mesafe < enKisaMesafe) {
            enKisaMesafe = mesafe;
            enYakinIndex = i;
        }
    }

    return enYakinIndex;
}

Kullanım:

function oyuncuHasarAl(saldiri) {
    if (kalkanModulleri.length > 0) {
        const index = enYakinModuluBul(saldiri, kalkanModulleri);

        if (index !== -1) {
            kalkanModulleri.splice(index, 1);
            return;
        }
    }

    oyuncu.can -= 1;
}
Prompt

Oyuncu ateş ettiğinde yardımcı modüller de aynı hedefe doğru hafif açılı mermiler atsın. Bunu nasıl tasarlayabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, ana atış açısına küçük açı farkları eklenerek her modülün ayrı mermi atabileceğini açıkladı. Bu sayede modül sayısı arttıkça oyuncunun ateş gücü artar, fakat daha fazla modül toplamak hareketi yavaşlatabileceği için risk-ödül dengesi oluşur.

Örnek Kod Mantığı
function modulAtisiYap(modul, anaAci, index) {
    const sapma = (index - kalkanModulleri.length / 2) * 0.08;
    const atisAci = anaAci + sapma;

    mermiler.push({
        x: modul.x,
        y: modul.y,
        vx: Math.cos(atisAci) * mermiHizi,
        vy: Math.sin(atisAci) * mermiHizi,
        yaricap: 3,
        hasar: 1
    });
}

Ana ateş fonksiyonunda:

function atesEt() {
    // Ana geminin mermisi
    mermiOlustur(oyuncu.x, oyuncu.y, fare.x, fare.y);

    // Yardımcı modüllerin mermileri
    for (let i = 0; i < kalkanModulleri.length; i++) {
        modulAtisiYap(kalkanModulleri[i], oyuncu.aci, i);
    }
}
Prompt

Kalkan modülü topladıkça gemi biraz yavaşlasın ama hız belli bir sınırın altına düşmesin. Bunu nasıl sınırlandırabilirim?

Alınan Cevap / Kullanım Şekli

Yapay zeka, modül sayısı arttıkça oyuncunun hızının belli oranda azaltılabileceğini, fakat oyunun oynanamaz hale gelmemesi için minimum hız sınırı koyulması gerektiğini açıkladı.

Bu sistem oyuna güzel bir risk-ödül dengesi katar: Daha fazla modül daha fazla savunma ve ateş gücü sağlar, ancak oyuncunun hareket kabiliyeti azalır.

Örnek Kod Mantığı
function oyuncuHiziniHesapla() {
    const temelHiz = 5;
    const modulSayisi = kalkanModulleri.length;

    // Her modül hızı %5 düşürür.
    const hizCarpani = 1 - modulSayisi * 0.05;

    // Hız en fazla %40'a kadar düşebilir.
    const sinirliCarpan = Math.max(0.4, hizCarpani);

    return temelHiz * sinirliCarpan;
}

oyuncu.hiz = oyuncuHiziniHesapla();