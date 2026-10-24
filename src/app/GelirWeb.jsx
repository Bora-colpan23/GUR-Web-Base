// ═══════════════════════════════════════════════════════════════════════
// GELİR MODELİ — tüketici tarafındaki parçalar
//   • YorumBolumu     mekân sayfası: GUR yorumları · GURME yorumları · Google Maps (3 kaynak, açıkça ayrı)
//   • SponsorluSerit  Keşfet: onaylı "Keşfet Banner'ı" rezervasyonu olan mekân, "Sponsorlu" etiketiyle
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Img } from './GurApp.jsx';
import { useApp } from './webCtx.js';
import { gurmePaketiVar, aktifBannerlar } from './webStore.js';
import { placeUrl } from '../../shared/deeplink.js';

const yildiz = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const tarihYaz = (iso) => { try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

export function YorumBolumu({ r, mobil = false }) {
  const { depo, gelir } = useApp();
  const [sekme, setSekme] = useState('gur');
  const gur = depo.yorumlar[String(r.id)] || [];
  const gurme = gelir.gurmeYorumlari.filter((y) => String(y.restaurantId) === String(r.id));
  const paket = gurmePaketiVar(gelir, r.id);
  const gurmeOrt = gurme.length ? (gurme.reduce((a, y) => a + y.puan, 0) / gurme.length).toFixed(1) : null;
  const gUrl = placeUrl({ name: r.name, address: r.addr, lat: r.lat, lng: r.lng }, 'google');
  const sekmeler = [
    ['gur', 'GUR yorumları', gur.length ? String(gur.length) : ''],
    ['gurme', 'GURME yorumları', gurme.length ? `${gurmeOrt}/10` : ''],
    ['google', 'Google Maps', r.rating ? `★ ${r.rating}` : ''],
  ];
  return (
    <section className={`gy ${mobil ? 'm' : ''}`} aria-label="Yorumlar">
      <h2 className="gy-baslik">Yorumlar</h2>
      <p className="gy-alt">Üç kaynak, üç ayrı yer: kimin yazdığı her zaman yazılı.</p>
      <div className="gy-tabs" role="tablist" aria-label="Yorum kaynağı">
        {sekmeler.map(([k, ad, ek]) => (
          <button key={k} type="button" role="tab" aria-selected={sekme === k} className={`${mobil ? 'gm-chip' : 'gw-kchip'} ${sekme === k ? 'on' : ''}`} onClick={() => setSekme(k)}>
            {ad}{ek && <em>{ek}</em>}
          </button>
        ))}
      </div>

      {sekme === 'gur' && (
        <div role="tabpanel">
          <p className="gy-not">GUR yorumları, <b>GUR uygulamasını kullananların</b> yazdığı yorumlardır. Yorum yazmak GUR mobil uygulamasından yapılır.</p>
          {gur.length === 0 ? (
            <div className="gy-bos"><Icon n="chat" size={22} color="#FF6600" /><b>Henüz GUR yorumu yok</b><span>Bu mekân için GUR uygulamasından yazılmış yorum bulunmuyor.</span></div>
          ) : gur.map((y, i) => (
            <article key={i} className="gy-kart"><div className="gy-ust"><span className="gy-yildiz" aria-label={`${y.puan} / 5`}>{yildiz(y.puan)}</span><span>{tarihYaz(y.tarih)}</span></div><p>{y.metin}</p></article>
          ))}
        </div>
      )}

      {sekme === 'gurme' && (
        <div role="tabpanel">
          <p className="gy-not"><b>GURME</b>, GUR’un kendi gurmeleridir. GURME yorumları, mekânın <b>GURME paketi</b> almasıyla gurmeler tarafından yazılır; 10 üzerinden mesleki puan ve gerekçeli not içerir. Paket almak yorumun içeriğini belirlemez.</p>
          {gurme.length === 0 ? (
            <div className="gy-bos"><Icon n="shield" size={22} color="#FF6600" />
              <b>{paket ? 'GURME bu mekânı henüz değerlendirmedi' : 'Bu mekân için GURME değerlendirmesi yok'}</b>
              <span>{paket ? 'GURME paketi yürürlükte; gurmenin değerlendirmesi yayınlanınca burada görünecek.' : 'GURME değerlendirmesi, mekân GURME paketi aldığında yazılır.'}</span></div>
          ) : gurme.map((y) => (
            <article key={y.id} className="gy-kart gurme">
              <div className="gy-ust">
                <span className="gy-avatar" aria-hidden>{y.gurmeAd.replace('Şef ', '').slice(0, 1)}</span>
                <span style={{ flex: 1 }}><b>{y.gurmeAd}</b><small>GURME · {y.uzmanlik}</small></span>
                <span className="gy-puan" aria-label={`${y.puan} / 10`}>{y.puan.toFixed(1)}<small>/10</small></span>
              </div>
              {y.baslik && <h3>{y.baslik}</h3>}
              <p>{y.metin}</p>
              <div className="gy-alt2"><span className="gy-rozet">GURME paketi kapsamında</span><span>{tarihYaz(y.tarih)}</span></div>
            </article>
          ))}
        </div>
      )}

      {sekme === 'google' && (
        <div role="tabpanel">
          <p className="gy-not">Google Maps puanı ve değerlendirme sayısı, <b>Google Maps</b> üzerindeki herkese açık verilerdir. Yorum metinleri Google Maps’te okunur.</p>
          <div className="gy-google">
            <b className="gy-buyuk">{r.rating ? r.rating : '—'}</b>
            <span><span className="gy-yildiz">{r.rating ? yildiz(r.rating) : ''}</span><small>{r.ratingCount ? `${r.ratingCount.toLocaleString('tr-TR')} değerlendirme` : 'Değerlendirme sayısı yok'}</small></span>
            <a href={gUrl} target="_blank" rel="noopener noreferrer" className="gy-link">Google Maps’te yorumları oku →</a>
          </div>
        </div>
      )}
    </section>
  );
}

// Keşfet'in üstünde onaylı banner rezervasyonu olan mekânlar. ETİKET ZORUNLU: sponsorlu içerik organik gibi görünmez.
export function SponsorluSerit({ mobil = false }) {
  const { gelir, restaurants } = useApp();
  const liste = aktifBannerlar(gelir).map((b) => restaurants.find((r) => String(r.id) === String(b.restaurantId))).filter(Boolean);
  if (!liste.length) return null;
  return (
    <section className={`gs ${mobil ? 'm' : ''}`} aria-label="Sponsorlu">
      {liste.map((r) => (
        <Link key={r.id} to={`/restoran/${r.id}`} className="gs-kart">
          <Img src={r.imgs?.[0]} style={{ width: mobil ? 84 : 120, height: mobil ? 84 : 96, borderRadius: 16, flexShrink: 0 }} bg="#e8e0d8" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="gs-etiket">Sponsorlu</span>
            <b>{r.name}</b>
            <small>{r.cat}{r.rating ? ` · ★ ${r.rating}` : ''}</small>
          </span>
        </Link>
      ))}
    </section>
  );
}

export const GELIR_CSS = `
  .gy { margin-top:40px; } .gy.m { margin-top:26px; }
  .gy-baslik { font-size:28px; margin:0 0 4px; } .gy.m .gy-baslik { font-family:'Poppins',sans-serif !important; font-weight:800 !important; font-size:17px; letter-spacing:-.02em; }
  .gy-alt { margin:0 0 14px; color:#6F6459; font-size:14px; }
  .gy-tabs { display:flex; gap:8px; align-items:center; overflow-x:auto; scrollbar-width:none; margin:0 -8px 6px; padding:12px 8px 18px; scroll-padding:0 8px; } .gy-tabs button { flex-shrink:0; white-space:nowrap; } .gy-tabs::-webkit-scrollbar { display:none; }
  .gy-tabs button em { font-style:normal; font-size:12px; font-weight:800; margin-left:8px; opacity:.75; }
  .gy-not { background:#FBF7F1; border-radius:14px; padding:12px 14px; font-size:13.5px; color:#4A443E; margin:0 0 12px; line-height:1.55; }
  .gy-bos { display:flex; flex-direction:column; align-items:flex-start; gap:6px; background:#fff; border:1px dashed #E3DCD2; border-radius:18px; padding:18px; } .gy-bos span { color:#6F6459; font-size:14px; }
  .gy-kart { background:#fff; border:1px solid rgba(45,36,25,.10); border-radius:20px; padding:16px 18px; margin-bottom:10px; box-shadow:0 1px 2px rgba(45,36,25,.04), 0 2px 6px rgba(45,36,25,.04); }
  .gy-kart p { margin:8px 0 0; color:#4A443E; line-height:1.6; } .gy-kart h3 { margin:12px 0 0; font-size:17px; }
  .gy-kart.gurme { border-color:rgba(255,102,0,.35); background:linear-gradient(180deg, rgba(255,165,0,.07), #fff 60%); }
  .gy-ust { display:flex; align-items:center; gap:12px; font-size:13px; color:#6F6459; } .gy-ust b { display:block; color:#2A140C; font-size:15px; } .gy-ust small { display:block; font-size:12.5px; }
  .gy-yildiz { color:#FF6600; letter-spacing:1px; }
  .gy-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#FFA500,#FF6600 55%,#FF0000); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:17px; flex-shrink:0; }
  .gy-puan { font-family:'Poppins',sans-serif; font-weight:800; font-size:26px; color:#B4530A; line-height:1; } .gy-puan small { font-size:12px; color:#6F6459; margin-left:2px; font-family:inherit; }
  .gy-alt2 { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:12px; font-size:12.5px; color:#6F6459; flex-wrap:wrap; }
  .gy-rozet { background:rgba(255,165,0,.2); color:#8A5200; font-weight:700; border-radius:999px; padding:3px 10px; }
  .gy-google { display:flex; align-items:center; gap:16px; flex-wrap:wrap; background:#fff; border:1px solid rgba(45,36,25,.10); border-radius:20px; padding:18px 20px; }
  .gy-buyuk { font-family:'Poppins',sans-serif; font-size:44px; font-weight:800; line-height:1; } .gy-google small { display:block; color:#6F6459; font-size:13px; margin-top:2px; }
  .gy-link { margin-left:auto; color:#B4530A; font-weight:800; font-size:14px; }
  .gs { display:grid; gap:10px; margin:0 0 18px; } .gs.m { margin:12px 16px 0; }
  .gs-kart { display:flex; gap:14px; align-items:center; background:#fff; border:1.5px solid rgba(255,102,0,.35); border-left:6px solid #FFA500; border-radius:22px; padding:12px; color:inherit; box-shadow:0 8px 28px rgba(255,102,0,.10); }
  .gs-kart b { display:block; font-size:17px; } .gs-kart small { color:#6F6459; font-size:13px; }
  .gs-etiket { display:inline-block; font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#8A5200; background:rgba(255,165,0,.2); border-radius:999px; padding:2px 10px; margin-bottom:4px; }
`;
