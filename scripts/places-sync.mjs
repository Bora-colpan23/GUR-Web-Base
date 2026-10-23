#!/usr/bin/env node
// Google Places (New) senkronizasyonu — maliyet dostu iki aşama:
//
//   kesif     (AYDA 1)   Yeni mekânları bulur. Text Search YALNIZCA KİMLİK (places.id) ister: Google bunu "IDs Only / Essentials"
//                        sınıfında sayar, ÜCRETSİZ. Yeni kimlikler önbelleğe eklenir (alanları henüz çekilmez).
//   guncelle  (HAFTADA 1) Alanları (puan, yorum sayısı, saat, telefon, web, koordinat) yalnızca YENİ ya da ESKİMİŞ kayıtlar için çeker
//                        (Place Details, Enterprise sınıfı: bugünkü fiyat ~$20/1000, ayda 1000 ücretsiz).
//
// Güvenlik ağları: aylık Details sınırı (varsayılan 950, ücretsiz hakkın altı), çalıştırma başına istek sınırı, --kuru (ağa çıkmaz).
// Anahtar: .env içinde GOOGLE_PLACES_API_KEY (koda YAZMAYIN; Google Cloud'da anahtarı Places API ile ve sunucu IP'sine kısıtlayın).
//
// Kullanım:
//   node scripts/places-sync.mjs kesif    [--kuru] [--sinir=400]
//   node scripts/places-sync.mjs guncelle [--kuru] [--yas=7] [--sinir=300]
//   node scripts/places-sync.mjs durum
//
// Çıktı: src/data/places-cache.json (site src/data/placesBirlestir.js ile okur). Saklama şartları için Google'ın güncel
// koşullarını kontrol edin: yalnızca place_id süresiz saklanabilir; diğer alanlar sınırlı süre önbelleğe alınır, bu yüzden her kayıtta
// `cekildi` tarihi tutulur ve eskiyenler yeniden çekilir.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ONBELLEK = path.join(KOK, 'src/data/places-cache.json');
const API = (process.env.PLACES_API_ROOT || 'https://places.googleapis.com').replace(/\/$/, '');

// ── .env (bağımlılıksız) ──
try {
  for (const s of fs.readFileSync(path.join(KOK, '.env'), 'utf8').split(/\r?\n/)) {
    const m = s.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* .env yoksa ortam değişkenleri kullanılır */ }

const komut = process.argv[2];
const bayrak = (ad, vars) => { const a = process.argv.find((x) => x.startsWith(`--${ad}=`)); return a ? Number(a.split('=')[1]) : vars; };
const kuru = process.argv.includes('--kuru');
const AYLIK_DETAY = Number(process.env.PLACES_AYLIK_DETAY_SINIRI || 900);
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const bugun = () => new Date().toISOString();
const ay = () => bugun().slice(0, 7);
const norm = (s) => String(s || '').toLocaleLowerCase('tr').replace(/[^a-z0-9ğüşöçıİ ]/gi, ' ').replace(/\s+/g, ' ').trim();

function oku() { try { return JSON.parse(fs.readFileSync(ONBELLEK, 'utf8')); } catch { return { guncelleme: null, kullanim: {}, mekanlar: {} }; } }
function yaz(d) { fs.mkdirSync(path.dirname(ONBELLEK), { recursive: true }); fs.writeFileSync(ONBELLEK, JSON.stringify(d, null, 1) + '\n'); }

async function cagri(yol, { yontem = 'GET', govde, alanlar }) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY yok: .env dosyasına ekleyin.');
  const r = await fetch(`${API}${yol}`, {
    method: yontem,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': alanlar },
    body: govde ? JSON.stringify(govde) : undefined,
  });
  if (!r.ok) { const e = new Error(`Places ${r.status}: ${(await r.text()).slice(0, 200)}`); e.durum = r.status; throw e; }
  return r.json();
}

