# GUR — Proje Rehberi (Claude Code için)

Bu dosya Claude Code'un projeyi hızlıca anlaması içindir. GUR, İstanbul için **Tinder-tarzı restoran keşif platformu**dur.

## Ne inşa ediyoruz

Kullanıcılar restoranları kaydırarak keşfeder (sağa = favori, sola = geç). Ana farklılaştırıcı **Gastro Onaylı** sistemidir: tanınmış şefler restoranları onaylar, onaylılar rozet + öncelikli yerleşim alır. Gelir modeli restoran abonelikleridir (Premium/Pro/Ücretsiz).

Ürün üç arayüzden oluşur:
1. **Tüketici mobil uygulaması** — keşif, kaydırma, favoriler, detay, profil
2. **Doyurucu (restoran) paneli** — kayıt, doğrulama, dashboard, menü/fotoğraf yükleme
3. **Yönetici paneli** — başvuru onayı, Gastro yönetimi, moderasyon, gelir

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
```

- Web sitesi (`src/app/GurWeb.jsx`; mobil uygulamanın `mobile/` son sürümünün web karşılığı). Veri ve deste mantığı mobil/sunucuyla ortak:
  `src/data/restaurants.js` (218 Bakırköy kaydı) + `shared/{bakirkoy,deck,deeplink}.js`; yerel durum `src/app/webStore.js` — ÜÇ AYRI DEPO:
  müşteri `gur.musteri.v1` (hesap, favori, geçilen, konum, rıza), işletme `gur.isletme.v1` (hesap, sahiplenme başvuruları, girilen alanlar),
  platform `gur.platform.v1` (anonim etkileşim sayaçları + masa talepleri; müşteri→işletme köprüsü). Birinin oturumu/çıkışı/hesap silmesi ötekine dokunmaz. gelir `gur.gelir.v1` (reklam rezervasyonları, paket talepleri/teklifleri, GURME yorumları). Hook'lar: `useDepo` (müşteri), `useIsletme`, `usePlatform`, `useGelir`.
  `/` ana sayfa · `/giris` (`?kayit=1`) · `/konum` · `/doyurucu` `/doyurucu/giris` `/doyurucu/kayit` `/doyurucu/panel` ·
  `/kesfet` · `/kesfet/swipe` (sağa kaydet · sola geç · yukarı ya da ortadaki düğme = detay sayfası; "bu akşam" özelliği yok) · `/restoran/:id` · `/favoriler` · `/profil`
  GUR İşletme (`src/app/GurBusinessWeb.jsx`): `/doyurucu` kurumsal tanıtım (neden sahiplenmeli) → `/doyurucu/giris` hesap → `/doyurucu/sahiplen` (kaydı bul → doğrula → başvur) →
  onaydan sonra `/doyurucu/panel` (etkileşim panosu, bilgilerim, masa talepleri). Onaylı sahiplenme `claimed` yapar (masa ayırtma açılır), girilen alan kaynağı ezer
  (`sahiplikUygula`). Etkileşimler `izle()` ile yalnızca ölçümleme izni varsa ve yalnızca bu tarayıcıda sayılır. Sunucu yok: onay yerel önizlemede "Onayı simüle et" düğmesiyle.
  Keşfet ve Profil uygulamanın düzeninde (`GurAnaEkran.jsx`: konum+logo+avatar başlığı, arama hapı, dönen banner, 'Ne canın çekti?' halkaları, 'Yakınında popüler'; profilde avatar+istatistik+alt çizgili sekmeler). GUR Match, rozet şeridi ve demo reklamlar web'de bilerek YOK.
  Müşteri harita görünümü: `/kesfet/harita` (`RestoranHaritaPage`) — Keşfet/Kaydır'a alternatif; liste + OpenStreetMap haritası (Leaflet, puan etiketli iğneler, Booking tarzı).
  Açılınca ilk 30 mekânı otomatik yerleştirir. (`/doyurucu/restoranlar` eski adresi buraya yönlenir; işletme tarafında bu ekran yok.) Mekân koordinatı listede yok; `src/app/webGeo.js` adresten Nominatim ile çözer (mekân adı → sokak → mahalle, saniyede 1 istek, `gur.geo.v2` önbelleği);
  yaklaşık sonuçlar arayüzde "yaklaşık" diye işaretli.
  Ürün kuralları: rıza modalı (iki seçenek eşit), konum üç yol eşit, masa ayırtma yalnız `claimed` mekanlarda, yorum üç kaynaklı ve etiketli: GUR yorumları (uygulamadan), GURME yorumları (`/gurme`, GURME paketi yürürlükteyse; `GurGurme.jsx`), Google Maps (yalnız puan/sayı + link, metin kopyalanmaz) — `GelirWeb.jsx`.
  Gelir modeli (`gelirKatalog.js`, `GurPaketler.jsx`): abonelik ve rezervasyon komisyonu YOK; sabit fiyatlı reklam (banner ₺350/gün, ödüllü video ₺105/gün, push ₺1.800/gün; tarih seç → talep → onay; kurallar `reklamKuraliIhlali`) ve teklifle satılan paketler (Gastro, İkinci Şans, Anlık fırsat, GURME — GURME'nin liste fiyatı yok). Panelde `Paketler ve reklam` sekmesi. Onaylı banner → Keşfet'te "Sponsorlu" şerit. Tüketiciden ücret YOK (GUR Plus kaldırıldı). Sponsorlu kart: işletme panelinde Sponsorlu kartlar sekmesi (CPC=detay açıldı, CPE=kaydedildi, bütçe); desteKur kampanyaları shared/deck.js rankCampaigns+buildDeck ile kaydırma destesine 5-7 kartta bir Sponsorlu etiketiyle karıştırır; harcama yerel simülasyon. Kaydırma kotası: günde 40 (shared/deck.js quotaState, ham sayı gösterilmez); dolunca GurOdul.jsx Mutfak kapandı paneli + Ödüllü reklam (+5, 8 sn, onaylı rewardedAds rezervasyonu olan restoran, yoksa Google yer tutucusu). Yerel modda yönetim kararları 'simüle' düğmeleriyle yapılır.
- `/admin`  → Yönetici paneli (tam ekran masaüstü). Kapı: AdminKapi.jsx, kullanıcı adı + şifre + telefon onay kodu (6 hane, 5 dk, 3 hak; SMS sunucu ister: VITE_ADMIN_OTP_API tanımlıysa POST /gonder ve /dogrula sunucuya gider, yoksa kod ekranda etiketli 'yerel önizleme' kutusunda gösterilir, SMS gitmez); varsayılan hesap YOK, ilk açılışta yönetici kendi bilgisini belirler (PBKDF2 özeti, tarayıcıda; 5 hatada 30 sn kilit). Ek: Microsoft Authenticator (TOTP, RFC 6238; QR ile eklenir, Güvenlik sayfasından aç/kapat; girişte varsayılan ikinci adım, SMS yedek). Ortak altyapı: src/lib/otp.js (şifre özeti, SMS, TOTP). İşletme girişi de aynı SMS altyapısını kullanır: kayıtta telefon, hesaplar isletme deposunda (şifre özet), girişte e-posta+parola sonra telefon kodu. VITE_OTP_API tek ayar. TELEFON (SMS) DOĞRULAMASI ŞİMDİLİK KAPALI (otp.js TELEFON_ACIK; VITE_TELEFON_DOGRULAMA=1 ile açılır): admin = kullanıcı adı+şifre (+Authenticator varsa), işletme = e-posta+parola. Gerçek güvenlik değil, sunucu doğrulaması gerekir. Sol altta Web sitesine git ve Çıkış. SİTEYLE AYNI DEPOLARI okur/yazar (aynı origin localStorage): Başvurular = gerçek sahiplenme başvuruları (onay → sitede Sahiplenilmiş), Restoranlar = 218 kayıt (Gastro/Askıya al → platform `restoranAyar`, `yonetimUygula` ile sitede uygulanır; askıdaki mekân listelerde ve detayda yok), Onay Kuyruğu (`AdminOnaylar.jsx`) = reklam rezervasyonu onayı, teklif fiyatı gönderme, sponsorlu kampanya onayı. Banner Yönetimi (AdminBanner.jsx): Keşfet'in dönen bannerlarını yönetici koyar (görsel yükle/adres, başlık, mekân bağlantısı, sıra, gizle, Reklam etiketi) — platform bannerlar; hiç yoksa varsayılan GUR slaytı, onaylı işletme bannerları ardından eklenir. Satın alınan banner akışı: tarih onayı (Onay Kuyruğu) → işletme panelinde banner görseli yükler (GurPaketler BannerGorsel, ancak tarihi onaylı rezervasyona) → görsel onayı (Onay Kuyruğu) → Keşfet'te mekân fotoğrafı yerine onaylı görsel, Reklam etiketiyle. Kullanıcılar/Yorumlar/Genel Bakış'ın bir kısmı hâlâ örnek veri.

Derleme: `npm run build` → `dist/`

## Proje yapısı

```
gur/
├── index.html                 # Giriş; Poppins fontu burada yüklenir
├── vite.config.js             # Vite + React eklentisi
├── package.json
└── src/
    ├── main.jsx               # React kökü + router (/ ve /admin)
    ├── app/
    │   └── GurApp.jsx         # TÜM tüketici + doyurucu uygulaması (tek dosya, ~2260 satır)
    └── admin/
        └── GurAdmin.jsx       # Yönetici paneli (tek dosya, ~730 satır)
