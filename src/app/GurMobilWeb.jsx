// ═══════════════════════════════════════════════════════════════════════
// GUR Web — TELEFON GÖRÜNÜMÜ: mobil uygulamanın (mobile/) ekranlarına benzer
//
// Aynı jetonlar (src/tema.js): kremsi kâğıt zemin, beyaz kart + ince kenar + üç katmanlı sıcak gölge,
// marka turuncusu, Poppins başlık + Outfit gövde, tam yuvarlak "hap" düğmeler, düz alt sekme çubuğu
// (Keşfet · Kaydır · Favoriler · Profil), satır kartları, konum çipi. Masaüstü görünümü değişmez:
// bu ekranlar yalnızca ≤700 px'te devreye girer (useMobil).
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { GurLogo, Icon, Img } from './GurApp.jsx';
import { useApp } from './webCtx.js';
import { YorumBolumu, SponsorluSerit } from './GelirWeb.jsx';
import { yaz, hepsiniSil, mesafeMetni, izle, talepEkle } from './webStore.js';
import { RESTAURANTS, CATEGORIES } from '../data/restaurants.js';
import { directionsUrl, defaultMapProvider } from '../../shared/deeplink.js';

export function useMobil(maks = 700) {
  const q = `(max-width:${maks}px)`;
  const [m, setM] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [q]);
  return m;
}