// ── KEŞİF ──
async function kesif() {
  const { BAKIRKOY, BAKIRKOY_ILCE } = await import('../shared/bakirkoy.js');
  const mahalleler = [...new Set(BAKIRKOY.map((k) => k.mahalle).filter(Boolean))];
  const turler = ['restoran', 'kafe', 'kebap', 'pizza', 'balık restoranı', 'pastane', 'lokanta', 'fast food', 'tatlıcı'];
  const sorgular = (mahalleler.length ? mahalleler : ['']).flatMap((m) => turler.map((t) => `${t} ${m} Bakırköy İstanbul`.replace(/\s+/g, ' ').trim()));
  const sinir = bayrak('sinir', 400);
  const d = BAKIRKOY_ILCE.lat ? 0.045 : 0.045;
  const kutu = { rectangle: { low: { latitude: BAKIRKOY_ILCE.lat - d, longitude: BAKIRKOY_ILCE.lng - d }, high: { latitude: BAKIRKOY_ILCE.lat + d, longitude: BAKIRKOY_ILCE.lng + d } } };
  console.log(`Keşif: ${sorgular.length} sorgu (sayfa başına 20 sonuç, en çok 3 sayfa), sınır ${sinir} istek. Alan maskesi yalnızca kimlik = ücretsiz sınıf.`);
  if (kuru) { console.log('--kuru: ağa çıkılmadı.'); return; }

  const veri = oku(); let istek = 0; let yeni = 0;
  for (const q of sorgular) {
    let sayfa = null;
    for (let s = 0; s < 3; s++) {
      if (istek >= sinir) { console.log('İstek sınırına ulaşıldı, durdu.'); break; }
      const govde = { textQuery: q, languageCode: 'tr', regionCode: 'TR', pageSize: 20, locationRestriction: kutu, ...(sayfa ? { pageToken: sayfa } : {}) };
      let yanit;
      try { yanit = await cagri('/v1/places:searchText', { yontem: 'POST', govde, alanlar: 'places.id,nextPageToken' }); }
      catch (e) {
        istek++;   // başarısız istek de sayılır
        if ([401, 403, 429].includes(e.durum)) { console.error(`Yetki/kota hatası (${e.durum}): durduruldu. Anahtarın Places API (New) ile etkin ve kısıtlamaların (API/IP) doğru olduğundan emin olun.
${e.message.split('\n')[0]}`); yaz(veri); process.exit(1); }
        console.error(`  hata (${q}): ${e.message.split('\n')[0]}`); break;
      }
      istek++;
      for (const p of yanit.places || []) {
        if (!veri.mekanlar[p.id]) { veri.mekanlar[p.id] = { placeId: p.id, kesfedildi: bugun(), cekildi: null }; yeni++; }
      }
      sayfa = yanit.nextPageToken; if (!sayfa) break;
      await bekle(200);
    }
    if (istek >= sinir) break;
  }
  veri.guncelleme = bugun(); yaz(veri);
  console.log(`Keşif bitti: ${istek} istek, ${yeni} yeni kimlik, toplam ${Object.keys(veri.mekanlar).length}.`);
}

