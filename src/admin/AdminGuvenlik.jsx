import React, { useState } from 'react';
import TotpKurulum from './TotpKurulum.jsx';
import { kimlikOku, kimlikYaz } from './adminKimlik.js';
import { telGizli, totpDogrula, API, TELEFON_ACIK } from '../lib/otp.js';

// Hesap güvenliği: ikinci doğrulama yöntemleri. Authenticator sonradan buradan eklenir/kaldırılır.
export default function AdminGuvenlik({ C, toast }) {
  const [k, setK] = useState(kimlikOku);
  const [kur, setKur] = useState(false);
  const [kaldir, setKaldir] = useState(false);
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState('');
  const kart = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 16 };
  const dugme = (renk, soft) => ({ padding: '9px 16px', borderRadius: 9, border: `1px solid ${renk}`, background: soft, color: renk, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 });
  if (!k) return <div style={kart}>Kimlik bulunamadı.</div>;

  const kaydet = (yeni) => { try { kimlikYaz(yeni); setK(yeni); return true; } catch { toast('Kaydedilemedi: tarayıcı depolaması kapalı olabilir', 'error'); return false; } };
  const kaldirOnayla = async (e) => {
    e.preventDefault(); setHata('');
    if (!(await totpDogrula(k.totp, kod))) { setHata('Kod hatalı.'); setKod(''); return; }
    const { totp, ...kalan } = k; // eslint-disable-line no-unused-vars
    if (kaydet(kalan)) { setKaldir(false); setKod(''); toast('Authenticator kaldırıldı'); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s', maxWidth: 720 }}>
      {TELEFON_ACIK && <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Telefon onay kodu (SMS)</h3>
        <p style={{ margin: 0, fontSize: 13, color: C.dim, lineHeight: 1.55 }}>Kayıtlı numara: <b style={{ color: C.text }}>{k.telefon ? telGizli(k.telefon) : '—'}</b>. {API ? 'Kod SMS sunucusu üzerinden gönderilir.' : 'SMS sunucusu bağlı değil; yerel önizlemede kod giriş ekranında gösterilir, SMS gitmez.'}</p>
      </div>}

      <div style={kart}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Microsoft Authenticator {k.totp && <span style={{ fontSize: 11, color: C.green, marginLeft: 8 }}>ETKİN</span>}</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: C.dim, lineHeight: 1.55 }}>Etkinken girişte SMS yerine uygulamadaki 6 haneli kod istenir (SMS yedek olarak kalır). Microsoft Authenticator ve diğer TOTP uygulamalarıyla çalışır. Gizli anahtar bu tarayıcıda saklanır; gerçek güvenlik için sunucuda tutulmalıdır.</p>
        {!k.totp && !kur && <button style={dugme(C.orange, C.orangeSoft)} onClick={() => setKur(true)}>Authenticator ekle</button>}
        {!k.totp && kur && <TotpKurulum C={C} hesap={k.kullanici} onAtla={() => setKur(false)} onTamam={(secret) => { if (kaydet({ ...k, totp: secret })) { setKur(false); toast('Authenticator etkinleştirildi'); } }} />}
        {k.totp && !kaldir && <button style={dugme(C.red, C.redSoft)} onClick={() => setKaldir(true)}>Authenticator’ı kaldır</button>}
        {k.totp && kaldir && (
          <form onSubmit={kaldirOnayla} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={6} placeholder="Mevcut kod" aria-label="Mevcut Authenticator kodu" style={{ width: 150, padding: '10px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit', letterSpacing: 3 }} />
            <button type="submit" style={dugme(C.red, C.redSoft)}>Kaldır</button>
            <button type="button" style={dugme(C.dim, 'transparent')} onClick={() => { setKaldir(false); setKod(''); setHata(''); }}>Vazgeç</button>
            {hata && <span role="alert" style={{ fontSize: 13, color: C.red }}>{hata}</span>}
          </form>
        )}
      </div>
    </div>
  );
}
