// Yönetici kimliği (bu tarayıcıda): { kullanici, telefon, tuz, iter, hash, totp? } — şifre ÖZET olarak, düz yazı olarak değil.
// totp = Authenticator gizli anahtarı. Bu tarayıcıda saklandığı için gerçek güvenlik değildir (bkz. src/lib/otp.js).
export const ANAHTAR = 'gur.admin.kimlik.v1';
export const OTURUM = 'gur.admin.oturum';
export const kimlikOku = () => { try { return JSON.parse(localStorage.getItem(ANAHTAR)); } catch { return null; } };
export const kimlikYaz = (k) => localStorage.setItem(ANAHTAR, JSON.stringify(k));
