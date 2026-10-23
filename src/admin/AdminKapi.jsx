import React, { useEffect, useRef, useState } from 'react';
import GurAdmin from './GurAdmin.jsx';
import TotpKurulum from './TotpKurulum.jsx';
import { ANAHTAR, OTURUM, kimlikOku, kimlikYaz } from './adminKimlik.js';
import { API, TELEFON_ACIK, KOD_OMRU, YENIDEN, HAK, ITER, ozet, tuzUret, telNormal, telGizli, smsGonder, smsDogrula, totpDogrula } from '../lib/otp.js';

// Yönetici paneli kapısı: kullanıcı adı + şifre + ikinci adım (telefon SMS kodu YA DA Microsoft Authenticator kodu).
// Altyapı src/lib/otp.js içinde, işletme girişiyle ortak. DÜRÜSTLÜK notları orada: SMS için sunucu gerekir (yoksa kod ekranda etiketli
// gösterilir, SMS gitmez); Authenticator gerçekten çalışır ama gizli anahtar bu tarayıcıda saklanır. Hiçbiri gerçek güvenlik DEĞİLDİR.
// Varsayılan kullanıcı adı/şifre/telefon yoktur: ilk açılışta yönetici kendi bilgisini belirler.

const oturumVar = () => { try { return sessionStorage.getItem(OTURUM) === '1'; } catch { return false; } };
const C = { bg: '#0E1117', panel: '#161B22', border: '#242C3A', text: '#E6EDF3', dim: '#8B98A9', orange: '#FF6600', red: '#F85149', green: '#3FB950' };

