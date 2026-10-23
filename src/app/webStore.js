// ═══════════════════════════════════════════════════════════════════════
// WEB YEREL DEPO — ÜÇ AYRI DEPO
//
// Müşteri (kaydıran kullanıcı) verisi ile işletme (Doyurucu) verisi AYRI tutulur; birinin oturumu,
// çıkışı ya da hesap silmesi ötekine dokunmaz. Ayrı anahtar, ayrı oturum, ayrı hook:
//
//   MÜŞTERİ   gur.musteri.v1   riza, kullanici, favoriler, gecilen, yorumlar, konum, acilisGoruldu
//   İŞLETME   gur.isletme.v1   hesap (oturum), sahiplenmeler (başvurular), profiller (girilen alanlar)
//   PLATFORM  gur.platform.v1  olaylar (anonim etkileşim sayıları), talepler (masa talepleri)
//
// PLATFORM, ikisinin kesiştiği yer: müşterinin yaptığı bir işlem (kart gösterimi, kaydetme, masa talebi) işletmenin
// panelinde sayı olarak görünür. Kişisel kimlik taşımaz: olaylar yalnızca sayaçtır, talepte yalnızca mekân ve kişi sayısı
// vardır. Gerçek dağıtımda burası sunucudaki ortak tablodur; müşteri ve işletme verisi de ayrı tablolara/oturumlara karşılık gelir.
// ═══════════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from 'react';
import { RESTAURANTS } from '../data/restaurants.js';
import { orderByProximity, buildDeck, rankCampaigns, QUOTA } from '../../shared/deck.js';
import { KAMPANYA, kelepce, bitisGunu, toplamTutar, reklamKuraliIhlali, bugun, PAKET_BY_KEY, GURMELER } from './gelirKatalog.js';

const ESKI = 'gur.web.v1';
const MUSTERI_VARSAYILAN = {
  riza: null,              // null = sorulmadı | "kabul" | "ret"
  kullanici: null,         // { ad, email }
  favoriler: [],           // restoran id listesi
  gecilen: [],             // sola kaydırılanlar — "geçtiklerine bir daha bak"ın hedefi
  yorumlar: {},            // { [restoranId]: [{ puan, metin, tarih, dogrulandi }] }
  konum: null,             // { kaynak: "cihaz"|"elle", lat, lng, ilce }
  acilisGoruldu: false,
  kota: { gun: '', kullanilan: 0, bonus: 0 },   // günlük kaydırma kotası (ücretsiz 40; ödüllü reklam +5). Gün değişince sıfırlanır.
  videoGorulen: [],        // izlenmiş ödüllü reklam kimlikleri (aynı reklam aynı kullanıcıya bir kez)
  kampanyaGorulen: [],     // bu kullanıcıya gösterilmiş sponsorlu kampanya kimlikleri (aynı kampanya ömür boyu en çok bir kez)
};
const ISLETME_VARSAYILAN = {
  hesap: null,             // { ad, email } işletme oturumu
  hesaplar: [],            // kayıtlı işletme hesapları (bu tarayıcıda): { ad, email, telefon, tuz, iter, hash } — şifre ÖZET olarak
  sahiplenmeler: [],       // [{ id, restaurantId, ad, unvan, vergiNo, yetkili, telefon, eposta, durum: bekliyor|onaylandi|reddedildi, tarih }]
  profiller: {},           // { [restoranId]: { desc, hours, price, phone, website, instagram, facebook } } — girilen alan kaynağı ezer
};
const PLATFORM_VARSAYILAN = {
  olaylar: {},             // { [restoranId]: { toplam: {tip: n}, gun: { 'YYYY-MM-DD': {tip: n} } } }
  talepler: [],            // [{ id, restaurantId, ad, kisi, durum: bekliyor|onaylandi|reddedildi, tarih }]
  bannerlar: [],           // Keşfet banner'ı: YÖNETİCİ koyar. { id, baslik, alt, gorsel, restaurantId?, reklam: bool, aktif: bool }
  restoranAyar: {},        // YÖNETİM kararları: { [restoranId]: { gastro?: bool, askida?: bool } } — yönetici panelinde yazılır, sitede uygulanır
};

