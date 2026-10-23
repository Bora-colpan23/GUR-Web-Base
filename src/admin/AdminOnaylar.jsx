import React, { useState } from 'react';
import { useGelir, reklamKarar, teklifGonder, kampanyaKarar, bannerGorselKarar } from '../app/webStore.js';
import { AD_PRODUCTS, PAKET_BY_KEY, TL } from '../app/gelirKatalog.js';

// Onay kuyruğu: web sitesindeki işletme panelinden gelen talepler burada karara bağlanır.
// Karar aynı depoya yazılır; işletme paneli ve tüketici sitesi (banner, kampanya, GURME) hemen güncellenir.
export default function AdminOnaylar({ C, toast }) {
  const gelir = useGelir();
  const [tutar, setTutar] = useState({});
  const [ret, setRet] = useState({});
  const kart = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 16 };
  const satir = { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' };
  const alt = { fontSize: 12, color: C.faint, marginTop: 2 };
  const dugme = (renk, soft) => ({ padding: '8px 14px', borderRadius: 9, border: `1px solid ${renk}`, background: soft, color: renk, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600 });
  const bos = (m) => <p style={{ margin: 0, fontSize: 13, color: C.dim }}>{m}</p>;

  const reklamlar = gelir.rezervasyonlar.filter((x) => x.durum === 'bekliyor');
  const talepler = gelir.hizmetTalepleri.filter((x) => x.durum === 'acik');
  const kampanyalar = gelir.kampanyalar.filter((x) => x.durum === 'bekliyor');
  const gorseller = gelir.rezervasyonlar.filter((x) => x.urun === 'bannerAds' && x.gorselDurum === 'bekliyor');
  const bekleyenTeklif = gelir.teklifler.filter((x) => x.durum === 'bekliyor');
  const g = (iso) => iso.split('-').reverse().join('.');

  return (
    <div style={{ animation: 'fadeIn 0.2s' }}>
      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Reklam rezervasyonları ({reklamlar.length})</h3>
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: C.dim }}>Onay, günleri kilitler; banner onaylanınca Keşfet’te Sponsorlu olarak yayına girer. Ödüllü video onayı kota dolunca gösterilecek reklamı açar.</p>
        {reklamlar.length === 0 ? bos('Bekleyen rezervasyon yok.') : reklamlar.map((x) => (
          <div key={x.id} style={satir}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{x.ad} · {AD_PRODUCTS[x.urun].ad}</div>
              <div style={alt}>{g(x.baslangic)} – {g(x.bitis)} · {x.gun} gün · {TL(x.tutar)}</div>
            </div>
            <button style={dugme(C.green, C.greenSoft)} onClick={() => { reklamKarar(x.id, 'onaylandi'); toast(`${x.ad}: reklam onaylandı`); }}>Onayla</button>
            <button style={dugme(C.red, C.redSoft)} onClick={() => { reklamKarar(x.id, 'reddedildi'); toast(`${x.ad}: reklam reddedildi`, 'error'); }}>Reddet</button>
          </div>
        ))}
      </div>

      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Teklif talepleri ({talepler.length})</h3>
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: C.dim }}>Fiyatı siz belirlersiniz; teklif işletme paneline düşer, kabul ya da ret işletmeye aittir. GURME paketi kabul edilince o mekânın sayfasında gurme değerlendirmesi yazılabilir.</p>
        {talepler.length === 0 ? bos('Açık talep yok.') : talepler.map((x) => {
          const p = PAKET_BY_KEY[x.hizmet];
          const v = tutar[x.id] ?? (p.liste || '');
          return (
            <div key={x.id} style={satir}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{x.ad} · {p.ad}</div>
                <div style={alt}>{p.liste ? `Liste: ${TL(p.liste)} ${p.birim}` : 'Liste fiyatı yok, tamamen teklifle'}</div>
              </div>
              <input type="number" min={1} placeholder="Tutar ₺" value={v} onChange={(e) => setTutar((s) => ({ ...s, [x.id]: e.target.value }))}
                style={{ width: 120, padding: '8px 10px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
              <button style={dugme(C.orange, C.orangeSoft)} onClick={() => { const s = teklifGonder(x.id, v); if (s.ok) toast(`${x.ad}: ${TL(v)} teklif gönderildi`); else toast('Geçerli bir tutar girin', 'error'); }}>Teklif gönder</button>
            </div>
          );
        })}
        {bekleyenTeklif.length > 0 && <p style={{ margin: '14px 0 0', fontSize: 12, color: C.faint }}>{bekleyenTeklif.length} gönderilmiş teklif işletmenin kararını bekliyor.</p>}
      </div>

      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Banner görselleri ({gorseller.length})</h3>
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: C.dim }}>Günleri onaylanmış işletmelerin yüklediği banner görselleri. Onaylanınca Keşfet’te mekân fotoğrafı yerine bu görsel çıkar; reddederseniz sebebi işletme panelinde yazılır.</p>
        {gorseller.length === 0 ? bos('Onay bekleyen görsel yok.') : gorseller.map((x) => (
          <div key={x.id} style={satir}>
            <img src={x.gorsel} alt="" style={{ width: 160, height: 86, objectFit: 'cover', borderRadius: 10, background: '#222' }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{x.ad}</div>
              <div style={alt}>{g(x.baslangic)} – {g(x.bitis)}</div>
            </div>
            <input placeholder="Ret sebebi" value={ret[x.id] || ''} onChange={(e) => setRet((s) => ({ ...s, [x.id]: e.target.value }))} style={{ width: 160, padding: '8px 10px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit' }} />
            <button style={dugme(C.green, C.greenSoft)} onClick={() => { bannerGorselKarar(x.id, 'onaylandi'); toast(`${x.ad}: banner görseli onaylandı`); }}>Onayla</button>
            <button style={dugme(C.red, C.redSoft)} onClick={() => { if (!(ret[x.id] || '').trim()) { toast('Ret sebebi yazın', 'error'); return; } bannerGorselKarar(x.id, 'reddedildi', ret[x.id].trim()); toast(`${x.ad}: görsel reddedildi`, 'error'); }}>Reddet</button>
          </div>
        ))}
      </div>

      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Sponsorlu kart kampanyaları ({kampanyalar.length})</h3>
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: C.dim }}>Onaylanan kampanya, kaydırma destesine her 5–7 kartta bir “Sponsorlu” etiketiyle karışır.</p>
        {kampanyalar.length === 0 ? bos('Bekleyen kampanya yok.') : kampanyalar.map((k) => (
          <div key={k.id} style={satir}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{k.ad} · {k.fiyatlama === 'cpc' ? 'Tıklama başı' : 'Etkileşim başı'} {TL(k.teklif)}</div>
              <div style={alt}>Bütçe {TL(k.butce)}</div>
            </div>
            <button style={dugme(C.green, C.greenSoft)} onClick={() => { kampanyaKarar(k.id, 'aktif'); toast(`${k.ad}: kampanya yayında`); }}>Onayla</button>
            <button style={dugme(C.red, C.redSoft)} onClick={() => { kampanyaKarar(k.id, 'reddedildi'); toast(`${k.ad}: kampanya reddedildi`, 'error'); }}>Reddet</button>
          </div>
        ))}
      </div>
    </div>
  );
}
