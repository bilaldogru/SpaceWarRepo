# Vega Gezegeni ve Dinamik Taret Sistemi Güncellemesi

Bu güncelleme ile oyuna Vega gezegeni eklenmiş ve gezegen bazlı taret kısıtlama sistemi getirilmiştir.

## 1. Vega Gezegeni (`js/vega.js`)
Vega gezegeni, Astra ve Nora ile uyumlu ancak kendine has görsel efektlere sahip olacak şekilde yapılandırıldı.
- **Atmosfer:** Fütüristik **Cyan (Camgöbeği)** teması kullanıldı.
  - Ana Renk: `#00d2ff`
  - Parlama: `#5ae0ff`
  - Derinlik (Gradyan): `#004e92`
- **Oynanış:** Sol tarafta yarım daire şeklinde gezegen ve Astra ile aynı temel savunma mantığı (üs, düşman dalgaları) entegre edildi.

## 2. Dinamik Taret Sistemi (`js/level.js`)
`level.js` dosyasına eklenen `taretleriGuncelle` fonksiyonu ile her gezegenin zorluk seviyesine göre açık taret sayısı belirlendi:
- **Astra:** 2 Taret açık.
- **Vega:** 4 Taret açık.
- **Nora:** 5 Taret açık.

## 3. Teknik Özet
- **Görsel:** `canvas` arka planı ve gölge efektleri seçilen gezegene göre dinamik olarak değişmektedir.
- **HUD:** Üst menü statları ve mermi yönetim sistemi diğer gezegenlerle birebir aynı tutularak arayüz bütünlüğü korundu.
- **Geliştirme:** Yeni gezegenler için `js/main.js`'i değiştirmeye gerek kalmadan `level.js` üzerinden tam kontrol sağlandı.

## 4. Galaxy Radar Güncellemesi (`js/main.js`)
Stratejik görünümü iyileştirmek adına mini harita (radar) sistemi güncellendi:
- **Gezegen Gösterimi:** Radarın sol kısmına, gezegenin konumunu ve kapsama alanını temsil eden dinamik bir yarım daire eklendi. Bu daire, seçilen gezegenin rengini yansıtmaktadır.
- **Oyuncu Gemisi:** Oyuncunun konumu radarda parlak **mavi bir daire** olarak işaretlendi. Oyuncu simgesi, düşman birimlerinden daha büyük ve belirgin hale getirilerek takip kolaylığı sağlandı.
- **Görsel İyileştirmeler:** Düşman birimleri (kırmızı noktalar) ve oyuncu simgesi için parlama (glow) efektleri eklenerek derinlik algısı artırıldı.

## 5. Hikaye ve Arayüz Güncellemeleri
Oyunun derinliğini artırmak ve kullanıcı deneyimini iyileştirmek adına aşağıdaki düzenlemeler yapılmıştır:
- **Dinamik Hikaye Sistemi:** "Hakkında" (About) bölümündeki hikaye metni, artık dış bir dosya olan `Hikaye.txt` üzerinden dinamik olarak okunmaktadır. Bu sayede oyun kodunu değiştirmeden hikaye metni güncellenebilmektedir.
- **Navigasyon İyileştirmesi:** "Hakkında" ekranının altına, ana menü tasarımlarıyla uyumlu bir **"ANA MENÜ"** butonu eklenmiştir. Bu buton, oyuncuların menüye hızlıca dönmesini sağlar.
- **Metin Seçimi Engelleme:** Kullanıcıların oyun sırasında yanlışlıkla metin seçmesini önlemek adına tüm arayüz öğelerinde metin seçimi (text-selection) devre dışı bırakılmıştır.

## 6. Dosya Yapısı ve İşlevleri
Yapılan güncelleme ile projeye eklenen veya kritik değişiklik yapılan dosyalar şunlardır:

| Dosya Yolu | İşlevi |
| :--- | :--- |
| **`js/vega.js`** | Vega gezegeninin fiziksel özelliklerini, atmosfer renklerini ve bölüme özel düşman/mermi ayarlarını içerir. |
| **`js/level.js`** | Gezegen seçim mantığını yönetir. Seçilen gezegene göre taret sayısını ve atmosfer efektlerini dinamik olarak ayarlar. |
| **`js/main.js`** | Oyunun ana döngüsünü ve Galaxy Radar sistemini barındırır. Radar üzerindeki gezegen ve oyuncu simgeleri burada çizilir. |
| **`Hikaye.txt`** | "Hakkında" bölümünde görünen hikaye metnini barındırır. Kod bilgisi gerektirmeden içerik değiştirilebilir. |
| **`Vega.md`** | Yapılan tüm bu geliştirmeleri, teknik detayları ve kullanım kılavuzunu içeren rapor dosyasıdır. |
