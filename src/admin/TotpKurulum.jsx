import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { totpSecretUret, totpDogrula, otpauthUrl } from '../lib/otp.js';

// Microsoft Authenticator (ya da herhangi bir TOTP uygulaması) ekleme: QR okut, uygulamadaki 6 haneli kodu yaz, doğrulanınca etkinleşir.
export default function TotpKurulum({ C, hesap, onTamam, onAtla }) {
  const [secret] = useState(totpSecretUret);
  const [qr, setQr] = useState('');
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState('');
  const [bekle, setBekle] = useState(false);
  useEffect(() => { QRCode.toDataURL(otpauthUrl(hesap, secret), { margin: 1, width: 200 }).then(setQr).catch(() => setQr('')); }, [hesap, secret]);

  const dogrula = async (e) => {
    e.preventDefault(); setHata('');
    if (!/^\d{6}$/.test(kod)) { setHata('Uygulamadaki 6 haneli kodu yazın.'); return; }
    setBekle(true);
    const ok = await totpDogrula(secret, kod);
    setBekle(false);
    if (!ok) { setHata('Kod hatalı. Telefonunuzun saatinin doğru olduğundan emin olun ve yeni kodu deneyin.'); setKod(''); return; }
    onTamam(secret);
  };
  const alan = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 20, letterSpacing: 6, textAlign: 'center' };
  const grup = secret.match(/.{1,4}/g).join(' ');
  return (
    <form onSubmit={dogrula} style={{ display: 'grid', gap: 14 }}>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
        <li>Telefonunuzda <b style={{ color: C.text }}>Microsoft Authenticator</b>’ı açın (Google Authenticator gibi diğer TOTP uygulamaları da olur).</li>
        <li><b style={{ color: C.text }}>+</b> → <b style={{ color: C.text }}>Diğer hesap (Google, Facebook vb.)</b> → QR kodu okutun.</li>
        <li>Uygulamada görünen 6 haneli kodu aşağıya yazın.</li>
      </ol>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {qr ? <img src={qr} alt="Authenticator için QR kod" width={160} height={160} style={{ background: '#fff', borderRadius: 12, padding: 6 }} /> : <div style={{ width: 160, height: 160, borderRadius: 12, background: C.bg }} />}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>QR okutamıyorsanız anahtarı elle girin:</div>
          <code style={{ display: 'block', fontSize: 13, color: C.text, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', wordBreak: 'break-all', userSelect: 'all' }}>{grup}</code>
          <div style={{ fontSize: 11, color: '#5A6675', marginTop: 6 }}>Bu anahtarı kimseyle paylaşmayın.</div>
        </div>
      </div>
      <input style={alan} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, ''))} aria-label="Authenticator kodu" />
      {hata && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.red }}>{hata}</p>}
      <button type="submit" disabled={bekle} style={{ minHeight: 46, borderRadius: 12, border: 'none', background: bekle ? '#3a2a20' : C.orange, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: bekle ? 'default' : 'pointer' }}>{bekle ? 'Kontrol ediliyor…' : 'Doğrula ve etkinleştir'}</button>
      {onAtla && <button type="button" onClick={onAtla} style={{ background: 'none', border: 'none', color: C.dim, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', padding: 0 }}>Şimdi değil, atla</button>}
    </form>
  );
}