// Eski tek kayıttan (gur.web.v1) bir kez taşı: veri kaybolmasın, ama artık ayrı anahtarlarda dursun.
(function tasi() {
  try {
    const ham = localStorage.getItem(ESKI);
    if (!ham) return;
    const o = JSON.parse(ham) || {};
    const sec = (v, anahtarlar) => Object.fromEntries(anahtarlar.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
    if (!localStorage.getItem('gur.musteri.v1')) localStorage.setItem('gur.musteri.v1', JSON.stringify({ ...MUSTERI_VARSAYILAN, ...sec(o, Object.keys(MUSTERI_VARSAYILAN)) }));
    if (!localStorage.getItem('gur.isletme.v1')) localStorage.setItem('gur.isletme.v1', JSON.stringify({ ...ISLETME_VARSAYILAN, hesap: o.isletme ?? null, sahiplenmeler: o.sahiplenmeler ?? [], profiller: o.profiller ?? {} }));
    if (!localStorage.getItem('gur.platform.v1')) localStorage.setItem('gur.platform.v1', JSON.stringify({ ...PLATFORM_VARSAYILAN, olaylar: o.olaylar ?? {}, talepler: o.talepler ?? [] }));
    localStorage.removeItem(ESKI);
  } catch { /* taşıma başarısızsa varsayılanla devam: kullanıcı kilitlenmesin */ }
}());

/** Tek kayıt, bellekte sabit anlık görüntü (useSyncExternalStore sonsuz döngüye girmesin), yazma hatası konsola düşer. */
function depoKur(anahtar, varsayilan, atilacak = []) {
  let durum = varsayilan;
  try {
    const ham = localStorage.getItem(anahtar);
    if (ham) { const o = JSON.parse(ham); if (o && typeof o === 'object') { durum = { ...varsayilan, ...o }; atilacak.forEach((k) => { delete durum[k]; }); } }
  } catch { /* bozuk kayıt ya da depo kapalı */ }
  const dinleyiciler = new Set();
  const duyur = () => { for (const d of dinleyiciler) d(); };
  const abone = (fn) => { dinleyiciler.add(fn); return () => dinleyiciler.delete(fn); };
  const oku = () => durum;
  const yaz = (parca) => {
    const yeni = typeof parca === 'function' ? parca(durum) : parca;
    durum = { ...durum, ...yeni };
    duyur();
    try { localStorage.setItem(anahtar, JSON.stringify(durum)); } catch (e) { console.warn(`GUR: ${anahtar} yazılamadı`, e?.message); }
    return durum;
  };
  const sifirla = () => { durum = varsayilan; duyur(); try { localStorage.removeItem(anahtar); } catch { /* yoksay */ } return durum; };
  return { oku, yaz, sifirla, use: () => useSyncExternalStore(abone, oku, oku) };
}

const GELIR_VARSAYILAN = {
  rezervasyonlar: [],      // sabit fiyatlı reklam talepleri: { id, restaurantId, ad, urun, baslangic, bitis, gun, tutar, durum: bekliyor|onaylandi|reddedildi }
  hizmetTalepleri: [],     // teklifle satılan paketler için "teklif iste": { id, restaurantId, ad, hizmet, durum: acik|teklif|kapandi }
  teklifler: [],           // yönetimin verdiği teklifler: { id, talepId, restaurantId, ad, hizmet, tutar, durum: bekliyor|kabul|ret }
  kampanyalar: [],         // sponsorlu kart kampanyaları: { id, restaurantId, ad, fiyatlama: cpc|cpe, teklif, butce, harcanan, gosterim, tik, etkilesim, durum: bekliyor|aktif|duraklatildi|reddedildi|bitti }
  gurmeYorumlari: [],      // GURME değerlendirmeleri: { id, restaurantId, gurmeId, gurmeAd, uzmanlik, puan (10 üzerinden), baslik, metin, tarih }
};
const musteri = depoKur('gur.musteri.v1', MUSTERI_VARSAYILAN, ['superBegeni']);
const gelir = depoKur('gur.gelir.v1', GELIR_VARSAYILAN);   // GELİR: reklam/paket satışları + GURME içeriği (işletme ile yönetim/gurme arasındaki ortak kayıt)   // kaldırılan özelliğin eski verisi atılır
const isletme = depoKur('gur.isletme.v1', ISLETME_VARSAYILAN);
const platform = depoKur('gur.platform.v1', PLATFORM_VARSAYILAN);

export const useDepo = musteri.use;          // MÜŞTERİ
export const useIsletme = isletme.use;       // İŞLETME
export const usePlatform = platform.use;     // PLATFORM (ortak sayaçlar ve talepler)
export const useGelir = gelir.use;           // GELİR (reklam/paket satışları, GURME yorumları)
export const yaz = musteri.yaz;              // müşteri deposuna yazar

// ─── MÜŞTERİ ─────────────────────────────────────────────────────────
export function favoriCevir(id) {
  const k = String(id);
  const d = musteri.oku();
  const var_ = d.favoriler.includes(k);
  if (!var_) izle(id, 'kaydet');
  return musteri.yaz({ favoriler: var_ ? d.favoriler.filter((x) => x !== k) : [...d.favoriler, k] });
}
/** Sağa kaydırma: kaydet (zaten kayıtlıysa kaldırmaz). */
export function favoriEkle(id) {
  const k = String(id);
  const d = musteri.oku();
  if (d.favoriler.includes(k)) return d;
  izle(id, 'kaydet');
  return musteri.yaz({ favoriler: [...d.favoriler, k] });
}
export function gecildi(id) {
  const k = String(id); const d = musteri.oku();
  return d.gecilen.includes(k) ? d : musteri.yaz({ gecilen: [...d.gecilen, k] });
}
/** Müşterinin hesabını siler: YALNIZCA müşteri verisi. İşletme hesabı ve başvurular etkilenmez. */
export const hepsiniSil = () => musteri.sifirla();

// ─── PLATFORM: etkileşim ölçümü ve masa talepleri ────────────────────
// Etkileşim yalnızca MÜŞTERİ "Ölçümleme izni"ni verdiyse sayılır (rıza kutusundaki söz). Kişisel kimlik taşımaz.
export const OLAY_TIPLERI = ['kart_gosterim', 'goruntulenme', 'kaydet', 'yol_tarifi', 'iletisim', 'masa_talebi'];
export function izle(id, tip) {
  if (musteri.oku().riza !== 'kabul') return;
  const k = String(id);
  const gun = new Date().toISOString().slice(0, 10);
  const { olaylar } = platform.oku();
  const o = olaylar[k] || { toplam: {}, gun: {} };
  const g = o.gun[gun] || {};
  platform.yaz({ olaylar: { ...olaylar, [k]: { toplam: { ...o.toplam, [tip]: (o.toplam[tip] || 0) + 1 }, gun: { ...o.gun, [gun]: { ...g, [tip]: (g[tip] || 0) + 1 } } } } });
}
export function talepEkle(t) {
  izle(t.restaurantId, 'masa_talebi');
  const { talepler } = platform.oku();
  return platform.yaz({ talepler: [{ restaurantId: t.restaurantId, ad: t.ad, kisi: t.kisi, id: `t-${Date.now()}`, durum: 'bekliyor', tarih: new Date().toISOString() }, ...talepler] });
}
/** Yönetim kararı (Gastro Onaylı, askıya alma). Yönetici panelinden yazılır; site yonetimUygula ile okur. */
export const restoranAyarYaz = (id, parca) => platform.yaz((p) => ({ restoranAyar: { ...(p.restoranAyar || {}), [String(id)]: { ...((p.restoranAyar || {})[String(id)] || {}), ...parca } } }));
/** Askıdaki mekânları listeden çıkarır, Gastro kararını uygular. */
export function yonetimUygula(liste, pl) {
  const ay = (pl && pl.restoranAyar) || {};
  return liste.filter((r) => !ay[String(r.id)]?.askida).map((r) => { const a = ay[String(r.id)]; return a && a.gastro !== undefined ? { ...r, gastro: a.gastro } : r; });
}
/** Keşfet banner'ları (yönetici). Sıra = dizi sırası. */
export const bannerEkle = (b) => platform.yaz((p) => ({ bannerlar: [...(p.bannerlar || []), { id: `bn-${Date.now()}`, aktif: true, reklam: false, ...b }] }));
export const bannerGuncelle = (id, parca) => platform.yaz((p) => ({ bannerlar: (p.bannerlar || []).map((b) => (b.id === id ? { ...b, ...parca } : b)) }));
export const bannerSil = (id) => platform.yaz((p) => ({ bannerlar: (p.bannerlar || []).filter((b) => b.id !== id) }));
export function bannerSirala(id, yon) {
  platform.yaz((p) => { const l = [...(p.bannerlar || [])]; const i = l.findIndex((b) => b.id === id); const j = i + yon; if (i < 0 || j < 0 || j >= l.length) return {}; [l[i], l[j]] = [l[j], l[i]]; return { bannerlar: l }; });
}
export const talepKarar = (id, karar) => platform.yaz((p) => ({ talepler: p.talepler.map((t) => (t.id === id ? { ...t, durum: karar, kararTarihi: new Date().toISOString() } : t)) }));

// ─── İŞLETME: oturum, sahiplenme başvurusu, işletmenin girdiği alanlar ─
export const isletmeHesapBul = (email) => isletme.oku().hesaplar.find((h) => h.email.toLowerCase() === String(email).trim().toLowerCase()) || null;
export const isletmeHesapEkle = (h) => isletme.yaz((d) => ({ hesaplar: [...d.hesaplar, h] }));
export const isletmeGiris = (kisi) => isletme.yaz({ hesap: kisi });
export const isletmeCikis = () => isletme.yaz({ hesap: null });

/** Yeni sahiplenme başvurusu. Aynı mekân için bekleyen/onaylı başvuru varsa ikincisi açılmaz. */
export function basvuruEkle(b) {
  const k = String(b.restaurantId);
  const d = isletme.oku();
  const var_ = d.sahiplenmeler.find((s) => String(s.restaurantId) === k && s.durum !== 'reddedildi');
  if (var_) return { ok: false, neden: var_.durum === 'onaylandi' ? 'zaten_sahipli' : 'zaten_bekliyor' };
  const basvuru = { ...b, id: `clm-${Date.now()}`, durum: 'bekliyor', tarih: new Date().toISOString() };
  isletme.yaz({ sahiplenmeler: [basvuru, ...d.sahiplenmeler] });
  return { ok: true, basvuru };
}
export const basvuruKarar = (id, karar) => isletme.yaz((d) => ({ sahiplenmeler: d.sahiplenmeler.map((s) => (s.id === id ? { ...s, durum: karar, kararTarihi: new Date().toISOString() } : s)) }));
export const profilYaz = (id, parca) => isletme.yaz((d) => ({ profiller: { ...d.profiller, [String(id)]: { ...(d.profiller[String(id)] || {}), ...parca } } }));
export function profilSil(id) { const p = { ...isletme.oku().profiller }; delete p[String(id)]; return isletme.yaz({ profiller: p }); }

/** `isl` = işletme deposunun durumu. Onaylı sahiplenmelerin mekân kimlikleri. */
export const sahipliIdler = (isl = isletme.oku()) => isl.sahiplenmeler.filter((s) => s.durum === 'onaylandi').map((s) => String(s.restaurantId));

/** Onaylı sahiplenmeyi (claimed) ve işletmenin girdiği alanları kayda uygular: girilen alan kaynağı ezer, girilmeyen kaynaktan gelmeye devam eder. */
export function sahiplikUygula(liste, isl) {
  const sahip = new Set(sahipliIdler(isl));
  return liste.map((r) => {
    const p = isl.profiller[String(r.id)];
    const claimed = sahip.has(String(r.id));
    if (!claimed && !p) return r;
    const girilen = p ? Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null)) : {};
    return { ...r, ...(claimed ? { claimed: true } : {}), ...girilen, ownerFields: Object.keys(girilen) };
  });
}

