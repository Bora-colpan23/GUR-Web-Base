import React from 'react';
import { useGelir } from '../app/webStore.js';
import { AD_PRODUCTS, AD_KEYS, PAKETLER, TL } from '../app/gelirKatalog.js';

// Finansal yapı: gelirin kimden, hangi kalemden geldiği; neyin henüz olmadığı.
// Rakamlar gelirKatalog.js'ten okunur (tek kaynak). Canlı kutusu yalnızca bu tarayıcıdaki yerel önizleme verisidir.
export default function FinansPage({ C }) {
  const gelir = useGelir();
  const kart = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 16 };
  const h3 = { margin: '0 0 6px', fontSize: 15, fontWeight: 700 };
  const alt = { margin: '0 0 16px', fontSize: 13, color: C.dim, lineHeight: 1.55 };
  const th = { textAlign: 'left', fontSize: 11, color: C.faint, fontWeight: 600, padding: '8px 10px', borderBottom: `1px solid ${C.border}` };
  const td = { fontSize: 13, padding: '12px 10px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' };
  const etiket = (renk, soft, m) => <span style={{ fontSize: 11, fontWeight: 700, color: renk, background: soft, borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>{m}</span>;

  const onayli = gelir.rezervasyonlar.filter((r) => r.durum === 'onaylandi');
  const bekleyen = gelir.rezervasyonlar.filter((r) => r.durum === 'bekliyor');
  const kabul = gelir.teklifler.filter((t) => t.durum === 'kabul');
  const bekleyenTeklif = gelir.hizmetTalepleri.filter((t) => t.durum === 'acik' || t.durum === 'teklif').length;
  const toplam = onayli.reduce((a, r) => a + r.tutar, 0) + kabul.reduce((a, t) => a + t.tutar, 0);

  return (
    <div style={{ animation: 'fadeIn 0.2s' }}>
      <div style={{ ...kart, borderColor: 'rgba(210,153,34,.4)', background: C.yellowSoft }}>
        <b style={{ fontSize: 13 }}>Tasarım düzeyi.</b>
        <span style={{ fontSize: 13, color: C.dim }}> Tahsilat yok: ödeme altyapısı bağlı değil. Aşağıdaki fiyatlar tasarım kararıdır, pazarda test edilmedi.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 }}>
        {[
          ['Onaylı reklam bedeli', TL(onayli.reduce((a, r) => a + r.tutar, 0)), `${onayli.length} onaylı rezervasyon`, C.green],
          ['Kabul edilen teklifler', TL(kabul.reduce((a, t) => a + t.tutar, 0)), `${kabul.length} paket`, C.orange],
          ['Bekleyen iş', `${bekleyen.length + bekleyenTeklif}`, `${bekleyen.length} reklam talebi · ${bekleyenTeklif} teklif`, C.blue],
        ].map(([b, v, a, r]) => (
          <div key={b} style={{ ...kart, marginBottom: 0, boxShadow: `inset 0 3px 0 ${r}` }}>
            <div style={{ fontSize: 12, color: C.dim }}>{b}</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            <div style={{ fontSize: 12, color: C.faint }}>{a}</div>
          </div>
        ))}
      </div>
      <p style={{ margin: '-4px 2px 16px', fontSize: 12, color: C.faint }}>Üstteki üç kutu yalnızca bu tarayıcının yerel önizleme verisinden gelir (toplam {TL(toplam)}). Gerçek müşteri ve tahsilat yok.</p>

      <div style={kart}>
        <h3 style={h3}>1 · İşletmeler (B2B): satın aldıkları kalemler</h3>
        <p style={alt}>İşletme aboneliği yok (Premium/Pro kaldırıldı). Rezervasyon komisyonu yok; masa ayırtma ücretsiz. İşletmenin ödediği tutar yalnızca satın aldığı kalemlerden oluşur. Bedel = günlük fiyat × gün sayısı ve rezervasyon anında donar. Satın alma doğrudan değildir: işletme tarih seçer, talep yönetime düşer, onaylanınca slot kilitlenir.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Model</th><th style={th}>Kalem</th><th style={th}>Fiyat</th><th style={th}>Nasıl satılıyor</th></tr></thead>
          <tbody>
            {AD_KEYS.map((k, i) => { const p = AD_PRODUCTS[k]; return (
              <tr key={k}>
                <td style={td}>{i === 0 && etiket(C.green, C.greenSoft, 'Sabit fiyat (günlük)')}</td>
                <td style={{ ...td, fontWeight: 600 }}>{p.ad}</td>
                <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{TL(p.gunluk)} / gün</td>
                <td style={{ ...td, color: C.dim }}>1–{p.maksGun} gün; {p.kural}</td>
              </tr>
            ); })}
            {PAKETLER.map((p, i) => (
              <tr key={p.key}>
                <td style={td}>{i === 0 && etiket(C.orange, C.orangeSoft, 'Pazarlıklı (teklifle)')}</td>
                <td style={{ ...td, fontWeight: 600 }}>{p.ad}</td>
                <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{p.liste ? `${TL(p.liste)} ${p.birim} (liste)` : 'Liste fiyatı yok'}</td>
                <td style={{ ...td, color: C.dim }}>İşletme teklif ister, yönetici fiyatlar, işletme kabul/ret eder.</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ ...alt, margin: '14px 0 0' }}>Yönetici fiyatları panelden değiştirebilir. Liste fiyatı değişse de gönderilmiş teklif ve onaylı rezervasyon bedeli değişmez.</p>
      </div>

      <div style={kart}>
        <h3 style={h3}>2 · Sponsorlu kartlar (açık artırma) {etiket(C.blue, C.blueSoft, 'web’de yerel simülasyon')}</h3>
        <p style={{ ...alt, margin: 0 }}>Reklam veren kampanya açar ve teklifini CPC (tıklama başı: detay açılınca) ya da CPE (etkileşim başı: kaydedilince) verir. Sıralama teklif × kalite puanıyla yapılır; kart kaydırma akışına 5–7 kartta bir, aynı kullanıcıya bir kez, “Sponsorlu” etiketiyle karışır. Bütçe bitince kampanya durur. Web’de işletme panelindeki “Sponsorlu kartlar” sekmesinden kampanya açılır; onay ve harcama simüledir, tahsilat yok. Şu an {gelir.kampanyalar.length} kampanya ({gelir.kampanyalar.filter((k) => k.durum === 'aktif').length} yayında), toplam harcama {TL(gelir.kampanyalar.reduce((a, k) => a + k.harcanan, 0))}.</p>
      </div>

      <div style={kart}>
        <h3 style={h3}>3 · Tüketici tarafı: abonelik yok</h3>
        <ul style={{ ...alt, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          <li><b style={{ color: C.text }}>Tüketiciden ücret alınmaz.</b> GUR Plus aboneliği kaldırıldı; kullanıcı gelir kaynağı değil, reklamın ulaştığı kitledir.</li>
          <li><b style={{ color: C.text }}>Ödüllü video:</b> günlük ücretsiz kota 40 kaydırma; kota dolunca kullanıcı reklam izleyip 5 kaydırma kazanır (web ve mobil). Onaylı Ödüllü Video rezervasyonu olan restoranın reklamı gösterilir ve o restoranın ödediği ücret gelir olur; yoksa Google reklamı yer tutucusu çıkar (AdSense bağlı değil, gelir yok). Webde reklam video değil, restoranın fotoğraflı kartıdır (8 sn); kullanıcıya aynı reklam bir kez gösterilir, Vazgeç her zaman açıktır.</li>
          <li><b style={{ color: C.text }}>Kaydırma akışında reklam (fikir aşaması):</b> yemek ve restoran reklamlarının kaydırma sırasında arada çıkması; yukarıdaki sponsorlu kart modeli buna zemin oluyor. Web’de henüz yok.</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <div style={kart}>
          <h3 style={h3}>Henüz olmayanlar</h3>
          <ul style={{ ...alt, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li><b style={{ color: C.text }}>Ödeme altyapısı yok</b> (iyzico/Stripe). Ücretli özellikler arayüzde var, tahsilat yok.</li>
            <li><b style={{ color: C.text }}>Google reklam entegrasyonu yok.</b> Ödüllü videodaki Google yedeği yer tutucu; AdSense/AdMob birimi bağlanmadı.</li>
            <li><b style={{ color: C.text }}>Maliyet tarafı yok:</b> barındırma (Railway/PostgreSQL), harita ve veri kaynağı ücretleri, şef çekimi maliyeti.</li>
            <li>Yönetici kararları (reklam onayı, teklif) web önizlemesinde “simüle” düğmeleriyle yapılır; gerçek akış sunucu ister.</li>
          </ul>
        </div>
        <div style={kart}>
          <h3 style={h3}>Dikkat edilecek iki nokta</h3>
          <ul style={{ ...alt, margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li><b style={{ color: C.text }}>Birim ekonomisi hesaplanmadı.</b> Banner günlüğü {TL(AD_PRODUCTS.bannerAds.gunluk)}, ödüllü video günlüğü {TL(AD_PRODUCTS.rewardedAds.gunluk)} gibi rakamların pazarda kabul görüp görmeyeceği test edilmedi.</li>
            <li><b style={{ color: C.text }}>Veri kaynağı riski:</b> 218 restoranlık liste Google Maps taramasıyla geldi. Google’ın koşulları taramayı ve puan/yorum verisinin kalıcı saklanmasını kısıtlıyor; gelir getiren bir ürün için yayına almadan önce resmi koşullardan teyit edin.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
