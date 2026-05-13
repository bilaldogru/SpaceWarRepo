# SpaceWarRepo — Eksiklikler & Geliştirme Notları
> Güncelleme: Mayıs 2026 | Branch: hud-redesign

---

## 🔴 KRİTİK — Hemen Yapılmalı

### `LevelManager` Sınıfı Kullanılmıyor
`level.js` sonunda tam yazılmış ama hiçbir yerde kullanılmayan bir sınıf duruyor.
Silmek ya da entegre etmek gerekiyor — şimdilik bırakıldı.

---

## 🟡 GELİŞTİRİLMELİ — Oynanışı Etkiliyor

### Düşman Görselleri Çok Tekdüze
Tüm düşmanlar kare çiziliyor. 5 tip var ama büyüklük farkı dışında ayrımlanamıyor.
- Her tip için farklı rotasyon animasyonu veya renk varyasyonu eklenebilir
- Tip-5 boss için özel çizim (parlayan kenar, farklı şekil)

### Harita Kenarında Spawn Sorunu
Oyuncu haritanın kenarına gittiğinde bazı düşmanlar görünür alanda spawn oluyor.
`randomWorldEdgeSpawn` kamera pozisyonunu hesaba katmıyor.

### Modül Can Barı Takip Edilemiyor
Canvas üzerindeki modül can barları çok küçük (36px). 6 modülde hangisinin hasar gördüğünü görmek zor.
- Hover ile büyük tooltip gösterilebilir

### Satın Alma Sistemi Anlatılmıyor
Modülü sürükle-bırak ile alıyorsun ama bu hiçbir yerde yazılmıyor.
Aynı anda maksimum 2 modül aktif olabiliyor — bu kural oyuncuya gösterilmiyor.
Para gidip modül gelmeyince oyuncu ne olduğunu anlamıyor.

### Combo Motivasyonu Yok
Combo x1–x9 arası artıyor ve skora çarpan uygulanıyor.
Ama skor tablosu yok, kayıt yok, kimseyle karşılaştırma yok.
Combonun neden önemli olduğu belli değil — motivasyon zinciri kırık.

### Nora Zorluk Eğrisi Dik ve Monoton
İlk 3 dalga neredeyse aynı hissettiriyor. Sonra tip-5 birdenbire geliyor.
Gradyan zorluk yok — oyuncu "kolay" → "imkansız" atlayışı yaşıyor.

### Ölüm Öğretici Değil
Can bitince "Gemi Yok Oldu" ekranı açılıyor ama oyuncuya ne yaptığını açıklamıyor.
Hangi dalga, kaçıncı dakika, ne kadar hasar aldı — bunların gösterilmesi gerekiyor. *(İstatistik ekranı eklendi ama daha genişletilebilir)*

---

## 🟢 YENİ ÖZELLİK ÖNERİLERİ

### Ekran Sarsıntısı (Screen Shake)
Büyük düşman ölümlerinde veya hasar alındığında canvas 2-3 frame hafif titremeli.
Bu tek başına "ucuz hissi"ni büyük ölçüde kaldırır. En kolay yüksek etki.

### Dalga Arası Nefes Süresi
Dalga bitince hemen yeni dalga başlıyor. 4-5 saniyelik ara:
- "Dalga Temizlendi" bildirimi
- Oyuncu modüllerini yeniden konumlandırabilir
- Modüller can yenileyebilir

### Boss Dalgası (Nora 7. Dalga)
Son dalgada özel "final dalga" modu:
- Tüm tip-5 birden gelir
- Ekranda "SON DALGA" uyarısı
- Müzik tempo artar

### Gemi Bölüme Göre Görünüm
- Astra: mor glow
- Vega: cyan glow
- Nora: turuncu/alev efekt
- Kron: yeşil iz bırakma

### Harita Tehlike Halkası
Üssün etrafında soluk bir "savunma yarıçapı" halkası.
Oyuncu bu halkadan çıkınca uyarı rengi devreye girer.