export default function AdminKapi() {
  const [kimlik, setKimlik] = useState(kimlikOku);
  const [acik, setAcik] = useState(oturumVar);
  const [kullanici, setKullanici] = useState('');
  const [sifre, setSifre] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [telefon, setTelefon] = useState('');
  const [hata, setHata] = useState('');
  const [bekle, setBekle] = useState(false);
  const [yanlis, setYanlis] = useState(0);
  const [kilit, setKilit] = useState(0);
  const [adim, setAdim] = useState('form');            // 'form' | 'kod' (SMS) | 'totp' (Authenticator) | 'totpKur'
  const [kod, setKod] = useState('');
  const [yerelKod, setYerelKod] = useState('');        // yalnızca yerel önizlemede; sunucu varsa HİÇ tutulmaz
  const [kalanSure, setKalanSure] = useState(0);
  const [yenidenSure, setYenidenSure] = useState(0);
  const [kodHak, setKodHak] = useState(HAK);
  const bekleyen = useRef(null);                       // { tur: 'kurulum'|'giris', telefon, yeni? }

  useEffect(() => {
    if (kilit <= 0) return undefined;
    const t = setTimeout(() => setKilit((k) => k - 1), 1000);
    return () => clearTimeout(t);
  }, [kilit]);
  useEffect(() => {
    if (adim !== 'kod') return undefined;
    const t = setInterval(() => { setKalanSure((k) => Math.max(0, k - 1)); setYenidenSure((k) => Math.max(0, k - 1)); }, 1000);
    return () => clearInterval(t);
  }, [adim]);

  const sifirla = () => { setAdim('form'); setSifre(''); setTekrar(''); setKod(''); setHata(''); bekleyen.current = null; };
  const cikis = () => { try { sessionStorage.removeItem(OTURUM); } catch { /* yoksay */ } setAcik(false); sifirla(); };
  const girisYap = () => { try { sessionStorage.setItem(OTURUM, '1'); } catch { /* yoksay */ } bekleyen.current = null; setYerelKod(''); setAcik(true); };
  if (acik && kimlik && adim !== 'totpKur') return <GurAdmin onCikis={cikis} />;

  const kurulum = !kimlik;

  const smsIste = async (tel) => {
    setHata(''); setKod(''); setKodHak(HAK);
    const s = await smsGonder(tel);
    if (!s.ok) { setHata(s.neden); return false; }
    setYerelKod(s.yerelKod); setKalanSure(KOD_OMRU); setYenidenSure(YENIDEN); setAdim('kod');
    return true;
  };

  const gonder = async (e) => {
    e.preventDefault(); setHata('');
    if (!window.crypto?.subtle) { setHata('Bu tarayıcı güvenli bağlantı gerektiriyor (https ya da localhost).'); return; }
    if (kurulum) {
      const tel = TELEFON_ACIK ? telNormal(telefon) : null;
      if (kullanici.trim().length < 3) { setHata('Kullanıcı adı en az 3 karakter olmalı.'); return; }
      if (sifre.length < 8) { setHata('Şifre en az 8 karakter olmalı.'); return; }
      if (sifre !== tekrar) { setHata('Şifreler aynı değil.'); return; }
      if (TELEFON_ACIK && !tel) { setHata('Geçerli bir cep telefonu yazın (5XX XXX XX XX).'); return; }
      setBekle(true);
      const tuz = tuzUret();
      const yeni = { kullanici: kullanici.trim(), ...(tel ? { telefon: tel } : {}), tuz, iter: ITER, hash: await ozet(sifre, tuz) };
      if (!TELEFON_ACIK) {   // telefon doğrulaması kapalı: hesap hemen kurulur
        try { kimlikYaz(yeni); sessionStorage.setItem(OTURUM, '1'); } catch { setBekle(false); setHata('Kimlik bu tarayıcıya kaydedilemedi (depolama kapalı olabilir).'); return; }
        setKimlik(yeni); setAcik(true); setAdim('totpKur'); setBekle(false); return;
      }
      bekleyen.current = { tur: 'kurulum', telefon: tel, yeni };
      await smsIste(tel); setBekle(false); return;
    }
    if (kilit > 0) return;
    setBekle(true);
    const hh = await ozet(sifre, kimlik.tuz, kimlik.iter);
    const dogruAd = kullanici.trim().toLowerCase() === kimlik.kullanici.toLowerCase();
    if (dogruAd && hh === kimlik.hash) {
      setYanlis(0);
      if (kimlik.totp) { bekleyen.current = { tur: 'giris', telefon: kimlik.telefon }; setKod(''); setKodHak(HAK); setAdim('totp'); setBekle(false); return; }   // Authenticator varsa ikinci adım odur
      if (!TELEFON_ACIK) { setBekle(false); girisYap(); return; }   // telefon doğrulaması kapalı
      if (!kimlik.telefon) { setBekle(false); setTelefon(''); setAdim('telefonEkle'); return; }   // telefon eklenmeden önce kurulmuş eski hesap: telefonu şimdi ekle
      bekleyen.current = { tur: 'giris', telefon: kimlik.telefon };
      await smsIste(kimlik.telefon); setBekle(false); return;
    }
    setBekle(false);
    const n = yanlis + 1; setYanlis(n); setSifre('');
    if (n >= 5) { setKilit(30); setYanlis(0); setHata('Çok fazla hatalı deneme. 30 saniye bekleyin.'); } else setHata('Kullanıcı adı ya da şifre hatalı.');
  };

  const hakDus = () => {
    const kalan = kodHak - 1; setKodHak(kalan); setKod('');
    if (kalan <= 0) { sifirla(); setHata('Kod 3 kez yanlış girildi. Baştan başlayın.'); } else setHata(`Kod hatalı. ${kalan} hakkınız kaldı.`);
  };

  const smsDogrulaGonder = async (e) => {
    e.preventDefault(); setHata('');
    const b = bekleyen.current; if (!b) { setAdim('form'); return; }
    if (kalanSure <= 0) { setHata('Kodun süresi doldu. Yeni kod isteyin.'); return; }
    if (!/^\d{6}$/.test(kod)) { setHata('6 haneli kodu yazın.'); return; }
    setBekle(true);
    const dogru = await smsDogrula(b.telefon, kod, yerelKod);
    setBekle(false);
    if (dogru === null) { setHata('Doğrulama sunucusuna ulaşılamadı.'); return; }
    if (!dogru) { hakDus(); return; }
    if (b.tur === 'telefonEkle') {
      const yeni = { ...kimlik, telefon: b.telefon };
      try { kimlikYaz(yeni); } catch { setHata('Kimlik bu tarayıcıya kaydedilemedi (depolama kapalı olabilir).'); return; }
      setKimlik(yeni); girisYap(); return;
    }
    if (b.tur === 'kurulum') {
      try { kimlikYaz(b.yeni); } catch { setHata('Kimlik bu tarayıcıya kaydedilemedi (depolama kapalı olabilir).'); return; }
      setKimlik(b.yeni); try { sessionStorage.setItem(OTURUM, '1'); } catch { /* yoksay */ }
      setAcik(true); setAdim('totpKur'); setYerelKod(''); return;   // kurulumdan sonra isteğe bağlı Authenticator
    }
    girisYap();
  };

  const totpGonder = async (e) => {
    e.preventDefault(); setHata('');
    if (!/^\d{6}$/.test(kod)) { setHata('Authenticator uygulamasındaki 6 haneli kodu yazın.'); return; }
    setBekle(true);
    const ok = await totpDogrula(kimlik.totp, kod);
    setBekle(false);
    if (!ok) { hakDus(); return; }
    girisYap();
  };

  const alan = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: "'Poppins',system-ui,sans-serif", fontSize: 15 };
  const et = { display: 'grid', gap: 6, fontSize: 12, fontWeight: 600, color: C.dim };
  const dk = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const birincil = (pasif) => ({ minHeight: 48, borderRadius: 12, border: 'none', background: pasif ? '#3a2a20' : C.orange, color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: pasif ? 'default' : 'pointer' });
  const baglanti = (pasif) => ({ background: 'none', border: 'none', color: pasif ? '#5A6675' : C.orange, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: pasif ? 'default' : 'pointer', padding: 0 });
  const kart = { width: '100%', maxWidth: 420, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, display: 'grid', gap: 16 };
  const logo = <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 12, padding: '6px 14px', fontSize: 24, fontWeight: 900, letterSpacing: -1 }}><span style={{ color: '#FFA500' }}>G</span><span style={{ color: '#FF6600' }}>U</span><span style={{ color: '#FF0000' }}>R</span></div>;
  const sayfa = (icerik) => <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Poppins',system-ui,sans-serif" }}>{icerik}</div>;
  const baslik = (h, p) => <div>{logo}<h1 style={{ margin: '16px 0 4px', fontSize: 20 }}>{h}</h1><p style={{ margin: 0, fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{p}</p></div>;
  const kodAlani = (deger, ayarla) => <input style={{ ...alan, letterSpacing: 6, fontSize: 20, textAlign: 'center' }} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={deger} onChange={(e) => ayarla(e.target.value.replace(/\D/g, ''))} aria-label="Onay kodu" />;

  if (adim === 'telefonEkle') {
    const ekle = async (e) => { e.preventDefault(); setHata(''); const tel = telNormal(telefon); if (!tel) { setHata('Geçerli bir cep telefonu yazın (5XX XXX XX XX).'); return; } setBekle(true); bekleyen.current = { tur: 'telefonEkle', telefon: tel }; await smsIste(tel); setBekle(false); };
    return sayfa(
      <form onSubmit={ekle} style={kart}>
        {baslik('Telefon ekleyin', 'Şifreniz doğru. Bu hesap telefon doğrulaması eklenmeden önce kurulmuş; onay kodunun gideceği cep telefonunu şimdi ekleyin.')}
        <label style={et}>Cep telefonu<input style={alan} type="tel" inputMode="tel" placeholder="5XX XXX XX XX" autoFocus value={telefon} onChange={(e) => setTelefon(e.target.value)} /></label>
        {hata && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.red }}>{hata}</p>}
        <button type="submit" disabled={bekle} style={birincil(bekle)}>{bekle ? 'Kontrol ediliyor…' : 'Devam: telefonu doğrula'}</button>
        <button type="button" onClick={sifirla} style={{ ...baglanti(false), color: C.dim, fontWeight: 400 }}>Geri dön</button>
      </form>,
    );
  }

  if (adim === 'totpKur') {
    return sayfa(
      <div style={kart}>
        {baslik('Microsoft Authenticator ekle', 'İsteğe bağlı ama önerilir: girişte SMS yerine uygulamadaki kodu kullanırsınız. Sonradan Güvenlik sayfasından da ekleyebilirsiniz.')}
        <TotpKurulum C={C} hesap={kimlik.kullanici} onAtla={() => setAdim('form')}
          onTamam={(secret) => { const k = { ...kimlik, totp: secret }; try { kimlikYaz(k); } catch { /* yoksay */ } setKimlik(k); setAdim('form'); }} />
      </div>,
    );
  }

  if (adim === 'totp') {
    return sayfa(
      <form onSubmit={totpGonder} style={kart}>
        {baslik('Authenticator kodu', 'Microsoft Authenticator uygulamasını açın ve GUR hesabının 6 haneli kodunu yazın.')}
        {kodAlani(kod, setKod)}
        {hata && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.red }}>{hata}</p>}
        <button type="submit" disabled={bekle} style={birincil(bekle)}>{bekle ? 'Kontrol ediliyor…' : 'Doğrula ve gir'}</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          {TELEFON_ACIK && kimlik.telefon ? <button type="button" onClick={() => smsIste(bekleyen.current.telefon)} style={baglanti(false)}>Telefona SMS kodu gönder</button> : <span />}
          <button type="button" onClick={sifirla} style={{ ...baglanti(false), color: C.dim, fontWeight: 400 }}>Geri dön</button>
        </div>
      </form>,
    );
  }

  if (adim === 'kod') {
    const tel = bekleyen.current?.telefon || '';
    return sayfa(
      <form onSubmit={smsDogrulaGonder} style={kart}>
        {baslik('Telefon onay kodu', API ? `Telefonunuza (${telGizli(tel)}) 6 haneli bir kod SMS ile gönderildi.` : `Telefon (${telGizli(tel)}) için 6 haneli kod üretildi.`)}
        {!API && (
          <div role="note" style={{ border: `1px dashed ${C.orange}`, borderRadius: 12, padding: 14, background: 'rgba(255,102,0,.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, letterSpacing: '.04em' }}>YEREL ÖNİZLEME · SMS GÖNDERİLMEDİ</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, margin: '6px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{yerelKod}</div>
            <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>SMS sağlayıcısı bağlı olmadığı için kod burada gösteriliyor. Bu bir güvenlik önlemi değil, akışın gösterimidir.</div>
          </div>
        )}
        <label style={et}>Onay kodu{kodAlani(kod, setKod)}</label>
        <div style={{ fontSize: 12, color: kalanSure > 0 ? C.dim : C.red }}>{kalanSure > 0 ? `Kod ${dk(kalanSure)} içinde geçerli` : 'Kodun süresi doldu'}</div>
        {hata && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.red }}>{hata}</p>}
        <button type="submit" disabled={bekle || kalanSure <= 0} style={birincil(bekle || kalanSure <= 0)}>{bekle ? 'Kontrol ediliyor…' : kurulum ? 'Doğrula ve hesabı oluştur' : 'Doğrula ve gir'}</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" disabled={yenidenSure > 0 || bekle} onClick={() => smsIste(tel)} style={baglanti(yenidenSure > 0)}>{yenidenSure > 0 ? `Yeni kod (${yenidenSure} sn)` : 'Yeni kod gönder'}</button>
          {!kurulum && kimlik?.totp && <button type="button" onClick={() => { setKod(''); setHata(''); setKodHak(HAK); setAdim('totp'); }} style={baglanti(false)}>Authenticator kullan</button>}
          <button type="button" onClick={sifirla} style={{ ...baglanti(false), color: C.dim, fontWeight: 400 }}>Geri dön</button>
        </div>
      </form>,
    );
  }

  return sayfa(
    <form onSubmit={gonder} style={kart}>
      {baslik(kurulum ? 'Yönetici hesabını oluştur' : 'Yönetici girişi', kurulum ? (TELEFON_ACIK ? 'İlk açılış: kullanıcı adı, şifre ve onay kodunun gideceği telefonu siz belirleyin. Varsayılan bir hesap yoktur.' : 'İlk açılış: panele girecek kullanıcı adı ve şifreyi siz belirleyin. Varsayılan bir hesap yoktur.') : (kimlik.totp ? 'Kullanıcı adı ve şifrenizi girin; ardından Authenticator kodu istenir.' : 'Kullanıcı adı ve şifrenizi girin.'))}
      <label style={et}>Kullanıcı adı<input style={alan} value={kullanici} autoComplete="username" autoFocus onChange={(e) => setKullanici(e.target.value)} /></label>
      <label style={et}>Şifre<input style={alan} type="password" value={sifre} autoComplete={kurulum ? 'new-password' : 'current-password'} onChange={(e) => setSifre(e.target.value)} /></label>
      {kurulum && <label style={et}>Şifre (tekrar)<input style={alan} type="password" value={tekrar} autoComplete="new-password" onChange={(e) => setTekrar(e.target.value)} /></label>}
      {kurulum && TELEFON_ACIK && <label style={et}>Cep telefonu<input style={alan} type="tel" inputMode="tel" placeholder="5XX XXX XX XX" autoComplete="tel-national" value={telefon} onChange={(e) => setTelefon(e.target.value)} /></label>}
      {!kurulum && TELEFON_ACIK && kimlik.telefon && <p style={{ margin: 0, fontSize: 12, color: C.dim }}>{kimlik.totp ? 'İkinci adım: Microsoft Authenticator (SMS yedek)' : `Kod şu numaraya gider: ${telGizli(kimlik.telefon)}`}</p>}
      {hata && <p role="alert" style={{ margin: 0, fontSize: 13, color: C.red }}>{hata}{kilit > 0 ? ` (${kilit} sn)` : ''}</p>}
      <button type="submit" disabled={bekle || kilit > 0} style={birincil(bekle || kilit > 0)}>{bekle ? 'Kontrol ediliyor…' : kurulum ? (TELEFON_ACIK ? 'Devam: telefonu doğrula' : 'Hesabı oluştur') : (kimlik.totp ? 'Devam' : 'Giriş yap')}</button>
      <p style={{ margin: 0, fontSize: 11.5, color: '#5A6675', lineHeight: 1.5 }}>Yerel önizleme: bilgiler yalnızca bu tarayıcıda (şifre özetlenmiş olarak) saklanır. Telefon (SMS) doğrulaması şimdilik kapalı. Bu kapı gerçek güvenlik sağlamaz.</p>
    </form>,
  );
}
