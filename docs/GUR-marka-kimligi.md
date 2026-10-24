# GUR — Marka Kimliği Sistemi

Girdi: **GUR** · İstanbul için restoran keşif platformu (kaydırarak keşif, Gastro Onaylı şef sistemi, işletme paneli).
Bu doküman mevcut proje kurallarına bağlıdır: font Poppins, marka gradyanı turuncu-kırmızı, zemin krem `#FDFBF7`.

---

## 1. MARKA STRATEJİSİ VE HİKAYESİ

### Marka Özü (Brand Essence) ve Konumlandırma
**"Gür sofra."** Türkçede *gür* bolluk, dolgunluk, canlılık demektir: gür saç, gür ses, gür sofra. GUR, İstanbul'un bol, canlı ve kalabalık yemek sahnesini tek bir elin hareketine, bir kaydırmaya sığdırır.

- **Konumlandırma:** Liste okutan rehber değil, tadı sezdiren keşif. Rakipler puan ve yorum yığar, GUR karar verdirir.
- **Üç söz:** Bol seçenek · Hızlı karar · Güvenilir tat (şef onayı).
- **Ton:** Sıcak, kısa, iddialı. "Ne yesek?" sorusunu bitiren arkadaş.

### Tasarım Manifestosu
> Açlık beklemez.
> Seçenek çok, vakit az.
> Kaydır, bak, karar ver.
> Şef onayladıysa, güven.
> İstanbul sofrası gür olmalı.

---

## 2. GÖRSEL KİMLİK SİSTEMİ

### Logo konsepti ve imza detayı
- **Wordmark:** küçük harfli, kalın, geometrik **`gur`** (Poppins ExtraBold tabanlı, özel çizimle). Uygulamadaki mevcut büyük harfli `GUR` pill logosu "uygulama ikonu" olarak kalır; wordmark küçük harfli yazılır.
- **İmza detay: "dolu u".** `u` harfinin açık ağzı bir **kase/tabak** gibi çizilir ve içine **turuncu bir nokta** (lokma/konum iğnesi) oturur. Nokta tek başına konum işareti, kaydırma noktası ve "lokma" anlamına gelir.
- **Hareket kahramanı:** Nokta `g`'den `r`'ye yay çizerek gelip `u`'nun içine düşer (kaydırma + tabağa konma). Logo açılışı 900 ms, yaylı (spring) iniş.
- **Minimum boyut:** wordmark 56 px genişlik; altında yalnızca nokta + `u` kasesi (tek başına ikon).
- **Koruma alanı:** `u` genişliği kadar boşluk her yönde.

### Renk paleti (oranlar toplamı %100)

| Ad | HEX | Rol | Oran |
|---|---|---|---|
| Krem | `#FDFBF7` | Zemin, kartlar | 50 |
| Gür Turuncu | `#FF6600` | Ana marka, butonlar, nokta | 20 |
| Közlenmiş | `#2A140C` | Metin, koyu zemin, alt bar | 15 |
| Şeftali | `#FFD9C2` | Yumuşak yüzey, aura gradyanı | 8 |
| Nane | `#9BE7C4` | Başarı, "Gastro Onaylı" vurgusu | 4 |
| Limon | `#FFE45C` | Rozet, sponsorlu etiket, mikro vurgu | 3 |

- **Marka gradyanı:** `#FF9A1F → #FF3D00` (135°). Yalnızca ana buton, logo zemini ve banner'da.
- **Aura:** Şeftali ile Gür Turuncu'nun bulanık (blur 80–120 px) geçişi; hero ve boş durum ekranlarında zemin.
- **Erişilebilirlik:** Beyaz yazı `#FF6600` üzerinde yalnızca büyük/kalın metinde (≈3:1). Küçük metin için Közlenmiş kullan.

### Tipografi hiyerarşisi (Poppins, italik yok)

| Seviye | Ağırlık | Boyut / satır | İzleme |
|---|---|---|---|
| Display (hero) | 800 | 40–56 / 1.05 | −0.03em |
| Başlık (H1–H2) | 700 | 24–32 / 1.15 | −0.02em |
| Alt başlık | 600 | 17–20 / 1.3 | −0.01em |
| Gövde | 400–500 | 15–16 / 1.5 | 0 |
| Etiket / düğme | 600 | 13–14 / 1.2 | +0.01em |

Kural: başlıklar kısa ve sıkı, gövde bol boşlukla. Rakam büyütülerek (puan, fiyat) tipografik desen yapılır.

---

## 3. DESEN VE SİMGELER

### Simge seti (12 adet, line-art)
Izgara 24 px · çizgi **2 px** · uçlar yuvarlak (round cap/join) · iç köşe yarıçapı 3 px · tek renk Közlenmiş, aktifte Gür Turuncu.

