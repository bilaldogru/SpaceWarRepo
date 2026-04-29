# Space War: Galaktik Savunma

Bu proje, [Üniversite/Ders Adı] Web Tabanlı Programlama dersi kapsamında HTML5 Canvas, JavaScript ve CSS kullanılarak geliştirilmiş 2 boyutlu bir uzay savunma (dalga savunma) oyunudur. Projede hiçbir hazır oyun motoru veya JS oyun kütüphanesi kullanılmamıştır.

## 🔗 Proje Bağlantıları
* **Oynanabilir Canlı Sürüm:** [Github Pages veya itch.io Linki Buraya]
* **Oyun Tanıtım Videosu / Sunum Dosyası:** [Varsa Link veya PDF adı]

## 🎯 Hedeflenen Oyun ve Temel Mekanik
* **Seçilen Referans Oyun:** [İlham Alınan İtch.io Oyununun Adı]
* **Referans Oyun Linki:** [https://ornekoyun.itch.io/oyun-linki]
* **Uyarlanan Temel Mekanik:** Oyuncu, merkezdeki uzay gemisini kontrol ederek 4 farklı gezegende (bölümde) üzerine akın akın gelen düşman dalgalarına (wave) karşı hayatta kalmaya çalışır. Düşmanlar oyuncuya doğru farklı hareket kalıplarıyla (düz, zig-zag) yaklaşır. Hedef, geminin canı sıfırlanmadan mümkün olan en yüksek skoru elde etmektir.

## 🎮 Kontroller ve Oynanış (Challenge)
Oyundaki temel zorluk (challenge), düşman sayısının her dalgada artması ve mermi kısıtlaması/atış hızı dengesini koruyarak gemiyi doğru konumlandırmaktır.

* **W, A, S, D:** Uzay gemisini yukarı, sola, aşağı ve sağa hareket ettirir.
* **Fare (Mouse) Hareketi:** Geminin namlusunu (açısını) farenin olduğu yöne döndürür.
* **Fare Sol Tık (Left Click):** İmlecin bulunduğu yöne doğru ateş eder.

## 👥 Geliştirici Ekip ve Görev Dağılımı
* **[Öğrenci Adı Soyadı 1] ([Öğrenci No]):** Oyuncu hareketi, fizik motoru ve çarpışma (collision) testleri (`player.js`, `projectile.js`).
* **[Öğrenci Adı Soyadı 2] ([Öğrenci No]):** Düşman yapay zekası, dalga (wave) sistemi ve 4 farklı gezegenin tasarımı (`enemy.js`, `level.js`).
* **[Öğrenci Adı Soyadı 3] ([Öğrenci No]):** Arayüz (UI), skor sistemi, menü geçişleri ve oyun içi seslerin/müziklerin entegrasyonu (`ui.js`, `audio.js`).
* **[Öğrenci Adı Soyadı 4] ([Öğrenci No]):** Oyun motorunun birleştirilmesi (`main.js`), dokümantasyon, AI prompt kayıtları (`AI.md`) ve projenin canlıya alınması.

## 📸 Ekran Görüntüleri
*(Not: Oyununuzun ekran görüntülerini `assets/images/` klasörüne ekleyip aşağıdaki yolları güncelleyin)*

![Ana Menü Görünümü](assets/images/ekran-goruntusu-1.png)
*Şekil 1: Oyunun ana menü ve arayüz tasarımı.*

![Oyun İçi Savaş Alanı](assets/images/ekran-goruntusu-2.png)
*Şekil 2: 2. Gezegende düşman dalgasına karşı savunma yaparken.*

## 📂 Kaynakça ve Varlıklar (Assets)
Bu projede kullanılan ve takımımıza ait olmayan tüm görsel ve işitsel materyallerin kaynakları aşağıdadır:
* **Oyuncu Gemisi Görseli:** [Sitenin Adı veya Sanatçının Linki]
* **Düşman Görselleri:** [Sitenin Adı veya Sanatçının Linki]
* **Arka Plan Müzikleri:** [Sitenin Adı - Örn: freesound.org / Yazar Adı]
* **Lazer ve Patlama Sesleri:** [Sitenin Adı]
* **Font (Orbitron & Rajdhani):** Google Fonts