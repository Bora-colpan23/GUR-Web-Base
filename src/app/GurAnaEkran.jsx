// Mobil uygulamadaki Keşfet (ana ekran) ve Profil düzeninin web karşılığı.
// Aynı yapı iki genişlikte çalışır: telefonda tek sütun uygulama ekranı, masaüstünde ortalanmış ve genişletilmiş aynı yapı.
//
// Uygulamadan bilerek ALINMAYANLAR (web'de karşılığı olmayan ya da uydurma veri gerektiren):
//   • GUR Match girişi — özellik yalnızca mobil uygulamada; tıklanınca bir yere gitmeyen kart olmaz.
//   • Rozet şeridi ("Puan Ustası"…) — rozetler uygulamadaki davranıştan kazanılır; web'de kazanım yok.
//   • Demo reklamlar ("Öz Değirmen"…) — gerçek bir reklamveren yok; yalnızca onaylı banner rezervasyonu REKLAM etiketiyle döner.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GurLogo, Icon, Img } from './GurApp.jsx';
import { useApp } from './webCtx.js';
import { useMobil, Satir } from './GurMobilWeb.jsx';
import { CATEGORIES } from '../data/restaurants.js';
import { yaz, hepsiniSil, yakinaGore, mesafeMetni } from './webStore.js';
import { aktifBannerlar } from './webStore.js';