1. Konum iğnesi (içinde nokta: imza detay)
2. Kaydır (el + yay oku)
3. Favori (kalp, tabak formlu)
4. Masa ayırt (masa + saat)
5. Menü (açık kitap/kâğıt, kıvrık köşe)
6. Gastro Onaylı (şef kepi + onay tiki)
7. Harita (katlı harita + iğne)
8. "Ne canın çekti?" (çatal-kaşık çapraz)
9. Yorum (konuşma balonu, içinde yıldız)
10. Saat / açık-kapalı
11. Telefon / ara
12. Paylaş (ok + kase)

### Marka deseni: "Sofra İzi"
Kaydırma hareketinin bıraktığı **kavisli turuncu iz** ve iz üzerinde dizili nokta/kase öğeleri. Kullanım: foto üzerinde ince kurdele (3 px, yarı saydam), boş durumda büyük arka plan deseni (%8 opaklık), banner kenarlarında kırpılmış yay. Desen tek elemandır: yay + nokta; başka motif eklenmez.

---

## 4. DİJİTAL VE FİZİKSEL UYGULAMA ALANLARI

### Baskılı / ambalaj
- **Kartvizit:** Krem zemin, ön yüz yalnızca `gur` wordmark + nokta; arka yüz Közlenmiş zemin, iletişim Poppins 500. Köşeler 6 mm yuvarlak kesim.
- **Kurumsal dosya:** Gür Turuncu dış kapak, iç kapakta Sofra İzi deseni, yırtılabilir Şeftali not kâğıdı.
- **Restoran masa standı / QR:** Közlenmiş zemin, tek büyük nokta, "Bizi GUR'da keşfet" + QR. Gastro Onaylı mekânlara Nane çerçeveli rozet sticker (cam vitrin için, 9 cm daire).
- **Paket / kutu (şef kutusu, hediye):** Krem karton, dışta tek turuncu yay, içte Şeftali kâğıt.

### Dijital UI
- **Butonlar:** Hap (pill), yükseklik 52 px, ana = marka gradyanı + beyaz 700 yazı; ikincil = Krem zemin, 1.5 px Közlenmiş çizgi; üçüncül = metin + ok.
- **Kartlar:** Köşe yarıçapı 24 px, gölge yok yerine 1 px `#E3DCD2` çizgi; foto üstünde alt gradyan Közlenmiş %0→%70.
- **Grid:** 4 sütun mobil, 20 px kenar boşluğu, 8 px baz birim.
- **Alt bar:** Beyaz yuvarlak pill, ortada GUR pill logosu (mevcut kural korunur).
- **Mikro-etkileşimler:** Basınca %96 küçülme, bırakınca yaylanma; sağa kaydırma = turuncu iz çizer, kalp tabağa düşer; Gastro Onaylı rozeti ilk görünüşte hafifçe "pop" yapar; sayfa geçişi bulanıktan netleşme. Yalnızca transform/opacity/filter, hareket azaltılınca kapalı.
- **Görsel dil:** Sıcak, doğal ışıklı yemek ve masa fotoğrafı + line-art simgeler. Stok fotoğraf yerine mekânın kendi görseli; yedek: `picsum.photos`.

---

## 5. GÖRSEL ÜRETİM PROMPTLARI

**1 — Ambalaj mock-up**
```
Minimalist packaging mock-up on a warm cream studio backdrop: a matte cardboard gift box in vivid orange (#FF6600) with a single thin curved arc and one round dot printed on the lid, lowercase bold geometric wordmark "gur" embossed in the corner, soft peach tissue paper peeking out, natural window light from the left, shallow depth of field, architectural plaster wall behind, ultra clean, editorial product photography, 50mm lens
```

**2 — Kırtasiye seti**
```
Brand stationery flat lay on a pale cream textured table: rounded-corner business cards, a deep espresso-brown card with a small orange dot and bold lowercase geometric wordmark "gur", an orange folder with a faint swooping arc pattern, a peach notepad, a mint sticker sheet, warm studio light, long soft shadows, top-down view, minimal composition, high-end branding presentation
```

**3 — Dijital ekran sunumu**
```
Modern smartphone floating in front of a soft blurred aura gradient of peach and orange, screen showing a restaurant discovery app with a large rounded food photo card, pill-shaped orange button, thin line-art icons, bold geometric sans typography, a curved orange swipe trail glowing across the card, clean cream UI, subtle reflections, bright studio lighting, 3D render, crisp, brand presentation slide
```

---

*Sonraki adım:* Bu renk ve tipografi sistemi `src/app` içindeki sabit renklerle (`GRAD = "#FF6600"` vb.) eşleştirilip tek bir `tokens` dosyasına taşınabilir; logo da `public/icons/icon.svg` içine uygulanabilir.