// ─── GELİR: reklam talepleri, paket teklifleri, GURME yorumları ──────────
// Uygulamadaki kural: HİÇBİR ŞEY kendiliğinden satın alınmaz. Sabit fiyatlı reklamda işletme takvimden tarih seçer, talep yönetime
// düşer, onaylanınca yayına girer. Teklifle satılan pakette işletme teklif ister, yönetim fiyatlar, işletme kabul/ret eder.
// Yönetim işlemleri (onay, teklif) yerel önizlemede arayüzde açıkça "simüle et" etiketiyle yapılır; sunucuda yönetici panelinden gelir.
export function reklamTalebi({ restaurantId, ad, urun, baslangic, gun }) {
  const g = gelir.oku();
  const ihlal = reklamKuraliIhlali({ urun, restaurantId, baslangic, gun }, g.rezervasyonlar);
  if (ihlal) return { ok: false, neden: ihlal };
  const n = kelepce(urun, gun);
  const rez = { id: `rez-${Date.now()}`, restaurantId: String(restaurantId), ad, urun, baslangic, bitis: bitisGunu(urun, baslangic, n), gun: n, tutar: toplamTutar(urun, n), durum: 'bekliyor', tarih: new Date().toISOString() };
  gelir.yaz({ rezervasyonlar: [rez, ...g.rezervasyonlar] });
  return { ok: true, rez };
}
/** Banner görseli: yalnızca TARİHİ ONAYLANMIŞ banner rezervasyonu için yüklenir ve yönetici onaylamadan sitede çıkmaz. */
export const bannerGorselYukle = (id, gorsel) => gelir.yaz((g) => ({ rezervasyonlar: g.rezervasyonlar.map((r) => (r.id === id && r.urun === 'bannerAds' && r.durum === 'onaylandi' ? { ...r, gorsel, gorselDurum: 'bekliyor', gorselNot: '' } : r)) }));
export const bannerGorselKarar = (id, durum, not = '') => gelir.yaz((g) => ({ rezervasyonlar: g.rezervasyonlar.map((r) => (r.id === id ? { ...r, gorselDurum: durum, gorselNot: not } : r)) }));
export const reklamKarar = (id, durum) => gelir.yaz((g) => ({ rezervasyonlar: g.rezervasyonlar.map((r) => (r.id === id ? { ...r, durum, kararTarihi: new Date().toISOString() } : r)) }));