const tarihYaz = (iso) => { try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
const kucukMu = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ───────────── Dönen banner: bölünmüş tanıtım kartı (görsel solda, metin + düğme sağda); marka/yönetici slaytı + onaylı sponsorlar ─────────────
function Karusel({ slides }) {
  const [i, setI] = useState(0);
  const [dur, setDur] = useState(false);   // duraklat: kullanıcı dönmeyi durdurabilir
  useEffect(() => {
    if (dur || kucukMu() || slides.length < 2) return undefined;
    const t = setTimeout(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearTimeout(t);
  }, [i, slides.length, dur]);
  const s = slides[i] || slides[0];
  if (!s) return null;
  return (
    <div className="ga-karusel ga-split" aria-roledescription="carousel" aria-label="Öne çıkanlar">
      <div key={s.id} className="ga-split-slayt">
        <div className="ga-split-img">
          <Img src={s.img} style={{ width: '100%', height: '100%' }} bg="#4a2a14" />
          {s.etiket && <span className="ga-split-etiket">{s.etiket}</span>}
          {s.reklam && <span className="ga-reklam">REKLAM</span>}
        </div>
        <div className={slides.length > 1 ? 'ga-split-yazi coklu' : 'ga-split-yazi'}>
          <h2>{s.baslik}</h2>
          {s.aciklama && <p>{s.aciklama}</p>}
          {s.to && <Link to={s.to} className="ga-split-cta">{s.cta || 'İncele'}</Link>}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="ga-split-alt">
          <span className="ga-noktalar-ic">
            {slides.map((x, k) => <button key={x.id} type="button" aria-label={`${k + 1}. slayt`} aria-current={k === i} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}
          </span>
          <button type="button" className="ga-split-dur" aria-label={dur ? 'Dönmeyi sürdür' : 'Dönmeyi duraklat'} onClick={() => setDur((v) => !v)}>{dur ? '▶' : '❚❚'}</button>
        </div>
      )}
    </div>
  );
}

// ───────────── Keşfet ─────────────
export function KesfetApp() {
  const { depo, gelir, platform, restaurants } = useApp();
  const mobil = useMobil();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [kat, setKat] = useState(null);
  const [tumu, setTumu] = useState(false);
  const [adet, setAdet] = useState(30);
  const ad = depo.kullanici?.ad;
  const k = depo.konum;
  const konumAd = k ? (k.kaynak === 'cihaz' ? 'Konumun' : (k.ilce || 'İstanbul')) : 'Konum kapalı';
  const konumUst = !k ? 'Seçmek için dokun' : k.kaynak === 'cihaz' ? 'Yakındakiler önce' : 'Seçtiğin ilçe';

  const siralı = useMemo(() => yakinaGore(restaurants, k), [restaurants, k]);
  const populer = useMemo(() => siralı.slice(0, 10).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6), [siralı]);
  const kategoriler = useMemo(() => CATEGORIES.filter((c) => restaurants.some((r) => r.cat === c.name)), [restaurants]);

  const slides = useMemo(() => {
    const kapak = restaurants.find((r) => r.imgs?.[0])?.imgs[0];
    const sponsor = aktifBannerlar(gelir).map((b) => {
      const r = restaurants.find((x) => String(x.id) === String(b.restaurantId));
      return r ? { id: `bk-${b.id}`, img: b.gorselDurum === 'onaylandi' && b.gorsel ? b.gorsel : r.imgs?.[0], reklam: true, etiket: r.cat, baslik: r.name, aciklama: r.desc || `${r.cat} · ${r.district || 'Bakırköy'}`, cta: 'Mekânı gör', to: `/restoran/${r.id}` } : null;
    }).filter(Boolean);
    // Yönetici panelinden konan bannerlar; hiç yoksa marka slaytı.
    const yonetici = (platform.bannerlar || []).filter((b) => b.aktif && b.gorsel).map((b) => ({ id: b.id, img: b.gorsel, baslik: b.baslik, aciklama: b.alt, cta: 'İncele', reklam: !!b.reklam, to: b.restaurantId ? `/restoran/${b.restaurantId}`  : undefined }));
    return [...(yonetici.length ? yonetici : [{ id: 'marka', img: kapak, baslik: 'İstanbul’un Lezzetleri', aciklama: 'En popüler restoranları keşfet, kaydırarak karar ver.', cta: 'Kaydırarak keşfet', to: '/kesfet/swipe' }]), ...sponsor];
  }, [gelir, platform, restaurants]);

  const arama = q.trim().toLocaleLowerCase('tr');
  const sonuc = useMemo(() => {
    if (!arama && !kat) return null;
    const ad1 = []; const diger = [];
    for (const r of siralı) {
      if (kat && r.cat !== kat) continue;
      if (!arama) { diger.push(r); continue; }
      if (r.name.toLocaleLowerCase('tr').includes(arama)) ad1.push(r);
      else if (`${r.cat} ${(r.tags || []).join(' ')} ${r.addr || ''}`.toLocaleLowerCase('tr').includes(arama)) diger.push(r);
    }
    return [...ad1, ...diger];
  }, [arama, kat, siralı]);
  useEffect(() => { setAdet(30); }, [arama, kat]);

  const liste = sonuc || siralı;
  const baslikListe = sonuc ? (kat && !arama ? kat : `“${q.trim()}” için`) : 'Tüm mekanlar';

  return (
    <div className={`ga ${mobil ? 'gm' : ''}`}>
      <div className="ga-top">
        <Link to="/konum/degistir" className="ga-konum" aria-label={`Konum: ${konumAd}. Değiştirmek için dokun`}>
          <i><Icon n="pin" size={16} color="#4A443E" /></i><span><small>{k?.kaynak === 'cihaz' ? 'Konumun' : k ? 'Seçtiğin ilçe' : 'Konum kapalı'}</small><b>{k ? konumAd : konumUst}{k?.kaynak !== 'cihaz' && ' ▾'}</b></span>
        </Link>
        <Link to="/" aria-label="GUR ana sayfa"><GurLogo size={38} pill /></Link>
        <span style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Link to="/profil" className="ga-avatar" aria-label="Profil">{(ad || 'G').slice(0, 1).toLocaleUpperCase('tr')}</Link>
        </span>
      </div>

      <h1 className="ga-nereye">Canın ne istiyor?</h1>
      <div className="ga-arama">
        <Icon n="search" size={18} color="rgba(45,36,25,.4)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restoran, mutfak, semt" aria-label="Restoran ara" />
        {(q || kat) && <button type="button" className="ga-temizle" aria-label="Aramayı temizle" onClick={() => { setQ(''); setKat(null); }}>✕</button>}
        <button type="button" className="ga-ara" onClick={() => { document.activeElement?.blur?.(); document.querySelector('.ga-bolum')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Ara</button>
      </div>
      <div className="ga-hizli"><Link to="/kesfet/swipe">Kaydırarak keşfet</Link><Link to="/kesfet/harita">Haritada gör</Link></div>

      {sonuc ? (
        <section className="ga-bolum">
          <p className="ga-say" aria-live="polite">{sonuc.length > 0 ? `${baslikListe} ${sonuc.length} restoran` : `${baslikListe} sonuç yok`}</p>
          {sonuc.length === 0 && (
            <div className="ga-bos"><span>Başka bir isim ya da mutfak deneyebilirsin.</span><Link to="/kesfet/swipe" className="ga-hap">Kaydırarak keşfet</Link></div>
          )}
          <div className="ga-liste">{sonuc.slice(0, adet).map((r) => <Satir key={r.id} r={r} />)}</div>
          {adet < sonuc.length && <div style={{ textAlign: 'center' }}><button type="button" className="ga-hap ghost" onClick={() => setAdet((a) => a + 30)}>Daha fazla göster ({sonuc.length - adet})</button></div>}
        </section>
      ) : (
        <>
          <Karusel slides={slides} />

          <div className="ga-baslik ga-baslik-alt"><div><h2>İlgi alanına göre mekân bul</h2><p>Neyi merak ediyorsan keşfedebilirsin</p></div><button type="button" onClick={() => setTumu((v) => !v)}>{tumu ? 'Daralt' : 'Tümü'}</button></div>
          {tumu ? (
            <div className="ga-kat-izgara">
              {kategoriler.map((c) => (
                <button key={c.name} type="button" className="ga-kat-kutu" onClick={() => { setKat(c.name); setTumu(false); }}>
                  <Img src={c.img} style={{ width: '100%', height: '100%' }} bg="#d4c8bc" /><span className="ga-perde" /><b>{c.name}</b>
                </button>
              ))}
            </div>
          ) : (
            <div className="ga-hscroll ga-kat" role="group" aria-label="Kategoriler">
              {kategoriler.slice(0, 12).map((c) => (
                <button key={c.name} type="button" className="ga-kat-kutu ga-kat-kart" onClick={() => setKat(c.name)}>
                  <Img src={c.img} style={{ width: '100%', height: '100%' }} bg="#E9E2D8" /><span className="ga-perde" /><b>{c.name}</b>
                </button>
              ))}
            </div>
          )}

          {populer.length > 0 && (
            <>
              <div className="ga-baslik"><h2>{k ? 'Yakınında popüler' : 'Popüler mekânlar'}</h2><Link to="/kesfet/swipe">Kaydırarak gez</Link></div>
              <div className="ga-hscroll">
                {populer.map((r) => (
                  <Link key={r.id} to={`/restoran/${r.id}`} className="ga-pop">
                    <span className="ga-pop-img"><Img src={r.imgs?.[0]} style={{ width: '100%', height: '100%' }} bg="#E9E2D8" />{r.claimed && <i title="Sahiplenilmiş">✓</i>}</span>
                    <span className="ga-pop-govde">
                      <span className="ga-pop-ust"><b>{r.name}</b>{r.rating ? <em><Icon n="star" size={12} color="#F5A524" />{r.rating}</em> : null}</span>
                      <small>{r.cat}</small>
                      <span className="ga-pop-alt"><Icon n="pin" size={11} color="#6F6459" />{mesafeMetni(r) || 'Bakırköy'}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <section className="ga-bolum">
            <div className="ga-baslik"><h2>{baslikListe}</h2><Link to="/kesfet/harita">Haritada gör</Link></div>
            <div className="ga-liste">{liste.slice(0, adet).map((r) => <Satir key={r.id} r={r} />)}</div>
            {adet < liste.length && <div style={{ textAlign: 'center' }}><button type="button" className="ga-hap ghost" onClick={() => setAdet((a) => a + 30)}>Daha fazla göster ({liste.length - adet})</button></div>}
          </section>
        </>
      )}
    </div>
  );
}

// ───────────── Profil ─────────────
export function ProfilApp() {
  const { depo, restaurants, platform, gelir } = useApp();
  const mobil = useMobil();
  const nav = useNavigate();
  const [sekme, setSekme] = useState('yorum');
  const [onay, setOnay] = useState(null);
  const [duzen, setDuzen] = useState(false);
  const [adTaslak, setAdTaslak] = useState('');
  const [hepsi, setHepsi] = useState(false);
  const ad = depo.kullanici?.ad;
  const k = depo.konum;

  const favoriler = depo.favoriler.map((id) => restaurants.find((r) => String(r.id) === String(id))).filter(Boolean);
  const yorumlar = Object.entries(depo.yorumlar).flatMap(([id, l]) => (l || []).map((y) => ({ ...y, r: restaurants.find((x) => String(x.id) === String(id)) })));
  const ort = yorumlar.length ? (yorumlar.reduce((a, y) => a + (y.puan || 0), 0) / yorumlar.length).toFixed(1) : '-';
  const talepler = platform.talepler;
  const bekleyen = talepler.filter((t) => t.durum === 'bekliyor').length;
  const DURUM = { bekliyor: ['İşletme onayında', 'bek'], onaylandi: ['Kabul edildi', 'ok'], reddedildi: ['Kabul edilmedi', 'ret'] };

  // Başarılar: yalnızca kullanıcının kendi gerçek eylemlerinden hesaplanır (uydurma kilit yok).
  const basarilar = [
    { id: 'fav', ad: 'İlk mekânını favorile', alt: 'Keşfet’te kalbe dokun ya da sağa kaydır', acik: favoriler.length > 0, to: '/kesfet' },
    { id: 'konum', ad: 'Konumunu belirle', alt: 'Yakındaki mekânlar sana göre sıralansın', acik: !!k, to: '/konum/degistir' },
    { id: 'yorum', ad: 'İlk yorumunu yaz', alt: 'Yorum yazmak GUR mobil uygulamasından yapılır', acik: yorumlar.length > 0, to: '/profil' },
    { id: 'masa', ad: 'İlk masa talebini gönder', alt: 'Sahiplenilmiş mekânlarda masa ayırt', acik: talepler.length > 0, to: '/kesfet' },
  ];
  const acikSayi = basarilar.filter((b) => b.acik).length;
  const uyelik = depo.kullanici?.tarih ? new Date(depo.kullanici.tarih).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : '';

  const SEKMELER = [['yorum', 'Yorumlarım'], ['masa', 'Rezervasyonlarım'], ['fav', 'Beğendiğim Yerler']];
  return (
    <div className={`ga gp-sayfa ${mobil ? 'gm' : ''}`}>
      <div className="gpr-ust">
        <span className="gpr-avatar" aria-hidden>{(ad || 'G').slice(0, 1).toLocaleUpperCase('tr')}</span>
        <div className="gpr-kimlik">
          <h1>{ad || 'Misafir'}</h1>
          <p>{depo.kullanici?.email ? `@${depo.kullanici.email.split('@')[0]}` : 'Giriş yapılmadı'}</p>
          <div className="gpr-katki">
            <span><small>Katkı sayısı</small><b>{yorumlar.length}</b></span>
            <span><small>Favori</small><b>{favoriler.length}</b></span>
            <span><small>Ortalama puan</small><b>{ort}</b></span>
          </div>
        </div>
        <div className="gpr-ust-eylem">
          {depo.kullanici
            ? <button type="button" className="gpr-duzen" onClick={() => { setAdTaslak(ad || ''); setDuzen(true); }}>Profili düzenle</button>
            : <Link to="/giris" className="ga-hap">Giriş yap</Link>}
          <button type="button" className="gpr-disli" aria-label="Ayarlar" onClick={() => document.querySelector('.gpr-ayar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg></button>
        </div>
      </div>

      <div className="gpr-iki">
        <aside className="gpr-yan">
          <section className="gpr-panel" aria-label="Başarılar">
            <h2>Başarıların</h2>
            <p className="gpr-alt">{acikSayi > 0 ? `${acikSayi} / ${basarilar.length} başarı açıldı` : 'Kilidi açmak için GUR’u kullanmaya başla'}</p>
            {(hepsi ? basarilar : basarilar.slice(0, 3)).map((b) => (
              <Link key={b.id} to={b.to} className={`gpr-basari ${b.acik ? 'acik' : ''}`}>
                <span className="gpr-kilit" aria-hidden>{b.acik ? '✓' : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>}</span>
                <span><b>{b.ad}</b><small>{b.acik ? 'Açıldı' : b.alt}</small></span>
              </Link>
            ))}
            {basarilar.length > 3 && <button type="button" className="ga-hap koyu" onClick={() => setHepsi((v) => !v)}>{hepsi ? 'Daha az göster' : 'Tümünü görüntüle'}</button>}
          </section>
          <section className="gpr-panel" aria-label="Hakkında">
            <h2>Hakkında</h2>
            <Link to="/konum/degistir" className="gpr-bilgi"><Icon n="pin" size={15} color="#4A443E" />{k ? `${k.ilce || 'Cihaz konumu'} (konum açık)` : 'Bulunduğun ilçeyi belirt'}</Link>
            {depo.kullanici?.tarih && <p className="gpr-bilgi"><Icon n="clock" size={15} color="#4A443E" />{uyelik} katıldı</p>}
            {depo.kullanici?.email && <p className="gpr-bilgi"><Icon n="chat" size={15} color="#4A443E" />{depo.kullanici.email}</p>}
          </section>
        </aside>
        <div className="gpr-ana">
      <div className="gpr-tabs" role="tablist" aria-label="Profil bölümleri">
        {SEKMELER.map(([id, ad1]) => (
          <button key={id} type="button" role="tab" aria-selected={sekme === id} className={sekme === id ? 'on' : ''} onClick={() => setSekme(id)}>
            {ad1}{id === 'masa' && bekleyen > 0 && <em>{bekleyen}</em>}
          </button>
        ))}
      </div>

      <div className="gpr-icerik" role="tabpanel">
        {sekme === 'yorum' && (yorumlar.length === 0
          ? <p className="gpr-bos">Henüz yorum yapmadın<small>Yorum yazmak GUR mobil uygulamasından yapılır.</small></p>
          : yorumlar.map((y, i) => (
            <Link key={i} to={y.r ? `/restoran/${y.r.id}` : '#'} className="gpr-satir">
              <Img src={y.r?.imgs?.[0]} style={{ width: 50, height: 50, borderRadius: 12, flexShrink: 0 }} bg="#E9E2D8" />
              <span style={{ flex: 1, minWidth: 0 }}><b>{y.r?.name || 'Restoran'}</b><small>{'★'.repeat(Math.round(y.puan || 0))} · {tarihYaz(y.tarih)}</small><span className="gpr-metin">{y.metin}</span></span>
            </Link>
          )))}
        {sekme === 'masa' && (talepler.length === 0
          ? <p className="gpr-bos">Henüz masa talebin yok<small>Masa ayırtma, kaydını sahiplenmiş mekânlarda açıktır.</small></p>
          : talepler.map((t) => {
            const [etiket, ton] = DURUM[t.durum] || DURUM.bekliyor;
            const r = restaurants.find((x) => String(x.id) === String(t.restaurantId));
            return (
              <Link key={t.id} to={r ? `/restoran/${r.id}` : '#'} className="gpr-satir">
                <span className={`gpr-ikon ${ton}`}><Icon n="clock" size={18} color="currentColor" /></span>
                <span style={{ flex: 1, minWidth: 0 }}><b>{t.ad}</b><small>{t.kisi} kişi · {tarihYaz(t.tarih)}</small></span>
                <span className={`gpr-durum ${ton}`}>{etiket}</span>
              </Link>
            );
          }))}
        {sekme === 'fav' && (favoriler.length === 0
          ? <p className="gpr-bos">Henüz beğendiğin bir yer yok<small>Keşfet’te kalbe dokun ya da kartı sağa kaydır.</small></p>
          : favoriler.map((r) => (
            <Link key={r.id} to={`/restoran/${r.id}`} className="gpr-satir">
              <Img src={r.imgs?.[0]} style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0 }} bg="#E9E2D8" />
              <span style={{ flex: 1, minWidth: 0 }}><b>{r.name}</b><small>{r.cat} · {mesafeMetni(r) || 'Bakırköy'}</small></span>
              {r.rating ? <span className="gpr-puan"><Icon n="star" size={12} color="#F5A524" />{r.rating}</span> : null}
            </Link>
          )))}
      </div>
        </div>
      </div>

      <section className="gpr-ayar" aria-label="Ayarlar">
        <h2>Ayarlar</h2>
        <button type="button" className="gpr-ayar-satir" onClick={() => nav('/konum/degistir')}><i><Icon n="pin" size={16} color="#FF6600" /></i>Konum<em>{k ? (k.ilce || 'Cihazdan') : 'Kapalı'}</em><span aria-hidden>›</span></button>
        <button type="button" className="gpr-ayar-satir" onClick={() => yaz({ riza: depo.riza === 'kabul' ? 'ret' : 'kabul' })}><i><Icon n="shield" size={16} color="#FF6600" /></i>Ölçümleme izni<em>{depo.riza === 'kabul' ? 'Açık' : 'Kapalı'}</em></button>
        <div className="gpr-ayar-satir" style={{ cursor: 'default' }}><i><Icon n="chart" size={16} color="#FF6600" /></i>Bağlantı<em>Yerel</em></div>
        <p className="gpr-not">Sunucuya bağlı değil. Favorilerin ve tercihlerin yalnızca bu tarayıcıda saklanıyor.</p>
      </section>


      <section className="gpr-hesap">
        <h2>Hesap</h2>
        <p>Hesabını silersen favorilerin, yorumların ve tercihlerin bu tarayıcıdan kalıcı olarak kaldırılır.</p>
        <div className="gpr-eylem">
          <button type="button" className="ga-hap ghost" onClick={() => setOnay('cikis')}>Çıkış yap</button>
          <button type="button" className="ga-hap tehlike" onClick={() => setOnay('sil')}>Hesabımı sil</button>
        </div>
      </section>

      {duzen && (
        <div className="ga-modal" role="dialog" aria-modal="true" aria-labelledby="ga-du-b" onClick={() => setDuzen(false)}>
          <form className="ga-modal-k" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); const a = adTaslak.trim(); if (a.length < 2) return; yaz({ kullanici: { ...depo.kullanici, ad: a } }); setDuzen(false); }}>
            <h2 id="ga-du-b">Profilini düzenle</h2>
            <label style={{ display: 'grid', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 600 }}>Görünen ad
              <input value={adTaslak} onChange={(e) => setAdTaslak(e.target.value)} maxLength={40} autoFocus style={{ minHeight: 46, borderRadius: 12, border: '1.5px solid #E3DCD2', padding: '0 14px', font: 'inherit', fontSize: 16 }} />
            </label>
            <div className="gpr-eylem" style={{ marginTop: 18 }}>
              <button type="submit" className="ga-hap">Kaydet</button>
              <button type="button" className="ga-hap ghost" onClick={() => setDuzen(false)}>Vazgeç</button>
            </div>
          </form>
        </div>
      )}
      {onay && (
        <div className="ga-modal" role="alertdialog" aria-modal="true" aria-labelledby="ga-on-b" onClick={() => setOnay(null)}>
          <div className="ga-modal-k" onClick={(e) => e.stopPropagation()}>
            <h2 id="ga-on-b">{onay === 'cikis' ? 'Çıkış yapılsın mı?' : 'Hesabın silinsin mi?'}</h2>
            <p>{onay === 'cikis' ? 'Favorilerin bu tarayıcıda kalır.' : 'Favorilerin, yorumların ve tercihlerin bu tarayıcıdan kalıcı olarak silinir. Geri alınamaz.'}</p>
            <div className="gpr-eylem" style={{ marginTop: 18 }}>
              <button type="button" className={`ga-hap ${onay === 'sil' ? 'tehlike' : ''}`} onClick={() => { if (onay === 'cikis') yaz({ kullanici: null }); else hepsiniSil(); setOnay(null); nav('/'); }}>{onay === 'cikis' ? 'Çıkış yap' : 'Sil'}</button>
              <button type="button" className="ga-hap ghost" onClick={() => setOnay(null)}>Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ANA_CSS = `
  .ga { max-width:1120px; margin:0 auto; padding:0 16px 96px; font-family:'Poppins',sans-serif; color:#1C1917; }
  .ga.gm { background:#FDFBF7; max-width:none; }
  .ga-top { display:flex; align-items:center; gap:10px; padding:calc(10px + env(safe-area-inset-top)) 0 12px; }
  .ga-konum { flex:1; min-width:0; min-height:44px; display:flex; align-items:center; gap:8px; color:inherit; }
  .ga-konum i { width:34px; height:34px; border-radius:12px; background:#F6F3EE; border:1px solid #E3DCD2; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .ga-konum small { display:block; font-size:10.5px; font-weight:600; color:#6F6459; letter-spacing:.3px; } .ga-konum b { display:block; font-size:13.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ga-top > a { flex-shrink:0; } .ga-top > .ga-konum { flex:1 1 0; min-width:0; overflow:hidden; } .ga-top > span { flex:1 1 0; min-width:0; }
  .ga-avatar { width:40px; height:40px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(45,36,25,.06), 0 4px 12px rgba(45,36,25,.08); display:flex; align-items:center; justify-content:center; color:inherit; }
  .ga-avatar::before { content:attr(aria-label); display:none; }
  .ga-arama { display:flex; align-items:center; gap:10px; background:#fff; border-radius:999px; padding:6px 6px 6px 18px; box-shadow:0 1px 2px rgba(45,36,25,.05), 0 6px 18px rgba(45,36,25,.07); margin-bottom:14px; }
  .ga-arama input { flex:1; min-width:0; border:none !important; outline:none !important; box-shadow:none !important; background:transparent; font:inherit; font-size:16px; font-weight:500; padding:10px 0; color:#1C1917; }
  .ga-arama button { width:44px; height:44px; border-radius:50%; border:none; background:#F6F3EE; cursor:pointer; font-size:15px; color:#6F6459; display:flex; align-items:center; justify-content:center; }
  .ga-arama .ga-swipe { background:#fff; box-shadow:0 1px 2px rgba(45,36,25,.08), 0 3px 10px rgba(45,36,25,.10); }
  .ga-karusel { position:relative; height:150px; border-radius:24px; overflow:hidden; margin-bottom:18px; box-shadow:0 2px 6px rgba(45,36,25,.08), 0 10px 28px rgba(45,36,25,.10); background:#4a2a14; }
  .ga-slayt { position:absolute; inset:0; display:block; color:#fff; animation:gaFade .45s ease both; } @keyframes gaFade { from { opacity:0; } to { opacity:1; } }
  .ga-karusel .ga-slayt > div:first-child, .ga-kat-kutu > div:first-child, .ga-pop-img > div:first-child, .ga-kat-halka span > div:first-child { position:absolute !important; inset:0; }
  .ga, .ga * { box-sizing:border-box; } .ga { overflow-x:clip; }
  .ga-perde { position:absolute; inset:0; background:linear-gradient(to top, rgba(20,10,4,.82), rgba(20,10,4,.35) 55%, rgba(20,10,4,.12)); }
  .ga-reklam { position:absolute; top:12px; right:12px; background:rgba(0,0,0,.45); border:1px solid rgba(255,255,255,.2); border-radius:6px; padding:2px 7px; font-size:9px; font-weight:800; letter-spacing:.5px; color:rgba(255,255,255,.9); }
  .ga-slayt-yazi { position:absolute; left:0; right:0; bottom:0; padding:18px 20px 24px; display:flex; flex-direction:column; gap:3px; }
  .ga-slayt-yazi small { font-size:11px; font-weight:700; color:rgba(255,255,255,.75); } .ga-slayt-yazi b { font-size:18px; font-weight:800; text-shadow:0 2px 10px rgba(0,0,0,.45); } .ga-slayt-yazi em { font-style:normal; font-size:12px; color:rgba(255,255,255,.8); }
  .ga-noktalar { position:absolute; right:14px; bottom:10px; display:flex; gap:5px; z-index:2; }
  .ga-noktalar button { width:6px; height:6px; padding:0; border:none; border-radius:3px; background:rgba(255,255,255,.5); cursor:pointer; transition:width .3s, background .3s; } .ga-noktalar button.on { width:16px; background:#fff; }
  .ga-baslik { display:flex; justify-content:space-between; align-items:baseline; margin:4px 0 10px; } .ga-baslik h2 { font-size:15px; font-weight:800; margin:0; letter-spacing:-.01em; }
  .ga-baslik button, .ga-baslik a { border:none; background:none; padding:0; min-height:44px; display:inline-flex; align-items:center; font:inherit; font-size:12px; font-weight:700; color:#4A443E; cursor:pointer; }
  .ga-hscroll { display:flex; gap:12px; overflow-x:auto; padding:2px 2px 8px; margin-bottom:12px; scroll-snap-type:x proximity; scrollbar-width:none; } .ga-hscroll::-webkit-scrollbar { display:none; }
  .ga-kat { gap:14px; }
  .ga-kat-halka { flex:0 0 68px; border:none; background:none; padding:0; cursor:pointer; font:inherit; font-size:11px; font-weight:700; line-height:1.25; color:#1C1917; text-align:center; scroll-snap-align:start; }
  .ga-kat-halka span { display:block; width:62px; height:62px; border-radius:50%; overflow:hidden; position:relative; margin:0 auto 7px; border:2px solid #E3DCD2; box-shadow:0 1px 2px rgba(45,36,25,.05), 0 4px 12px rgba(45,36,25,.07); transition:transform .25s, border-color .2s; }
  .ga-kat-halka:hover span { transform:translateY(-2px); border-color:#FF6600; }
  .ga-kat-izgara { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; margin-bottom:18px; }
  .ga-kat-kutu { position:relative; height:110px; border:none; border-radius:20px; overflow:hidden; cursor:pointer; padding:0; box-shadow:0 2px 8px rgba(45,36,25,.10); text-align:left; }
  .ga-kat-kutu b { position:absolute; left:14px; bottom:12px; color:#fff; font-size:14px; font-weight:800; text-shadow:0 2px 8px rgba(0,0,0,.5); font-family:inherit; }
  .ga-pop { flex:0 0 208px; background:#fff; border-radius:22px; overflow:hidden; color:inherit; scroll-snap-align:start; box-shadow:0 1px 2px rgba(45,36,25,.05), 0 6px 18px rgba(45,36,25,.07); transition:transform .25s, box-shadow .25s; }
  .ga-pop:hover { transform:translateY(-3px); box-shadow:0 2px 4px rgba(45,36,25,.06), 0 14px 30px rgba(255,102,0,.16); }
  .ga-pop-img { display:block; position:relative; height:116px; } .ga-pop-img i { position:absolute; top:9px; right:9px; width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,.92); color:#FF6600; font-style:normal; font-size:12px; font-weight:900; display:flex; align-items:center; justify-content:center; }
  .ga-pop-govde { display:block; padding:11px 13px 13px; } .ga-pop-ust { display:flex; gap:8px; align-items:flex-start; } .ga-pop-ust b { flex:1; min-width:0; font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ga-pop-ust em { display:inline-flex; gap:3px; align-items:center; font-style:normal; font-size:12px; font-weight:800; flex-shrink:0; } .ga-pop small { display:block; font-size:11.5px; color:#6F6459; margin:3px 0 10px; }
  .ga-pop-alt { display:flex; align-items:center; gap:4px; font-size:11.5px; color:#6F6459; }
  .ga-bolum { margin-top:8px; } .ga-say { margin:0 0 10px; font-size:12.5px; color:#6F6459; }
  .ga-liste { display:block; } .ga-bos { background:#fff; border-radius:20px; padding:18px; text-align:center; display:grid; gap:12px; justify-items:center; color:#6F6459; font-size:13px; }
  .ga-hap { display:inline-flex; align-items:center; justify-content:center; min-height:46px; padding:0 22px; border-radius:999px; border:none; background:linear-gradient(135deg,#FF7A1A,#F04E00); color:#fff; font:inherit; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 6px 16px rgba(255,102,0,.28); }
  .ga-hap.ghost { background:#fff; color:#1C1917; box-shadow:none; border:1.5px solid #E3DCD2; } .ga-hap.tehlike { background:#FDECEA; color:#B3261E; box-shadow:none; }
  .gpr-ust { display:flex; flex-direction:column; align-items:center; text-align:center; padding:calc(26px + env(safe-area-inset-top)) 0 8px; }
  .gpr-avatar { width:84px; height:84px; border-radius:50%; background:#FF6600; color:#fff; font-size:30px; font-weight:800; display:flex; align-items:center; justify-content:center; }
  .gpr-ust h1 { font-size:19px; font-weight:800; letter-spacing:-.02em; margin:14px 0 3px; } .gpr-ust p { margin:0 0 16px; font-size:12.5px; color:#6F6459; }
  .gpr-stat { display:flex; align-items:center; gap:10px; font-size:13px; color:#4A443E; } .gpr-stat span { display:inline-flex; gap:3px; align-items:center; } .gpr-stat b { color:#1C1917; } .gpr-stat i { width:3px; height:3px; border-radius:50%; background:#BDB4AA; }
  .gpr-tabs { display:flex; gap:28px; margin:22px 0 0; border-bottom:1px solid #E3DCD2; overflow-x:auto; scrollbar-width:none; } .gpr-tabs::-webkit-scrollbar { display:none; }
  .gpr-tabs button { border:none; background:none; padding:0 0 12px; min-height:44px; font:inherit; font-size:13px; font-weight:500; color:#6F6459; cursor:pointer; border-bottom:2px solid transparent; white-space:nowrap; display:flex; gap:5px; align-items:center; margin-bottom:-1px; }
  .gpr-tabs button.on { color:#1C1917; font-weight:700; border-bottom-color:#FF6600; } .gpr-tabs em { font-style:normal; min-width:16px; height:16px; border-radius:8px; background:#FF6600; color:#fff; font-size:9.5px; font-weight:800; display:inline-flex; align-items:center; justify-content:center; padding:0 4px; }
  .gpr-icerik { padding:6px 0 0; } .gpr-bos { text-align:center; padding:40px 20px; margin:0; font-size:14px; color:#6F6459; } .gpr-bos small { display:block; margin-top:6px; font-size:12.5px; }
  .gpr-satir { display:flex; gap:12px; align-items:center; padding:14px 0; border-bottom:1px solid rgba(0,0,0,.06); color:inherit; } .gpr-satir b { display:block; font-size:14px; font-weight:700; } .gpr-satir small { display:block; font-size:11.5px; color:#6F6459; margin-top:2px; }
  .gpr-metin { display:block; font-size:12.5px; color:#4A443E; margin-top:4px; line-height:1.45; } .gpr-puan { display:inline-flex; gap:3px; align-items:center; font-size:12px; font-weight:700; }
  .gpr-ikon { width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; } .gpr-ikon.bek, .gpr-durum.bek { background:rgba(255,102,0,.09); color:#A84D09; } .gpr-ikon.ok, .gpr-durum.ok { background:rgba(34,197,94,.1); color:#0A7C46; } .gpr-ikon.ret, .gpr-durum.ret { background:rgba(255,59,48,.09); color:#B3261E; }
  .gpr-durum { flex-shrink:0; font-size:11px; font-weight:800; border-radius:999px; padding:5px 11px; }
  .gpr-ayar, .gpr-hesap { margin-top:30px; padding-top:18px; border-top:1px solid #E3DCD2; } .gpr-ayar h2, .gpr-hesap h2 { font-size:13px; font-weight:700; margin:0 0 8px; }
  .gpr-ayar-satir { width:100%; display:flex; align-items:center; gap:12px; min-height:52px; padding:0; background:none; border:none; font:inherit; font-size:14px; font-weight:600; color:#1C1917; cursor:pointer; text-align:left; border-bottom:1px solid rgba(0,0,0,.06); }
  .gpr-ayar-satir i { width:34px; height:34px; border-radius:50%; background:rgba(255,102,0,.08); display:flex; align-items:center; justify-content:center; } .gpr-ayar-satir em { margin-left:auto; font-style:normal; font-weight:500; font-size:13px; color:#6F6459; } .gpr-ayar-satir span { color:#BDB4AA; }
  .gpr-not, .gpr-hesap p { margin:10px 0 0; font-size:12.5px; color:#6F6459; line-height:1.5; } .gpr-eylem { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
  .ga-modal { position:fixed; inset:0; z-index:90; background:rgba(20,12,6,.5); display:flex; align-items:center; justify-content:center; padding:20px; }
  .ga-modal-k { background:#fff; border-radius:24px; padding:24px; max-width:380px; width:100%; } .ga-modal-k h2 { margin:0; font-size:20px; } .ga-modal-k p { margin:8px 0 0; color:#6F6459; line-height:1.55; }
  @media (min-width:701px) {
    .ga { padding:24px 28px 90px; }
    .ga-top { display:none; }
    .ga-arama { max-width:680px; margin:0 auto 22px; }
    .ga-karusel { height:300px; border-radius:28px; } .ga-slayt-yazi { padding:28px 34px 34px; } .ga-slayt-yazi b { font-size:30px; } .ga-slayt-yazi small { font-size:13px; } .ga-slayt-yazi em { font-size:15px; }
    .ga-baslik h2 { font-size:20px; } .ga-baslik button, .ga-baslik a { font-size:14px; }
    .ga-kat-halka { flex-basis:92px; font-size:13px; } .ga-kat-halka span { width:84px; height:84px; }
    .ga-pop { flex-basis:250px; } .ga-pop-img { height:150px; }
    .ga-liste { display:grid; grid-template-columns:repeat(2,1fr); column-gap:18px; }
    .gp-sayfa { max-width:760px; }
  }
  @media (hover:hover) { .ga-hap:hover { filter:brightness(1.06); transform:translateY(-1px); } .ga-hap.ghost:hover { border-color:#FF6600; color:#B4530A; } .gpr-satir:hover b { color:#B4530A; } .ga-kat-kutu:hover { transform:translateY(-2px); } }
  /* ───── Tripadvisor tarzı ana ekran ve profil düzeni (GUR kimliğiyle) ───── */
  .ga-nereye { font-family:'Poppins',sans-serif !important; font-size:clamp(32px,9vw,46px); font-weight:800 !important; text-align:center; margin:6px 0 18px; letter-spacing:-.04em; line-height:1.05; color:#1C1917; }
  .ga-arama { border:1.5px solid #D8D0C6; box-shadow:0 2px 6px rgba(45,36,25,.05), 0 10px 28px rgba(45,36,25,.07); padding:5px 5px 5px 18px; }
  .ga-arama .ga-temizle { width:36px; height:36px; }
  .ga-arama .ga-ara { width:auto; height:46px; padding:0 24px; border-radius:999px; background:linear-gradient(135deg,#FFA500,#FF6600 55%,#F04E00); color:#fff; font-weight:700; font-size:15px; box-shadow:0 6px 16px rgba(255,102,0,.3); flex-shrink:0; }
  .ga-hizli { display:flex; justify-content:center; gap:10px; margin:-2px 0 20px; flex-wrap:wrap; }
  .ga-hizli a { display:inline-flex; align-items:center; min-height:40px; padding:0 16px; border-radius:999px; background:#fff; border:1.5px solid #E3DCD2; font-size:13px; font-weight:700; color:#1C1917; }
  .ga-hizli a:hover { border-color:#FF6600; color:#B4530A; }
  .ga-baslik-alt { align-items:flex-end; margin-top:12px; } .ga-baslik-alt h2 { font-size:18px; letter-spacing:-.02em; } .ga-baslik-alt p { margin:3px 0 0; font-size:13px; color:#6F6459; }
  .ga-karusel { height:190px; border-radius:26px; }
  .ga-kat-kart { flex:0 0 138px; height:172px; border-radius:22px; scroll-snap-align:start; }
  .ga-kat-kart b { font-size:15px; }
  .gpr-ust { flex-direction:row; align-items:center; text-align:left; gap:18px; flex-wrap:wrap; padding:calc(22px + env(safe-area-inset-top)) 0 14px; }
  .gpr-avatar { width:92px; height:92px; font-size:34px; flex-shrink:0; }
  .gpr-kimlik { flex:1; min-width:180px; } .gpr-kimlik h1 { margin:0; font-size:24px; } .gpr-kimlik p { margin:2px 0 12px; color:#8B8177; font-size:13.5px; }
  .gpr-katki { display:flex; gap:22px; flex-wrap:wrap; } .gpr-katki span { display:grid; gap:2px; } .gpr-katki small { font-size:12px; color:#6F6459; } .gpr-katki b { font-size:26px; color:#B9B0A5; font-weight:800; line-height:1; } .gpr-katki span:first-child b { color:#1C1917; }
  .gpr-ust-eylem { display:flex; gap:8px; margin-left:auto; align-items:center; }
  .gpr-duzen { min-height:44px; padding:0 18px; border-radius:10px; border:1.5px solid #E3DCD2; background:#fff; font:inherit; font-size:14px; font-weight:700; cursor:pointer; color:#1C1917; }
  .gpr-disli { width:44px; height:44px; border-radius:10px; border:1.5px solid #E3DCD2; background:#fff; cursor:pointer; color:#1C1917; display:flex; align-items:center; justify-content:center; }
  .gpr-duzen:hover, .gpr-disli:hover { border-color:#FF6600; color:#B4530A; }
  .gpr-iki { display:grid; grid-template-columns:1fr; gap:18px; margin-top:8px; }
  .gpr-yan { display:grid; gap:16px; align-content:start; } .gpr-ana { min-width:0; }
  .gpr-panel { background:#fff; border-radius:20px; padding:20px; box-shadow:0 1px 2px rgba(45,36,25,.04), 0 8px 24px rgba(45,36,25,.05); }
  .gpr-panel h2 { margin:0 0 4px; font-size:20px; } .gpr-alt { margin:0 0 14px; font-size:13.5px; color:#6F6459; }
  .gpr-basari { display:flex; gap:12px; align-items:center; border:1.5px solid #E3DCD2; border-radius:14px; padding:12px; margin-bottom:10px; color:inherit; transition:border-color .2s, transform .5s var(--spring); }
  .gpr-basari:hover { border-color:#FF6600; transform:translateY(-1px); }
  .gpr-basari b { display:block; font-size:14.5px; } .gpr-basari small { display:block; font-size:12.5px; color:#6F6459; margin-top:2px; line-height:1.35; }
  .gpr-kilit { width:44px; height:44px; border-radius:50%; background:#F6F3EE; color:#6F6459; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:800; }
  .gpr-basari.acik { border-color:rgba(255,102,0,.45); background:linear-gradient(180deg, rgba(255,165,0,.08), #fff); } .gpr-basari.acik .gpr-kilit { background:linear-gradient(135deg,#FFA500,#FF6600); color:#fff; }
  .ga-hap.koyu { width:100%; background:#1C1917; box-shadow:none; margin-top:4px; }
  .gpr-bilgi { display:flex; align-items:center; gap:10px; margin:0; padding:11px 0; font-size:14px; color:#1C1917; border-top:1px solid rgba(0,0,0,.06); } .gpr-panel h2 + .gpr-bilgi { border-top:none; }
  @media (min-width:900px) { .gpr-iki { grid-template-columns:320px 1fr; align-items:start; } .gp-sayfa { max-width:1060px; } .ga-kat-kart { flex-basis:180px; height:210px; } .ga-karusel { height:300px; } }
  @media (max-width:520px) { .gpr-ust-eylem { margin-left:0; width:100%; } .gpr-duzen { flex:1; } }
  /* ───── Bölünmüş tanıtım banner'ı (Tripadvisor düzeni, GUR renkleri) ───── */
  .ga-karusel.ga-split { height:auto; background:linear-gradient(135deg,#FFB224,#FF7A1A 58%,#F04E00); border-radius:26px; padding:12px; overflow:hidden; box-shadow:0 2px 6px rgba(240,78,0,.14), 0 16px 36px rgba(240,78,0,.18); }
  .ga-split-slayt { display:grid; grid-template-columns:1fr; gap:12px; animation:ymGecis .55s var(--ease-out) backwards; }
  .ga-split-img { position:relative; height:176px; border-radius:18px; overflow:hidden; background:#4a2a14; }
  .ga-split-img > div:first-child { position:absolute !important; inset:0; }
  .ga-split-etiket { position:absolute; left:10px; bottom:10px; background:rgba(255,255,255,.92); border:1.5px solid #1C1917; border-radius:999px; padding:5px 12px; font-size:12.5px; font-weight:700; color:#1C1917; }
  .ga-split-yazi { padding:6px 8px 10px; } .ga-split-yazi.coklu { padding-bottom:42px; } .ga-split-yazi { color:#1C1917; display:grid; gap:8px; align-content:center; justify-items:start; }
  .ga-split-yazi h2 { margin:0; font-size:clamp(24px,6.4vw,34px); font-weight:800; letter-spacing:-.035em; line-height:1.06; color:#1C1917; }
  .ga-split-yazi p { margin:0; font-size:14.5px; line-height:1.45; color:rgba(28,25,23,.82); max-width:34ch; }
  .ga-split-cta { display:inline-flex; align-items:center; min-height:46px; padding:0 24px; border-radius:999px; background:#1C1917; color:#fff !important; -webkit-text-fill-color:#fff; font-weight:700; font-size:15px; margin-top:6px; }
  .ga-split-cta:hover { background:#000; }
  .ga-split-alt { position:absolute; right:14px; bottom:12px; display:flex; align-items:center; gap:10px; z-index:2; }
  .ga-noktalar-ic { display:flex; gap:5px; } .ga-noktalar-ic button { width:7px; height:7px; padding:0; border:none; border-radius:4px; background:rgba(28,25,23,.35); cursor:pointer; transition:width .3s var(--ease-out), background .3s; } .ga-noktalar-ic button.on { width:20px; background:#1C1917; }
  .ga-split-dur { width:30px; height:30px; border-radius:50%; border:1.5px solid #1C1917; background:transparent; color:#1C1917; font-size:10px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .ga-split .ga-reklam { top:10px; right:10px; background:rgba(0,0,0,.55); }
  @media (min-width:700px) {
    .ga-karusel.ga-split { padding:18px 22px; }
    .ga-split-slayt { grid-template-columns:1.15fr 1fr; gap:0; align-items:stretch; }
    .ga-split-img { height:300px; }
    .ga-split-yazi { padding:8px 34px 12px; border-left:1.5px solid rgba(28,25,23,.85); margin-left:24px; }
    .ga-split-yazi h2 { font-size:clamp(30px,3.2vw,44px); }
  }
`;
