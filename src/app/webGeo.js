// ═══════════════════════════════════════════════════════════════════════
// ADRESTEN KONUM — Doyurucu haritası için
//
// Mekân listesinde (Bakırköy, 218 kayıt) koordinat YOK; uydurmuyoruz. İğneler ancak
//   • kayıtta gerçek lat/lng varsa                         → hassasiyet "kayit"
//   • mekân adı OpenStreetMap'te bir işletme olarak bulunursa → "poi"   (tam konum)
//   • adresteki sokak + numara çözülürse                   → "sokak" (sokak düzeyinde, yaklaşık)
//   • yalnızca mahalle çözülürse                           → "mahalle" (mahalle içinde, yaklaşık)
// çıkar. Yaklaşık sonuçlar haritada ve listede AÇIKÇA "yaklaşık" yazar; aynı sokaktaki iğneler
// üst üste binmesin diye (en çok ~35 m / ~140 m) belirlenimli küçük bir kaydırma uygulanır.
//
// Nominatim kullanım kuralı: saniyede en fazla 1 istek (burada ≥1,1 sn). Gizlilik: yalnızca
// mekân adı + işletme adresi (herkese açık bilgi) gider, kullanıcı konumu gitmez; istek yalnızca
// Doyurucu "Konumları bul / Haritada göster" dediğinde başlar. Sonuçlar tarayıcıda saklanır.
// ═══════════════════════════════════════════════════════════════════════

const ANAHTAR = 'gur.geo.v2';
const ISTANBUL = { latMin: 40.75, latMax: 41.60, lngMin: 28.40, lngMax: 29.95 };
const ARALIK_MS = 1100;
const POI_SINIFI = new Set(['amenity', 'shop', 'tourism', 'leisure']);

let onbellek = {};
try { const ham = localStorage.getItem(ANAHTAR); if (ham) onbellek = JSON.parse(ham) || {}; } catch { /* yoksay */ }
const kaydet = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(onbellek)); } catch { /* yoksay */ } };

const istanbulda = (lat, lng) => lat >= ISTANBUL.latMin && lat <= ISTANBUL.latMax && lng >= ISTANBUL.lngMin && lng <= ISTANBUL.lngMax;

function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Yaklaşık sonuçları üst üste bindirmemek için belirlenimli küçük kaydırma (metre). */
function kaydir(lat, lng, id, azamiM) {
  const h = hash(id);
  const aci = ((h % 360) * Math.PI) / 180;
  const m = azamiM * (0.35 + ((h >>> 9) % 65) / 100);
  return { lat: lat + (m * Math.cos(aci)) / 111320, lng: lng + (m * Math.sin(aci)) / (111320 * Math.cos((lat * Math.PI) / 180)) };
}

/** Mekânın bilinen koordinatı + hassasiyeti. Yoksa null. */
export function koordinat(r) {
  if (Number.isFinite(r?.lat) && Number.isFinite(r?.lng)) return { lat: r.lat, lng: r.lng, hassasiyet: 'kayit' };
  const c = onbellek[String(r?.id)];
  return c && Number.isFinite(c.lat) ? c : null;
}
export const bulunamadi = (r) => onbellek[String(r?.id)] === null;
export const yaklasikMi = (k) => !!k && (k.hassasiyet === 'sokak' || k.hassasiyet === 'mahalle');
export const HASSASIYET_METNI = { kayit: 'tam konum', poi: 'tam konum', sokak: 'yaklaşık (sokak düzeyinde)', mahalle: 'yaklaşık (mahalle içinde)' };

let sonIstek = 0;
async function ara(q, sinyal) {
  const bekle = sonIstek + ARALIK_MS - Date.now();
  if (bekle > 0) await new Promise((y) => setTimeout(y, bekle));
  if (sinyal?.aborted) throw new DOMException('iptal', 'AbortError');
  sonIstek = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tr&accept-language=tr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal: sinyal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const k = (await res.json())?.[0];
  if (!k) return null;
  const lat = Number(k.lat), lng = Number(k.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) && istanbulda(lat, lng) ? { lat, lng, sinif: k.category || k.class } : null;
}

/** "Zeytinlik, Türkçü Sk. BEYAZLAR PASAJI No:13/B" → "Türkçü Sk. 13" */
function sokakNo(adres) {
  const m = (adres || '').match(/([A-Za-zÇĞİÖŞÜçğıöşü0-9. ]+?(?:Sk\.|Sok\.|Sokak|Cd\.|Cad\.|Caddesi|Cadde|Blv\.|Bulvarı))\s*(?:No:?\s*)?(\d+)?/i);
  return m ? `${m[1].trim()}${m[2] ? ` ${m[2]}` : ''}` : null;
}

/** Tek mekânı çöz (3 kademe). Sonucu önbelleğe yazar; hiçbiri tutmazsa null (tekrar sorulmaz). */
export async function coz(r, sinyal) {
  const var_ = koordinat(r);
  if (var_) return var_;
  const mahalle = r.tags?.[1] || '';
  const bolge = `${mahalle ? `${mahalle}, ` : ''}Bakırköy, İstanbul`;
  let sonuc = null;

  const poi = await ara(`${r.name}, Bakırköy, İstanbul`, sinyal);
  if (poi && POI_SINIFI.has(poi.sinif)) sonuc = { lat: poi.lat, lng: poi.lng, hassasiyet: 'poi' };

  if (!sonuc) {
    const sk = sokakNo(r.addr);
    const s = sk ? await ara(`${sk}, ${bolge}`, sinyal) : null;
    if (s) { const o = kaydir(s.lat, s.lng, r.id, 35); sonuc = { ...o, hassasiyet: 'sokak' }; }
  }
  if (!sonuc && mahalle) {
    const m = await ara(`${mahalle} Mahallesi, Bakırköy, İstanbul`, sinyal);
    if (m) { const o = kaydir(m.lat, m.lng, r.id, 140); sonuc = { ...o, hassasiyet: 'mahalle' }; }
  }
  onbellek[String(r.id)] = sonuc; // null = denendi, bulunamadı
  kaydet();
  return sonuc;
}

/** Listeyi sırayla çöz. `ilerle(biten, toplam, r)` her adımda çağrılır; sinyal iptal edilince durur. */
export async function topluCoz(liste, { sinyal, ilerle } = {}) {
  const bekleyen = liste.filter((r) => !koordinat(r) && !bulunamadi(r));
  let biten = 0;
  for (const r of bekleyen) {
    if (sinyal?.aborted) break;
    try { await coz(r, sinyal); } catch (e) { if (e?.name === 'AbortError') break; /* ağ hatası: bu mekânı atla */ }
    biten += 1;
    ilerle?.(biten, bekleyen.length, r);
  }
  return biten;
}