export const MOBIL_CSS = `
  @media (max-width:700px) {
    html, body { background:#FDFBF7 !important; }
    .gw { background:#FDFBF7; }
    .gw-mtop { display:none !important; }
    /* Düz alt sekme çubuğu (uygulamadaki gibi): beyaz, üstte ince çizgi, etkin sekme turuncu */
    .gw-bottom { left:0 !important; right:0 !important; bottom:0 !important; border-radius:0 !important; padding:4px 0 calc(4px + env(safe-area-inset-bottom)) !important; background:#fff !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; border:none !important; border-top:1px solid #E3DCD2 !important; box-shadow:none !important; justify-content:space-around !important; }
    .gw-bottom::before { display:none !important; }
    .gw-bottom a.gw-tab { opacity:1 !important; color:#6F6459 !important; font-size:11.5px; font-weight:600; min-height:52px; justify-content:center; gap:3px; padding:4px 14px; letter-spacing:0; }
    .gw-bottom a.gw-tab.active { color:#FF6600 !important; font-weight:700; }
    .gw-page { padding-bottom:calc(66px + env(safe-area-inset-bottom)) !important; }
    /* Kaydır: kâğıt zemin, solda başlık, düğmeler tek turuncu */
    .gw-deckpage { background:#FDFBF7 !important; padding-top:calc(8px + env(safe-area-inset-top)) !important; }
    .gw-deckpage::before { display:none !important; }
    .gw .gw-deckhead { text-align:left; padding:4px 8px 8px; }
    .gw .gw-deckhead h1 { font-family:'Poppins',sans-serif !important; font-weight:800 !important; font-size:24px; letter-spacing:-.03em; }
    .gw .gw-deckhead p { font-size:13.5px; } .gw-deckhead-link { display:none; }
    .gw .gw-yuvarlak { border:1px solid rgba(45,36,25,.10) !important; box-shadow:0 1px 2px rgba(45,36,25,.04), 0 3px 8px rgba(45,36,25,.045), 0 10px 24px rgba(45,36,25,.05) !important; }
    .gw .gw-yuvarlak svg { stroke:#FF6600 !important; }
    /* Giriş / kayıt / konum: kâğıt zemin, kartsız form, tek renk koyu başlık */
    .gw-auth-page { background:#FDFBF7 !important; }
    .gw-auth-page::before { display:none !important; }
    .gw-auth-card { background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; }
    .gw-auth-body { text-align:left; }
    .gw .gw-auth-body .gw-tgo-h1 { text-align:left; font-family:'Poppins',sans-serif !important; font-size:26px !important; letter-spacing:-.03em; }
    .gw .gw-auth-body .gw-tgo-h1 span { color:#1C1917 !important; -webkit-text-fill-color:#1C1917 !important; background:none !important; font-weight:800 !important; }
    .gw .gw-auth-body > p { margin-left:0 !important; text-align:left !important; }
    .gw .gw-afield input, .gw .gw-afield select { border:1px solid #E3DCD2 !important; border-radius:14px !important; min-height:48px; }
  }

  /* ───── Ekranlar ───── */
  .gm { background:#FDFBF7; color:#1C1917; min-height:100vh; min-height:100dvh; }
  .gw .gm .gm-h { font-family:'Poppins',sans-serif !important; font-weight:800 !important; letter-spacing:-.03em; color:#1C1917; margin:0; }
  .gm-top { display:flex; align-items:center; justify-content:space-between; padding:calc(8px + env(safe-area-inset-top)) 16px 2px; }
  .gm-konum { display:flex; align-items:center; gap:8px; min-height:44px; padding-right:8px; color:#1C1917; }
  .gm-konum i { width:32px; height:32px; border-radius:50%; background:rgba(255,102,0,.08); display:flex; align-items:center; justify-content:center; }
  .gm-konum small { display:block; font-size:11px; color:#6F6459; line-height:1.2; } .gm-konum b { font-size:13.5px; font-weight:700; line-height:1.2; }
  .gm-search { margin:10px 16px 0; display:flex; align-items:center; gap:10px; background:#fff; border:1px solid #E3DCD2; border-radius:999px; padding:0 16px; min-height:48px; }
  .gm-search input { flex:1; border:none !important; outline:none !important; box-shadow:none !important; font-size:16px; background:transparent; min-width:0; color:#1C1917; padding:10px 0; }
  .gm-chips { display:flex; gap:8px; overflow-x:auto; padding:14px 16px 6px; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .gm-chips::-webkit-scrollbar { display:none; }
  .gm-chip { flex-shrink:0; min-height:40px; padding:0 15px; border-radius:999px; border:1px solid #E3DCD2; background:#fff; font-family:inherit; font-size:13px; font-weight:600; color:#4A443E; white-space:nowrap; display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
  .gm-chip.on { background:#FF6600; border-color:#FF6600; color:#fff; font-weight:700; }
  .gm-list { padding:10px 16px 24px; }
  .gm-row { display:flex; gap:13px; padding:10px; margin-bottom:12px; background:#fff; border:1px solid rgba(45,36,25,.10); border-radius:20px; box-shadow:0 1px 2px rgba(45,36,25,.04), 0 2px 6px rgba(45,36,25,.04), 0 5px 14px rgba(45,36,25,.035); color:inherit; transition:transform .25s; }
  .gm-row:active { transform:scale(.988) translateY(1px); }
  .gm-row-b { flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; }
  .gm-row-b b.ad { font-family:'Poppins',sans-serif; font-weight:800; font-size:16.5px; letter-spacing:-.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .gm-row-b .alt { font-size:13px; color:#6F6459; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .gm-row-b .meta { display:flex; align-items:center; gap:10px; margin-top:7px; font-size:12.5px; color:#6F6459; } .gm-row-b .meta b { color:#4A443E; font-weight:700; }
  .gm-kalp { width:44px; height:44px; border:none; background:none; display:flex; align-items:center; justify-content:center; cursor:pointer; align-self:center; flex-shrink:0; }
  .gm-bos { text-align:center; padding:48px 24px; } .gm-bos .ikon { width:64px; height:64px; border-radius:50%; background:rgba(255,102,0,.08); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
  .gm-bos p { color:#6F6459; line-height:1.55; margin:8px 0 0; }
  /* Hap düğmeler: tam yuvarlak, kalın yazı, turuncu gölge; devre dışı hap soluklaşmaz, nötr tona geçer */
  .gm-hap { width:100%; min-height:50px; padding:0 30px; border-radius:999px; border:1px solid transparent; font-family:inherit; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:9px; cursor:pointer; letter-spacing:-.1px; }
  .gm-hap.filled { background:linear-gradient(135deg, #FF7A1A, #FF6600 50%, #F04E00); color:#fff; box-shadow:0 1px 2px rgba(190,70,0,.10), 0 4px 10px rgba(190,70,0,.16), 0 10px 24px rgba(190,70,0,.18); }
  .gm-hap.outline { background:#fff; color:#1C1917; border-color:#E3DCD2; box-shadow:0 1px 2px rgba(45,36,25,.04), 0 3px 8px rgba(45,36,25,.045); }
  .gm-hap.soft { background:#FDECDE; color:#A84D09; }
  .gm-hap.kapali { background:#F6F3EE; color:#6F6459; border-color:#E3DCD2; cursor:not-allowed; box-shadow:none; }
  .gm-hap.sm { min-height:44px; padding:0 18px; font-size:14px; width:auto; }
  .gm-pad { padding:0 20px 28px; }
  .gm-kart { background:#fff; border:1px solid rgba(45,36,25,.10); border-radius:22px; box-shadow:0 1px 2px rgba(45,36,25,.04), 0 2px 6px rgba(45,36,25,.04), 0 5px 14px rgba(45,36,25,.035); }
  .gm-yol { display:flex; align-items:center; gap:13px; padding:14px; margin-bottom:10px; border-radius:18px; }
  .gm-yol i { width:38px; height:38px; border-radius:50%; background:rgba(255,102,0,.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .gm-yol b { display:block; font-size:15px; } .gm-yol span { font-size:13px; color:#6F6459; }
  .gm-stat { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:12px; } .gm-stat > div { text-align:center; padding:14px 6px; border-radius:18px; } .gm-stat b { display:block; font-family:'Poppins',sans-serif; font-weight:800; font-size:22px; } .gm-stat span { font-size:12px; color:#6F6459; }
  .gm-satir { display:flex; align-items:center; gap:13px; min-height:56px; padding:12px 0; border:none; border-bottom:1px solid #E3DCD2; background:none; width:100%; text-align:left; font-family:inherit; font-size:15px; font-weight:600; color:#1C1917; cursor:pointer; }
  .gm-satir:last-child { border-bottom:none; } .gm-satir i { width:34px; height:34px; border-radius:50%; background:rgba(255,102,0,.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; } .gm-satir em { font-style:normal; font-weight:500; font-size:14px; color:#6F6459; margin-left:auto; }
  /* Detay */
  .gm-hero { height:300px; position:relative; background:#e8e0d8; }
  .gm-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,0) 42%, rgba(0,0,0,.5)); pointer-events:none; }
  .gm-hero-btn { position:absolute; top:calc(12px + env(safe-area-inset-top)); z-index:3; width:44px; height:44px; border-radius:50%; background:rgba(0,0,0,.42); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .gm-sheet { position:relative; z-index:2; margin-top:-26px; background:#FDFBF7; border-radius:28px 28px 0 0; padding:20px 20px 120px; }
  .gm-cip { display:inline-flex; align-items:center; gap:6px; background:#fff; border:1px solid #E3DCD2; border-radius:999px; padding:8px 12px; font-size:12.5px; font-weight:600; }
  .gm-etiket { display:inline-flex; align-items:center; gap:7px; background:rgba(255,102,0,.08); color:#A84D09; font-weight:700; font-size:12.5px; border-radius:999px; padding:7px 12px; }
  .gm-sec { font-family:'Poppins',sans-serif; font-weight:800; font-size:17px; letter-spacing:-.02em; margin:26px 0 10px; }
  .gm-seritler { display:flex; gap:10px; overflow-x:auto; margin:0 -20px; padding:0 20px; scrollbar-width:none; } .gm-seritler::-webkit-scrollbar { display:none; }
  .gm-seritler button { flex-shrink:0; padding:0; border:none; background:#e8e0d8; overflow:hidden; cursor:zoom-in; }
  .gm-bar { position:fixed; left:0; right:0; bottom:0; z-index:70; background:#fff; border-top:1px solid #E3DCD2; padding:12px 14px calc(12px + env(safe-area-inset-bottom)); display:flex; gap:10px; }
  .gm-modal { position:fixed; inset:0; z-index:900; display:flex; align-items:flex-end; background:rgba(16,12,8,.5); }
  .gm-modal-k { width:100%; background:#fff; border-radius:28px 28px 0 0; padding:24px 24px calc(30px + env(safe-area-inset-bottom)); }
  .gm-foto { position:fixed; inset:0; z-index:900; background:rgba(10,8,6,.94); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }
`;

