# 🚀 SpaceWarRepo — Proje Analizi & Eksiklikler

> Tarih: 2026-05-01 | Analiz Kapsamı: Tüm JS modülleri, HTML, CSS, Assets

---

## 📁 Mevcut Dosya Yapısı

| Dosya | Durum | Boyut |
|---|---|---|
| `main.js` | ✅ Çalışıyor | 6.4 KB |
| `nora.js` | ✅ Çalışıyor | 19.6 KB |
| `astra.js` | ✅ Çalışıyor | 11.6 KB |
| `enemy.js` | ✅ Çalışıyor | 6.3 KB |
| `level.js` | ⚠️ Karışık | 5.0 KB |
| `player.js` | ⚠️ Basit | 1.2 KB |
| `projectile.js` | ⚠️ Basit | 1.4 KB |
| `audio.js` | ❌ Boş | 0 KB |
| `ui.js` | ⚠️ Minimal | 1.8 KB |
| `input.js` | ✅ Yeterli | 1.2 KB |

---

## 🔴 KRİTİK EKSİKLER (Oynanabilirliği Etkiliyor)

### 1. `audio.js` Tamamen Boş
Oyunda hiç ses yok. Bu bir uzay oyunu için büyük bir eksilik.
- [ ] Ateş sesi
- [ ] Düşman ölüm/patlama sesi
- [ ] Queen ışınlanma/doğurma sesi
- [ ] Arka plan ambient müziği
- [ ] Bölüm başlangıç/bitiş müziği
- [ ] Kalkan aktive olma sesi

### 2. `Vega` ve `Kron` Gezegenleri Yok
`index.html`'de haritada görünüyorlar ama tıklayınca **hiçbir şey olmuyor**.
`level.js`'de sadece Astra ve Nora'nın click listener'ı var.
- [ ] `vega.js` bölüm dosyası oluşturulmalı
- [ ] `kron.js` bölüm dosyası oluşturulmalı
- [ ] `level.js`'e Vega ve Kron click listener'ları eklenmeli

### 3. `LevelManager` Sınıfı Kullanılmıyor
`level.js` içinde tam yazılmış bir `LevelManager` class'ı var ama hiçbir yerde kullanılmıyor.
Gereksiz yer kaplıyor veya entegre edilmesi gerekiyor.
- [ ] Ya kullanılmalı ya da silinmeli

### 4. Oyun Sonu Sonrası Geri Dönüş Yok
Astra veya Nora'yı bitirince (kazan/kaybet ekranı çıkıyor) oyuncu **menüye dönemez**.
Oyun sonunda "Ana Menüye Dön" butonu veya otomatik geçiş yok.
- [ ] `oyunSonuEkraniCiz` fonksiyonlarına geri dönüş butonu eklenmeli
- [ ] Ya da belirli süre sonra otomatik menüye dönüş

### 5. Skor / Puan Sistemi Eksik
`para` değişkeni var ama hiçbir zaman gerçek bir skor olarak işlenmez.
Leaderboard veya bölüm sonu ekranında gösterilmiyor.
- [ ] Bölüm sonu istatistik ekranı eklenmeli (öldürülen düşman, harcanan mermi, geçen süre)

---

## 🟡 GELİŞTİRİLMESİ GEREKEN YERLER

### 6. Gemi Hızı Çok Yavaş
`player.js`'de `hiz: 2` — gemi çok ağır hareket ediyor.
Düşman lazerlerinden ve çarpmalardan kaçmak için **4-5** olmalı.
- [ ] `hiz: 2` → `hiz: 4` veya `hiz: 5`

### 7. Mermi Sistemi Tek Tip
Sadece tek tür mermi var (mavi daire). Oyunun ilerleyen bölümlerinde farklı ateş türleri eklenebilir:
- [ ] **Çift atış** (yan yana 2 mermi)
- [ ] **Patlayıcı mermi** (belirli çapta alan hasarı)
- [ ] **Lazer demeti** (kesintisiz ışın)

### 8. Taret Slotları Çalışmıyor
HUD'da 5 taret slotu görünüyor ama **hiçbiri işlevsel değil**. Sadece görsel.
Satın alma sistemi de yok (para var ama harcanmıyor).
- [ ] Taret satın alma sistemi
- [ ] Taretlerin otomatik ateş etmesi

### 9. `astra.js` Sadece Normal Düşman Kullanıyor
Astra bölümü çok basit — sadece `NormalEnemy` (kamikaze).
Biraz çeşitlilik olmalı ama Astra birinci gezegen olduğu için kolay kalmalı.
- [ ] Sonraki turn'larda az sayıda High eklenebilir

### 10. Gemi Haritanın Sol Tarafına Gidebiliyor
Gemi karadeliğin veya gezegenin içine girebilir.
- [ ] Minimum X sınırı: `savunmaUssuX`'tan sola gidemez olmalı