export function hizmetTalebiEkle({ restaurantId, ad, hizmet }) {
  const g = gelir.oku();
  if (!PAKET_BY_KEY[hizmet]) return { ok: false, neden: 'Bilinmeyen hizmet.' };
  if (g.hizmetTalepleri.some((t) => String(t.restaurantId) === String(restaurantId) && t.hizmet === hizmet && (t.durum === 'acik' || t.durum === 'teklif'))) return { ok: false, neden: 'Bu hizmet için zaten açık bir talebin var.' };
  const talep = { id: `tal-${Date.now()}`, restaurantId: String(restaurantId), ad, hizmet, durum: 'acik', tarih: new Date().toISOString() };
  gelir.yaz({ hizmetTalepleri: [talep, ...g.hizmetTalepleri] });
  return { ok: true, talep };
}
/** Yönetimin teklifi (yerel önizlemede simüle edilir). */
export function teklifGonder(talepId, tutar) {
  const g = gelir.oku();
  const talep = g.hizmetTalepleri.find((t) => t.id === talepId);
  const n = Math.round(Number(tutar));
  if (!talep || !Number.isFinite(n) || n <= 0) return { ok: false };
  const teklif = { id: `tek-${Date.now()}`, talepId, restaurantId: talep.restaurantId, ad: talep.ad, hizmet: talep.hizmet, tutar: n, durum: 'bekliyor', tarih: new Date().toISOString() };
  gelir.yaz({ teklifler: [teklif, ...g.teklifler], hizmetTalepleri: g.hizmetTalepleri.map((t) => (t.id === talepId ? { ...t, durum: 'teklif' } : t)) });
  return { ok: true, teklif };
}
/** İşletmenin kararı: kabul → paket yürürlüğe girer; ret → talep açık kalır, yeni teklif gelebilir. */
export function teklifKarar(id, karar) {
  const g = gelir.oku();
  const tek = g.teklifler.find((t) => t.id === id); if (!tek) return;
  gelir.yaz({
    teklifler: g.teklifler.map((t) => (t.id === id ? { ...t, durum: karar, kararTarihi: new Date().toISOString() } : t)),
    hizmetTalepleri: g.hizmetTalepleri.map((t) => (t.id === tek.talepId ? { ...t, durum: karar === 'kabul' ? 'kapandi' : 'acik' } : t)),
  });
}
export const gurmePaketiVar = (g, restaurantId) => g.teklifler.some((t) => String(t.restaurantId) === String(restaurantId) && t.hizmet === 'gurmePackage' && t.durum === 'kabul');
export const aktifBannerlar = (g, gun = bugun()) => g.rezervasyonlar.filter((r) => r.urun === 'bannerAds' && r.durum === 'onaylandi' && r.baslangic <= gun && gun <= r.bitis);

