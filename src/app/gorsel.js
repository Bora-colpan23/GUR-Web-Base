// Görseli tarayıcıda küçültüp data URL'e çevirir (tarayıcı depolama kotası ~5 MB; küçültmeden birkaç görsel kotayı doldurur).
export function gorselKucult(dosya, en = 1400) {
  return new Promise((coz, red) => {
    if (!dosya.type.startsWith('image/')) { red(new Error('Yalnızca görsel dosyası yükleyin.')); return; }
    const o = new FileReader();
    o.onerror = () => red(new Error('Dosya okunamadı.'));
    o.onload = () => {
      const im = new Image();
      im.onerror = () => red(new Error('Görsel açılamadı.'));
      im.onload = () => {
        const k = Math.min(1, en / im.width);
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        coz(c.toDataURL('image/jpeg', 0.78));
      };
      im.src = o.result;
    };
    o.readAsDataURL(dosya);
  });
}