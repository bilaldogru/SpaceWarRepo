# Nora Gezegeni — Geliştirme Raporu & Değişiklik Kaydı

## 1. Nora Nedir?

Nora, Space War oyununun **üçüncü ve en zor** ana gezegenidir. Turuncu/magma renk temasıyla "yanmakta olan bir savunma hattı" hissi verir. Diğer gezegenlerden farklı olarak oyuncuya daha az başlangıç kaynağı verir, daha hızlı ve karışık düşman dalgaları gönderir.

---

## 2. Gezegen Karşılaştırması

| Parametre | Astra (Kolay) | Vega (Orta) | Nora (Zor) | Kron (Sonsuz) |
|---|---|---|---|---|
| `coreCan` | 100 | 110 | **115** | 140 |
| `maxTurn` | 5 | 6 | **7** | sonsuz |
| `acikModulSayisi` | 2 | 3 | **6** | 5 |
| `maxModuleSayisi` | 4 | 5 | **5** | 8 |
| `dalgaBaslangic` | 5 | 6 | **9** | 8 |
| `dalgaArtis` | 2.0 | 2.4 | **3.5** | 3.0 |
| `spawnGecikmesi` | 440 ms | 390 ms | **280 ms** | 320 ms |
| `zorlukCarpani` | 0.045 | 0.055 | **0.078** | 0.072 |
| `moduleDropEvery` | 3 | 4 | **5** | 5 |
| `baslangicModulleri` | yok | `['rapid']` | **`['rapid']`** | `['rapid','heal','speed']` |
| Tip-5 Boss | Yok | Yok | **Var (%8)** | Var (%9) |

---

## 3. Yapılan Değişiklikler (AZOR Güncelleme)

### nora.js — Parametre Güncellemeleri

| Parametre | Eski | Yeni | Gerekçe |
|---|---|---|---|
| `gridRengi` | `rgba(..., 0.14)` | `rgba(..., 0.22)` | Daha belirgin magma atmosferi |
| `coreCan` | 130 | **115** | Daha az hata payı |
| `maxModuleSayisi` | 6 | **5** | Az taret = zor savunma |
| `acikModulSayisi` | 5 | **6** | Yıldırım Zinciri modülü açıldı |
| `baslangicModulleri` | `['rapid','heal']` | **`['rapid']`** | Heal başta yok, ilk anlar ağır |
| `dalgaBaslangic` | 7 | **9** | 1. dalga bile yoğun başlar |
| `dalgaArtis` | 3.0 | **3.5** | Her dalga daha hızlı büyür |
| `spawnGecikmesi` | 350 ms | **280 ms** | Düşmanlar daha sık gelir |
| `zorlukCarpani` | 0.065 | **0.078** | Düşman canı/hızı daha sert artar |
| `moduleDropEvery` | 4 | **5** | Modül ödülü daha seyrek düşer |
| `dusmanDagilimi` | Max Tip-4 | **Tip-5 Boss eklendi (%8)** | Boss koşusunu zorlaştırır |

---

## 4. Yeni Özellik: Yıldırım Zinciri Modülü

### Genel Tasarım

Oyuncu bir düşmana mermi isabet ettirdiğinde, eğer **Yıldırım Zinciri** modülü aktif ve oyuncu modülün etki alanındaysa, en yakın başka düşmana da otomatik olarak elektriksel hasar uygulanır ve güzel bir şimşek animasyonu oluşur.

### Teknik Uygulama (modularLevel.js)

**Modül Tanımı (MODULES dizisi):**
```js
{
    id: 'chain',
    ad: 'Yıldırım Zinciri',
    gorev: 'Zincir Hasar',
    aciklama: 'Bir düşmana isabet eden mermi, en yakın diğer düşmana da şimşek çarpar.',
    renk: '#f9ca24',
    radius: 310,       // Oyuncunun modüle yakın olması gereken mesafe
    chainDamage: 22,   // Zincir hasarı
    chainRange: 270,   // Hedef düşmana maksimum zincir mesafesi
    fiyat: 185,
    sure: 13,
    maxCan: 105
}
```

**chainZincirUygula() Metodu:**

Bir mermi düşmana çarptıktan hemen sonra çağrılır:
1. Aktif bir chain modülü var mı ve oyuncu etki alanında mı? -> Kontrol
2. Vurulan düşmanın en yakınındaki başka düşmanı bul (chainRange içinde)
3. Önceden zigzag noktaları hesapla (titremesiz animasyon için)
4. `chainEffects` listesine şimşek efekti kaydet
5. Hedefe `chainDamage` kadar hasar uygula

**chainEffekleriniCiz() Metodu:**

Her frame'de çizim için:
- Süresi dolan efektleri temizle
- Her efekt için iki katmanlı şimşek çiz:
  - **Dış katman:** Kalın, sarı, parlama efektli ana şimşek
  - **İç katman:** İnce, beyazımsı yol (derinlik hissi)
- Hedefe çarpma noktasında azalan bir çember de çiz

### Oyun Dengesi

- Modülü almak için **185 para** gerekir
- Yalnızca **oyuncu modüle yakın** olduğunda (radius: 310) aktiftir
- Zincir menzili **270 piksel** — yakın gruplar için çok etkili
- **Nora özelinde** bu modül varsayılan olarak açık (acikModulSayisi: 6)

---

## 5. Nora Kimliği / Atmosfer

- **Renk Paleti:** `#f39c12` (turuncu/alev) + koyu amber grid
- **Hissi:** Yakıcı, agresif, yakın mesafe savunması
- **Güçlü Yan:** En fazla modül tipi açık (Yıldırım dahil)
- **Zayıf Yan:** En az başlangıç kaynağı, en yüksek dalga yoğunluğu
- **İlerlemedeki Rolü:** Astra ve Vega'yı bitiren oyuncunun "gerçek sınavıdır"

---

## 6. Gelecek Geliştirme Fikirleri

| Fikir | Öncelik | Açıklama |
|---|---|---|
| **Magma Dalgası** | Yüksek | Her 3. dalgada modüllere ekstra hasar veren özel düşman sürüsü |
| **Kıtlık Başlangıcı** | Orta | Para sıfır başlar, ilk kill ile para kazanılmaya başlar |
| **Zincir Zincirleme** | Düşük | Zincir hasarı ikinci bir düşmana da zıplayabilir (3'lü zincir) |
| **Nora Boss Dalgası** | Yüksek | 7. dalgada özel bir mini-boss düşmanı çıkıyor |

---

*Rapor tarihi: Mayıs 2026*
*Düzenleyen: Antigravity AI*