### Modül Yükseltme Sistemi
Aktif modüle tekrar para yatırınca süre uzuyor (bu var).
Alternatif: seviye atlama — Rapid Lv2: daha fazla hasar, Lv3: ikili atış.

### Düşman Yapay Zekası
Düşmanlar direkt oyuncuya koşuyor.
- Grup gelince birbirinden mesafe tutsun (flocking)
- Tip-3/4 modülleri hedef alsın

### Mobil / Dokunmatik Destek
Şu an tamamen fare + klavye.
- Sürükleme: oyuncuyu takip
- Ekranın sağı: ateş

---

## 📊 Açık Maddeler — Öncelik Sırası

| Özellik | Zorluk | Etki |
|---|---|---|
| Ekran sarsıntısı | 🟢 Kolay | 🔥 Çok Yüksek |
| Dalga arası nefes süresi | 🟡 Orta | 🔥 Yüksek |
| Boss dalgası (Nora 7. dalga) | 🟡 Orta | 🔥 Yüksek |
| Satın alma kuralları göster | 🟢 Kolay | 🔥 Yüksek |
| Düşman görselleri çeşitlendirme | 🟡 Orta | 🟡 Orta |
| Harita tehlike halkası | 🟡 Orta | 🟡 Orta |
| Gemi glow bölüme göre | 🟢 Kolay | ⚪ Düşük |
| Modül yükseltme sistemi | 🔴 Zor | 🔥 Yüksek |
| Mobil destek | 🔴 Zor | 🟡 Orta |
| LevelManager temizliği | 🟢 Kolay | ⚪ Düşük |

---

## 🎯 Tarafsız Oyun Değerlendirmesi
> *Antigravity AI — Mayıs 2026 — Kod tabanının tamamı okunarak yazılmıştır.*

### Gerçekten İyi Olan Şeyler
- **Teknik altyapı sağlam.** Sıfır kütüphane, saf canvas, factory pattern ile temiz state yönetimi. Bu seviyede bir web oyunu için standarın üstünde.
- **Görsel kimlik tutarlı.** Sci-fi HUD, Orbitron fontu, neon glow, glassmorphism — özenle düşünülmüş.
- **Yıldırım Zinciri mekanik + görsel birlikte tasarlanmış.** Zigzag çizimi, fade-out, ikincil geçiş çizgisi.

### Dürüst Sorunlar
- **Feedback döngüsü zayıf.** Parçacık efekti eklendi ama screen shake yok. Büyük patlama ekranı sallamalı — bu tek satır kod, farkı büyük.
- **Gemi hareketi hantal.** `hiz: 2.2`, speed modülüyle ~4 çıkıyor. Hız değil ivmelenme eklenmeli — yumuşak başlayıp hızlanma daha iyi hissettirir.
- **Satın alma sezgisel değil.** Sürükle-bırak hiçbir yerde anlatılmıyor. "2 modül sınırı" oyuncuya gösterilmiyor. Frustration kaçınılmaz.
- **Combo anlamsız.** Skora çarpan uyguluyor ama leaderboard, kayıt, karşılaştırma yok. Oyuncu neden combo yapayım diye sormaz bile.
- **Nora'nın zorluk eğrisi kırık.** "Kolay → İmkansız" atlayışı var. Gradyan zorluk olmalı.

### Genel Puan

| Kriter | Puan |
|---|---|
| Teknik kalite | 7/10 |
| Görsel tasarım | 8/10 |
| Oynanabilirlik (game feel) | 5/10 |
| Feedback (ses/görsel/sarsıntı) | 4/10 |
| Öğrenme eğrisi (tutorial) | 3/10 |
| Tekrar oynanabilirlik | 4/10 |

**Sonuç:** Ders projesi için güçlü bir çalışma. Görsel olarak iyi ilk izlenim veriyor. Ama ilk 5 dakikanın ötesinde oyuncuyu tutacak mekanik derinlik henüz yok. En kolay ve en yüksek etkili iyileştirme: **ekran sarsıntısı + modül açıklama tooltip'i.**

---

*Son güncelleme: Mayıs 2026 — Antigravity AI*