// ── GÜNCELLEME ──
const DETAY_ALANLARI = 'id,displayName,formattedAddress,location,rating,userRatingCount,nationalPhoneNumber,websiteUri,regularOpeningHours.weekdayDescriptions,primaryType,businessStatus';
// Bölge koruması: yalnızca uygulamadaki bölge (Bakırköy) kabul edilir; Google dışarıdan bir mekân döndürürse kayıt DIŞARIDA sayılıp saklanmaz.
const BOLGE_PAYI = 0.06;
async function guncelle() {
  const { BAKIRKOY_ILCE } = await import('../shared/bakirkoy.js');
  const bolgedeMi = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat - BAKIRKOY_ILCE.lat) <= BOLGE_PAYI && Math.abs(lng - BAKIRKOY_ILCE.lng) <= BOLGE_PAYI;
  const yas = bayrak('yas', 7); const sinir = bayrak('sinir', 300);
  const veri = oku(); veri.kullanim ||= {}; veri.kullanim[ay()] ||= { detay: 0 };
  const esik = Date.now() - yas * 86400000;
  const eskiler = Object.values(veri.mekanlar).filter((m) => !m.kaldirildi && (!m.cekildi || new Date(m.cekildi).getTime() < esik))
    .sort((a, b) => (a.cekildi ? new Date(a.cekildi).getTime() : 0) - (b.cekildi ? new Date(b.cekildi).getTime() : 0));
  const kalanHak = Math.max(0, AYLIK_DETAY - veri.kullanim[ay()].detay);
  const yapilacak = Math.min(eskiler.length, sinir, kalanHak);
  console.log(`Güncelleme: ${eskiler.length} kayıt ${yas} günden eski/yeni; bu çalıştırmada ${yapilacak} çekilecek (bu ay kullanılan ${veri.kullanim[ay()].detay}/${AYLIK_DETAY}).`);
  console.log(`Tahmini maliyet: ücretsiz hak (ayda 1000 Details) içinde ~$0; aşılırsa 1000 istek ≈ $20.`);
  if (eskiler.length > yapilacak) console.log(`Not: ${eskiler.length - yapilacak} kayıt sınır yüzünden sonraki çalıştırmaya kaldı.`);
  if (kuru) { console.log('--kuru: ağa çıkılmadı.'); return; }

  let ok = 0; let hata = 0;
  for (const m of eskiler.slice(0, yapilacak)) {
    try {
      const p = await cagri(`/v1/places/${encodeURIComponent(m.placeId)}?languageCode=tr`, { alanlar: DETAY_ALANLARI });
      Object.assign(m, {
        ad: p.displayName?.text || m.ad, adres: p.formattedAddress, lat: p.location?.latitude, lng: p.location?.longitude,
        puan: p.rating ?? null, yorumSayisi: p.userRatingCount ?? null, telefon: p.nationalPhoneNumber || null, web: p.websiteUri || null,
        saatler: p.regularOpeningHours?.weekdayDescriptions || null, tur: p.primaryType || null, durum: p.businessStatus || null, cekildi: bugun(),
      });
      if (!bolgedeMi(m.lat, m.lng)) { m.kaldirildi = true; m.disari = true; }   // uygulama bölgesi dışı: sitede gösterilmez
      ok++; veri.kullanim[ay()].detay++;
    } catch (e) {
      hata++;
      if (e.durum === 404) { m.kaldirildi = true; } else console.error(`  hata (${m.placeId}): ${e.message}`);
      if (e.durum === 403 || e.durum === 429) { console.error('Yetki/kota hatası: durduruluyor.'); break; }
    }
    if (ok % 25 === 0) yaz(veri);
    await bekle(120);
  }
  // Mevcut listeyle ad eşleştirme (aynı mekânı iki kez göstermemek için)
  const { RESTAURANTS } = await import('../src/data/restaurants.js');
  const adlar = new Map(RESTAURANTS.map((r) => [norm(r.name), r.id]));
  for (const m of Object.values(veri.mekanlar)) if (m.ad && !m.bkrId && adlar.has(norm(m.ad))) m.bkrId = adlar.get(norm(m.ad));
  veri.guncelleme = bugun(); yaz(veri);
  console.log(`Bitti: ${ok} güncellendi, ${hata} hata. Eşleşen mevcut kayıt: ${Object.values(veri.mekanlar).filter((m) => m.bkrId).length}.`);
}

function durum() {
  const v = oku(); const l = Object.values(v.mekanlar);
  console.log(`Önbellek: ${l.length} kayıt; alanı çekilmiş ${l.filter((m) => m.cekildi).length}; mevcut listeyle eşleşen ${l.filter((m) => m.bkrId).length}; yeni (listede yok) ${l.filter((m) => m.cekildi && !m.bkrId).length}.`);
  console.log(`Son güncelleme: ${v.guncelleme || '—'}; aylık kullanım: ${JSON.stringify(v.kullanim || {})}`);
}

const islem = { kesif, guncelle, durum }[komut];
if (!islem) { console.log('Kullanım: node scripts/places-sync.mjs kesif|guncelle|durum [--kuru] [--yas=7] [--sinir=N]'); process.exit(1); }
Promise.resolve(islem()).catch((e) => { console.error(e.message); process.exit(1); });
