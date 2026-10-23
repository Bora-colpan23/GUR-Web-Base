// İşletme tarafı gelir modeli: panelde "Hizmetlerimiz" (tüm hizmetler tek yerde, tek tuşla talep/teklif).
// Yerel önizleme: yönetim kararları (reklam onayı, teklif) panelde AÇIKÇA etiketli düğmelerle simüle edilir.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './GurApp.jsx';
import { useApp } from './webCtx.js';
import { tgoPill } from './GurWeb.jsx';
import { reklamTalebi, reklamKarar, hizmetTalebiEkle, teklifGonder, teklifKarar, kampanyaAc, kampanyaKarar, bannerGorselYukle } from './webStore.js';
import { gorselKucult } from './gorsel.js';
import { KAMPANYA, AD_PRODUCTS, AD_KEYS, PAKETLER, PAKET_BY_KEY, TL, bugun, kelepce, bitisGunu, toplamTutar } from './gelirKatalog.js';

const tarih = (iso) => { try { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; } catch { return iso; } };
const DURUM = { bekliyor: 'Yönetim onayı bekliyor', onaylandi: 'Onaylandı · slot kilitli', reddedildi: 'Reddedildi', acik: 'Teklif bekleniyor', teklif: 'Teklif geldi', kapandi: 'Paket yürürlükte', kabul: 'Kabul edildi', ret: 'Reddedildi' };