const Hap = ({ children, onClick, to, varyant = 'filled', kapali = false, sm = false, ...r }) => {
  const sinif = `gm-hap ${kapali ? 'kapali' : varyant} ${sm ? 'sm' : ''}`;
  return to ? <Link to={to} className={sinif} {...r}>{children}</Link> : <button type="button" className={sinif} disabled={kapali} onClick={onClick} {...r}>{children}</button>;
};

function KonumCipi() {
  const { depo } = useApp();
  const k = depo.konum;
  const e = !k ? ['Konum kapalı', 'Seçmek için dokun'] : k.kaynak === 'cihaz' ? ['Konumun', 'Yakındakiler önce'] : ['Seçtiğin ilçe', k.ilce || 'İstanbul'];
  return (
    <Link to="/konum/degistir" className="gm-konum" aria-label={`Konum: ${e[0]}. Değiştirmek için dokun.`}>
      <i><Icon n="pin" size={15} color="#FF6600" /></i><span><small>{e[0]}</small><b>{e[1]}</b></span>
    </Link>
  );
}

export function Satir({ r, rozet }) {
  const { isFav, toggleFav } = useApp();
  const fav = isFav(r);
  const mesafe = mesafeMetni(r);
  return (
    <Link to={`/restoran/${r.id}`} className="gm-row" aria-label={`${r.name}, ${r.cat}, puan ${r.rating}`}>
      <Img src={r.imgs?.[0]} style={{ width: 92, height: 92, borderRadius: 14, flexShrink: 0 }} bg="#e8e0d8" />
      <div className="gm-row-b">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <b className="ad" style={{ flex: 1 }}>{r.name}</b>{r.gastro && <Icon n="star" size={14} color="#FF6600" />}
        </div>
        <div className="alt">{r.cat}{r.price ? ` · ${r.price}` : ''}</div>
        <div className="meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon n="star" size={12} color="#8A5200" /><b>{r.rating}</b></span>
          {mesafe && <span>{mesafe}</span>}
        </div>
        {rozet}
      </div>
      <button type="button" className="gm-kalp" aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'} onClick={(e) => { e.preventDefault(); toggleFav(r); }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? '#FF6600' : 'none'} stroke={fav ? '#FF6600' : '#BDB4AA'} strokeWidth={fav ? 2.6 : 2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
      </button>
    </Link>
  );
}

