# Nora Gezegeni — Gelistirme Raporu & Degisiklik Kaydi

## 1. Nora Nedir?

Nora, Space War oyununun **ucuncu ve en zor** ana gezegenidir. Turuncu/magma renk temasiyla "yanmakta olan bir savunma hatti" hissi verir. Diger gezegenlerden farkli olarak oyuncuya daha az baslangic kaynagi verir, daha hizli ve karisik dusman dalgalari gonderir.

---

## 2. Gezegen Karsilastirmasi

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

## 3. Yapilan Degisiklikler (AZOR Guncelleme)

### nora.js — Parametre Guncellemeleri

| Parametre | Eski | Yeni | Gerekce |
|---|---|---|---|
| `gridRengi` | `rgba(..., 0.14)` | `rgba(..., 0.22)` | Daha belirgin magma atmosferi |
| `coreCan` | 130 | **115** | Daha az hata payi |
| `maxModuleSayisi` | 6 | **5** | Az taret = zor savunma |
| `acikModulSayisi` | 5 | **6** | Yildirim Zinciri modulu acildi |
| `baslangicModulleri` | `['rapid','heal']` | **`['rapid']`** | Heal basta yok, ilk anlar agir |
| `dalgaBaslangic` | 7 | **9** | 1. dalga bile youn baslar |
| `dalgaArtis` | 3.0 | **3.5** | Her dalga daha hizli buyur |
| `spawnGecikmesi` | 350 ms | **280 ms** | Dusmanlar daha sik gelir |
| `zorlukCarpani` | 0.065 | **0.078** | Dusman can/hizi daha sert artar |
| `moduleDropEvery` | 4 | **5** | Modul odul daha seyrek duser |
| `dusmanDagilimi` | Max Tip-4 | **Tip-5 Boss eklendi (%8)** | Boss kosusunu zorlestirir |

---

## 4. Yeni Ozellik: Yildirim Zinciri Modulu

### Genel Tasarim

Oyuncu bir dusmana mermi isabet ettirdiginde, eger **Yildirim Zinciri** modulu aktif ve oyuncu modulun etki alaninindaysa, en yakin baska dusmana da otomatik olarak elektriksel hasar uygulanir ve gozel bir simsek animasyonu olusur.

### Teknik Uygulama (modularLevel.js)

**Modul Tanimi (MODULES dizisi):**
```js
{
    id: 'chain',
    ad: 'Yildirim Zinciri',
    gorev: 'Zincir Hasar',
    aciklama: 'Bir dusmana isabet eden mermi, en yakin diger dusmana da simsek carpar.',
    renk: '#f9ca24',
    radius: 310,       // Oyuncunun module yakin olmasi gereken mesafe
    chainDamage: 22,   // Zincir hasari
    chainRange: 270,   // Hedef dusmana maksimum zincir mesafesi
    fiyat: 185,
    sure: 13,
    maxCan: 105
}
```

**chainZincirUygula() Metodu:**

Bir mermi dusmana carptiktan hemen sonra cagrilir:
1. Aktif bir chain modulu var mi ve oyuncu etki alaninda mi? -> Kontrol
2. Vurulan dusmanin en yakinindaki baska dusmani bul (chainRange icinde)
3. Onceden zigzag noktalari hesapla (titremesiz animasyon icin)
4. `chainEffects` listesine simsek efekti kaydet
5. Hedefe `chainDamage` kadar hasar uygula

**chainEffekleriniCiz() Metodu:**

Her frame'de cizim icin:
- Suresi dolan efektleri temizle
- Her efekt icin iki katmanli simsek ciz:
  - **Dis katman:** Kalin, sari, parlama efektli ana simsek
  - **Ic katman:** Ince, beyazimsi yol (derinlik hissi)
- Hedefe carpma noktasinda azalan bir emberi de ciz

### Oyun Dengesi

- Modulu almak icin **185 para** gerekir
- Yalnizca **oyuncu modula yakin** oldugunda (radius: 310) aktiftir
- Zincir menzili **270 piksel** — yakin gruplar icin cok etkili
- **Nora ozelinde** bu modul varsayilan olarak acik (acikModulSayisi: 6)

---

## 5. Nora Kimligi / Atmosfer

- **Renk Paleti:** `#f39c12` (turuncu/alev) + koyu amber grid
- **Hissi:** Yakici, agresif, yakin mesafe savunmasi
- **Guclü Yan:** En fazla modul tipi acik (Yildirim dahil)
- **Zayif Yan:** En az baslangic kaynagi, en yuksek dalga yogunlugu
- **Ilerlemede Rolu:** Astra ve Vega'yi bitiren oyuncunun "gercek sinavidir"

---

## 6. Gelecek Gelistirme Fikirleri

| Fikir | Oncelik | Aciklama |
|---|---|---|
| **Magma Dalgasi** | Yuksek | Her 3. dalgada modullere ekstra hasar veren ozel dusman surüsü |
| **Kitlik Baslangici** | Orta | Para sifir baslar, ilk kill ile para kazanilmaya baslar |
| **Zincir Zincirleme** | Dusuk | Zincir hasari ikinci bir dusmana da ziplabilir (3'lu zincir) |
| **Nora Boss Dalgasi** | Yuksek | 7. dalgada ozel bir mini-boss dusmanı cikiyor |

---

*Rapor tarihi: Mayis 2026*
*Duzenleyen: Antigravity AI*