```

## Mimari notlar (ÖNEMLİ)

### GurApp.jsx — tek dosyalık uygulama
- Tüm ekranlar tek dosyada ayrı fonksiyon bileşenleri: `SplashScreen`, `WelcomeScreen`, `LoginScreen`, `RegisterScreen`, `DoyurucuAuthScreen`, `DoyurucuLoginScreen`, `RestReg1/2/3`, `RestaurantDashboard`, `ExploreScreen`, `SwipeScreen`, `DetailScreen`, `FavScreen`, `ProfileScreen`.
- Ekran yönetimi: `GurApp` içinde `screen` state'i + `render()` switch'i. Navigasyon `nav(to)` / `back()` ile history stack üzerinden.
- Ortak bileşenler: `GurLogo` (pill logo), `Screen`, `PhoneFrame`, `Img`, `InputField`, `Btn`, `UploadBox`.
- Stil: **inline style** (CSS-in-JS yok, Tailwind yok). Renkler `GRAD = "#FF6600"` turuncu-kırmızı marka gradyanı.
- Animasyonlar: dosya sonundaki `<style>` bloğunda `@keyframes` (fadeInUp, badgeMarquee, spin, pulse).
- Font: **Poppins** (index.html'de yüklenir). Başka font kullanma.

### Canlı veri (OpenStreetMap)
- `fetchLiveRestaurants()` — Overpass API'den gerçek Kadıköy restoranlarını çeker (ücretsiz, API-key yok).
- Başarısız olursa sessizce mock `RESTAURANTS` verisine düşer.
- `dataSource` state'i "demo" | "live"; canlı ise Swipe ekranında yeşil rozet gösterilir.
- `CAT_MAP` OSM mutfak etiketlerini (turkish, sushi...) 13 kategoriye eşler.

### GurAdmin.jsx — yönetici paneli
- Koyu, veri-yoğun "operatör" arayüzü (GitHub/Linear estetiği). Renkler `C` nesnesinde.
- Sayfalar: `DashboardPage`, `RestaurantsPage`, `ApplicationsPage`, `GastroPage`, `UsersPage`, `ReviewsPage`, `RevenuePage`, `SettingsPage`.
- Tüm veriler mock (dosya başındaki sabitler). State'li aksiyonlar çalışır (onay, Gastro ver/al, askıya al).

## Hareket dili

src/app/yumusak.js (YUMUSAK_CSS): sayfa geçişi bulanıktan netleşme+ölçek+yükselme, listeler kademeli giriş, seçili öğe yay gibi pop, basınca küçülme/bırakınca yaylanma, pencereler blur-in. Yalnızca transform/opacity/filter; animasyon dolgusu ackwards (both değil: hover kilitlenir). Hareket azaltılınca kapanır.

## Google Places senkronizasyonu

`scripts/places-sync.mjs`: `npm run places:kesif` (AYDA 1: yeni mekân kimlikleri, Text Search yalnızca kimlik = ücretsiz sınıf), `npm run places:guncelle` (HAFTADA 1: yalnızca yeni/7 günden eski kayıtlar için Place Details; aylık sınır 950, PLACES_AYLIK_DETAY_SINIRI), `npm run places:durum`, `--kuru` ağa çıkmaz. Anahtar .env GOOGLE_PLACES_API_KEY (koda yazma). Çıktı src/data/places-cache.json; src/data/placesBirlestir.js siteye ve admin'e birleştirir (eşleşen kayıt güncellenir, yeniler eklenir, kalıcı kapalı çıkar). Google fotoğrafı kullanılmaz (her gösterim ücretli). Saklama şartlarını Google'dan kontrol et.

## Marka kimliği

`docs/GUR-marka-kimligi.md`: logo DEĞİŞMEZ (büyük harfli `GUR`, G `#FFA500` · U `#FF6600` · R `#FF0000`, Poppins 900; `GurLogo` bileşeni); kimlik bu logo etrafında kuruludur. Koyu metin `#2A140C`, renk değişkenleri `index.html` `:root` içinde (`--gur-*`). Yeni renk eklerken bu dokümana uy.