/** GURME değerlendirmesi: yalnızca GURME paketi yürürlükte olan mekâna yazılabilir; puan 10 üzerinden, not gerekçeli (en az 40 karakter). */
export function gurmeYorumuEkle({ restaurantId, gurmeId, puan, baslik, metin }) {
  const g = gelir.oku();
  const gurme = GURMELER.find((x) => x.id === Number(gurmeId));
  const p = Math.round(Number(puan) * 10) / 10;
  if (!gurme) return { ok: false, neden: 'Gurme seç.' };
  if (!gurmePaketiVar(g, restaurantId)) return { ok: false, neden: 'Bu mekânın yürürlükte bir GURME paketi yok.' };
  if (!(p >= 0 && p <= 10)) return { ok: false, neden: 'Puan 0 ile 10 arasında olmalı.' };
  if (String(metin || '').trim().length < 40) return { ok: false, neden: 'Gerekçeli not en az 40 karakter olmalı.' };
  const y = { id: `gy-${Date.now()}`, restaurantId: String(restaurantId), gurmeId: gurme.id, gurmeAd: gurme.ad, uzmanlik: gurme.uzmanlik, puan: p, baslik: String(baslik || '').trim(), metin: String(metin).trim(), tarih: new Date().toISOString() };
  gelir.yaz({ gurmeYorumlari: [y, ...g.gurmeYorumlari] });
  return { ok: true, yorum: y };
}
// ─── Veri ───────────────────────────────────────────────────────────
export { RESTAURANTS };

