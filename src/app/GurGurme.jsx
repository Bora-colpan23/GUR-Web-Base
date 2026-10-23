// GURME paneli (yerel önizleme): GUR'un gurmeleri, GURME paketi yürürlükte olan mekânlar için değerlendirme yazar.
// Gerçek sürümde bu sayfa yalnızca doğrulanmış gurme hesaplarına açık olur; yerel modda kimlik doğrulama yoktur.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from './webCtx.js';
import { PageHero, tgoPill } from './GurWeb.jsx';
import { gurmePaketiVar, gurmeYorumuEkle } from './webStore.js';
import { GURMELER } from './gelirKatalog.js';

export function GurmePage() {
  const { gelir, restaurants } = useApp();
  const uygun = restaurants.filter((r) => gurmePaketiVar(gelir, r.id));
  const [rid, setRid] = useState('');
  const [gid, setGid] = useState(GURMELER[0].id);
  const [puan, setPuan] = useState(8);
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [hata, setHata] = useState('');
  const [ok, setOk] = useState('');
  const seciliId = rid || uygun[0]?.id || '';

  const gonder = (ev) => {
    ev.preventDefault();
    const s = gurmeYorumuEkle({ restaurantId: seciliId, gurmeId: gid, puan, baslik, metin });
    if (!s.ok) { setHata(s.neden); setOk(''); return; }
    setHata(''); setOk('Değerlendirme yayınlandı.'); setBaslik(''); setMetin('');
  };

  return (
    <div>
      <PageHero light="GURME" bold="Gurme paneli" sub="GURME paketi yürürlükte olan mekânlar için değerlendirme yaz." compact />
      <div className="gw-wrap" style={{ paddingTop: 28, paddingBottom: 70, maxWidth: 720 }}>
        <p className="gw-demo" role="note"><b>Yerel önizleme.</b> Gerçek sürümde bu sayfa yalnızca doğrulanmış gurme hesaplarına açıktır. Burada herkes deneyebilir; yazılanlar yalnızca bu tarayıcıda kalır.</p>
        {uygun.length === 0 ? (
          <div className="gw-pn-kart">
            <h2>Değerlendirilecek mekân yok</h2>
            <p style={{ color: '#6F6459' }}>Bir mekân GURME paketi teklifini kabul ettiğinde burada görünür. İşletme panelinde <Link to="/doyurucu/panel?sekme=paketler" style={{ color: '#B4530A', fontWeight: 700 }}>Paketler ve reklam</Link> sekmesinden teklif isteyip kabul ederek deneyebilirsin.</p>
          </div>
        ) : (
          <form onSubmit={gonder} className="gw-pn-kart" style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700, fontSize: 13 }}>Mekân
              <select value={seciliId} onChange={(e) => setRid(e.target.value)} style={{ minHeight: 46, borderRadius: 14, border: '1.5px solid #E3DCD2', padding: '0 12px', font: 'inherit' }}>{uygun.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700, fontSize: 13 }}>Gurme
              <select value={gid} onChange={(e) => setGid(Number(e.target.value))} style={{ minHeight: 46, borderRadius: 14, border: '1.5px solid #E3DCD2', padding: '0 12px', font: 'inherit' }}>{GURMELER.map((g) => <option key={g.id} value={g.id}>{g.ad} · {g.uzmanlik}</option>)}</select></label>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700, fontSize: 13 }}>Puan: {Number(puan).toFixed(1)} / 10
              <input type="range" min={0} max={10} step={0.5} value={puan} onChange={(e) => setPuan(e.target.value)} /></label>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700, fontSize: 13 }}>Başlık (isteğe bağlı)
              <input value={baslik} onChange={(e) => setBaslik(e.target.value)} maxLength={90} style={{ minHeight: 46, borderRadius: 14, border: '1.5px solid #E3DCD2', padding: '0 12px', font: 'inherit' }} /></label>
            <label style={{ display: 'grid', gap: 6, fontWeight: 700, fontSize: 13 }}>Gerekçeli not (en az 40 karakter)
              <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={5} style={{ borderRadius: 14, border: '1.5px solid #E3DCD2', padding: 12, font: 'inherit' }} /></label>
            {hata && <p role="alert" style={{ color: '#B3261E', fontWeight: 600, margin: 0 }}>{hata}</p>}
            {ok && <p role="status" style={{ color: '#0A7C46', fontWeight: 600, margin: 0 }}>{ok} <Link to={`/restoran/${seciliId}`} style={{ color: '#B4530A' }}>Mekân sayfasında gör →</Link></p>}
            <button type="submit" style={tgoPill(true)}>Değerlendirmeyi yayınla</button>
          </form>
        )}
      </div>
    </div>
  );
}