export function PaketlerSekmesi({ r }) {
  const { gelir } = useApp();
  const [urun, setUrun] = useState('bannerAds');
  const [bas, setBas] = useState(bugun());
  const [gun, setGun] = useState(3);
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');
  const p = AD_PRODUCTS[urun]; const n = kelepce(urun, gun);
  const rezler = gelir.rezervasyonlar.filter((x) => String(x.restaurantId) === String(r.id));
  const talepler = gelir.hizmetTalepleri.filter((x) => String(x.restaurantId) === String(r.id));
  const teklifler = gelir.teklifler.filter((x) => String(x.restaurantId) === String(r.id));
  const kampanyaVar = gelir.kampanyalar.some((x) => String(x.restaurantId) === String(r.id) && ['bekliyor', 'aktif', 'duraklatildi'].includes(x.durum)) ? 'Açık kampanyan var' : '';
  const formaGit = (k) => { setUrun(k); setHata(''); setBilgi(''); setTimeout(() => document.getElementById('pk-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };
  const reklamDurum = (k) => { const l = rezler.filter((x) => x.urun === k && x.durum !== 'reddedildi'); return l.length ? (l.some((x) => x.durum === 'onaylandi') ? 'Onaylı rezervasyonun var' : 'Onay bekleyen talebin var') : ''; };

  const gonder = (ev) => {
    ev.preventDefault(); setBilgi('');
    const s = reklamTalebi({ restaurantId: r.id, ad: r.name, urun, baslangic: bas, gun: n });
    if (!s.ok) { setHata(s.neden); return; }
    setHata(''); setBilgi('Talebin yönetime iletildi. Onaylanmadan slot kilitlenmez ve hiçbir tutar tahsil edilmez.');
  };
  const teklifIste = (hizmet) => {
    const s = hizmetTalebiEkle({ restaurantId: r.id, ad: r.name, hizmet });
    if (!s.ok) { setHata(s.neden); setBilgi(''); } else { setHata(''); setBilgi('Teklif talebin alındı. GUR fiyatlayıp sana teklif gönderecek; kabul etmek zorunda değilsin.'); }
  };

  return (
    <>
      <p className="gw-demo" role="note" style={{ margin: '0 0 16px' }}><b>Yönetim onayı.</b> Reklam talepleri ve teklifler GUR yönetim panelindeki Onay Kuyruğu'nda karara bağlanır. Karar verilince burada görünür.</p>

      <section className="gw-pn-kart" id="pk-hizmetler">
        <h2>Hizmetlerimiz</h2>
        <p className="pk-giris">Mekânınızı öne çıkarmak için isteğe bağlı hizmetler. Abonelik ve rezervasyon komisyonu yoktur; yalnızca seçtiğiniz kalem için ödeme yapılır ve hiçbir şey kendiliğinden satın alınmaz.</p>

        <h3 className="pk-alt-baslik">Sabit fiyatlı reklamlar <small>tarihi siz seçersiniz, yönetim onaylar</small></h3>
        <div className="pk-grid">
          {AD_KEYS.map((k) => { const a = AD_PRODUCTS[k]; const d = reklamDurum(k); return (
            <div key={k} className="pk-kart"><Icon n={a.ikon} size={22} color="#FF6600" /><b>{a.ad}</b>
              <strong>{TL(a.gunluk)}<small> / {a.birim}</small></strong><span>{a.kural}</span><p>{a.aciklama}</p>
              {d && <em className="pk-durum">{d}</em>}
              <button type="button" className="pk-eylem" onClick={() => formaGit(k)}>Tarih seç ve talep et</button>
            </div>
          ); })}
        </div>

        <h3 className="pk-alt-baslik">Sponsorlu kart <small>kaydırma akışında, tıklama ya da etkileşim başı ödeme</small></h3>
        <div className="pk-grid">
          <div className="pk-kart"><Icon n="star" size={22} color="#FF6600" /><b>Sponsorlu kart kampanyası</b>
            <strong>Teklifini sen verirsin<small> · bütçe sana ait</small></strong>
            <p>Mekânınız kaydırma ekranında organik kartların arasına “Sponsorlu” etiketiyle karışır. Tıklama (CPC) ya da kaydetme (CPE) başı teklif verirsin, bütçe bitince kampanya durur.</p>
            {kampanyaVar && <em className="pk-durum">{kampanyaVar}</em>}
            <Link to="/doyurucu/panel?sekme=kampanya" className="pk-eylem">Kampanya aç</Link>
          </div>
        </div>

        <h3 className="pk-alt-baslik">Teklifle satılan paketler <small>teklif istersin, GUR fiyatlar, kabul ya da ret sana aittir</small></h3>
        <div className="pk-grid">
          {PAKETLER.map((pk) => {
            const acik = talepler.find((t) => t.hizmet === pk.key && (t.durum === 'acik' || t.durum === 'teklif'));
            const yururlukte = teklifler.some((t) => t.hizmet === pk.key && t.durum === 'kabul');
            return (
              <div key={pk.key} className="pk-kart"><Icon n={pk.ikon} size={22} color="#FF6600" /><b>{pk.ad}</b>
                <strong>{pk.liste ? <>{TL(pk.liste)}<small> {pk.birim} · başlangıç</small></> : <>Teklifle<small> · liste fiyatı yok</small></>}</strong>
                <p>{pk.aciklama}</p>
                {yururlukte ? <em className="pk-durum ok">Paket yürürlükte</em>
                  : acik ? <em className="pk-durum">{DURUM[acik.durum]}</em>
                  : <button type="button" className="pk-eylem" onClick={() => teklifIste(pk.key)}>Teklif iste</button>}
              </div>
            );
          })}
        </div>
        {hata && <p role="alert" className="pk-hata">{hata}</p>}
        {bilgi && <p role="status" className="pk-ok">{bilgi}</p>}
      </section>

      <section className="gw-pn-kart">
        <h2>Reklam talebi (sabit fiyat)</h2>
        <form onSubmit={gonder} className="pk-form" id="pk-form">
          <label>Ürün
            <select value={urun} onChange={(e) => { setUrun(e.target.value); setHata(''); setBilgi(''); }}>{AD_KEYS.map((k) => <option key={k} value={k}>{AD_PRODUCTS[k].ad} · {TL(AD_PRODUCTS[k].gunluk)}/gün</option>)}</select></label>
          <label>Başlangıç günü<input type="date" min={bugun()} value={bas} onChange={(e) => { setBas(e.target.value); setHata(''); }} required /></label>
          <label>Gün sayısı (en fazla {p.maksGun})<input type="number" min={1} max={p.maksGun} value={gun} onChange={(e) => setGun(e.target.value)} /></label>
          <div className="pk-ozet"><span>{tarih(bas)} – {tarih(bitisGunu(urun, bas, n))} · {n} gün</span><b>{TL(toplamTutar(urun, n))}</b></div>
          <p className="pk-kural">{p.kural}{p.ozel ? ' Aynı günler iki restorana satılmaz.' : ''}</p>
          <button type="submit" style={tgoPill(true, { padding: '12px 24px' })}>Talep gönder</button>
        </form>
        {hata && <p role="alert" className="pk-hata">{hata}</p>}
        {bilgi && <p role="status" className="pk-ok">{bilgi}</p>}
      </section>


      {(rezler.length > 0 || talepler.length > 0 || teklifler.length > 0) && (
        <section className="gw-pn-kart">
          <h2>Taleplerim ve tekliflerim</h2>
          {rezler.map((x) => (
            <div key={x.id} className="pk-satir">
              <div style={{ flex: 1 }}><b>{AD_PRODUCTS[x.urun].ad}</b><div className="pk-alt2">{tarih(x.baslangic)} – {tarih(x.bitis)} · {x.gun} gün · {TL(x.tutar)}</div></div>
              <span className={`gw-durum ${x.durum === 'onaylandi' ? 'ok' : ''}`}>{DURUM[x.durum]}</span>
              {x.urun === 'bannerAds' && x.durum === 'onaylandi' && <BannerGorsel x={x} />}
            </div>
          ))}
          {talepler.filter((t) => t.durum === 'acik').map((t) => (
            <div key={t.id} className="pk-satir">
              <div style={{ flex: 1 }}><b>{PAKET_BY_KEY[t.hizmet].ad}</b><div className="pk-alt2">Teklif talebi</div></div>
              <span className="gw-durum">{DURUM.acik}</span>
            </div>
          ))}
          {teklifler.map((t) => (
            <div key={t.id} className="pk-satir">
              <div style={{ flex: 1 }}><b>{PAKET_BY_KEY[t.hizmet].ad}</b><div className="pk-alt2">Teklif: {TL(t.tutar)} · kabul etmek zorunda değilsin</div></div>
              {t.durum === 'bekliyor' ? <>
                <button type="button" style={tgoPill(true, { padding: '9px 18px', fontSize: 14 })} onClick={() => teklifKarar(t.id, 'kabul')}>Kabul et</button>
                <button type="button" style={tgoPill(false, { padding: '9px 18px', fontSize: 14 })} onClick={() => teklifKarar(t.id, 'ret')}>Reddet</button>
              </> : <span className={`gw-durum ${t.durum === 'kabul' ? 'ok' : ''}`}>{DURUM[t.durum]}</span>}
            </div>
          ))}
        </section>
      )}
      <style>{`
        .pk-giris { margin:0 0 18px; color:#4A443E; font-size:14.5px; line-height:1.55; max-width:70ch; }
        .pk-alt-baslik { margin:22px 0 12px; font-size:17px; } .pk-alt-baslik small { font-size:12.5px; color:#6F6459; font-weight:500; margin-left:8px; }
        .pk-eylem { display:inline-flex; align-items:center; justify-content:center; align-self:flex-start; margin-top:auto; min-height:44px; padding:0 20px; border-radius:999px; border:none; background:linear-gradient(135deg,#FF7A1A,#F04E00); color:#fff !important; font:inherit; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 6px 16px rgba(255,102,0,.25); }
        .pk-durum { align-self:flex-start; font-style:normal; font-size:12.5px; font-weight:700; color:#8A5200; background:rgba(255,165,0,.2); border-radius:999px; padding:4px 12px; } .pk-durum.ok { color:#0A7C46; background:rgba(34,197,94,.12); }
        .pk-kart { box-shadow:0 1px 2px rgba(0,0,0,.03), 0 8px 24px rgba(0,0,0,.05); }        .pk-form { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; align-items:end; } .pk-form label { display:grid; gap:6px; font-size:13px; font-weight:700; color:#4A443E; }
        .pk-form select, .pk-form input { min-height:46px; border-radius:14px; border:1.5px solid #E3DCD2; padding:0 12px; font:inherit; background:#fff; }
        .pk-ozet { display:flex; justify-content:space-between; gap:10px; background:#FBF7F1; border-radius:14px; padding:12px 14px; grid-column:1/-1; } .pk-ozet b { color:#B4530A; font-size:18px; }
        .pk-kural, .pk-alt2 { font-size:13px; color:#6F6459; margin:0; } .pk-hata { color:#B3261E; font-weight:600; margin:12px 0 0; } .pk-ok { color:#0A7C46; font-weight:600; margin:12px 0 0; }
        .pk-liste { display:grid; gap:10px; } .pk-satir { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px 0; border-top:1px solid rgba(45,36,25,.08); }
        .pk-sim { border:1.5px dashed #B4530A; background:transparent; color:#B4530A; border-radius:999px; padding:8px 14px; font:inherit; font-size:12.5px; font-weight:700; cursor:pointer; }
        .pk-grup { margin-bottom:34px; } .pk-grup h3 { font-size:22px; margin:0 0 4px; } .pk-grup > p { margin:0 0 16px; color:#4A443E; }
        .pk-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:16px; }
        .pk-kart { background:#fff; border-radius:22px; padding:22px; display:flex; flex-direction:column; gap:6px; cursor:default; border-top:4px solid #FFA500; }
        .pk-kart strong { font-size:26px; font-family:'Poppins',sans-serif; } .pk-kart strong small { font-size:13px; color:#6F6459; font-weight:500; } .pk-kart span { font-size:13px; color:#8A5200; font-weight:600; } .pk-kart p { margin:4px 0 0; color:#4A443E; font-size:14px; line-height:1.55; }
        .pk-alt { text-align:center; color:#6F6459; font-size:14px; max-width:640px; margin:0 auto 22px; }
      `}</style>
    </>
  );
}

// ───────── Sponsorlu kartlar: kaydırma akışına karışan kampanya (açık artırma) ─────────
const K_DURUM = { bekliyor: 'Yönetim onayı bekliyor', aktif: 'Yayında', duraklatildi: 'Duraklatıldı', reddedildi: 'Reddedildi', bitti: 'Bütçe bitti' };

export function KampanyaSekmesi({ r }) {
  const { gelir } = useApp();
  const [fiyatlama, setFiyatlama] = useState('cpc');
  const [teklif, setTeklif] = useState(2);
  const [butce, setButce] = useState(500);
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');
  const liste = gelir.kampanyalar.filter((k) => String(k.restaurantId) === String(r.id));
  const gonder = (ev) => {
    ev.preventDefault();
    const s = kampanyaAc({ restaurantId: r.id, ad: r.name, fiyatlama, teklif, butce });
    if (!s.ok) { setHata(s.neden); setBilgi(''); return; }
    setHata(''); setBilgi('Kampanya yönetime iletildi. Onaylanınca kaydırma akışına karışmaya başlar; hiçbir tutar kendiliğinden tahsil edilmez.');
  };
  return (
    <>
      <p className="gw-demo" role="note" style={{ margin: '0 0 16px' }}><b>Yönetim onayı.</b> Kampanyalar yönetim panelindeki Onay Kuyruğu'ndan onaylanır. Tahsilat yok: harcama, bu tarayıcıdaki gösterim ve tıklama sayımıdır.</p>
      <section className="gw-pn-kart">
        <h2>Sponsorlu kart kampanyası</h2>
        <p style={{ color: '#6F6459', margin: '0 0 14px', fontSize: 14, lineHeight: 1.55 }}>Mekânınız, kaydırma ekranında organik kartların arasına <b>“Sponsorlu”</b> etiketiyle karışır (her 5–7 kartta bir; aynı kullanıcıya bir kez). Sıralama teklif × kalite ile yapılır: yalnızca yüksek teklif yetmez, kartınızın ilgi görmesi de önemlidir.</p>
        <form onSubmit={gonder} className="pk-form">
          <label>Ödeme türü
            <select value={fiyatlama} onChange={(e) => setFiyatlama(e.target.value)}>
              <option value="cpc">Tıklama başı (CPC): detay açıldığında</option>
              <option value="cpe">Etkileşim başı (CPE): kaydedildiğinde</option>
            </select></label>
          <label>Teklif (₺ / {fiyatlama === 'cpc' ? 'tıklama' : 'etkileşim'})<input type="number" min={KAMPANYA.minTeklif} step="0.5" value={teklif} onChange={(e) => setTeklif(e.target.value)} /></label>
          <label>Toplam bütçe (₺)<input type="number" min={KAMPANYA.minButce} step="50" value={butce} onChange={(e) => setButce(e.target.value)} /></label>
          <div className="pk-ozet"><span>En fazla yaklaşık {Math.floor(Number(butce) / Math.max(Number(teklif), 0.01)) || 0} {fiyatlama === 'cpc' ? 'tıklama' : 'etkileşim'}</span><b>{TL(Number(butce) || 0)}</b></div>
          <p className="pk-kural">Alt sınırlar: teklif {TL(KAMPANYA.minTeklif)}, bütçe {TL(KAMPANYA.minButce)} (tasarım varsayımı). Bütçe bitince kampanya kendiliğinden durur.</p>
          <button type="submit" style={tgoPill(true, { padding: '12px 24px' })}>Kampanya aç</button>
        </form>
        {hata && <p role="alert" className="pk-hata">{hata}</p>}
        {bilgi && <p role="status" className="pk-ok">{bilgi}</p>}
      </section>

      {liste.length > 0 && (
        <section className="gw-pn-kart">
          <h2>Kampanyalarım</h2>
          {liste.map((k) => (
            <div key={k.id} className="pk-satir" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <b>{k.fiyatlama === 'cpc' ? 'Tıklama başı' : 'Etkileşim başı'} · {TL(k.teklif)}</b>
                <div className="pk-alt2">Harcanan {TL(k.harcanan)} / {TL(k.butce)}</div>
                <div className="pk-alt2">{k.gosterim} gösterim · {k.tik} tıklama · {k.etkilesim} kaydetme</div>
              </div>
              <span className={`gw-durum ${k.durum === 'aktif' ? 'ok' : ''}`}>{K_DURUM[k.durum]}</span>
              {k.durum === 'aktif' && <button type="button" style={tgoPill(false, { padding: '9px 18px', fontSize: 14 })} onClick={() => kampanyaKarar(k.id, 'duraklatildi')}>Duraklat</button>}
              {k.durum === 'duraklatildi' && <button type="button" style={tgoPill(true, { padding: '9px 18px', fontSize: 14 })} onClick={() => kampanyaKarar(k.id, 'aktif')}>Sürdür</button>}
            </div>
          ))}
        </section>
      )}
    </>
  );
}

// Onaylı banner günleri için görsel: yüklenince yönetici onayına düşer, onaylanmadan Keşfet'te kullanılmaz.
function BannerGorsel({ x }) {
  const [hata, setHata] = useState('');
  const yukle = async (e) => {
    const d = e.target.files?.[0]; if (!d) return;
    try { setHata(''); bannerGorselYukle(x.id, await gorselKucult(d)); } catch (err) { setHata(err.message || 'Yüklenemedi'); }
    e.target.value = '';
  };
  const durum = x.gorselDurum === 'onaylandi' ? 'Görsel onaylandı · yayında' : x.gorselDurum === 'bekliyor' ? 'Görsel yönetim onayında' : x.gorselDurum === 'reddedildi' ? `Görsel reddedildi${x.gorselNot ? `: ${x.gorselNot}` : ''}` : 'Görsel yüklenmedi (mekân fotoğrafı kullanılır)';
  return (
    <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 6 }}>
      {x.gorsel && <img src={x.gorsel} alt="" style={{ width: 96, height: 52, objectFit: 'cover', borderRadius: 8 }} />}
      <span className="pk-alt2">{durum}</span>
      <label className="pk-sim" style={{ cursor: 'pointer' }}>{x.gorsel ? 'Görseli değiştir' : 'Banner görseli yükle'}<input type="file" accept="image/*" onChange={yukle} style={{ display: 'none' }} /></label>
      {hata && <span role="alert" className="pk-hata" style={{ margin: 0 }}>{hata}</span>}
    </div>
  );
}
