// ═══════════════════════════════════════════════════════════════════════
// GUR İŞLETME (Doyurucu) — kurumsal site + sahiplenme + etkileşim paneli
//
// Akış: tanıtım (neden sahiplenmeli) → hesap → kaydını bul → doğrula → başvur → onay → panel.
// Panel yalnızca onaylı sahiplenmesi olan işletmeye açılır; girilen alan kaynağı ezer, girilmeyen alan
// kaynaktan gelmeye devam eder (webStore → sahiplikUygula).
//
// DÜRÜSTLÜK: sunucu yok. (1) Başvuru onayı yönetici panelinde verilir; yerel modda onay için açıkça
// "simüle et" etiketli bir geliştirici düğmesi var. (2) Etkileşimler yalnızca BU tarayıcıda, yalnızca
// ölçümleme izni verildiyse sayılır — uydurma rakam yok; sunucu bağlanınca tüm kullanıcılar akar.
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API, TELEFON_ACIK, KOD_OMRU, YENIDEN, HAK, ITER, ozet, tuzUret, telNormal, telGizli, smsGonder, smsDogrula } from '../lib/otp.js';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GurLogo, Icon, Img } from './GurApp.jsx';
import { tgoPill, useApp, AField, ABtn, F, C3, GRAD, DoyurucuBar } from './GurWeb.jsx';
import { RESTAURANTS } from '../data/restaurants.js';
import { PaketlerSekmesi, KampanyaSekmesi } from './GurPaketler.jsx';
import {
  isletmeGiris, isletmeHesapBul, isletmeHesapEkle, isletmeCikis, basvuruEkle, basvuruKarar, profilYaz, profilSil, talepKarar, sahipliIdler,
} from './webStore.js';

const METRIKLER = [
  { tip: 'kart_gosterim', ad: 'Kart gösterimi', ikon: 'eye', renk: C3.g, aciklama: 'Kartınızın kaç kişinin destesinde göründüğü.', ne: 'Düşükse: kategori, fotoğraf ve açıklamanızı güçlendirin; deste konum ve ilgiye göre kurulur.' },
  { tip: 'goruntulenme', ad: 'Sayfa görüntüleme', ikon: 'doc', renk: C3.u, aciklama: 'Mekân sayfanızın açılma sayısı.', ne: 'Kartı görenlerin kaçının merak edip detaya girdiğini gösterir.' },
  { tip: 'kaydet', ad: 'Kaydedilme', ikon: 'heart', renk: C3.r, aciklama: 'Sağa kaydırma ve favoriye ekleme.', ne: 'Gerçek ilginin en net işareti; oranı kart gösterimine bölerek izleyin.' },
  { tip: 'yol_tarifi', ad: 'Yol tarifi', ikon: 'pin', renk: C3.u, aciklama: '“Yol tarifi” düğmesine basanlar.', ne: 'Yola çıkma niyeti; yoğunluk öncesi erken uyarı.' },
  { tip: 'iletisim', ad: 'İletişim tıklaması', ikon: 'chat', renk: C3.r, aciklama: 'Telefon, web sitesi, Instagram, Facebook, e-posta tıklamaları.', ne: 'Sosyal medya hesaplarınıza ve web sitenize gelen trafik.' },
  { tip: 'masa_talebi', ad: 'Masa talebi', ikon: 'masa', renk: C3.g, aciklama: 'Gelen masa talepleri.', ne: 'Talebi panelden onaylayın ya da reddedin; komisyon yok.' },
];

const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
function son7() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { anahtar: d.toISOString().slice(0, 10), ad: GUNLER[d.getDay()] };
  });
}
const sayi = (n) => (n || 0).toLocaleString('tr-TR');