/** Yakınlık sıralaması — sunucunun kullandığı fonksiyonun aynısı. Başlangıç yoksa liste olduğu gibi. */
export function yakinaGore(liste, baslangic) {
  if (!baslangic || !Number.isFinite(baslangic.lat) || !Number.isFinite(baslangic.lng)) return liste;
  try { return orderByProximity(liste, { lat: baslangic.lat, lng: baslangic.lng }); } catch { return liste; }
}

/** Mesafe metni: hesaplanmış `distanceKm` varsa ondan, yoksa kayıttaki hazır metinden (ilçe adı). */
export function mesafeMetni(r) {
  if (Number.isFinite(r?.distanceKm)) {
    return r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)} m` : `${r.distanceKm.toFixed(1)} km`;
  }
  return r?.dist || '';
}

/** Deste: geçilenler çıkarılmış, sponsorlu kampanya yok (demo müşteri/kampanya yok). */
export function desteKur(restoranlar, { gecilen = [], tohum = 1, kampanyalar = [], gorulen = [] } = {}) {
  const kalan = restoranlar.filter((r) => !gecilen.includes(String(r.id)));
  // Sponsorlu adaylar: skor = teklif × kalite (shared/deck.js). Kalite, yeterli gösterim birikene kadar nötr kabul edilir.
  const adaylar = rankCampaigns(kampanyalar.filter((k) => k.durum === 'aktif').map((k) => {
    const r = restoranlar.find((x) => String(x.id) === String(k.restaurantId));
    return r ? {
      id: k.id, status: 'active', remainingBudgetMinor: k.butce - k.harcanan, bidMinor: k.teklif, category: r.cat, restaurant: r,
      engagementRate: k.gosterim >= 20 ? Math.min(1, (k.tik + k.etkilesim) / k.gosterim) : undefined, label: 'Sponsorlu', pricing: k.fiyatlama,
    } : null;
  }).filter(Boolean));
  const sponsorlu = new Set(adaylar.map((c) => String(c.restaurant.id)));
  const organik = kalan.filter((r) => !sponsorlu.has(String(r.id)));   // aynı mekân hem organik hem sponsorlu görünmesin
  try { return buildDeck(organik, adaylar, { seed: tohum, seenCampaigns: gorulen }); } catch { return kalan; }
}

// ─── Kaydırma kotası + ödüllü reklam (müşteri) ───
/** Bugünün kotası: gün değiştiyse sıfırdan başlar. Ham sayı arayüze gösterilmez (yalnızca shared/deck.js quotaState baskısı). */
export const kotaOku = (d) => { const g = bugun(); const k = d.kota; return k && k.gun === g ? k : { gun: g, kullanilan: 0, bonus: 0 }; };
export const kotaKullan = () => musteri.yaz((d) => { const k = kotaOku(d); return { kota: { ...k, kullanilan: k.kullanilan + 1 } }; });
export const kotaBonusVer = (reklamId) => musteri.yaz((d) => { const k = kotaOku(d); return { kota: { ...k, bonus: k.bonus + QUOTA.rewardBonus }, videoGorulen: [...new Set([...(d.videoGorulen || []), String(reklamId)])] }; });
// ─── Sponsorlu kart kampanyaları (işletme açar, yönetim onaylar, deste içine karışır) ───
export function kampanyaAc({ restaurantId, ad, fiyatlama, teklif, butce }) {
  const g = gelir.oku();
  const tk = Number(teklif); const bt = Number(butce);
  if (fiyatlama !== 'cpc' && fiyatlama !== 'cpe') return { ok: false, neden: 'Fiyatlama türünü seç.' };
  if (!(tk >= KAMPANYA.minTeklif)) return { ok: false, neden: `Teklif en az ${KAMPANYA.minTeklif} ₺ olmalı.` };
  if (!(bt >= KAMPANYA.minButce)) return { ok: false, neden: `Bütçe en az ${KAMPANYA.minButce} ₺ olmalı.` };
  if (bt < tk) return { ok: false, neden: 'Bütçe, tek bir teklif tutarından küçük olamaz.' };
  if (g.kampanyalar.some((k) => String(k.restaurantId) === String(restaurantId) && ['bekliyor', 'aktif', 'duraklatildi'].includes(k.durum))) return { ok: false, neden: 'Bu mekân için zaten açık bir kampanya var.' };
  const k = { id: `kmp-${Date.now()}`, restaurantId: String(restaurantId), ad, fiyatlama, teklif: Math.round(tk * 100) / 100, butce: Math.round(bt), harcanan: 0, gosterim: 0, tik: 0, etkilesim: 0, durum: 'bekliyor', tarih: new Date().toISOString() };
  gelir.yaz({ kampanyalar: [k, ...g.kampanyalar] });
  return { ok: true, kampanya: k };
}
/** Durum geçişi: yönetim onayı (bekliyor→aktif/reddedildi) ve işletmenin duraklat/sürdür kararı. */
export const kampanyaKarar = (id, durum) => gelir.yaz((g) => ({ kampanyalar: g.kampanyalar.map((k) => (k.id === id ? { ...k, durum } : k)) }));
/** Olay: gosterim (ücretsiz) · tik = detay açıldı (CPC öder) · etkilesim = kaydedildi (CPE öder). Bütçe bitince kampanya kapanır. */
export function kampanyaOlay(id, tip) {
  gelir.yaz((g) => ({
    kampanyalar: g.kampanyalar.map((k) => {
      if (k.id !== id || k.durum !== 'aktif') return k;
      const n = { ...k, [tip]: (k[tip] || 0) + 1 };
      if ((tip === 'tik' && k.fiyatlama === 'cpc') || (tip === 'etkilesim' && k.fiyatlama === 'cpe')) {
        n.harcanan = Math.round((k.harcanan + k.teklif) * 100) / 100;
        if (n.harcanan + k.teklif > k.butce) n.durum = 'bitti';
      }
      return n;
    }),
  }));
}
// ─── Konum: üç yol, üçü de eşit ağırlıkta (müşteri) ───────────────────
export const ILCELER = [
  { ad: 'Kadıköy', lat: 40.9903, lng: 29.0264 },
  { ad: 'Beşiktaş', lat: 41.0430, lng: 29.0094 },
  { ad: 'Beyoğlu', lat: 41.0336, lng: 28.9770 },
  { ad: 'Şişli', lat: 41.0602, lng: 28.9877 },
  { ad: 'Üsküdar', lat: 41.0226, lng: 29.0133 },
  { ad: 'Bakırköy', lat: 40.9819, lng: 28.8772 },
  { ad: 'Sarıyer', lat: 41.1670, lng: 29.0570 },
  { ad: 'Ataşehir', lat: 40.9923, lng: 29.1244 },
  { ad: 'Fatih', lat: 41.0186, lng: 28.9397 },
  { ad: 'Maltepe', lat: 40.9351, lng: 29.1310 },
];

/** Tarayıcı konum izni. Reddedilirse ya da desteklenmezse `null` — akış tıkanmaz, ilçe listesi açılır. */
export function cihazKonumu() {
  return new Promise((coz) => {
    if (!('geolocation' in navigator)) { coz(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => coz({ kaynak: 'cihaz', lat: p.coords.latitude, lng: p.coords.longitude, ilce: null }),
      () => coz(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

export function ilceSec(ad) {
  const i = ILCELER.find((x) => x.ad === ad);
  return i ? { kaynak: 'elle', lat: i.lat, lng: i.lng, ilce: i.ad } : null;
}
