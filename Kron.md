# Space War Proje Analizi ve Kron Gezegeni Güncellemesi

Bu dosya, **Space War** projesinin genel yapısını, dosya işlevlerini ve son eklenen **Kron Gezegeni (Eğlence Modu)** geliştirmelerini detaylandırmak amacıyla hazırlanmıştır.

## 1. Proje Genel Bakış
Space War, HTML5 Canvas ve modern JavaScript (ES6+ Modules) kullanılarak geliştirilmiş, taktiksel bir savunma ve uzay savaşı oyunudur. Oyuncular farklı gezegen sistemlerini savunur, taretlerini yönetir ve düşman ordularına karşı hayatta kalmaya çalışır.

## 2. Dosya Yapısı ve Açıklamalar

### Ana Dizin Dosyaları
| Dosya | Açıklama |
| :--- | :--- |
| `index.html` | Oyunun ana giriş noktasıdır. Menü yapıları, HUD (Heads-Up Display) ve canvas öğelerini barındırır. |
| `style.css` | Oyunun tüm görsel stilini, animasyonlarını (fade-in, süzülme vb.) ve gezegen tasarımlarını içerir. |
| `README.md` | Projenin genel kurulum ve kullanım bilgilerini içerir. |
| `Hikaye.txt` | Oyunun "Hakkında" bölümünde dinamik olarak yüklenen hikaye metnini barındırır. |

### JavaScript Modülleri (`js/` Dizini)
| Modül | İşlev |
| :--- | :--- |
| `main.js` | Oyunun kalbidir. Ana oyun döngüsünü (Game Loop), yıldız animasyonlarını ve Galaxy Radar sistemini yönetir. |
| `level.js` | Bölüm yönetimini yapar. Gezegen seçimlerini dinler, seçilen gezegene göre taret slotlarını ve atmosferi ayarlar. |
| `player.js` | Oyuncu gemisinin (ship) hareketlerini, boyutlarını ve fareye göre dönme mantığını tanımlar. |
| `enemy.js` | Düşman sınıflarını (Normal, High, Queen) ve onların yapay zeka/hareket mantığını içerir. |
| `projectile.js` | Oyuncu ve düşman mermilerinin fiziklerini ve çizimlerini yönetir. |
| `input.js` | Klavye ve fare girdilerini yakalayarak diğer modüllere iletir. |
| `ui.js` | Menü geçişlerini ve kullanıcı arayüzü etkileşimlerini yönetir. |
| `astra.js`, `vega.js`, `nora.js` | Sırasıyla Astra, Vega ve Nora gezegenlerine özel bölüm ayarlarını (renk, can, dalga sistemi) barındırır. |
| **`kron.js`** | **[YENİ]** Kron gezegeni ve Eğlence Modu mantığını içeren yeni modül. |

## 3. Kron Gezegeni ve Eğlence Modu (Entertainment Mode)

Kron gezegeni, projeye yeni bir soluk getirmek amacıyla "Eğlence Modu" konseptiyle eklenmiştir. Bu mod, standart oynanıştan farklı olarak daha hızlı ve sınırsız bir deneyim sunar.

### Uygulanan Özellikler:
- **Daha Küçük Gemi:** Kron gezegeninde oyuncu gemisi %33 oranında küçülerek (`40x40`) daha kıvrak bir yapıya bürünür. Bu durum mermilerden kaçmayı kolaylaştırırken, isabet hassasiyetini artırır.
- **Sınırsız Mermi:** Standart gezegenlerdeki mermi yenileme (reload) ihtiyacı Kron'da devre dışıdır. Mermi sayısı sonsuzdur (`∞`) ve ateş kesilmeden saldırı yapılabilir.
- **Sanatsal Görsel Tasarım:** Kullanıcıdan gelen taslağa uygun olarak, canvas üzerinde yeşil karalamalar, fırça darbeleri ve güneş ışını benzeri çizgilerle "el çizimi" tadında özgün bir gezegen atmosferi oluşturulmuştur.
- **Dinamik Atmosfer:** Kron seçildiğinde arka planda koyu yeşil bir ışıma ve özel bir gölge efekti devreye girer.

## 4. Yapılan Teknik Değişiklikler

### `js/kron.js` [Yeni Dosya]
- `kronBolumu` nesnesi tüm fonksiyonlarıyla (baslat, durdur, guncelle, ciz) sıfırdan oluşturuldu.
- `baslat` fonksiyonu içinde gemi boyutlarını değiştiren ve mermiyi `Infinity` yapan mantık kuruldu.
- `ciz` fonksiyonu içinde kompleks yol (path) çizimleri kullanılarak "scribble" efekti verildi.

### `js/level.js` [Güncelleme]
- `kronBolumu` modüle dahil edildi (import).
- Gezegen haritasındaki Kron noktasına tıklama olayı (event listener) eklendi.
- Kron için taktiksel olarak 3 taret slotunun açık kalması sağlandı.

### `index.html` ve `style.css`
- Mevcut HTML yapısındaki `kron` sınıfı, yeni JS mantığıyla işlevsel hale getirildi.
- CSS üzerindeki gezegen animasyonları ve parlama efektleri yeni modla uyumlu çalışacak şekilde doğrulandı.

## 5. Nasıl Oynanır?
1. Ana menüden **BAŞLA** butonuna tıklayın.
2. Gezegen haritasının sol alt kısmında bulunan yeşil **Kron** gezegenine tıklayın.
3. Eğlence modunun tadını çıkarın: Sınırsız mermi ile düşmanları temizleyin!

---
*Hazırlayan: Antigravity AI Geliştirici Ekibi*
*Tarih: 2 Mayıs 2026*