// ───────────────────────── Karşılama (uygulamanın ilk ekranı) ─────────────────────────
const YOLLAR = [['heart', 'Sağa kaydır', 'Beğendiğini kaydet'], ['cross', 'Sola kaydır', 'İlgilenmediğini geç'], ['eye', 'Yukarı kaydır', 'Detayları aç']];
export function MobilKarsilama() {
  const { depo } = useApp();
  if (depo.kullanici) return <Navigate to="/kesfet" replace />;   // uygulamadaki gibi: oturum varsa doğrudan sekmeler
  return (
    <div className="gm gm-pad" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><GurLogo size={46} /></div>
      <div style={{ height: 210, borderRadius: 26, overflow: 'hidden', marginTop: 26, position: 'relative', background: '#e8e0d8', flexShrink: 0 }}>
        <Img src={RESTAURANTS[0]?.imgs?.[0]} style={{ position: 'absolute', inset: 0 }} bg="#e8e0d8" />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', background: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.55))' }} />
      </div>
      <h1 className="gm-h" style={{ fontSize: 32, lineHeight: '37px', marginTop: 26 }}>Hoş geldin!</h1>
      <p style={{ fontSize: 16, lineHeight: '25px', color: '#6F6459', margin: '10px 0 0' }}>İstanbul’un restoranlarını kaydırarak keşfet. Beğendiğini kaydet, detayları görmek için yukarı kaydır.</p>
      <div style={{ marginTop: 24 }}>
        {YOLLAR.map(([ic, b, a]) => (
          <div key={b} className="gm-kart gm-yol"><i><Icon n={ic} size={17} color="#FF6600" /></i><div><b>{b}</b><span>{a}</span></div></div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 20 }} />
      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        <Hap to="/giris">GUR’u kullanmaya başla</Hap>
        <Hap to="/giris?kayit=1" varyant="outline">Hesabım yok, kayıt olayım</Hap>
        <Link to="/doyurucu" style={{ textAlign: 'center', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B4530A', fontWeight: 700, fontSize: 14 }}>Restoran sahibi misin? GUR İşletme</Link>
      </div>
    </div>
  );
}

// ───────────────────────── Keşfet ─────────────────────────
export function MobilKesfet() {
  const { restaurants } = useApp();
  const [q, setQ] = useState('');
  const [kat, setKat] = useState(null);
  const [adet, setAdet] = useState(30);
  const kategoriler = useMemo(() => CATEGORIES.map((c) => c.name).filter((n) => restaurants.some((r) => r.cat === n)), [restaurants]);
  const liste = useMemo(() => {
    const a = q.trim().toLocaleLowerCase('tr');
    return restaurants.filter((r) => (!kat || r.cat === kat) && (!a || `${r.name} ${r.cat} ${(r.tags || []).join(' ')} ${r.addr || ''}`.toLocaleLowerCase('tr').includes(a)));
  }, [restaurants, q, kat]);
  useEffect(() => { setAdet(30); }, [q, kat]);
  return (
    <div className="gm">
      <div className="gm-top"><KonumCipi /><GurLogo size={26} /></div>
      <label className="gm-search"><Icon n="search" size={17} color="#6F6459" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restoran, mutfak ya da semt" aria-label="Restoran ara" /></label>
      <div className="gm-chips" role="group" aria-label="Kategoriler">
        <button type="button" className={`gm-chip ${kat ? '' : 'on'}`} onClick={() => setKat(null)}>Tümü</button>
        {kategoriler.map((n) => <button key={n} type="button" className={`gm-chip ${kat === n ? 'on' : ''}`} aria-pressed={kat === n} onClick={() => setKat(kat === n ? null : n)}>{n}</button>)}
        <Link to="/kesfet/harita" className="gm-chip"><Icon n="pin" size={13} color="#FF6600" />Harita</Link>
      </div>
      <SponsorluSerit mobil />
      <div className="gm-list">
        {liste.length === 0 ? (
          <div className="gm-bos"><h2 className="gm-h" style={{ fontSize: 18 }}>Sonuç yok</h2><p>“{q}” için mekân bulunamadı.</p>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Hap to="/kesfet/swipe" varyant="soft" sm>Kaydırarak keşfet</Hap></div></div>
        ) : liste.slice(0, adet).map((r) => <Satir key={r.id} r={r} />)}
        {adet < liste.length && <div style={{ textAlign: 'center', padding: '6px 0' }}><Hap varyant="outline" sm onClick={() => setAdet((a) => a + 30)}>Daha fazla göster ({liste.length - adet})</Hap></div>}
      </div>
    </div>
  );
}

// ───────────────────────── Favoriler ─────────────────────────
export function MobilFavoriler() {
  const { depo, restaurants } = useApp();
  const liste = depo.favoriler.map((id) => restaurants.find((r) => String(r.id) === id)).filter(Boolean);
  return (
    <div className="gm">
      <div style={{ padding: 'calc(10px + env(safe-area-inset-top)) 20px 8px' }}>
        <h1 className="gm-h" style={{ fontSize: 24 }}>Favorilerim</h1>
        <p style={{ fontSize: 13.5, color: '#6F6459', margin: '3px 0 0' }}>{liste.length ? `${liste.length} mekân kayıtlı` : 'Henüz kayıtlı mekân yok'}</p>
      </div>
      {liste.length === 0 ? (
        <div className="gm-bos"><div className="ikon"><Icon n="heart" size={28} color="#FF6600" /></div>
          <h2 className="gm-h" style={{ fontSize: 20 }}>Kaydettiklerin burada</h2><p>Kaydırırken sağa attığın her mekân bu listeye düşüyor.</p>
          <div style={{ marginTop: 22 }}><Hap to="/kesfet/swipe">Kaydırmaya başla</Hap></div></div>
      ) : (
        <div className="gm-list">
          {liste.map((r) => (
            <Satir key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Profil ─────────────────────────
function Onay({ baslik, metin, onayMetin, onOnay, onVazgec }) {
  return (
    <div className="gm-modal" role="alertdialog" aria-modal="true" aria-labelledby="gm-onay-b" onClick={onVazgec}>
      <div className="gm-modal-k" onClick={(e) => e.stopPropagation()}>
        <h2 id="gm-onay-b" className="gm-h" style={{ fontSize: 20 }}>{baslik}</h2>
        <p style={{ color: '#6F6459', lineHeight: 1.55, margin: '8px 0 0' }}>{metin}</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
          <button type="button" className="gm-hap filled" style={{ background: '#C2282D', boxShadow: 'none' }} onClick={onOnay}>{onayMetin}</button>
          <button type="button" autoFocus className="gm-hap outline" onClick={onVazgec}>Vazgeç</button>
        </div>
      </div>
    </div>
  );
}

export function MobilProfil() {
  const nav = useNavigate();
  const { depo } = useApp();
  const [onay, setOnay] = useState(null);
  const yorum = Object.values(depo.yorumlar).reduce((t, l) => t + l.length, 0);
  const ad = depo.kullanici?.ad;
  const k = depo.konum;
  return (
    <div className="gm">
      <div style={{ padding: 'calc(10px + env(safe-area-inset-top)) 20px 28px' }}>
        <h1 className="gm-h" style={{ fontSize: 24 }}>Profil</h1>
        <div className="gm-kart" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, padding: 16 }}>
          <span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,102,0,.08)', color: '#A84D09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 22 }}>{(ad || 'G').slice(0, 1).toLocaleUpperCase('tr')}</span>
          <div style={{ flex: 1, minWidth: 0 }}><b className="gm-h" style={{ fontSize: 18, display: 'block' }}>{ad || 'Misafir'}</b><span style={{ fontSize: 13.5, color: '#6F6459' }}>{depo.kullanici?.email || 'Giriş yapılmadı'}</span></div>
        </div>
        <div className="gm-stat">{[['Favori', depo.favoriler.length], ['Yorum', yorum]].map(([b, s]) => <div key={b} className="gm-kart"><b>{s}</b><span>{b}</span></div>)}</div>
        <div className="gm-kart" style={{ marginTop: 18, padding: '0 16px' }}>
          <button type="button" className="gm-satir" onClick={() => nav('/konum/degistir')}><i><Icon n="pin" size={16} color="#FF6600" /></i>Konum<em>{k ? (k.ilce || 'Cihazdan') : 'Kapalı'}</em><span aria-hidden style={{ color: '#BDB4AA' }}>›</span></button>
          <button type="button" className="gm-satir" onClick={() => yaz({ riza: depo.riza === 'kabul' ? 'ret' : 'kabul' })}><i><Icon n="shield" size={16} color="#FF6600" /></i>Ölçümleme izni<em>{depo.riza === 'kabul' ? 'Açık' : 'Kapalı'}</em></button>
          <div className="gm-satir" style={{ cursor: 'default' }}><i><Icon n="chart" size={16} color="#FF6600" /></i>Bağlantı<em>Yerel</em></div>
        </div>
        <p style={{ fontSize: 12.5, color: '#6F6459', lineHeight: 1.5, margin: '10px 4px 0' }}>Sunucuya bağlı değil. Favorilerin ve tercihlerin yalnızca bu tarayıcıda saklanıyor.</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
          {!depo.kullanici && <Hap to="/giris">Giriş yap</Hap>}
          <Hap varyant="outline" onClick={() => setOnay('cikis')}>Çıkış yap</Hap>
          <button type="button" onClick={() => setOnay('sil')} style={{ minHeight: 44, background: 'none', border: 'none', color: '#C2282D', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Hesabımı sil</button>
        </div>
      </div>
      {onay === 'cikis' && <Onay baslik="Çıkış yapılsın mı?" metin="Favorilerin bu tarayıcıda kalır." onayMetin="Çıkış yap" onVazgec={() => setOnay(null)} onOnay={() => { yaz({ kullanici: null }); setOnay(null); nav('/'); }} />}
      {onay === 'sil' && <Onay baslik="Hesabın silinsin mi?" metin="Favorilerin, yorumların ve tercihlerin bu tarayıcıdan kalıcı olarak silinir. Geri alınamaz." onayMetin="Sil" onVazgec={() => setOnay(null)} onOnay={() => { hepsiniSil(); setOnay(null); nav('/'); }} />}
    </div>
  );
}

// ───────────────────────── Detay ─────────────────────────
const sosyalLink = (v, taban) => (/^https?:/i.test(v) ? v : taban + String(v).replace(/^@/, ''));

export function MobilDetay() {
  const { id } = useParams();
  const nav = useNavigate();
  const { restaurants, isFav, toggleFav } = useApp();
  const r = restaurants.find((x) => String(x.id) === String(id));
  const [buyuk, setBuyuk] = useState(null);
  const [bildirim, setBildirim] = useState('');
  useEffect(() => { if (r) izle(r.id, 'goruntulenme'); window.scrollTo(0, 0); setBildirim(''); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const geri = () => (window.history.length > 1 ? nav(-1) : nav('/kesfet'));

  if (!r) return <div className="gm gm-bos" style={{ paddingTop: 80 }}><h2 className="gm-h" style={{ fontSize: 18 }}>Mekân bulunamadı</h2><div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><Hap sm varyant="outline" onClick={geri}>Geri dön</Hap></div></div>;

  const fav = isFav(r);
  const mesafe = mesafeMetni(r);
  const iletisim = [
    r.phone && ['Ara', `tel:${r.phone.replace(/\s/g, '')}`], r.website && ['Web sitesi', sosyalLink(r.website, 'https://')],
    r.instagram && ['Instagram', sosyalLink(r.instagram, 'https://instagram.com/')], r.facebook && ['Facebook', sosyalLink(r.facebook, 'https://facebook.com/')], r.email && ['E-posta', `mailto:${r.email}`],
  ].filter(Boolean);
  const yolTarifi = () => {
    izle(r.id, 'yol_tarifi');
    window.open(directionsUrl({ name: r.name, lat: r.lat, lng: r.lng, address: r.addr }, defaultMapProvider(navigator.userAgent)), '_blank', 'noopener,noreferrer');
  };
  const masaAyirt = () => {
    if (!r.claimed) return;
    talepEkle({ restaurantId: r.id, ad: r.name, kisi: 2 });
    setBildirim(`${r.name} için talebin bu tarayıcıda kaydedildi. Sunucuya bağlanınca iletilecek — komisyon alınmıyor.`);
  };

  return (
    <div className="gm">
      <style>{'.gw-bottom{display:none !important} .gw-page{padding-bottom:0 !important}'}</style>
      <div className="gm-hero">
        <Img src={r.imgs?.[0]} style={{ position: 'absolute', inset: 0 }} bg="#e8e0d8" />
        <button type="button" className="gm-hero-btn" style={{ left: 12 }} aria-label="Geri" onClick={geri}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg></button>
        <button type="button" className="gm-hero-btn" style={{ right: 12 }} aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'} aria-pressed={fav} onClick={() => toggleFav(r)}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill={fav ? '#FF9A4D' : 'none'} stroke={fav ? '#FF9A4D' : '#fff'} strokeWidth={fav ? 2.8 : 2} strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></button>
      </div>
      <div className="gm-sheet">
        <h1 className="gm-h" style={{ fontSize: 27 }}>{r.name}</h1>
        <p style={{ fontSize: 14.5, color: '#6F6459', margin: '4px 0 0' }}>{r.cat} · {r.addr}</p>
        {r.gastro && <div style={{ marginTop: 12 }}><span className="gm-etiket"><Icon n="star" size={14} color="#A84D09" />Gastro Onaylı{r.gastroChef ? ` · ${r.gastroChef}` : ''}</span></div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <span className="gm-cip"><Icon n="star" size={13} color="#8A5200" />{r.rating}{r.ratingCount ? ` (${r.ratingCount.toLocaleString('tr-TR')})` : ''}</span>
          {mesafe && <span className="gm-cip"><Icon n="pin" size={13} color="#4A443E" />{mesafe}</span>}
          {r.price && <span className="gm-cip"><Icon n="bank" size={13} color="#4A443E" />{r.price}</span>}
          {r.hours && <span className="gm-cip"><Icon n="clock" size={13} color="#4A443E" />{r.hours}</span>}
        </div>
        {r.desc && <p style={{ fontSize: 15, lineHeight: '24px', color: '#4A443E', margin: '18px 0 0' }}>{r.desc}</p>}
        {r.popular?.length > 0 && (<><h2 className="gm-sec">Öne çıkanlar</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{r.popular.map((p) => <span key={p} style={{ background: '#F6F3EE', borderRadius: 999, padding: '8px 13px', fontSize: 13, fontWeight: 500 }}>{p}</span>)}</div></>)}
        {r.imgs?.length > 1 && (<><h2 className="gm-sec">Fotoğraflar</h2><div className="gm-seritler">{r.imgs.map((u, i) => (
          <button key={`${u}-${i}`} type="button" aria-label={`${r.name} fotoğraf ${i + 1}`} style={{ width: 150, height: 110, borderRadius: 16 }} onClick={() => setBuyuk(u)}><Img src={u} style={{ width: 150, height: 110 }} bg="#e8e0d8" /></button>))}</div></>)}
        {r.menu?.length > 0 ? (<><h2 className="gm-sec" style={{ marginBottom: 4 }}>Menü</h2><p style={{ fontSize: 13, color: '#6F6459', margin: '0 0 10px' }}>Sayfaya dokununca tam boy açılır.</p><div className="gm-seritler">{r.menu.map((u, i) => (
          <button key={`${u}-${i}`} type="button" aria-label={`Menü sayfa ${i + 1}`} style={{ width: 128, height: 180, borderRadius: 14 }} onClick={() => setBuyuk(u)}><Img src={u} style={{ width: 128, height: 180 }} bg="#e8e0d8" /></button>))}</div></>)
          : <p style={{ fontSize: 13.5, color: '#6F6459', marginTop: 24 }}>Menü henüz eklenmedi.</p>}
        <h2 className="gm-sec">İletişim ve sosyal medya</h2>
        {iletisim.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{iletisim.map(([l, h]) => <a key={l} className="gm-cip" href={h} target={h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" onClick={() => izle(r.id, 'iletisim')}>{l}</a>)}</div>
          : <p style={{ fontSize: 13.5, color: '#6F6459', margin: 0 }}>Bu mekân için henüz iletişim bilgisi yok.</p>}
        <YorumBolumu r={r} mobil />
        {!r.claimed && <p style={{ fontSize: 13, color: '#6F6459', margin: '14px 2px 0' }}>Masa ayırtma ücretsizdir ve yalnızca kaydını sahiplenmiş mekânlarda açıktır; bu mekân henüz sahiplenilmedi.</p>}
        {bildirim && <p role="status" style={{ fontSize: 14, color: '#0A7C46', fontWeight: 600, margin: '12px 2px 0' }}>{bildirim}</p>}
      </div>
      <div className="gm-bar">
        <button type="button" className="gm-hap outline" style={{ flex: 1 }} onClick={yolTarifi}>Yol tarifi</button>
        <button type="button" className={`gm-hap ${r.claimed ? 'filled' : 'kapali'}`} style={{ flex: 1.3 }} disabled={!r.claimed} onClick={masaAyirt}>{r.claimed ? 'Masa ayırt' : 'Masa ayırtma kapalı'}</button>
      </div>
      {buyuk && (
        <div className="gm-foto" role="dialog" aria-modal="true" aria-label="Görsel" onClick={() => setBuyuk(null)}>
          <img src={buyuk} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          <p style={{ color: 'rgba(255,255,255,.7)', margin: 0, fontSize: 13.5 }}>Kapatmak için dokun</p>
        </div>
      )}
    </div>
  );
}