### 11. Bölüm Geçişi / Progression Yok
Astra'yı bitirince otomatik Nora açılmıyor.
Gezegenler arasında ilerleme (unlock) sistemi yok.
- [ ] Astra kazanılınca Nora kilidi açılmalı
- [ ] Kilitli gezegenler haritada farklı gösterilmeli

### 12. Galaxy Radar Lazerler Göstermiyor
Radar düşmanları gösteriyor ama High düşmanların attığı lazerler radar'da görünmüyor.
- [ ] `main.js`'deki `galaxyRadarCiz` fonksiyonuna lazer noktaları eklenmeli

---

## 🟢 ÖNERİLEN YENİ ÖZELLİKLER

### 13. 🔊 Ses Sistemi (audio.js)
```
- Ateş sesi: "pew" efekti (her sol tık / boşluk)
- Patlama sesi: düşman ölünce küçük boom
- Kalkan sesi: "bzzt" — kalkan aktive olunca
- Müzik: her gezegen için farklı ambient track
- Queen sesi: ışınlanma ve doğurma sırasında özel ses
```

### 14. 💥 Patlama / Parçacık Efekti
Düşman ölünce sadece yok oluyor, hiç görsel feedback yok.
- [ ] Birkaç küçük parlak nokta dağılır (particle sistemi)
- [ ] Renk düşman tipine göre değişir (Normal=kırmızı, High=mor, Queen=altın)

### 15. 🛒 Dalga Arası Upgrade Mağazası
`para` değişkeni her bölümde birikiyor ama harcanmıyor.
Dalga arası 8 saniyelik bekleme sırasında küçük mağaza açılabilir:
- [ ] Ekstra mermi yenileme (50 para)
- [ ] Kalkan süresi uzatma (100 para)
- [ ] Ateş hızı artışı (150 para)
- [ ] Gemi can yenileme (200 para)

### 16. 📊 Bölüm Sonu İstatistik Ekranı
Oyun bitince gösterilecek:
- [ ] Toplam öldürülen düşman sayısı
- [ ] Alınan toplam hasar
- [ ] Harcanan mermi miktarı
- [ ] Geçen toplam süre
- [ ] Kazanılan para

### 17. 🌌 Vega ve Kron Bölümleri
Haritada var ama içleri boş:
- [ ] **Vega**: Orta zorluk — Normal + High ağırlıklı, 5 dalga
- [ ] **Kron**: Son boss bölümü — sadece Queen ve High, çok hızlı

### 18. ⌨️ Kontrol İpuçları (İlk Oyun Ekranı)
Yeni oyuncu oyunu açtığında kontrolleri bilmiyor:
- [ ] `WASD` — hareket
- [ ] `Sol Tık / Boşluk` — ateş
- [ ] `R` — şarjör doldur
- [ ] Başlarken 3-5 saniyelik ipucu overlay'i gösterilebilir

---

## 📊 Öncelik Sırası

| # | Özellik | Zorluk | Etki |
|---|---|---|---|
| 1 | Oyun sonu "Menüye Dön" butonu | 🟢 Kolay | 🔥 Çok Yüksek |
| 2 | Ses sistemi (audio.js) | 🟡 Orta | 🔥 Çok Yüksek |
| 3 | Vega bölümü | 🟡 Orta | 🔥 Yüksek |
| 4 | Gemi hızı artışı (`hiz: 4`) | 🟢 Çok Kolay | 🟡 Orta |
| 5 | Patlama parçacık efekti | 🟡 Orta | 🔥 Yüksek |
| 6 | Dalga arası upgrade mağazası | 🔴 Zor | 🔥 Yüksek |
| 7 | Kron son boss bölümü | 🟡 Orta | 🔥 Yüksek |
| 8 | Bölüm sonu istatistik ekranı | 🟢 Kolay | 🟡 Orta |
| 9 | Kontrol ipuçları overlay | 🟢 Kolay | 🟡 Orta |
| 10 | Bölüm progression / unlock | 🟡 Orta | 🟡 Orta |

---

## ✅ Tamamlanan Özellikler (Referans)

- [x] Astra bölümü (kamikaze düşman, 5 turn)
- [x] Nora bölümü (5 dalga sistemi, karadelik teması)
- [x] Normal / High / Queen düşman sınıfları (enemy.js)
- [x] High düşman lazer atışı (gemiye veya üsse)
- [x] Queen ışınlanma (Y ekseni)
- [x] Queen minyon doğurma
- [x] Galaxy Radar (mini harita, sağ alt köşe)
- [x] Kalkan sistemi (Nora — her 5 sn'de 3 sn bağışıklık)
- [x] Üs can rejenerasyonu (Nora)
- [x] Gemi pasif can rejenerasyonu (hasar almayınca)
- [x] Boşluk tuşu ile ateş
- [x] R tuşu ile şarjör doldurma
- [x] Düşman görselleri (normal.png, high.png, queen.png)
- [x] Dalga arası geri sayım overlay'i
