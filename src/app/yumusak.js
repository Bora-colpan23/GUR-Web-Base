// Yumuşak hareket katmanı. Temel düzen, renk ve içerik DEĞİŞMEZ; yalnızca geçişler ve etkileşim hissi.
//
// Dil (referans videodan): çok açık nötr zemin, büyük yuvarlak beyaz yüzeyler, ince katmanlı gölge. Bir adımdan ötekine geçerken içerik
// bulanıkken netleşir, hafif küçükten oturur ve yukarı yükselir; seçili/aktif öğe yay gibi (spring) "pop" yapar; basınca küçülür,
// bırakınca yaylanarak döner; listeler tek tek, kademeli belirir.
//
// Kurallar: yalnızca transform / opacity / filter (yerleşimi bozmaz). `both` DEĞİL `backwards` dolgu kullanılır: biten animasyon
// transform'u tutarsa üzerine gelince yükselme (hover) çalışmaz. Hareket azaltıldığında hepsi kapanır.

export const YUMUSAK_CSS = `
  /* ── Sayfa geçişi: bulanıktan netleşme + hafif ölçek + yükselme ── */
  @keyframes ymGecis { from { opacity:0; transform:translateY(16px) scale(.985); filter:blur(8px); } to { opacity:1; transform:none; filter:none; } }
  @keyframes ymYuksel { from { opacity:0; transform:translateY(14px) scale(.98); filter:blur(4px); } to { opacity:1; transform:none; filter:none; } }
  @keyframes ymPop { 0% { transform:scale(.9); } 55% { transform:scale(1.06); } 100% { transform:scale(1); } }
  @keyframes ymModal { from { opacity:0; transform:translateY(18px) scale(.95); filter:blur(10px); } to { opacity:1; transform:none; filter:none; } }
  .gw-kok, .gw-page { animation:ymGecis .62s var(--ease-out) backwards; }
  .gw-kok { animation-duration:.5s; } .gw-kok.kabuk { animation:none; }

  /* ── Listeler ve kart ızgaraları: kademeli giriş (ilk 12) ── */
  .ga-liste > *, .ga-hscroll > *, .gw-grid > *, .gw-reasons > *, .pk-grid > *, .gm-list > * { animation:ymYuksel .6s var(--ease-out) backwards; }
  .ga-liste > *:nth-child(1), .ga-hscroll > *:nth-child(1), .gw-grid > *:nth-child(1), .gw-reasons > *:nth-child(1), .pk-grid > *:nth-child(1), .gm-list > *:nth-child(1) { animation-delay:.04s; }
  .ga-liste > *:nth-child(2), .ga-hscroll > *:nth-child(2), .gw-grid > *:nth-child(2), .gw-reasons > *:nth-child(2), .pk-grid > *:nth-child(2), .gm-list > *:nth-child(2) { animation-delay:.08s; }
  .ga-liste > *:nth-child(3), .ga-hscroll > *:nth-child(3), .gw-grid > *:nth-child(3), .gw-reasons > *:nth-child(3), .pk-grid > *:nth-child(3), .gm-list > *:nth-child(3) { animation-delay:.12s; }
  .ga-liste > *:nth-child(4), .ga-hscroll > *:nth-child(4), .gw-grid > *:nth-child(4), .gw-reasons > *:nth-child(4), .pk-grid > *:nth-child(4), .gm-list > *:nth-child(4) { animation-delay:.16s; }
  .ga-liste > *:nth-child(5), .ga-hscroll > *:nth-child(5), .gw-grid > *:nth-child(5), .gw-reasons > *:nth-child(5), .pk-grid > *:nth-child(5), .gm-list > *:nth-child(5) { animation-delay:.2s; }
  .ga-liste > *:nth-child(6), .ga-hscroll > *:nth-child(6), .gw-grid > *:nth-child(6), .gw-reasons > *:nth-child(6), .pk-grid > *:nth-child(6), .gm-list > *:nth-child(6) { animation-delay:.24s; }
  .ga-liste > *:nth-child(n+7), .ga-hscroll > *:nth-child(n+7), .gw-grid > *:nth-child(n+7), .gw-reasons > *:nth-child(n+7), .pk-grid > *:nth-child(n+7), .gm-list > *:nth-child(n+7) { animation-delay:.28s; }

  /* ── Aktif / seçili öğe: yay gibi "pop" (sınıf eklenince bir kez çalışır) ── */
  .gw-kchip.on, .gm-chip.on, .gw-mah-chip.on, .gw-ilce.on, .gw-tab.on, .gw-link.active, .gy-tabs .on, .gpr-tabs .on, .gw-pn-tab .on, .gw-bk-tab .on, .ga-noktalar .on { animation:ymPop .5s var(--ease-out); }
  .gw-kchip, .gm-chip, .gw-mah-chip, .gy-tabs button, .gpr-tabs button, .gw-pn-tab button, .gw-bk-tab button { transition:transform .5s var(--spring), background-color .28s var(--ease-out), color .28s var(--ease-out), border-color .28s var(--ease-out), box-shadow .3s var(--ease-out); }
  .gw-kchip.on, .gm-chip.on { box-shadow:0 8px 20px rgba(255,102,0,.28); }
  /* Seçili sekme çizgisi soluk bir uzantıyla yerine oturur */
  .gpr-tabs button, .gw-pn-tab button { transition:color .25s var(--ease-out), border-color .3s var(--ease-out), transform .5s var(--spring); }

  /* ── Birincil düğmeler: basınca içeri, bırakınca yay; üstüne gelince hafif yükselme ── */
  .ga-hap, .gp-dugme, .gw-yuvarlak, .gm-hap { transition:transform .5s var(--spring), box-shadow .3s var(--ease-out), filter .25s, background-color .25s; will-change:transform; }
  .ga-hap:active, .gm-hap:active, .gw-yuvarlak:active { transform:scale(.95); transition-duration:.08s; box-shadow:0 2px 6px rgba(255,102,0,.2); }

  /* ── Yüzeyler: daha yumuşak, katmanlı gölge ── */
  .gw-hover, .ga-pop, .gm-row, .gy-kart, .gpr-satir { box-shadow:0 1px 2px rgba(0,0,0,.03), 0 8px 24px rgba(0,0,0,.045) !important; }
  .gw-hover:hover, .ga-pop:hover { box-shadow:0 2px 4px rgba(0,0,0,.04), 0 18px 44px rgba(0,0,0,.10) !important; }
  .gpr-satir { box-shadow:none !important; }

  /* ── Pencere ve panel açılışı: bulanıkken netleşme ── */
  .ga-modal-k, .gm-modal-k, .gw-modal > div:not(.gw-scrim) { animation:ymModal .5s var(--ease-out) backwards; }
  .ga-modal, .gm-modal { animation:scrim .3s var(--ease-out) backwards; backdrop-filter:blur(14px) saturate(140%); -webkit-backdrop-filter:blur(14px) saturate(140%); }

  /* ── Karuselde slayt değişimi de yumuşak ── */
  .ga-slayt { animation:ymGecis .55s var(--ease-out) backwards !important; }

  @media (prefers-reduced-motion: reduce) {
    .gw-kok, .gw-page, .ga-liste > *, .ga-hscroll > *, .gw-grid > *, .gw-reasons > *, .pk-grid > *, .gm-list > *, .ga-modal-k, .gm-modal-k, .ga-slayt { animation:none !important; }
    .gw-kchip.on, .gm-chip.on, .gw-tab.on, .gy-tabs .on, .gpr-tabs .on, .gw-pn-tab .on { animation:none; }
  }
`;
