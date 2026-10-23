// Ortak doğrulama altyapısı: şifre özeti (PBKDF2), telefon SMS kodu ve Authenticator (TOTP, RFC 6238).
// Yönetici paneli ve işletme girişi aynı altyapıyı kullanır.
//
// DÜRÜSTLÜK
//  • SMS: gerçek gönderim sunucu + SMS sağlayıcısı ister. VITE_OTP_API (ya da eski adıyla VITE_ADMIN_OTP_API) tanımlıysa kodu SUNUCU üretir,
//    SMS'i sunucu yollar ve doğrulamayı sunucu yapar (bu dosya kodu hiç bilmez). Tanımlı değilse "yerel önizleme": kod ekranda etiketli
//    gösterilir, SMS GİTMEZ.
//  • TOTP: Microsoft Authenticator, Google Authenticator vb. ile gerçekten çalışır (standart 6 hane / 30 sn / SHA-1). Ama gizli anahtar
//    bu tarayıcıda saklanır ve doğrulama burada yapılır; gerçek güvenlik için anahtar ve doğrulama sunucuda olmalıdır.
//
// Sunucu sözleşmesi (taban adres = VITE_OTP_API):
//   POST {api}/gonder   { telefon }        → 200 { ok: true }
//   POST {api}/dogrula  { telefon, kod }   → 200 { ok: true } | 4xx

export const API = (import.meta.env && (import.meta.env.VITE_OTP_API || import.meta.env.VITE_ADMIN_OTP_API)) || '';
// Telefon (SMS) doğrulaması şimdilik KAPALI. Açmak için VITE_TELEFON_DOGRULAMA=1 (SMS sunucusu bağlanınca).
export const TELEFON_ACIK = !!(import.meta.env && import.meta.env.VITE_TELEFON_DOGRULAMA === '1');
export const KOD_OMRU = 5 * 60;   // sn
export const YENIDEN = 30;        // sn
export const HAK = 3;

// ─── şifre özeti ───
export const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
export const bayt = (h) => new Uint8Array(h.match(/.{2}/g).map((x) => parseInt(x, 16)));
export const tuzUret = () => hex(crypto.getRandomValues(new Uint8Array(16)));
export const ITER = 150000;
export async function ozet(sifre, tuzHex, iter = ITER) {
  const anahtar = await crypto.subtle.importKey('raw', new TextEncoder().encode(sifre), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bayt(tuzHex), iterations: iter }, anahtar, 256));
}

// ─── telefon ───
/** 5XX XXX XX XX biçimine normalleştirir; geçersizse null. */
export const telNormal = (s) => { const r = String(s).replace(/\D/g, '').replace(/^(90|0)/, ''); return /^5\d{9}$/.test(r) ? r : null; };
export const telGizli = (t) => `+90 ${t.slice(0, 3)} *** ** ${t.slice(8)}`;
const yeniKod = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
async function apiCagri(yol, govde) {
  const r = await fetch(`${API.replace(/\/$/, '')}${yol}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(govde) });
  return r.ok;
}
/** SMS kodu gönderir. Sunucu varsa kodu bilmeyiz; yoksa yerel önizleme kodu döner. */
export async function smsGonder(telefon) {
  if (API) {
    try { return (await apiCagri('/gonder', { telefon })) ? { ok: true, yerelKod: '' } : { ok: false, neden: 'SMS gönderilemedi. Biraz sonra tekrar deneyin.' }; }
    catch { return { ok: false, neden: 'SMS sunucusuna ulaşılamadı.' }; }
  }
  return { ok: true, yerelKod: yeniKod() };
}
export async function smsDogrula(telefon, kod, yerelKod) {
  if (API) { try { return await apiCagri('/dogrula', { telefon, kod }); } catch { return null; } }   // null = sunucuya ulaşılamadı
  return kod === yerelKod;
}

// ─── TOTP (Authenticator) ───
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function b32Kodla(b) {
  let bits = 0; let v = 0; let s = '';
  for (const x of b) { v = (v << 8) | x; bits += 8; while (bits >= 5) { s += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) s += B32[(v << (5 - bits)) & 31];
  return s;
}
export function b32Coz(s) {
  let bits = 0; let v = 0; const o = [];
  for (const c of s.replace(/=+$/, '').toUpperCase()) { const i = B32.indexOf(c); if (i < 0) continue; v = (v << 5) | i; bits += 5; if (bits >= 8) { o.push((v >>> (bits - 8)) & 255); bits -= 8; } }
  return new Uint8Array(o);
}
export const totpSecretUret = () => b32Kodla(crypto.getRandomValues(new Uint8Array(20)));
export async function totpKod(secret, zamanMs = Date.now()) {
  const sayac = Math.floor(zamanMs / 1000 / 30);
  const m = new ArrayBuffer(8); new DataView(m).setUint32(4, sayac); new DataView(m).setUint32(0, Math.floor(sayac / 2 ** 32));
  const anahtar = await crypto.subtle.importKey('raw', b32Coz(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', anahtar, m));
  const o = h[19] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}
/** Saat sapmasına karşı ±1 aralık (30 sn) kabul edilir. */
export async function totpDogrula(secret, kod) {
  const t = Date.now();
  for (const d of [-30000, 0, 30000]) if ((await totpKod(secret, t + d)) === kod) return true;
  return false;
}
export const otpauthUrl = (hesap, secret, yayinci = 'GUR') => `otpauth://totp/${encodeURIComponent(`${yayinci}:${hesap}`)}?secret=${secret}&issuer=${encodeURIComponent(yayinci)}&algorithm=SHA1&digits=6&period=30`;
