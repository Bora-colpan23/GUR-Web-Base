import React, { useState } from 'react';
import { usePlatform, useGelir, bannerEkle, bannerGuncelle, bannerSil, bannerSirala } from '../app/webStore.js';
import { RESTAURANTS } from '../data/restaurants.js';

// Keşfet ekranının üstündeki dönen banner'ı YÖNETİCİ buradan koyar. Satın alınmış (onaylı) işletme banner'ları bunların ardından eklenir.
// Görsel yüklenirse tarayıcıda küçültülüp depoya yazılır (tarayıcı kotası ~5 MB).
function gorselKucult(dosya, en = 1400) {
  return new Promise((coz, red) => {
    if (!dosya.type.startsWith('image/')) { red(new Error('Yalnızca görsel dosyası yükleyin.')); return; }
    const o = new FileReader();
    o.onerror = () => red(new Error('Dosya okunamadı.'));
    o.onload = () => {
      const im = new Image();
      im.onerror = () => red(new Error('Görsel açılamadı.'));
      im.onload = () => {
        const k = Math.min(1, en / im.width);
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        coz(c.toDataURL('image/jpeg', 0.78));
      };
      im.src = o.result;
    };
    o.readAsDataURL(dosya);
  });
}

export default function AdminBanner({ C, toast }) {
  const pl = usePlatform();
  const gelir = useGelir();
  const satin = gelir.rezervasyonlar.filter((r) => r.urun === 'bannerAds' && r.durum !== 'reddedildi');
  const tr = (iso) => iso.split('-').reverse().join('.');
  const liste = pl.bannerlar || [];
  const [f, setF] = useState({ baslik: '', alt: '', gorsel: '', mekan: '', reklam: false });
  const [hata, setHata] = useState('');
  const kart = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 16 };
  const alan = { width: '100%', padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 13.5 };
  const etiket = { display: 'grid', gap: 6, fontSize: 12, color: C.dim, fontWeight: 600 };
  const dugme = (renk, soft) => ({ padding: '7px 12px', borderRadius: 8, border: `1px solid ${renk}`, background: soft, color: renk, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 });

  const mekanBul = (ad) => RESTAURANTS.find((r) => r.name.toLowerCase() === ad.trim().toLowerCase());
  const yukle = async (e) => {
    const d = e.target.files?.[0]; if (!d) return;
    try { setF((s) => ({ ...s, gorsel: '' })); setHata(''); const u = await gorselKucult(d); setF((s) => ({ ...s, gorsel: u })); } catch (x) { setHata(x.message); }
    e.target.value = '';
  };
  const ekle = (ev) => {
    ev.preventDefault();
    if (!f.baslik.trim()) { setHata('Başlık yazın.'); return; }
    if (!f.gorsel.trim()) { setHata('Bir görsel yükleyin ya da görsel adresi yazın.'); return; }
    let restaurantId;
    if (f.mekan.trim()) { const r = mekanBul(f.mekan); if (!r) { setHata('Bağlanacak mekân listede yok; adı listeden seçin ya da boş bırakın.'); return; } restaurantId = r.id; }
    try { bannerEkle({ baslik: f.baslik.trim(), alt: f.alt.trim(), gorsel: f.gorsel.trim(), restaurantId, reklam: f.reklam }); }
    catch { setHata('Kaydedilemedi: tarayıcı depolama alanı dolu olabilir, daha küçük bir görsel deneyin.'); return; }
    setF({ baslik: '', alt: '', gorsel: '', mekan: '', reklam: false }); setHata(''); toast('Banner eklendi: Keşfet’te yayında');
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s' }}>
      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Yeni banner</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: C.dim, lineHeight: 1.55 }}>Keşfet ekranının üstünde dönen banner’lar burada belirlenir. Hiç banner yoksa varsayılan GUR slaytı görünür. İşletmelerin satın aldığı ve onaylanan banner’lar bunların ardından eklenir.</p>
        <form onSubmit={ekle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
          <label style={etiket}>Başlık<input style={alan} value={f.baslik} maxLength={60} onChange={(e) => setF({ ...f, baslik: e.target.value })} /></label>
          <label style={etiket}>Alt başlık (isteğe bağlı)<input style={alan} value={f.alt} maxLength={80} onChange={(e) => setF({ ...f, alt: e.target.value })} /></label>
          <label style={etiket}>Görsel yükle<input type="file" accept="image/*" onChange={yukle} style={{ ...alan, padding: 8 }} /></label>
          <label style={etiket}>ya da görsel adresi<input style={alan} placeholder="https://…" value={f.gorsel.startsWith('data:') ? '' : f.gorsel} onChange={(e) => setF({ ...f, gorsel: e.target.value })} /></label>
          <label style={etiket}>Bağlanacak mekân (isteğe bağlı)
            <input style={alan} list="mekan-liste" value={f.mekan} onChange={(e) => setF({ ...f, mekan: e.target.value })} placeholder="Tıklayınca açılacak mekân" />
            <datalist id="mekan-liste">{RESTAURANTS.map((r) => <option key={r.id} value={r.name} />)}</datalist>
          </label>
          <label style={{ ...etiket, alignContent: 'end', gridAutoFlow: 'column', justifyContent: 'start', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={f.reklam} onChange={(e) => setF({ ...f, reklam: e.target.checked })} /> “Reklam” etiketi koy (ücretli yerleşimse)
          </label>
          {f.gorsel && <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>ÖNİZLEME</div><div style={{ position: 'relative', height: 150, maxWidth: 520, borderRadius: 16, overflow: 'hidden', background: '#222' }}><img src={f.gorsel} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75), transparent 60%)' }} /><div style={{ position: 'absolute', left: 16, bottom: 14, color: '#fff' }}><b style={{ fontSize: 17 }}>{f.baslik || 'Başlık'}</b><div style={{ fontSize: 12, opacity: .8 }}>{f.alt}</div></div></div></div>}
          <div style={{ gridColumn: '1/-1' }}><button type="submit" style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: C.orange, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Banner ekle</button></div>
        </form>
        {hata && <p role="alert" style={{ margin: '12px 0 0', fontSize: 13, color: C.red }}>{hata}</p>}
      </div>

      <div style={kart}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Yayındaki ve hazır banner’lar ({liste.length})</h3>
        {liste.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: C.dim }}>Henüz banner eklenmedi; Keşfet’te varsayılan GUR slaytı görünüyor.</p> : liste.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderTop: i ? `1px solid ${C.border}` : 'none', flexWrap: 'wrap' }}>
            <img src={b.gorsel} alt="" style={{ width: 120, height: 64, objectFit: 'cover', borderRadius: 10, background: '#222' }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{b.baslik} {b.reklam && <span style={{ fontSize: 10.5, color: C.yellow, border: `1px solid ${C.yellow}`, borderRadius: 6, padding: '1px 6px', marginLeft: 6 }}>REKLAM</span>}</div>
              <div style={{ fontSize: 12, color: C.faint }}>{b.alt || '—'}{b.restaurantId ? ` · ${(RESTAURANTS.find((r) => r.id === b.restaurantId) || {}).name || b.restaurantId}` : ''}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: b.aktif ? C.green : C.faint }}>{b.aktif ? 'Yayında' : 'Gizli'}</span>
            <button style={dugme(C.dim, 'transparent')} disabled={i === 0} onClick={() => bannerSirala(b.id, -1)} aria-label="Yukarı taşı">↑</button>
            <button style={dugme(C.dim, 'transparent')} disabled={i === liste.length - 1} onClick={() => bannerSirala(b.id, 1)} aria-label="Aşağı taşı">↓</button>
            <button style={dugme(b.aktif ? C.yellow : C.green, 'transparent')} onClick={() => bannerGuncelle(b.id, { aktif: !b.aktif })}>{b.aktif ? 'Gizle' : 'Yayına al'}</button>
            <button style={dugme(C.red, C.redSoft)} onClick={() => { bannerSil(b.id); toast('Banner silindi', 'error'); }}>Sil</button>
          </div>
        ))}
      </div>
      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>İşletmelerin satın aldığı banner günleri ({satin.length})</h3>
        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: C.dim, lineHeight: 1.55 }}>Bu günlerde banner, yukarıdaki kendi banner’larınızın ardından Keşfet’te “Reklam” etiketiyle çıkar. Rezervasyon ve görsel onayları Onay Kuyruğu’ndan verilir.</p>
        {satin.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: C.dim }}>Satın alınmış banner yok.</p> : satin.map((r, i) => (
          <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: i ? `1px solid ${C.border}` : 'none', flexWrap: 'wrap' }}>
            {r.gorsel ? <img src={r.gorsel} alt="" style={{ width: 96, height: 52, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: 96, height: 52, borderRadius: 8, background: C.bg, border: `1px dashed ${C.border}` }} />}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.ad}</div>
              <div style={{ fontSize: 12, color: C.faint }}>{tr(r.baslangic)} – {tr(r.bitis)} · {r.gun} gün</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: r.durum === 'onaylandi' ? C.green : C.yellow }}>{r.durum === 'onaylandi' ? 'Tarih onaylı' : 'Tarih onay bekliyor'}</span>
            <span style={{ fontSize: 12, color: C.dim }}>{r.gorselDurum === 'onaylandi' ? 'Görsel onaylı' : r.gorselDurum === 'bekliyor' ? 'Görsel onay bekliyor' : r.gorselDurum === 'reddedildi' ? 'Görsel reddedildi' : 'Görsel yok'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
