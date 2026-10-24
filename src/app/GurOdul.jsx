// Kaydırma kotası dolunca: "Mutfak kapandı" paneli + ödüllü reklam.
//
// Kurallar (uygulamayla aynı): ücretsiz 40 kaydırma; ödüllü reklamı izleyen +5 kazanır; kota dolunca ücretsiz yol (reklam) HER ZAMAN görünür
// ve "Vazgeç" her zaman açıktır. Ham kalan sayı gösterilmez.
//
// DÜRÜSTLÜK: web'de video dosyası yüklemesi yok. Reklam, "Ödüllü video" rezervasyonu onaylı restoranın fotoğraflı kartıdır;
// onaylı rezervasyon yoksa Google reklamı yer tutucusu çıkar (AdSense bağlı değil, ekranda yazar). Süre sabit 8 sn.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Img } from './GurApp.jsx';
import { useApp } from './webCtx.js';
import { QUOTA } from '../../shared/deck.js';
import { bugun } from './gelirKatalog.js';

const SURE = 8;

export function KotaPaneli({ onReklam }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', margin: 'auto', maxWidth: 380 }}>
      <span className="gw-tgo-ico" style={{ margin: '0 auto 18px' }}><Icon n="clock" size={28} color="#FF6600" /></span>
      <h2 style={{ fontSize: 24 }}>Mutfak kapandı</h2>
      <p style={{ color: '#6F6459', margin: '8px auto 22px' }}>Bugünlük kaydırma hakkın doldu. Kısa bir reklam izleyip {QUOTA.rewardBonus} kaydırma daha kazanabilir ya da yarın tekrar gelebilirsin.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        <button type="button" className="ga-hap" onClick={onReklam}>Reklam izle, {QUOTA.rewardBonus} kaydırma kazan</button>
        <Link to="/favoriler" className="ga-hap ghost">Favorilerim</Link>
      </div>
    </div>
  );
}

export function OdulluReklam({ onBitir, onKapat }) {
  const { depo, gelir, restaurants } = useApp();
  const [kalan, setKalan] = useState(SURE);

  const reklam = useMemo(() => {
    const g = bugun();
    const gorulen = new Set((depo.videoGorulen || []).map(String));
    for (const b of gelir.rezervasyonlar) {
      if (b.urun !== 'rewardedAds' || b.durum !== 'onaylandi' || b.baslangic > g || g > b.bitis || gorulen.has(String(b.id))) continue;
      const r = restaurants.find((x) => String(x.id) === String(b.restaurantId));
      if (r) return { id: b.id, r };
    }
    return { id: 'google-yedek', r: null };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps  (reklam açılırken bir kez seçilir)

  useEffect(() => {
    if (kalan <= 0) return undefined;
    const t = setTimeout(() => setKalan((k) => k - 1), 1000);
    return () => clearTimeout(t);
  }, [kalan]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onKapat();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onKapat]);

  const { r } = reklam;
  return (
    <div className="ga-modal" role="dialog" aria-modal="true" aria-label="Ödüllü reklam" style={{ background: 'rgba(10,8,6,.92)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#2A140C', borderRadius: 24, overflow: 'hidden', color: '#fff' }}>
        <div style={{ position: 'relative', height: 260, background: '#2c1810' }}>
          {r && <Img src={r.imgs?.[0]} style={{ width: '100%', height: '100%' }} bg="#2c1810" />}
          <span className="ga-perde" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent 60%)' }} />
          <span style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '.5px' }}>REKLAM</span>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16 }}>
            {r ? <><b style={{ fontSize: 20, display: 'block' }}>{r.name}</b><small style={{ opacity: .8 }}>{r.cat}{r.rating ? ` · ★ ${r.rating}` : ''}</small></>
              : <><b style={{ fontSize: 18, display: 'block' }}>Örnek reklam alanı</b><small style={{ opacity: .8 }}>Google reklamı henüz bağlı değil; bu bir yer tutucudur.</small></>}
          </div>
        </div>
        <div style={{ padding: 18, display: 'grid', gap: 10 }}>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }} aria-hidden><div style={{ height: '100%', width: `${((SURE - kalan) / SURE) * 100}%`, background: '#FF6600', transition: 'width 1s linear' }} /></div>
          <button type="button" className="ga-hap" disabled={kalan > 0} style={kalan > 0 ? { background: 'rgba(255,255,255,.12)', boxShadow: 'none', cursor: 'default' } : undefined} onClick={() => onBitir(reklam.id)}>
            {kalan > 0 ? `Ödül için ${kalan} sn` : `Ödülü al: +${QUOTA.rewardBonus} kaydırma`}
          </button>
          <button type="button" className="ga-hap ghost" onClick={onKapat} style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>Vazgeç</button>
        </div>
      </div>
    </div>
  );
}
