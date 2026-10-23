// Google Places önbelleğini (scripts/places-sync.mjs çıktısı) mekân listesine birleştirir.
//  • Mevcut kayıtla eşleşen (bkrId) mekân: puan, yorum sayısı, koordinat, saat, telefon, web Google'dan güncellenir.
//  • Listede olmayan mekân: yeni kayıt olarak eklenir (source: "google"; fotoğraf yer tutucu, Google fotoğrafı kullanılmaz).
//  • Kalıcı kapalı (CLOSED_PERMANENTLY) ve Google'da bulunamayan mekân listeden çıkar.
// Önbellek boşsa liste olduğu gibi döner.
import onbellek from './places-cache.json';

const TUR = {
  turkish_restaurant: 'Türk Mutfağı', cafe: 'Kafe', coffee_shop: 'Kafe', italian_restaurant: 'İtalyan', pizza_restaurant: 'İtalyan',
  seafood_restaurant: 'Deniz Ürünleri', fast_food_restaurant: 'Fast Food', hamburger_restaurant: 'Fast Food', bakery: 'Tatlıcı',
  dessert_shop: 'Tatlıcı', ice_cream_shop: 'Tatlıcı', bar: 'Gece Hayatı', steak_house: 'Mangal', barbecue_restaurant: 'Mangal',
  japanese_restaurant: 'Uzak Doğu', chinese_restaurant: 'Uzak Doğu', sushi_restaurant: 'Uzak Doğu', vegan_restaurant: 'Sağlıklı', vegetarian_restaurant: 'Sağlıklı',
};

/** Bugünün saat satırı ("Pazartesi: 09:00–23:00" → "09:00–23:00"). */
function bugunSaat(saatler) {
  if (!Array.isArray(saatler) || saatler.length < 7) return null;
  const s = saatler[(new Date().getDay() + 6) % 7] || '';
  return s.includes(': ') ? s.split(': ').slice(1).join(': ') : s || null;
}

export function placesUygula(liste, veri = onbellek) {
  const mekanlar = Object.values(veri?.mekanlar || {}).filter((m) => m.cekildi);
  if (!mekanlar.length) return liste;
  const byBkr = new Map(mekanlar.filter((m) => m.bkrId).map((m) => [m.bkrId, m]));
  const kapali = (m) => m.durum === 'CLOSED_PERMANENTLY' || m.kaldirildi;

  const guncel = liste.filter((r) => !(byBkr.has(r.id) && kapali(byBkr.get(r.id)))).map((r) => {
    const m = byBkr.get(r.id); if (!m) return r;
    return {
      ...r,
      ...(m.puan != null ? { rating: m.puan } : {}), ...(m.yorumSayisi != null ? { ratingCount: m.yorumSayisi } : {}),
      ...(Number.isFinite(m.lat) && Number.isFinite(m.lng) ? { lat: m.lat, lng: m.lng } : {}),
      ...(bugunSaat(m.saatler) ? { hours: bugunSaat(m.saatler) } : {}),
      ...(m.telefon && !r.phone ? { phone: m.telefon } : {}), ...(m.web && !r.website ? { website: m.web } : {}),
      googlePlaceId: m.placeId, googleGuncelleme: m.cekildi,
    };
  });

  const yeniler = mekanlar.filter((m) => !m.bkrId && !kapali(m) && m.ad).map((m) => {
    const id = `gmp-${m.placeId}`;
    return {
      id, name: m.ad, cat: TUR[m.tur] || 'Restoran', rating: m.puan ?? 0, ratingCount: m.yorumSayisi ?? 0, dist: 'Bakırköy', price: null,
      addr: m.adres || '', desc: `${m.adres || 'Bakırköy'}`, imgs: [0, 1, 2].map((i) => `https://picsum.photos/seed/${id}-${i}/600/400`), menu: [],
      hours: bugunSaat(m.saatler), tags: [], popular: [], lat: Number.isFinite(m.lat) ? m.lat : null, lng: Number.isFinite(m.lng) ? m.lng : null,
      district: 'Bakırköy', phone: m.telefon || null, website: m.web || null, source: 'google', googlePlaceId: m.placeId, googleGuncelleme: m.cekildi,
    };
  });
  return [...guncel, ...yeniler];
}