// ───────────────────────── Kurumsal kabuk (herkese açık sayfalar) ─────────────────────────
function IsletmeBaslik() {
  const { isletme } = useApp();
  const nav = useNavigate();
  return (
    <header className="gw-ib">
      <div className="gw-wrap gw-ib-in">
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/kesfet" aria-label="GUR ana menüye dön"><GurLogo size={36} pill /></Link>
          <Link to="/doyurucu" aria-label="Doyurucu ana sayfa" className="gw-ib-etiket"><Icon n="catalbicak" size={14} color="currentColor" strokeWidth={2.2} />DOYURUCU</Link>
        </span>
        <nav className="gw-ib-nav" aria-label="İşletme sitesi">
          <Link to="/doyurucu#neden">Neden sahiplen?</Link>
          <Link to="/doyurucu#nasil">Nasıl çalışır</Link>
          <Link to="/doyurucu#sss">SSS</Link>
        </nav>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isletme.hesap ? (
            <>
              <Link to="/doyurucu/panel" style={tgoPill(true, { padding: '9px 18px', fontSize: 14 })}>Panele git</Link>
              <button style={tgoPill(false, { padding: '9px 18px', fontSize: 14 })} onClick={() => { isletmeCikis(); nav('/doyurucu'); }}>Çıkış</button>
            </>
          ) : (
            <>
              <Link to="/doyurucu/giris" className="gw-hide-sm" style={tgoPill(false, { padding: '9px 18px', fontSize: 14 })}>Giriş yap</Link>
              <Link to="/doyurucu/giris?kayit=1" style={tgoPill(true, { padding: '9px 18px', fontSize: 14 })}>Ücretsiz kayıt ol</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function IsletmeAltBilgi() {
  return (
    <footer className="gw-ibfoot">
      <div className="gw-wrap gw-ibfoot-in">
        <div style={{ maxWidth: 320 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Link to="/kesfet" aria-label="GUR ana menüye dön"><GurLogo size={32} pill /></Link><span className="gw-ib-etiket"><Icon n="catalbicak" size={14} color="currentColor" strokeWidth={2.2} />DOYURUCU</span></span>
          <p style={{ margin: '12px 0 0', color: '#6F6459', fontSize: 14 }}>GUR İşletme: restoranını İstanbul'un keşif akışına taşı, etkileşimi gör, masa taleplerini yönet.</p>
        </div>
        <div><b>İşletme</b><Link to="/doyurucu/sahiplen">Kaydını sahiplen</Link><Link to="/doyurucu/giris?kayit=1">Ücretsiz kayıt ol</Link></div>
        <div><b>Ürün</b><Link to="/doyurucu#neden">Neden sahiplenmeli?</Link><Link to="/doyurucu#etkilesim">Etkileşim panosu</Link><Link to="/doyurucu#sss">Sık sorulanlar</Link></div>
        <div><b>GUR</b><Link to="/">Tüketici sitesi</Link><Link to="/kesfet">Keşfet</Link></div>
      </div>
      <p className="gw-wrap" style={{ margin: '22px auto 0', fontSize: 12.5, color: '#6F6459' }}>
        Mekân listesi Google Maps taramasından (Bakırköy, 218 kayıt) geliyor; fotoğraflar örnek görsellerdir. Kayıt, panel ve masa ayırtma ücretsizdir.
      </p>
    </footer>
  );
}

function IsletmeKabuk({ children }) {
  return (<div className="gw-ibpage"><IsletmeBaslik />{children}<IsletmeAltBilgi /></div>);
}

// ───────────────────────── Tanıtım (kurumsal ana sayfa) ─────────────────────────
const ONCE = [
  'Bilgiler (telefon, saat, açıklama) dış kaynaktan gelir; eski ya da eksik olabilir.',
  'Menü ve fotoğraf yok ya da örnek görsel.',
  'Masa ayırtma kapalı: sahipsiz mekân adına söz verilemez.',
  'Kaç kişinin kartınızı gördüğünü, kaydettiğini göremezsiniz.',
  'Yanlış bilgiyi düzeltemezsiniz.',
];
const SONRA = [
  'Bilgileri siz yazarsınız; girdiğiniz alan dış kaynağı ezer.',
  'Menü ve fotoğraflarınızı kendiniz yönetirsiniz.',
  'Masa talepleri panelinize düşer: onaylar ya da reddedersiniz. Komisyon yok.',
  'Etkileşimi görürsünüz: gösterim, görüntüleme, kaydedilme, yol tarifi.',
  'Mekânınız “Sahiplenildi” olarak işaretlenir; kullanıcı kime güvendiğini bilir.',
];
const NEDENLER = [
  { ikon: 'chart', renk: C3.g, baslik: 'Etkileşimi görürsünüz', metin: 'Kaç kişinin kartınızı gördüğünü, kaçının sayfanıza girdiğini ve kaydettiğini panelden izlersiniz. Hangi saat ve hangi bilgi işe yarıyor, tahmin etmezsiniz, bilirsiniz.' },
  { ikon: 'doc', renk: C3.u, baslik: 'Mekânın yüzünü siz yazarsınız', metin: 'Tanıtım yazısı, saatler, fiyat aralığı, telefon, web sitesi, Instagram ve Facebook hesaplarınız. Hangi alanın sizden, hangisinin harita kaynağından geldiği panelde yazar.' },
  { ikon: 'plate', renk: C3.r, baslik: 'Masa taleplerini alırsınız', metin: 'Kullanıcı uygulamadan masa ayırtır, talep panelinize düşer. Tamamen ücretsiz; rezervasyon komisyonu yok. Bu yalnızca sahiplenmiş mekânlarda açık.' },
];
const ADIMLAR = [
  ['01', 'Kaydınızı bulun', 'Mekân havuzu dış kaynaklardan otomatik doluyor; restoranınız büyük ihtimalle zaten listede. Arayıp bulun; yoksa yeni kayıt açın.'],
  ['02', 'Bilgilerinizi doğrulayın', 'Ticaret unvanı, vergi numarası, yetkili adı ve iletişim bilgisiyle sahiplenme başvurusu yapın. Başvuru GUR ekibinin onayına düşer.'],
  ['03', 'Panelden yönetin', 'Onaydan sonra bilgiler, etkileşim panosu ve masa talepleri tek yerde. Doldurmadığınız alan kaynaktan gelmeye devam eder.'],
];
const SSS = [
  ['Restoranım zaten GUR’da görünüyor, ne yapmalıyım?', 'Havuz dış kaynaklardan dolduğu için kaydınız sizden önce oluşmuş olabilir. “Kaydını sahiplen” ile arayıp başvurun; onaylandığında yönetim size geçer ve o güne kadarki bilgiler korunur.'],
  ['Neden sahiplenmeliyim?', 'Sahiplenmeden etkileşiminizi göremez, bilgilerinizi düzeltemez, masa talebi alamazsınız. Sahiplenince hepsi sizin kontrolünüzde olur ve mekânınız “Sahiplenildi” rozeti alır.'],
  ['Kayıt ücretli mi?', 'Hayır. Kayıt, sahiplenme, panel ve masa ayırtma ücretsiz. İşletme aboneliği ve rezervasyon komisyonu yok.'],
  ['Etkileşim verisi nereden geliyor?', 'Kullanıcıların GUR üzerinde mekânınızla yaptığı işlemlerden: kart gösterimi, sayfa görüntüleme, kaydetme, yol tarifi, iletişim tıklaması, masa talebi. Yalnızca ölçümleme izni veren kullanıcıların işlemleri sayılır; kişisel kimlik gösterilmez.'],
  ['Başvuru ne kadar sürede sonuçlanır?', 'Başvurunuz GUR ekibinin onayına düşer ve yönetici panelinden karara bağlanır. Onaylanınca mekânınız sitede Sahiplenilmiş olur ve panel açılır.'],
];

export function IsletmeLandingPage() {
  const { isletme } = useApp();
  const sahipli = new Set(sahipliIdler(isletme)).size;
  return (
    <IsletmeKabuk>
      <section className="gw-tgo-hero gw-ib-hero">
        <div className="gw-wrap gw-ib-herogrid">
          <div>
            <span className="gw-badge soft" style={{ marginBottom: 18 }}>GUR İŞLETME</span>
            <h1 className="gw-tgo-h1" style={{ textAlign: 'left', margin: '0 0 18px' }}>
              <span style={{ color: '#8f8a85', fontWeight: 400 }}>Restoranınız İstanbul’un</span> <span className="gw-tri-text">keşif akışında</span>
            </h1>
            <p style={{ fontSize: 17, color: '#4A443E', maxWidth: 540, margin: '0 0 26px' }}>
              GUR kullanıcıları restoranları kaydırarak keşfediyor. Kaydınızı sahiplenin; bilgilerinizi siz yönetin ve kaç kişinin kartınızı gördüğünü,
              kaydettiğini ve yol tarifi aldığını panelden görün.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <Link to="/doyurucu/sahiplen" style={tgoPill(true, { padding: '15px 30px', fontSize: 16 })}>Kaydını sahiplen</Link>
              <Link to="/doyurucu/giris?kayit=1" style={tgoPill(false, { padding: '15px 30px', fontSize: 16 })}>Ücretsiz kayıt ol</Link>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#6F6459' }}>Kayıt, panel ve masa ayırtma ücretsiz. İşletme aboneliği yok, rezervasyon komisyonu yok.</p>
          </div>
          <div className="gw-ib-card">
            <b style={{ fontSize: 12, letterSpacing: '.06em', color: '#6F6459' }}>PANELDE NE VAR</b>
            {[['chart', 'Etkileşim panosu', 'Gösterim, görüntüleme, kaydedilme, yol tarifi', C3.g],
              ['doc', 'Bilgi yönetimi', 'Girdiğiniz alan harita kaynağını ezer', C3.u],
              ['clock', 'Masa talepleri', 'Gelen talebi onaylayın ya da reddedin', C3.r],
              ['shield', 'Sahiplenildi rozeti', 'Kullanıcı mekânın resmi sahibini görür', C3.g]].map(([ic, b, a, renk], i) => (
              <div key={b} style={{ display: 'flex', gap: 13, padding: '13px 0', borderTop: i ? '1px solid #EFE9E1' : 'none', marginTop: i ? 0 : 10 }}>
                <span className="gw-tgo-ico" style={{ width: 38, height: 38, borderRadius: 12, margin: 0, background: `${renk}22` }}><Icon n={ic} size={18} color={renk} /></span>
                <div><b style={{ display: 'block', fontSize: 15 }}>{b}</b><span style={{ fontSize: 13, color: '#6F6459' }}>{a}</span></div>
              </div>
            ))}
            <div className="gw-ib-stats">
              <div><b>{sayi(RESTAURANTS.length)}</b><span>restoran havuzda</span></div>
              <div><b>{sayi(sahipli)}</b><span>sahiplenilmiş (bu tarayıcıda)</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="neden" className="gw-wrap gw-ib-sec">
        <div className="gw-ib-baslik"><span>NEDEN SAHİPLENMELİ?</span><h2>Kaydınızın sahibi siz olun</h2>
          <p>Dış kaynaktan gelen bir kayıt eksik ve eskidir, ve kimin gördüğünü size söylemez. Sahiplendiğinizde mekânın GUR’daki yüzünü siz yazar, etkileşimi siz görürsünüz.</p></div>
        <div className="gw-cmp">
          <div className="gw-cmp-kol once"><h3>Sahiplenmeden</h3>{ONCE.map((t) => <p key={t}><span aria-hidden>✕</span>{t}</p>)}</div>
          <div className="gw-cmp-kol sonra"><h3>Sahiplendikten sonra</h3>{SONRA.map((t) => <p key={t}><span aria-hidden>✓</span>{t}</p>)}</div>
        </div>
        <div className="gw-reasons">
          {NEDENLER.map((n) => (
            <div key={n.baslik} className="gw-hover" style={{ background: '#fff', borderRadius: 22, padding: 24, cursor: 'default' }}>
              <span className="gw-tgo-ico" style={{ background: `${n.renk}22` }}><Icon n={n.ikon} size={26} color={n.renk} /></span>
              <h3 style={{ margin: '0 0 8px', fontSize: 19 }}>{n.baslik}</h3><p style={{ margin: 0, color: '#4A443E', fontSize: 14.5 }}>{n.metin}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="etkilesim" className="gw-ib-band">
        <div className="gw-wrap gw-ib-sec" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="gw-ib-baslik"><span>ETKİLEŞİM PANOSU</span><h2>Ne görürsünüz, ne işinize yarar?</h2>
            <p>Etkileşim, kullanıcının mekânınızla GUR’da yaptığı her anlamlı işlemdir. Panel bunları sayar ve ne anlama geldiğini yanına yazar.</p></div>
          <div className="gw-metrik">
            {METRIKLER.map((m) => (
              <div key={m.tip} className="gw-metrik-satir">
                <span className="gw-tgo-ico" style={{ width: 44, height: 44, borderRadius: 14, margin: 0, background: `${m.renk}22` }}><Icon n={m.ikon} size={20} color={m.renk} /></span>
                <div><b>{m.ad}</b><p>{m.aciklama}</p></div>
                <p className="gw-metrik-ne">{m.ne}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nasil" className="gw-wrap gw-ib-sec">
        <div className="gw-ib-baslik"><span>NASIL ÇALIŞIR</span><h2>Üç adımda GUR’dasınız</h2><p>Kaydınızı sahiplenmek birkaç dakika sürer; gerisini panel yapar.</p></div>
        <div className="gw-reasons">
          {ADIMLAR.map(([n, b, m]) => (
            <div key={n} className="gw-hover" style={{ background: '#fff', borderRadius: 22, padding: 24, cursor: 'default' }}>
              <b className="gw-tri-text" style={{ fontSize: 34 }}>{n}</b><h3 style={{ margin: '8px 0', fontSize: 19 }}>{b}</h3><p style={{ margin: 0, color: '#4A443E', fontSize: 14.5 }}>{m}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ucret" className="gw-ib-band">
        <div className="gw-wrap gw-ib-sec" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="gw-ib-baslik"><span>ÜCRETLENDİRME</span><h2>Ücretsiz başlayın, abonelik yok</h2><p>Kayıt, sahiplenme, panel ve masa ayırtma ücretsizdir. Reklam ve ek paketler isteğe bağlıdır; hesabınızı açınca panelde <b>Hizmetlerimiz</b> bölümünden seçebilirsiniz. Reklam almayan restoran da keşif akışında görünür.</p></div>
          <div className="gw-ib-fiyat">
            <b>₺0</b>
            <ul>{['Kayıt ve sahiplenme', 'İşletme paneli ve etkileşim panosu', 'Bilgi yönetimi (girdiğiniz alan kaynağı ezer)', 'Masa talepleri, rezervasyon komisyonu yok'].map((t) => <li key={t}><span aria-hidden>✓</span>{t}</li>)}</ul>
            <Link to="/doyurucu/sahiplen" style={tgoPill(true, { padding: '14px 28px' })}>Kaydını sahiplen</Link>
          </div>
        </div>
      </section>

      <section id="sss" className="gw-wrap gw-ib-sec">
        <div className="gw-ib-baslik"><span>SIK SORULANLAR</span><h2>Merak edilenler</h2></div>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {SSS.map(([s, c], i) => <details key={s} className="gw-sss" open={i === 0}><summary>{s}</summary><p>{c}</p></details>)}
        </div>
      </section>

      <section className="gw-wrap" style={{ padding: '24px 28px 72px' }}>
        <div className="gw-ib-cta">
          <h2>Kaydınız sizi bekliyor</h2>
          <p>Restoranınız havuzda zaten varsa sahiplenin, yoksa birkaç dakikada yeni kayıt açın.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/doyurucu/sahiplen" style={tgoPill(false, { border: 'none', color: '#B4530A', padding: '14px 28px' })}>Kaydını sahiplen</Link>
            <Link to="/doyurucu/kayit" style={tgoPill(false, { background: 'transparent', color: '#fff', borderColor: '#fff', padding: '14px 28px' })}>Yeni kayıt aç</Link>
          </div>
        </div>
      </section>
    </IsletmeKabuk>
  );
}

// ───────────────────────── Hesap (giriş / kayıt) ─────────────────────────
const epostaGecerli = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function IsletmeGirisPage() {
  const nav = useNavigate();
  const { isletme } = useApp();
  const [sp, setSp] = useSearchParams();
  const kayit = sp.get('kayit') === '1';
  const devam = sp.get('devam');
  const [ad, setAd] = useState(''); const [eposta, setEposta] = useState(''); const [parola, setParola] = useState(''); const [telefon, setTelefon] = useState('');
  const [onay, setOnay] = useState(false); const [hata, setHata] = useState(null); const [bekle, setBekle] = useState(false);
  // İkinci adım: telefona gelen onay kodu (altyapı yönetici paneliyle ortak: src/lib/otp.js)
  const [adim, setAdim] = useState('form');
  const [kod, setKod] = useState(''); const [yerelKod, setYerelKod] = useState('');
  const [kalanSure, setKalanSure] = useState(0); const [yenidenSure, setYenidenSure] = useState(0);
  const [kodHak, setKodHak] = useState(HAK); const [yanlis, setYanlis] = useState(0); const [kilit, setKilit] = useState(0);
  const bekleyen = useRef(null);   // { tur: 'kayit'|'giris', telefon, ad, email, yeni? }

  useEffect(() => { if (kilit <= 0) return undefined; const t = setTimeout(() => setKilit((k) => k - 1), 1000); return () => clearTimeout(t); }, [kilit]);
  useEffect(() => {
    if (adim !== 'kod') return undefined;
    const t = setInterval(() => { setKalanSure((k) => Math.max(0, k - 1)); setYenidenSure((k) => Math.max(0, k - 1)); }, 1000);
    return () => clearInterval(t);
  }, [adim]);

  const eksik = kayit
    ? (!ad.trim() ? 'Yetkili adını yaz' : !epostaGecerli(eposta) ? 'Geçerli bir e-posta yaz' : (TELEFON_ACIK && !telNormal(telefon)) ? 'Geçerli bir cep telefonu yaz (5XX XXX XX XX)' : parola.length < 6 ? 'Parola en az 6 karakter olmalı' : !onay ? 'Koşulları onayla' : null)
    : (!epostaGecerli(eposta) ? 'Geçerli bir e-posta yaz' : parola.length < 6 ? 'Parola en az 6 karakter olmalı' : null);

  const smsIste = async (tel) => {
    setKod(''); setKodHak(HAK);
    const s = await smsGonder(tel);
    if (!s.ok) { setHata(s.neden); return false; }
    setYerelKod(s.yerelKod); setKalanSure(KOD_OMRU); setYenidenSure(YENIDEN); setHata(null); setAdim('kod');
    return true;
  };
  const geri = () => { setAdim('form'); setKod(''); setParola(''); setHata(null); bekleyen.current = null; };

  const gonder = async (ev) => {
    ev.preventDefault();
    if (eksik) { setHata(eksik); return; }
    if (!window.crypto?.subtle) { setHata('Bu tarayıcı güvenli bağlantı gerektiriyor (https ya da localhost).'); return; }
    if (kilit > 0) return;
    setBekle(true); setHata(null);
    if (kayit) {
      if (isletmeHesapBul(eposta)) { setBekle(false); setHata('Bu e-posta ile bir hesap var. Giriş yapmayı dene.'); return; }
      const tuz = tuzUret(); const tel = TELEFON_ACIK ? telNormal(telefon) : null;
      bekleyen.current = { tur: 'kayit', telefon: tel, ad: ad.trim(), email: eposta.trim(), yeni: { ad: ad.trim(), email: eposta.trim(), telefon: tel, tuz, iter: ITER, hash: await ozet(parola, tuz) } };
      if (!TELEFON_ACIK) { isletmeHesapEkle(bekleyen.current.yeni); bitirGiris(bekleyen.current); setBekle(false); return; }
      await smsIste(tel); setBekle(false); return;
    }
    const h = isletmeHesapBul(eposta);
    if (!h) { setBekle(false); setHata('Bu e-posta ile kayıtlı hesap yok. Ücretsiz kayıt olabilirsin.'); return; }
    if ((await ozet(parola, h.tuz, h.iter)) !== h.hash) {
      setBekle(false); setParola('');
      const n = yanlis + 1; setYanlis(n);
      if (n >= 5) { setKilit(30); setYanlis(0); setHata('Çok fazla hatalı deneme. 30 saniye bekle.'); } else setHata('E-posta ya da parola hatalı.');
      return;
    }
    setYanlis(0);
    bekleyen.current = { tur: 'giris', telefon: h.telefon, ad: h.ad, email: h.email };
    if (!TELEFON_ACIK || !h.telefon) { bitirGiris(bekleyen.current); setBekle(false); return; }   // telefon doğrulaması kapalı
    await smsIste(h.telefon); setBekle(false);
  };

  const bitirGiris = (b) => {
    isletmeGiris({ ad: b.ad, email: b.email });
    const sahipli = sahipliIdler(isletme).length > 0;
    nav(devam ? decodeURIComponent(devam) : (sahipli ? '/doyurucu/panel' : '/doyurucu/sahiplen'), { replace: true });
  };

  const kodGonder = async (ev) => {
    ev.preventDefault(); setHata(null);
    const b = bekleyen.current; if (!b) { geri(); return; }
    if (kalanSure <= 0) { setHata('Kodun süresi doldu. Yeni kod iste.'); return; }
    if (!/^\d{6}$/.test(kod)) { setHata('6 haneli kodu yaz.'); return; }
    setBekle(true);
    const dogru = await smsDogrula(b.telefon, kod, yerelKod);
    setBekle(false);
    if (dogru === null) { setHata('Doğrulama sunucusuna ulaşılamadı.'); return; }
    if (!dogru) {
      const kalan = kodHak - 1; setKodHak(kalan); setKod('');
      if (kalan <= 0) { geri(); setHata('Kod 3 kez yanlış girildi. Baştan başla.'); } else setHata(`Kod hatalı. ${kalan} hakkın kaldı.`);
      return;
    }
    if (b.tur === 'kayit') isletmeHesapEkle(b.yeni);
    isletmeGiris({ ad: b.ad, email: b.email });
    const sahipli = sahipliIdler(isletme).length > 0;
    nav(devam ? decodeURIComponent(devam) : (sahipli ? '/doyurucu/panel' : '/doyurucu/sahiplen'), { replace: true });
  };

  const kodAdimi = adim === 'kod';
  return (
    <IsletmeKabuk>
      <section className="gw-tgo-hero" style={{ padding: '48px 0 64px' }}>
        <div className="gw-wrap gw-ib-giris">
          <div>
            <h1 className="gw-tgo-h1" style={{ textAlign: 'left', fontSize: 'clamp(28px,3.6vw,44px)', margin: '0 0 14px' }}>
              <span style={{ color: '#8f8a85', fontWeight: 400 }}>{kodAdimi ? 'Telefonunu' : kayit ? 'İşletme hesabı' : 'İşletmene'}</span> <span className="gw-tri-text">{kodAdimi ? 'doğrula' : kayit ? 'oluştur' : 'giriş yap'}</span>
            </h1>
            <p style={{ color: '#4A443E', maxWidth: 440 }}>Hesabınızla kaydınızı sahiplenir, etkileşimi izler ve masa taleplerini yönetirsiniz. Hesabınız e-posta ve parolayla korunur.</p>
            <ul className="gw-ib-liste">
              {['Kayıt, panel ve masa ayırtma ücretsiz', 'Kaç kişinin kartınızı gördüğünü görün', 'Bilgilerinizi kendiniz yönetin'].map((t) => <li key={t}><span aria-hidden>✓</span>{t}</li>)}
            </ul>
          </div>
          <div className="gw-auth-card" style={{ maxWidth: 460, width: '100%' }}>
            {kodAdimi ? (
              <form onSubmit={kodGonder} noValidate>
                <p style={{ margin: '0 0 14px', color: '#4A443E' }}>{API ? `Telefonuna (${telGizli(bekleyen.current?.telefon || '')}) 6 haneli bir kod SMS ile gönderildi.` : `Telefon (${telGizli(bekleyen.current?.telefon || '')}) için 6 haneli kod üretildi.`}</p>
                {!API && (
                  <div className="gw-demo" role="note" style={{ margin: '0 0 14px' }}>
                    <b>Yerel önizleme · SMS gönderilmedi</b>
                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 6, margin: '6px 0' }}>{yerelKod}</div>
                    <p style={{ margin: 0 }}>SMS sağlayıcısı bağlı olmadığı için kod burada gösteriliyor. Bu bir güvenlik önlemi değil, akışın gösterimidir.</p>
                  </div>
                )}
                <AField label="Onay kodu" value={kod} onChange={(v) => setKod(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" />
                <p style={{ margin: '0 0 12px', fontSize: 13, color: kalanSure > 0 ? '#6F6459' : '#C2282D' }}>{kalanSure > 0 ? `Kod ${Math.floor(kalanSure / 60)}:${String(kalanSure % 60).padStart(2, '0')} içinde geçerli` : 'Kodun süresi doldu'}</p>
                {hata && <p role="alert" style={{ color: '#C2282D', fontWeight: 600, fontSize: 14, margin: '0 0 12px' }}>{hata}</p>}
                <ABtn type="submit">{bekle ? 'Kontrol ediliyor…' : 'Doğrula ve devam et'}</ABtn>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" disabled={yenidenSure > 0 || bekle} onClick={() => smsIste(bekleyen.current.telefon)} style={{ background: 'none', border: 'none', minHeight: 44, color: yenidenSure > 0 ? '#9a9086' : '#B4530A', fontWeight: 700, fontSize: 14, fontFamily: F, cursor: yenidenSure > 0 ? 'default' : 'pointer' }}>{yenidenSure > 0 ? `Yeni kod (${yenidenSure} sn)` : 'Yeni kod gönder'}</button>
                  <button type="button" onClick={geri} style={{ background: 'none', border: 'none', minHeight: 44, color: '#6F6459', fontSize: 14, fontFamily: F, cursor: 'pointer' }}>Geri dön</button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={gonder} noValidate>
                  {kayit && <AField label="Yetkili adı soyadı" value={ad} onChange={setAd} placeholder="Ad Soyad" />}
                  <AField label="İş e-postası" value={eposta} onChange={setEposta} placeholder="isletme@mail.com" type="email" />
                  {kayit && TELEFON_ACIK && <AField label="Cep telefonu (onay kodu bu numaraya gelir)" value={telefon} onChange={setTelefon} placeholder="5XX XXX XX XX" type="tel" />}
                  <AField label="Parola" value={parola} onChange={setParola} placeholder="En az 6 karakter" type="password" />
                  {kayit && (
                    <label className="gw-acheck"><input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} />
                      Kullanım koşullarını ve gizlilik metnini okudum, kabul ediyorum.</label>
                  )}
                  {hata && <p role="alert" style={{ color: '#C2282D', fontWeight: 600, fontSize: 14, margin: '0 0 12px' }}>{hata}{kilit > 0 ? ` (${kilit} sn)` : ''}</p>}
                  <ABtn type="submit">{bekle ? 'Kontrol ediliyor…' : kayit ? (TELEFON_ACIK ? 'Devam: telefonu doğrula' : 'Hesabı oluştur') : (TELEFON_ACIK ? 'Devam' : 'Giriş yap')}</ABtn>
                </form>
                <button onClick={() => { setHata(null); setSp((p) => { const n = new URLSearchParams(p); if (kayit) n.delete('kayit'); else n.set('kayit', '1'); return n; }, { replace: true }); }}
                  style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, color: '#B4530A', fontWeight: 700, fontSize: 14, fontFamily: F }}>
                  {kayit ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Ücretsiz kayıt ol'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </IsletmeKabuk>
  );
}

// ───────────────────────── Sahiplenme (kaydı bul → doğrula → başvur) ─────────────────────────
const DURUM_ETIKET = { bekliyor: 'Beklemede', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi' };

export function IsletmeSahiplenPage() {
  const { isletme, restaurants } = useApp();
  const loc = useLocation();
  const [sp] = useSearchParams();
  const [adim, setAdim] = useState(1);
  const [q, setQ] = useState('');
  const [secili, setSecili] = useState(null);
  const [f, setF] = useState({ unvan: '', vergiNo: '', yetkili: isletme.hesap?.ad || '', telefon: '', eposta: isletme.hesap?.email || '' });
  const [yetki, setYetki] = useState(false);
  const [hata, setHata] = useState(null);
  const [gonderilen, setGonderilen] = useState(null);

  const onSecili = sp.get('id');
  useEffect(() => {
    if (!onSecili) return;
    const r = restaurants.find((x) => String(x.id) === String(onSecili));
    if (r && !secili) { setSecili(r); setAdim(2); }
  }, [onSecili]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isletme.hesap) return <Navigate to={`/doyurucu/giris?devam=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;

  const durumOf = (id) => isletme.sahiplenmeler.find((s) => String(s.restaurantId) === String(id) && s.durum !== 'reddedildi')?.durum || null;
  const sonuclar = (() => {
    const a = q.trim().toLocaleLowerCase('tr');
    if (a.length < 2) return [];
    return restaurants.filter((r) => `${r.name} ${r.addr || ''}`.toLocaleLowerCase('tr').includes(a)).slice(0, 8);
  })();
  const ayarla = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const gonder = (ev) => {
    ev.preventDefault();
    const vergi = f.vergiNo.replace(/\s/g, '');
    if (!f.unvan.trim()) return setHata('Ticaret unvanını yaz.');
    if (!/^\d{10}$/.test(vergi)) return setHata('Vergi numarası 10 haneli olmalı.');
    if (!f.yetkili.trim()) return setHata('Yetkili adını yaz.');
    if (f.telefon.replace(/\D/g, '').length < 10) return setHata('Geçerli bir telefon yaz.');
    if (!epostaGecerli(f.eposta)) return setHata('Geçerli bir e-posta yaz.');
    if (!yetki) return setHata('Bu işletmeyi temsil etmeye yetkili olduğunu onayla.');
    const sonuc = basvuruEkle({ restaurantId: secili.id, ad: secili.name, unvan: f.unvan.trim(), vergiNo: vergi, yetkili: f.yetkili.trim(), telefon: f.telefon.trim(), eposta: f.eposta.trim() });
    if (!sonuc.ok) return setHata(sonuc.neden === 'zaten_sahipli' ? 'Bu mekân zaten sahiplenilmiş.' : 'Bu mekân için zaten bekleyen bir başvuru var.');
    setHata(null); setGonderilen(sonuc.basvuru.id); setAdim(3);
  };

  const guncel = isletme.sahiplenmeler.find((s) => s.id === gonderilen);
  const adimlar = ['Kaydını bul', 'Bilgilerini doğrula', 'Başvuru'];

  return (
    <IsletmeKabuk>
      <section className="gw-tgo-hero" style={{ padding: '40px 0 56px' }}>
        <div className="gw-wrap" style={{ maxWidth: 820 }}>
          <h1 className="gw-tgo-h1" style={{ fontSize: 'clamp(28px,3.6vw,44px)', margin: '0 0 8px', textAlign: 'center' }}>
            <span style={{ color: '#8f8a85', fontWeight: 400 }}>Kaydını</span> <span className="gw-tri-text">sahiplen</span>
          </h1>
          <p style={{ textAlign: 'center', color: '#4A443E', margin: '0 auto 24px', maxWidth: 560 }}>
            Sahiplenince bilgilerini sen yönetir, etkileşimi görür ve masa taleplerini alırsın. Başvurun GUR ekibinin onayına düşer.
          </p>
          <ol className="gw-stepper" aria-label="Adımlar">
            {adimlar.map((a, i) => <li key={a} className={adim === i + 1 ? 'on' : adim > i + 1 ? 'done' : ''} aria-current={adim === i + 1 ? 'step' : undefined}><span>{adim > i + 1 ? '✓' : i + 1}</span>{a}</li>)}
          </ol>

          <div className="gw-auth-card">
            {adim === 1 && (
              <>
                <div className="gw-bk-search" style={{ marginBottom: 14 }}>
                  <Icon n="search" size={18} color="#1C1917" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İşletme adı ya da adres yaz…" aria-label="İşletme ara" autoFocus />
                </div>
                {q.trim().length >= 2 && sonuclar.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#6F6459', padding: '18px 0' }}>Bu isimde bir kayıt bulamadık. Havuzda yoksa <Link to="/doyurucu/kayit" style={{ color: '#B4530A', fontWeight: 700 }}>yeni kayıt açabilirsin</Link>.</p>
                )}
                {sonuclar.map((r) => {
                  const d = durumOf(r.id);
                  return (
                    <button key={r.id} className="gw-sonuc" disabled={!!d} onClick={() => { setSecili(r); setAdim(2); setHata(null); }}>
                      <Img src={r.imgs?.[0]} style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} bg="#e8e0d8" />
                      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><b style={{ display: 'block' }}>{r.name}</b><span style={{ fontSize: 13, color: '#6F6459' }}>{r.addr}</span></span>
                      <span className={`gw-durum ${d === 'onaylandi' ? 'ok' : ''}`}>{d ? DURUM_ETIKET[d] : 'Sahiplen'}</span>
                    </button>
                  );
                })}
                {q.trim().length < 2 && <p style={{ margin: 0, color: '#6F6459', fontSize: 14 }}>İşletmen büyük ihtimalle GUR’da zaten var: harita servislerinden otomatik ekleniyor. Adını yazman yeterli.</p>}
              </>
            )}

            {adim === 2 && secili && (
              <form onSubmit={gonder} noValidate>
                <div className="gw-secili">
                  <Img src={secili.imgs?.[0]} style={{ width: 48, height: 48, borderRadius: 12 }} bg="#e8e0d8" />
                  <span style={{ flex: 1 }}><b style={{ display: 'block' }}>{secili.name}</b><span style={{ fontSize: 13, color: '#6F6459' }}>{secili.addr}</span></span>
                  <button type="button" style={tgoPill(false, { padding: '8px 16px', fontSize: 13 })} onClick={() => { setSecili(null); setAdim(1); }}>Değiştir</button>
                </div>
                <AField label="Ticaret unvanı" value={f.unvan} onChange={ayarla('unvan')} placeholder="ör: Lezzet Gıda San. Tic. Ltd. Şti." />
                <AField label="Vergi numarası" value={f.vergiNo} onChange={ayarla('vergiNo')} placeholder="10 haneli" />
                <AField label="Yetkili adı soyadı" value={f.yetkili} onChange={ayarla('yetkili')} placeholder="Ad Soyad" />
                <AField label="Telefon" value={f.telefon} onChange={ayarla('telefon')} placeholder="0212 000 00 00" type="tel" />
                <AField label="E-posta" value={f.eposta} onChange={ayarla('eposta')} placeholder="isletme@mail.com" type="email" />
                <label className="gw-acheck"><input type="checkbox" checked={yetki} onChange={(e) => setYetki(e.target.checked)} />Bu işletmeyi GUR’da temsil etmeye yetkili olduğumu beyan ederim.</label>
                <p style={{ background: '#FBFAF8', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#6F6459', margin: '0 0 16px' }}>
                  Başvurun yönetici onayına düşer. Onaylanınca panelde bilgileri düzenleyebilir ve etkileşimi görebilirsin; doldurmadığın alanlar harita kaynağından gelmeye devam eder.
                </p>
                {hata && <p role="alert" style={{ color: '#C2282D', fontWeight: 600, fontSize: 14, margin: '0 0 12px' }}>{hata}</p>}
                <ABtn type="submit">Sahiplenme başvurusu gönder</ABtn>
              </form>
            )}

            {adim === 3 && guncel && (
              <div style={{ textAlign: 'center' }}>
                <span className="gw-tgo-ico" style={{ margin: '0 auto 14px', background: guncel.durum === 'onaylandi' ? 'rgba(19,179,100,.14)' : 'rgba(255,165,0,.18)' }}>
                  <Icon n={guncel.durum === 'onaylandi' ? 'check' : 'clock'} size={26} color={guncel.durum === 'onaylandi' ? '#0A7C46' : '#FFA500'} />
                </span>
                <h2 style={{ fontSize: 24, margin: '0 0 8px' }}>{guncel.durum === 'onaylandi' ? 'Kaydın sahiplenildi' : 'Başvurun alındı'}</h2>
                <p style={{ color: '#4A443E', margin: '0 auto 6px', maxWidth: 440 }}><b>{guncel.ad}</b> için başvurun {guncel.durum === 'onaylandi' ? 'onaylandı. Panelin hazır.' : 'GUR ekibinin onayına düştü. Onaylanınca panelin açılır ve mekânın “Sahiplenildi” olur.'}</p>
                <p style={{ color: '#6F6459', fontSize: 13, margin: '0 0 18px' }}>Başvuru no: {guncel.id} · Durum: <b>{DURUM_ETIKET[guncel.durum]}</b></p>
                {guncel.durum === 'onaylandi' ? (
                  <Link to="/doyurucu/panel" style={tgoPill(true)}>Panele git</Link>
                ) : (
                  <div className="gw-demo">
                    <b>Yönetim onayı bekleniyor</b>
                    <p>Başvurun GUR yönetiminin incelemesinde. Karar verilince bu sayfa kendiliğinden güncellenir ve panelin açılır.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {isletme.sahiplenmeler.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 style={{ margin: '0 0 10px' }}>Başvurularım</h3>
              {isletme.sahiplenmeler.map((s) => (
                <div key={s.id} className="gw-hover" style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 16, padding: '12px 16px', marginBottom: 8, cursor: 'default' }}>
                  <b style={{ flex: 1 }}>{s.ad}</b><span style={{ fontSize: 13, color: '#6F6459' }}>{new Date(s.tarih).toLocaleDateString('tr-TR')}</span>
                  <span className={`gw-durum ${s.durum === 'onaylandi' ? 'ok' : ''}`}>{DURUM_ETIKET[s.durum]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </IsletmeKabuk>
  );
}

// ───────────────────────── Panel (etkileşim, bilgiler, masa talepleri) ─────────────────────────
const SEKMELER = [['genel', 'Genel bakış'], ['etkilesim', 'Etkileşimler'], ['bilgi', 'Bilgilerim'], ['talepler', 'Masa talepleri'], ['paketler', 'Hizmetlerimiz'], ['kampanya', 'Sponsorlu kartlar']];
const ALANLAR = [
  ['desc', 'Tanıtım yazısı', 'text'], ['hours', 'Çalışma saatleri', 'text'], ['price', 'Fiyat aralığı', 'text'],
  ['phone', 'Telefon', 'tel'], ['website', 'Web sitesi', 'text'], ['instagram', 'Instagram', 'text'], ['facebook', 'Facebook', 'text'],
];

export function IsletmePanelPage() {
  const { depo, isletme, platform, restaurants } = useApp();
  const [sp, setSp] = useSearchParams();
  const sekme = SEKMELER.some(([k]) => k === sp.get('sekme')) ? sp.get('sekme') : 'genel';
  const [seciliId, setSeciliId] = useState(null);
  const [kaydedildi, setKaydedildi] = useState('');
  const [taslak, setTaslak] = useState({});

  const sahipIds = sahipliIdler(isletme);
  const sahip = restaurants.filter((r) => sahipIds.includes(String(r.id)));
  const r = sahip.find((x) => String(x.id) === String(seciliId)) || sahip[0];
  useEffect(() => { setTaslak({}); setKaydedildi(''); }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const olay = r ? (platform.olaylar[String(r.id)] || { toplam: {}, gun: {} }) : { toplam: {}, gun: {} };
  const gunler = useMemo(() => son7().map((g) => ({ ...g, v: olay.gun[g.anahtar] || {} })), [olay]);
  const son7Top = (tip) => gunler.reduce((t, g) => t + (g.v[tip] || 0), 0);
  const talepler = r ? platform.talepler.filter((t) => String(t.restaurantId) === String(r.id)) : [];

  if (!isletme.hesap) return <Navigate to="/doyurucu/giris?devam=%2Fdoyurucu%2Fpanel" replace />;

  const kabuk = (icerik) => (<div className="gw-pn"><DoyurucuBar /><div className="gw-wrap gw-pn-in">{icerik}</div></div>);

  if (!r) {
    const bekleyen = isletme.sahiplenmeler.filter((s) => s.durum === 'bekliyor');
    return kabuk(
      <div className="gw-ib-bos">
        <span className="gw-tgo-ico" style={{ margin: '0 auto 16px' }}><Icon n="shield" size={26} color="#FF6600" /></span>
        <h1 style={{ fontSize: 30 }}>Panelini açmak için kaydını sahiplen</h1>
        <p>Etkileşimi görmek, bilgilerini yönetmek ve masa taleplerini almak için önce havuzdaki kaydını sahiplenmen gerekir. {bekleyen.length > 0 ? `${bekleyen.length} başvurun onay bekliyor.` : ''}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/doyurucu/sahiplen" style={tgoPill(true)}>Kaydımı sahiplen</Link>
          <Link to="/doyurucu#neden" style={tgoPill(false)}>Neden sahiplenmeli?</Link>
        </div>
      </div>,
    );
  }

  const kart = olay.toplam.kart_gosterim || 0;
  const oran = (a, b) => (b > 0 ? `%${Math.round((a / b) * 100)}` : '—');
  const maks = Math.max(1, ...gunler.map((g) => Math.max(g.v.kart_gosterim || 0, g.v.goruntulenme || 0, g.v.kaydet || 0)));
  const kaynakMi = (k) => !r.ownerFields?.includes(k);
  const alanDeger = (k) => (taslak[k] !== undefined ? taslak[k] : (r[k] ?? ''));

  const kaydet = (ev) => {
    ev.preventDefault();
    if (!Object.keys(taslak).length) return;
    profilYaz(r.id, taslak); setTaslak({}); setKaydedildi('Kaydedildi. Değişiklik mekân sayfanıza hemen yansıdı.');
  };

  return kabuk(
    <>
      <div className="gw-pn-ust">
        <div style={{ minWidth: 0 }}>
          <span className="gw-badge soft">✓ Sahiplenildi</span>
          <h1 style={{ margin: '8px 0 2px', fontSize: 'clamp(26px,3vw,36px)' }}>{r.name}</h1>
          <p style={{ margin: 0, color: '#6F6459' }}>{r.addr} · <Link to={`/restoran/${r.id}`} style={{ color: '#B4530A', fontWeight: 700 }}>Mekân sayfasını gör →</Link></p>
        </div>
        {sahip.length > 1 && (
          <select value={r.id} onChange={(e) => setSeciliId(e.target.value)} aria-label="Mekân seç" className="gw-pn-sec">{sahip.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        )}
      </div>

      <div className="gw-pn-tab" role="tablist" aria-label="Panel bölümleri">
        {SEKMELER.map(([k, ad]) => (
          <button key={k} role="tab" aria-selected={sekme === k} className={sekme === k ? 'on' : ''} onClick={() => setSp({ sekme: k })}>
            {ad}{k === 'talepler' && talepler.filter((t) => t.durum === 'bekliyor').length > 0 && <i>{talepler.filter((t) => t.durum === 'bekliyor').length}</i>}
          </button>
        ))}
      </div>

      {depo.riza !== 'kabul' && (
        <p className="gw-demo" role="note" style={{ margin: '0 0 16px' }}>
          <b>Ziyaretçi ölçümleme izni kapalı.</b> Etkileşimler yalnızca ziyaretçi (müşteri) izin verdiyse sayılır; bu, işletme hesabından bağımsız müşteri ayarıdır. <Link to="/profil" style={{ color: '#B4530A', fontWeight: 700 }}>Müşteri profilinden aç</Link>.
        </p>
      )}

      {sekme === 'genel' && (
        <>
          <div className="gw-kpi">
            {METRIKLER.slice(0, 4).map((m) => (
              <div key={m.tip} className="gw-kpi-k" style={{ boxShadow: `inset 0 3px 0 ${m.renk}` }}>
                <span><Icon n={m.ikon} size={14} color={m.renk} /> {m.ad}</span>
                <b>{sayi(olay.toplam[m.tip])}</b>
                <small>son 7 gün: {sayi(son7Top(m.tip))}</small>
              </div>
            ))}
          </div>

          <div className="gw-pn-iki">
            <section className="gw-pn-kart">
              <h2>Son 7 gün</h2>
              <div className="gw-chart" role="img" aria-label={`Son 7 günün kart gösterimi, sayfa görüntüleme ve kaydedilme grafiği. Toplam: ${son7Top('kart_gosterim')} gösterim, ${son7Top('goruntulenme')} görüntüleme, ${son7Top('kaydet')} kaydedilme.`}>
                {gunler.map((g) => (
                  <div key={g.anahtar} className="gw-chart-g">
                    <div className="gw-chart-b">
                      {[['kart_gosterim', C3.g], ['goruntulenme', C3.u], ['kaydet', C3.r]].map(([tip, renk]) => (
                        <i key={tip} title={`${g.ad}: ${g.v[tip] || 0}`} style={{ height: `${((g.v[tip] || 0) / maks) * 100}%`, background: renk }} />
                      ))}
                    </div>
                    <span>{g.ad}</span>
                  </div>
                ))}
              </div>
              <p className="gw-chart-leg"><span style={{ background: C3.g }} />Kart gösterimi <span style={{ background: C3.u }} />Sayfa görüntüleme <span style={{ background: C3.r }} />Kaydedilme</p>
            </section>
            <section className="gw-pn-kart">
              <h2>Dönüşüm</h2>
              {[['Gösterim → sayfa görüntüleme', olay.toplam.goruntulenme || 0, kart, C3.u], ['Gösterim → kaydedilme', olay.toplam.kaydet || 0, kart, C3.r], ['Sayfa görüntüleme → kaydedilme', olay.toplam.kaydet || 0, olay.toplam.goruntulenme || 0, C3.g]].map(([ad, a, b, renk]) => (
                <div key={ad} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>{ad}</span><b>{oran(a, b)}</b></div>
                  <div className="gw-bar"><i style={{ width: b > 0 ? `${Math.min(100, (a / b) * 100)}%` : 0, background: renk }} /></div>
                </div>
              ))}
              <p style={{ margin: 0, fontSize: 13, color: '#6F6459' }}>Oranlar bu tarayıcıdaki etkileşimlerden hesaplanır. Sunucu bağlanınca tüm kullanıcıların verisiyle çalışır.</p>
            </section>
          </div>

          <section className="gw-pn-kart">
            <h2>Bu veriler ne işinize yarar?</h2>
            <div className="gw-reasons" style={{ margin: 0 }}>
              {[['Kaydedilme düşükse', 'Fotoğraf, açıklama ve fiyat aralığınızı güncelleyin; kart gösterimi yüksekken kaydedilme düşükse kart ilgi çekmiyordur.'], ['Yol tarifi arttıysa', 'Mekâna gelmeye niyetli kullanıcı var: çalışma saatlerinizin ve adresinizin güncel olduğundan emin olun.'], ['İletişim tıklaması varsa', 'Sosyal medyanıza ya da web sitenize geçen kullanıcı var: hesaplarınızın güncel olduğundan emin olun.']].map(([b, m]) => (
                <div key={b}><b>{b}</b><p style={{ margin: '4px 0 0', color: '#4A443E', fontSize: 14 }}>{m}</p></div>
              ))}
            </div>
          </section>
        </>
      )}

      {sekme === 'etkilesim' && (
        <section className="gw-pn-kart">
          <h2>Tüm etkileşimler</h2>
          <div className="gw-tablo" role="table" aria-label="Etkileşimler">
            <div className="gw-tablo-h" role="row"><span>Etkileşim</span><span>Toplam</span><span>Son 7 gün</span><span>Ne anlama gelir?</span></div>
            {METRIKLER.map((m) => (
              <div key={m.tip} className="gw-tablo-s" role="row">
                <span><i style={{ background: m.renk }} />{m.ad}<small>{m.aciklama}</small></span>
                <b>{sayi(olay.toplam[m.tip])}</b><b>{sayi(son7Top(m.tip))}</b><span style={{ color: '#4A443E' }}>{m.ne}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: '#6F6459' }}>Kaydedilme oranı: <b>{oran(olay.toplam.kaydet || 0, kart)}</b> · Yalnızca ölçümleme izni veren kullanıcıların işlemleri sayılır; kişisel kimlik gösterilmez.</p>
        </section>
      )}

      {sekme === 'bilgi' && (
        <form className="gw-pn-kart" onSubmit={kaydet} noValidate>
          <h2>Bilgilerim</h2>
          <p style={{ margin: '0 0 16px', color: '#6F6459', fontSize: 14 }}>Girdiğiniz alan harita kaynağından geleni ezer; boş bıraktığınız alan kaynaktan gelmeye devam eder.</p>
          <div className="gw-pn-form">
            {ALANLAR.map(([k, ad, tip]) => (
              <div key={k} className="gw-afield">
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>{ad}<em className={`gw-kaynak ${kaynakMi(k) ? '' : 'sizden'}`}>{kaynakMi(k) ? 'Harita kaynağı' : 'Sizden'}</em></span>
                {k === 'desc'
                  ? <textarea rows={3} value={alanDeger(k)} onChange={(e) => setTaslak((t) => ({ ...t, [k]: e.target.value }))} style={{ border: '1.5px solid rgba(0,0,0,.14)', borderRadius: 14, padding: '14px 16px', fontSize: 15, width: '100%', fontFamily: F }} />
                  : <input type={tip} value={alanDeger(k)} onChange={(e) => setTaslak((t) => ({ ...t, [k]: e.target.value }))} />}
              </div>
            ))}
          </div>
          {kaydedildi && <p role="status" style={{ color: '#0A7C46', fontWeight: 600, margin: '0 0 12px' }}>{kaydedildi}</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" style={tgoPill(true)} disabled={!Object.keys(taslak).length}>Kaydet</button>
            <button type="button" style={tgoPill(false)} onClick={() => { profilSil(r.id); setTaslak({}); setKaydedildi('Girdiğiniz alanlar silindi; kaynak bilgileri gösteriliyor.'); }}>Tüm alanları kaynağa döndür</button>
          </div>
        </form>
      )}

      {sekme === 'paketler' && <PaketlerSekmesi r={r} />}
      {sekme === 'kampanya' && <KampanyaSekmesi r={r} />}

      {sekme === 'talepler' && (
        <section className="gw-pn-kart">
          <h2>Masa talepleri</h2>
          {talepler.length === 0 ? (
            <p style={{ color: '#6F6459' }}>Henüz masa talebi yok. Kullanıcılar mekân sayfanızdan “Masa ayırt”a bastığında talep buraya düşer. Masa ayırtma ücretsizdir; komisyon alınmaz.</p>
          ) : talepler.map((t) => (
            <div key={t.id} className="gw-talep">
              <div style={{ flex: 1 }}><b>{t.kisi} kişilik masa talebi</b><div style={{ fontSize: 13, color: '#6F6459' }}>{new Date(t.tarih).toLocaleString('tr-TR')}</div></div>
              {t.durum === 'bekliyor' ? (
                <>
                  <button style={tgoPill(true, { padding: '9px 18px', fontSize: 14 })} onClick={() => talepKarar(t.id, 'onaylandi')}>Onayla</button>
                  <button style={tgoPill(false, { padding: '9px 18px', fontSize: 14 })} onClick={() => talepKarar(t.id, 'reddedildi')}>Reddet</button>
                </>
              ) : <span className={`gw-durum ${t.durum === 'onaylandi' ? 'ok' : ''}`}>{t.durum === 'onaylandi' ? 'Onaylandı' : 'Reddedildi'}</span>}
            </div>
          ))}
        </section>
      )}
    </>,
  );
}
