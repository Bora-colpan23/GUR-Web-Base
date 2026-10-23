// ═══════════════════════════════════════════════════════════════════════
// GELİR MODELİ — uygulamadaki (src/lib/adslots.js, pricing.js, GurApp PremiumSheet) kataloğun web karşılığı
//
// Kurallar uygulamayla AYNI:
//   • İŞLETME ABONELİĞİ YOK ve REZERVASYON KOMİSYONU YOK. İşletmenin ödediği tutarın tamamı tek tek aldığı kalemlerden gelir.
//   • Sabit fiyatlı reklam (banner, ödüllü video, push): fiyat GÜNLÜK ve listede yazar, pazarlık yok. Ama satın alma serbest değil:
//     işletme takvimden tarih seçer, talep yönetime düşer, onaylanınca slot kilitlenir ve yayına girer.
//   • Teklifle satılan paketler: işletme yalnızca TEKLİF İSTER; yönetim fiyatlar, işletme kabul ya da reddeder. Liste fiyatı bir
//     taahhüt değil, başlangıç noktası.
//   • Tüketici tarafı abonelik YOK: gelir, kaydırma akışına karışan sponsorlu yemek/restoran reklamlarından düşünülüyor.
// ═══════════════════════════════════════════════════════════════════════

export const AD_PRODUCTS = {
  bannerAds: {
    ad: "Keşfet Banner'ı", birim: 'gün', gunluk: 350, maksGun: 7, ozel: true, limit: { ay: 1 }, kural: 'Ayda 1 kez, en fazla 7 gün.',
    aciklama: "Keşfet ekranının üstünde, seçtiğin günlerde tek restoran olarak “Sponsorlu” öne çıkar. Aynı günler iki restorana satılmaz.",
    ikon: 'star',
  },
  rewardedAds: {
    ad: 'Ödüllü Video Reklam', birim: 'gün', gunluk: 105, maksGun: 7, ozel: false, limit: { ay: 1 }, kural: 'Ayda 1 kez, en fazla 7 gün. Yakındaki kullanıcılara gösterilir; videoyu izleyen aynı videoyu bir daha görmez.',
    aciklama: 'Kullanıcılar videonu izleyip ek kaydırma hakkı kazanır. Yayın GUR mobil uygulamasında yapılır.',
    ikon: 'eye',
  },
  pushAds: {
    ad: 'Push Bildirim Reklamı', birim: 'gün', gunluk: 1800, maksGun: 7, ozel: false, limit: { haftaGun: 3 }, kural: 'Bir gün = bir gönderim. Haftada en fazla 3 gün.',
    aciklama: 'Yakındaki kullanıcılara bildirim gönderilir. Yayın GUR mobil uygulamasında yapılır.',
    ikon: 'chat',
  },
};
export const AD_KEYS = Object.keys(AD_PRODUCTS);

// Teklifle satılan paketler. `liste: null` = liste fiyatı yok, tutar tamamen mekâna göre teklifle belirlenir.
export const PAKETLER = [
  { key: 'gastroPackage', ad: 'Gastro şef videosu paketi', birim: '/ ay', liste: 13200, ikon: 'camera',
    aciklama: 'Şef tanıtım videosu karesi ve Gastro Onaylı mekân galerisi. Gastro Onaylı rozeti satın alınamaz; bağımsız bir değerlendirmeye dayanır.' },
  { key: 'secondChance', ad: 'İkinci Şans paketi', birim: '/ paket', liste: 1450, ikon: 'undo',
    aciklama: 'Kendini sola kaydırmış kullanıcıların destesine geri girersin. 200 farklı kullanıcıya gösterimle biter; aynı kullanıcıya günde en fazla 1 kez. Yayın GUR mobil uygulamasında yapılır.' },
  { key: 'instantDeals', ad: 'Anlık fırsat', birim: '/ yayın', liste: 450, ikon: 'clock',
    aciklama: 'Ölü saatleri dolduran süreli indirim; restoran sayfasında ve keşif akışında görünür.' },
  { key: 'gurmePackage', ad: 'GURME değerlendirme paketi', birim: '/ paket', liste: null, ikon: 'shield',
    aciklama: 'GUR’un kendi gurmeleri mekânı ziyaret eder; 10 üzerinden mesleki puan ve gerekçeli not yazar. Yorum mekân sayfasında “GURME paketi kapsamında” etiketiyle yayınlanır. Paket, yorumun olumlu olmasını garanti etmez; gurme bağımsız yazar.' },
];
export const PAKET_BY_KEY = Object.fromEntries(PAKETLER.map((p) => [p.key, p]));