## Görsel kurallar (bunlara uy)

- **Görseller**: `picsum.photos` kullan (Unsplash artifact'ta güvenilmez). URL formatı: `https://picsum.photos/seed/AD/600/400`.
- **Alt bar**: TÜM ekranlarda aynı olmalı — beyaz yuvarlak pill, kenarda ikon+yazı, ortada GUR pill logo. Inline (position:absolute değil).
- **Logo boyutları**: 42px pill (header/nav), 60-80px (giriş ekranları), 22-24px (dekoratif/alt bar), 110px (yalnızca splash).
- **Font**: her yerde Poppins, italic yok.
- **Menü**: görsel galeri olarak açılır (metin liste değil). Her restoranın `menu: [...]` alanı var.

## Sonraki adımlar (yapılabilecekler)

- Backend bağlantısı: Supabase veya Node+PostgreSQL (bkz. veri modeli, PRD'de).
- React Native sürümü ayrı bir projede mevcut (gur-mobile).
- GUR Match özelliği (arkadaşla birlikte kaydırma, eşleşme ekranı) — viral büyüme için.
- Ödeme entegrasyonu (iyzico/Stripe) abonelikler için.
- Yönetici girişi (şu an doğrudan /admin açılıyor).

## Bilinen kısıtlar

- Tüm veri mock/yerel; backend yok (kalıcılık yok, sayfa yenilenince sıfırlanır).
- Kimlik doğrulama gerçek değil (giriş ekranları herhangi bir değerle geçer).
- GurApp.jsx büyük tek dosya; istenirse ekranlar ayrı dosyalara bölünebilir.