// GUR'un kendi gurmeleri (yönetici panelindeki şef listesiyle aynı).
export const GURMELER = [
  { id: 1, ad: 'Şef Mehmet Gürs', uzmanlik: 'Modern Türk' },
  { id: 2, ad: 'Şef Didem Şenol', uzmanlik: 'Ege Mutfağı' },
  { id: 3, ad: 'Şef Maksut Aşkar', uzmanlik: 'Anadolu' },
  { id: 4, ad: 'Şef Civan Er', uzmanlik: 'Fine Dining' },
];

// Sponsorlu kart açık artırması: işletme tıklama başı (CPC = detay açıldı) ya da etkileşim başı (CPE = kaydedildi) teklif verir.
// Alt sınırlar tasarım varsayımıdır, pazarda test edilmedi.
export const KAMPANYA = { minTeklif: 1, minButce: 100 };

export const TL = (n) => `₺${Number(n).toLocaleString('tr-TR')}`;

// ─── Tarih yardımcıları: YEREL "YYYY-MM-DD" (UTC kaydırması gece yarısına yakın günü bir kaydırır) ───
export const gunYaz = (d) => { const x = d instanceof Date ? d : new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const bugun = () => gunYaz(new Date());
export function gunEkle(iso, n) { const [y, m, d] = iso.split('-').map(Number); const x = new Date(y, m - 1, d); x.setDate(x.getDate() + n); return gunYaz(x); }
export const kelepce = (urun, gun) => Math.min(AD_PRODUCTS[urun]?.maksGun ?? 1, Math.max(1, Math.round(Number(gun) || 1)));
export const bitisGunu = (urun, bas, gun) => gunEkle(bas, kelepce(urun, gun) - 1);
export const toplamTutar = (urun, gun) => (AD_PRODUCTS[urun]?.gunluk ?? 0) * kelepce(urun, gun);
export function haftaAnahtari(iso) { const [y, m, d] = iso.split('-').map(Number); const x = new Date(y, m - 1, d); x.setDate(x.getDate() - (x.getDay() || 7) + 1); return gunYaz(x); }
const kesisir = (a1, a2, b1, b2) => a1 <= b2 && b1 <= a2;

/**
 * Reklam talebi kuralları (uygulamadaki adslots.js ile aynı, tek yerde):
 *  • banner özel: o gün aralığında başka restoranın bekleyen/onaylı rezervasyonu olamaz
 *  • banner ve ödüllü video: aynı restoran aynı AYDA en çok 1 kez
 *  • push: bir gün = bir gönderim, aynı restoran bir haftada en çok 3 gün
 * `mevcut` = bekleyen ve onaylı rezervasyonlar. Hata yoksa null.
 */
export function reklamKuraliIhlali({ urun, restaurantId, baslangic, gun }, mevcut) {
  const p = AD_PRODUCTS[urun]; if (!p) return 'Bilinmeyen ürün.';
  const n = kelepce(urun, gun); const bit = gunEkle(baslangic, n - 1);
  if (baslangic < bugun()) return 'Geçmiş bir tarih seçilemez.';
  const canli = mevcut.filter((b) => b.urun === urun && (b.durum === 'bekliyor' || b.durum === 'onaylandi'));
  const benim = canli.filter((b) => String(b.restaurantId) === String(restaurantId));
  if (p.ozel && canli.some((b) => kesisir(baslangic, bit, b.baslangic, b.bitis))) return 'Bu günler dolu: bu aralıkta bekleyen ya da onaylı bir banner rezervasyonu var. Başka bir tarih seç.';
  if (p.limit.ay && benim.some((b) => b.baslangic.slice(0, 7) === baslangic.slice(0, 7))) return `Bu ürün ayda ${p.limit.ay} kez alınabilir; ${baslangic.slice(0, 7)} ayı için zaten talebin var.`;
  if (p.limit.haftaGun) {
    const sayac = {};
    benim.forEach((b) => { for (let i = 0; i < b.gun; i++) { const w = haftaAnahtari(gunEkle(b.baslangic, i)); sayac[w] = (sayac[w] || 0) + 1; } });
    for (let i = 0; i < n; i++) { const w = haftaAnahtari(gunEkle(baslangic, i)); sayac[w] = (sayac[w] || 0) + 1; if (sayac[w] > p.limit.haftaGun) return `Push’ta haftada en fazla ${p.limit.haftaGun} gün alınabilir.`; }
  }
  return null;
}
