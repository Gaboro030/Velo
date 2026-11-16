// Velo: runs at document start in every page of the window.
// YouTube enforces Trusted Types, so all DOM is built with createElement, never innerHTML.
(() => {
  'use strict';
  // Only YouTube itself. Never Google's sign-in pages, never frames.
  if (!/(^|\.)youtube\.com$/.test(location.hostname) || window.top !== window || window.__velo) return;
  window.__velo = true;
  const VERSION = '0.2.2';

  // ---------- settings ----------
  const KEY = 'velo:settings';
  const DEF = {
    lang: 'system', startPage: 'home',
    ads: true, sponsor: true, markers: true, minLen: 0,
    cat_sponsor: 'auto', cat_selfpromo: 'auto', cat_interaction: 'auto', cat_intro: 'auto',
    cat_outro: 'off', cat_preview: 'off', cat_music_offtopic: 'off', cat_filler: 'off',
    keys: true, seekStep: 5, volStep: 5, speedStep: 0.25,
    k_playPause: 'KeyK', k_seekBack: 'ArrowLeft', k_seekFwd: 'ArrowRight', k_volUp: 'Ctrl+ArrowUp', k_volDown: 'Ctrl+ArrowDown',
    k_mute: 'KeyM', k_speedUp: 'Shift+Period', k_speedDown: 'Shift+Comma', k_speedReset: '', k_fullscreen: 'KeyF',
    k_loop: '', k_skipSeg: 'KeyX', k_openPanel: 'Ctrl+Shift+KeyS',
    speed: 1, quality: 'auto', wheelVolume: false, noIdle: true,
    dislikes: true, shorts: false, comments: false, related: false, endCards: false, infoCards: false, liveChat: false, merch: false, endWall: false,
    toastSkip: true, toastKeys: true, toastTime: 4, toastPos: 'bl',
  };
  const S = { ...DEF, adsBlocked: 0, segSkipped: 0, secSaved: 0 };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const nativeFetch = window.fetch.bind(window);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Open the subscriptions feed once per app start, if chosen.
  try {
    const first = !sessionStorage.getItem('velo:started');
    sessionStorage.setItem('velo:started', '1');
    if (first && S.startPage === 'subs' && location.pathname === '/') location.replace('/feed/subscriptions');
  } catch {}

  // ---------- languages ----------
  const L = {
    de: {
      n_general: 'Allgemein', n_skip: 'Werbung & Segmente', n_keys: 'Tastenkürzel', n_player: 'Player', n_look: 'Aussehen', n_notify: 'Hinweise',
      back: 'Zurück',
      account: 'YouTube-Konto', accountD: 'Melde dich an, um deine Abos und deinen Feed zu sehen', accountIn: 'Du bist angemeldet', signIn: 'Anmelden',
      lang: 'Sprache', system: 'Systemsprache', startPage: 'Startseite', startPageD: 'Was beim Öffnen der App zuerst erscheint', sp_home: 'Start', sp_subs: 'Abos',
      sAds: 'Werbung', sSegs: 'Segmente', sSaved: 'Gespart', resetStats: 'Statistik zurücksetzen', resetAll: 'Alle Einstellungen zurücksetzen', sure: 'Wirklich?',
      credit: 'Segmente von SponsorBlock, Dislikes von Return YouTube Dislike',
      ads: 'Werbung blockieren', adsD: 'Überspringt Videowerbung und blendet Anzeigen aus',
      sponsor: 'Segmente überspringen', sponsorD: 'Nutzt die Zeitmarken der SponsorBlock-Community', subCats: 'Segment-Arten',
      m_auto: 'Auto', m_ask: 'Fragen', m_off: 'Aus',
      c_sponsor: 'Sponsor', cd_sponsor: 'Bezahlte Werbung im Video',
      c_selfpromo: 'Eigenwerbung', cd_selfpromo: 'Eigene Produkte, Merch, Kanal-Werbung',
      c_interaction: 'Abo-Aufruf', cd_interaction: 'Bitte um Like, Abo oder Glocke',
      c_intro: 'Intro', cd_intro: 'Vorspann und Intro-Animation',
      c_outro: 'Outro', cd_outro: 'Abspann und Endkarten',
      c_preview: 'Vorschau', cd_preview: 'Rückblick oder Ausblick auf das Video',
      c_music_offtopic: 'Kein Musikteil', cd_music_offtopic: 'Stellen ohne Musik in Musikvideos',
      c_filler: 'Füllmaterial', cd_filler: 'Abschweifungen und Witze nebenbei',
      markers: 'Markierungen auf der Zeitleiste', markersD: 'Zeigt Segmente farbig im Fortschrittsbalken',
      minLen: 'Mindestlänge', minLenD: 'Kürzere Segmente bleiben stehen',
      keys: 'Tastenkürzel aktiv', keysD: 'Klicke auf ein Feld und drücke die neue Taste. Entf löscht die Belegung.',
      k_playPause: 'Start / Pause', k_seekBack: 'Zurückspringen', k_seekFwd: 'Vorspringen', k_volUp: 'Lauter', k_volDown: 'Leiser', k_mute: 'Stumm',
      k_speedUp: 'Schneller', k_speedDown: 'Langsamer', k_speedReset: 'Normales Tempo', k_fullscreen: 'Vollbild', k_loop: 'Wiederholen an/aus',
      k_skipSeg: 'Aktuelles Segment überspringen', k_openPanel: 'Einstellungen öffnen',
      subSteps: 'Schrittweiten', seekStep: 'Sprungweite', volStep: 'Lautstärke-Schritt', speedStep: 'Tempo-Schritt',
      press: 'Taste drücken …', unbound: 'Nicht belegt', space: 'Leertaste', ctrl: 'Strg',
      speed: 'Standard-Tempo', speedD: 'Gilt für jedes neue Video', quality: 'Standard-Qualität', qualityD: 'Nimmt die nächstbeste, wenn es sie nicht gibt', q_auto: 'Automatisch',
      wheelVolume: 'Lautstärke per Mausrad', wheelVolumeD: 'Scrollen über dem Video ändert die Lautstärke',
      noIdle: 'Nie nachfragen, ob du noch schaust', noIdleD: 'Verhindert die Pause nach langer Zeit ohne Eingabe',
      dislikes: 'Dislikes anzeigen', dislikesD: 'Zahl neben dem Daumen nach unten', subHide: 'Ausblenden',
      shorts: 'Shorts', shortsD: 'Auf Startseite, in Suche und Menü', comments: 'Kommentare', related: 'Vorschläge neben dem Video',
      endCards: 'Endkarten im Video', infoCards: 'Infokarten und Produkt-Hinweise', liveChat: 'Livechat', merch: 'Merch- und Ticket-Leisten', endWall: 'Vorschläge nach dem Video',
      toastSkip: 'Hinweis beim Überspringen', toastSkipD: 'Kleines Fenster im Video mit „Rückgängig“',
      toastKeys: 'Hinweis bei Tastenkürzeln', toastKeysD: 'Zeigt Lautstärke, Tempo und Sprünge kurz an',
      toastTime: 'Anzeigedauer', toastPos: 'Position', p_bl: 'Unten links', p_br: 'Unten rechts', p_tl: 'Oben links', p_tr: 'Oben rechts',
      skipped: '{c} übersprungen', undo: 'Rückgängig', skip: 'Überspringen', open: 'Velo-Einstellungen',
      o_play: 'Wiedergabe', o_pause: 'Pause', o_muted: 'Stumm', o_unmuted: 'Ton an', o_vol: 'Lautstärke', o_loopOn: 'Wiederholen an', o_loopOff: 'Wiederholen aus',
    },
    en: {
      n_general: 'General', n_skip: 'Ads & segments', n_keys: 'Shortcuts', n_player: 'Player', n_look: 'Appearance', n_notify: 'Notices',
      back: 'Back',
      account: 'YouTube account', accountD: 'Sign in to see your subscriptions and feed', accountIn: 'You are signed in', signIn: 'Sign in',
      lang: 'Language', system: 'System language', startPage: 'Start page', startPageD: 'What shows first when the app opens', sp_home: 'Home', sp_subs: 'Subscriptions',
      sAds: 'Ads', sSegs: 'Segments', sSaved: 'Saved', resetStats: 'Reset statistics', resetAll: 'Reset all settings', sure: 'Are you sure?',
      credit: 'Segments by SponsorBlock, dislikes by Return YouTube Dislike',
      ads: 'Block ads', adsD: 'Skips video ads and hides ad slots',
      sponsor: 'Skip segments', sponsorD: 'Uses timestamps from the SponsorBlock community', subCats: 'Segment types',
      m_auto: 'Auto', m_ask: 'Ask', m_off: 'Off',
      c_sponsor: 'Sponsor', cd_sponsor: 'Paid promotion inside the video',
      c_selfpromo: 'Self-promotion', cd_selfpromo: 'Own products, merch, channel plugs',
      c_interaction: 'Subscribe reminder', cd_interaction: 'Requests to like, subscribe or ring the bell',
      c_intro: 'Intro', cd_intro: 'Opening titles and intro animation',
      c_outro: 'Outro', cd_outro: 'Credits and end cards',
      c_preview: 'Preview', cd_preview: 'Recap or teaser of the video',
      c_music_offtopic: 'Non-music part', cd_music_offtopic: 'Parts without music in music videos',
      c_filler: 'Filler', cd_filler: 'Tangents and side jokes',
      markers: 'Markers on the timeline', markersD: 'Shows segments in colour on the progress bar',
      minLen: 'Minimum length', minLenD: 'Shorter segments are left alone',
      keys: 'Shortcuts enabled', keysD: 'Click a field and press the new key. Delete clears the binding.',
      k_playPause: 'Play / pause', k_seekBack: 'Jump back', k_seekFwd: 'Jump forward', k_volUp: 'Volume up', k_volDown: 'Volume down', k_mute: 'Mute',
      k_speedUp: 'Faster', k_speedDown: 'Slower', k_speedReset: 'Normal speed', k_fullscreen: 'Fullscreen', k_loop: 'Toggle loop',
      k_skipSeg: 'Skip current segment', k_openPanel: 'Open settings',
      subSteps: 'Step sizes', seekStep: 'Jump size', volStep: 'Volume step', speedStep: 'Speed step',
      press: 'Press a key …', unbound: 'Not set', space: 'Space', ctrl: 'Ctrl',
      speed: 'Default speed', speedD: 'Applies to every new video', quality: 'Default quality', qualityD: 'Falls back to the next best one', q_auto: 'Automatic',
      wheelVolume: 'Volume with the mouse wheel', wheelVolumeD: 'Scrolling over the video changes the volume',
      noIdle: 'Never ask if you are still watching', noIdleD: 'Prevents the pause after a long time without input',
      dislikes: 'Show dislikes', dislikesD: 'Count next to the thumbs-down button', subHide: 'Hide',
      shorts: 'Shorts', shortsD: 'On home, in search and the menu', comments: 'Comments', related: 'Suggestions next to the video',
      endCards: 'End cards in the video', infoCards: 'Info cards and product hints', liveChat: 'Live chat', merch: 'Merch and ticket shelves', endWall: 'Suggestions after the video',
      toastSkip: 'Notice when skipping', toastSkipD: 'Small box in the video with “Undo”',
      toastKeys: 'Notice for shortcuts', toastKeysD: 'Briefly shows volume, speed and jumps',
      toastTime: 'Display time', toastPos: 'Position', p_bl: 'Bottom left', p_br: 'Bottom right', p_tl: 'Top left', p_tr: 'Top right',
      skipped: '{c} skipped', undo: 'Undo', skip: 'Skip', open: 'Velo settings',
      o_play: 'Play', o_pause: 'Pause', o_muted: 'Muted', o_unmuted: 'Sound on', o_vol: 'Volume', o_loopOn: 'Loop on', o_loopOff: 'Loop off',
    },
    tr: {
      n_general: 'Genel', n_skip: 'Reklam ve bölümler', n_keys: 'Kısayollar', n_player: 'Oynatıcı', n_look: 'Görünüm', n_notify: 'Bildirimler',
      back: 'Geri',
      account: 'YouTube hesabı', accountD: 'Aboneliklerini ve akışını görmek için oturum aç', accountIn: 'Oturum açık', signIn: 'Oturum aç',
      lang: 'Dil', system: 'Sistem dili', startPage: 'Başlangıç sayfası', startPageD: 'Uygulama açılınca ilk görünen sayfa', sp_home: 'Ana sayfa', sp_subs: 'Abonelikler',
      sAds: 'Reklam', sSegs: 'Bölüm', sSaved: 'Kazanılan', resetStats: 'İstatistikleri sıfırla', resetAll: 'Tüm ayarları sıfırla', sure: 'Emin misin?',
      credit: 'Bölümler: SponsorBlock, beğenmeme sayıları: Return YouTube Dislike',
      ads: 'Reklamları engelle', adsD: 'Video reklamlarını atlar, reklam alanlarını gizler',
      sponsor: 'Bölümleri atla', sponsorD: 'SponsorBlock topluluğunun zaman damgalarını kullanır', subCats: 'Bölüm türleri',
      m_auto: 'Otomatik', m_ask: 'Sor', m_off: 'Kapalı',
      c_sponsor: 'Sponsor', cd_sponsor: 'Videodaki ücretli tanıtım',
      c_selfpromo: 'Tanıtım', cd_selfpromo: 'Kendi ürünleri, kanal tanıtımı',
      c_interaction: 'Abone çağrısı', cd_interaction: 'Beğen, abone ol veya zil hatırlatması',
      c_intro: 'Giriş', cd_intro: 'Açılış ve giriş animasyonu',
      c_outro: 'Kapanış', cd_outro: 'Jenerik ve bitiş kartları',
      c_preview: 'Önizleme', cd_preview: 'Videonun özeti veya tanıtımı',
      c_music_offtopic: 'Müzik dışı', cd_music_offtopic: 'Müzik videolarında müziksiz kısımlar',
      c_filler: 'Dolgu', cd_filler: 'Konu dışı sohbet ve şakalar',
      markers: 'Zaman çizgisinde işaretler', markersD: 'Bölümleri ilerleme çubuğunda renkli gösterir',
      minLen: 'En kısa süre', minLenD: 'Daha kısa bölümler atlanmaz',
      keys: 'Kısayollar açık', keysD: 'Bir alana tıkla ve yeni tuşa bas. Delete atamayı siler.',
      k_playPause: 'Oynat / duraklat', k_seekBack: 'Geri atla', k_seekFwd: 'İleri atla', k_volUp: 'Sesi aç', k_volDown: 'Sesi kıs', k_mute: 'Sessiz',
      k_speedUp: 'Hızlandır', k_speedDown: 'Yavaşlat', k_speedReset: 'Normal hız', k_fullscreen: 'Tam ekran', k_loop: 'Tekrarı aç/kapat',
      k_skipSeg: 'Geçerli bölümü atla', k_openPanel: 'Ayarları aç',
      subSteps: 'Adım boyutları', seekStep: 'Atlama süresi', volStep: 'Ses adımı', speedStep: 'Hız adımı',
      press: 'Bir tuşa bas …', unbound: 'Atanmadı', space: 'Boşluk', ctrl: 'Ctrl',
      speed: 'Varsayılan hız', speedD: 'Her yeni videoda uygulanır', quality: 'Varsayılan kalite', qualityD: 'Yoksa en yakın alt kalite seçilir', q_auto: 'Otomatik',
      wheelVolume: 'Fare tekerleğiyle ses', wheelVolumeD: 'Video üzerinde kaydırmak sesi değiştirir',
      noIdle: 'İzlemeye devam ediyor musun diye sorma', noIdleD: 'Uzun süre işlem yapılmayınca duraklatmayı önler',
      dislikes: 'Beğenmeme sayısını göster', dislikesD: 'Beğenmeme düğmesinin yanındaki sayı', subHide: 'Gizle',
      shorts: 'Shorts', shortsD: 'Ana sayfa, arama ve menüde', comments: 'Yorumlar', related: 'Videonun yanındaki öneriler',
      endCards: 'Videodaki bitiş kartları', infoCards: 'Bilgi kartları ve ürün ipuçları', liveChat: 'Canlı sohbet', merch: 'Ürün ve bilet rafları', endWall: 'Video sonundaki öneriler',
      toastSkip: 'Atlanınca bildirim', toastSkipD: 'Videoda “Geri al” düğmeli küçük kutu',
      toastKeys: 'Kısayol bildirimi', toastKeysD: 'Ses, hız ve atlamaları kısaca gösterir',
      toastTime: 'Gösterim süresi', toastPos: 'Konum', p_bl: 'Sol alt', p_br: 'Sağ alt', p_tl: 'Sol üst', p_tr: 'Sağ üst',
      skipped: '{c} atlandı', undo: 'Geri al', skip: 'Atla', open: 'Velo ayarları',
      o_play: 'Oynatılıyor', o_pause: 'Duraklatıldı', o_muted: 'Sessiz', o_unmuted: 'Ses açık', o_vol: 'Ses', o_loopOn: 'Tekrar açık', o_loopOff: 'Tekrar kapalı',
    },
  };
  const NAMES = { de: 'Deutsch', en: 'English', tr: 'Türkçe' };
  const lang = () => (S.lang in L ? S.lang : navigator.language.slice(0, 2) in L ? navigator.language.slice(0, 2) : 'en');
  const t = (k) => L[lang()][k] ?? L.en[k] ?? '';
  const unit = (n, u, digits = 0) => new Intl.NumberFormat(lang(), { style: 'unit', unit: u, unitDisplay: 'short', maximumFractionDigits: digits }).format(n);
  const percent = (n) => new Intl.NumberFormat(lang(), { style: 'percent' }).format(n / 100);
  const rateText = (r) => new Intl.NumberFormat(lang(), { maximumFractionDigits: 2 }).format(r) + '×';
  const compact = (n) => new Intl.NumberFormat(lang(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);

  // ---------- ad blocking ----------
  // Ads are not stripped from YouTube's data: YouTube answers that by stalling every video for 5-10 s.
  // Instead an ad that starts is rushed to its end, muted and hidden for that moment.
  const parse = JSON.parse;
  let adPlayer = null, unmuteAfter = false;
  const skipAd = () => {
    if (!S.ads) return;
    const p = document.querySelector('.html5-video-player.ad-showing');
    if (!p) {
      if (unmuteAfter) adPlayer.unMute?.();
      adPlayer = null; unmuteAfter = false;
      return;
    }
    if (!adPlayer) {
      adPlayer = p; S.adsBlocked++; save();
      // Mute through the player, not the video element: YouTube would remember a muted element for later videos.
      if (p.isMuted && !p.isMuted()) { p.mute(); unmuteAfter = true; }
    }
    p.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
    const v = p.querySelector('video');
    if (!v) return;
    if (v.playbackRate !== 16) v.playbackRate = 16;
    // Only jump once the ad really plays: a jump before that leaves YouTube waiting about 10 s.
    if (isFinite(v.duration) && v.readyState >= 3 && v.currentTime > 0.3 && v.currentTime < v.duration - 0.3) v.currentTime = v.duration - 0.1;
  };
  for (const ev of ['loadedmetadata', 'durationchange', 'canplay', 'playing', 'timeupdate']) document.addEventListener(ev, skipAd, true);

  // ---------- small DOM helpers ----------
  const h = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
  const icon = (d, size = 20) => {
    const NS = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.75, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) s.setAttribute(k, v);
    p.setAttribute('d', d);
    s.append(p);
    return s;
  };
  const sheet = (css) => { const s = new CSSStyleSheet(); s.replaceSync(css); return s; };
  const I = {
    sliders: 'M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4',
    skip: 'M5 4l10 8-10 8V4zM19 5v14',
    keys: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
    player: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM10 8l6 4-6 4V8z',
    look: 'M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a10.9 10.9 0 0 0 5.4-1.4M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2',
    notify: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
    back: 'M19 12H5M12 19l-7-7 7-7',
    chevron: 'm6 9 6 6 6-6', check: 'M20 6 9 17l-5-5', minus: 'M5 12h14', plus: 'M12 5v14M5 12h14',
  };

  // ---------- styles that live in the page ----------
  const HIDE = {
    ads: ['ytd-ad-slot-renderer', 'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)', '#masthead-ad', '#player-ads',
      'ytd-in-feed-ad-layout-renderer', 'ytd-banner-promo-renderer', 'ytd-statement-banner-renderer', 'ytd-companion-slot-renderer',
      'ytd-promoted-sparkles-web-renderer', 'ytd-player-legacy-desktop-watch-ads-renderer', '.ytp-ad-overlay-container',
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]'],
    shorts: ['ytd-rich-shelf-renderer[is-shorts]', 'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
      'ytd-reel-shelf-renderer', 'grid-shelf-view-model:has(a[href^="/shorts/"])', 'ytd-video-renderer:has(a[href^="/shorts/"])',
      'ytd-guide-entry-renderer:has(a[title="Shorts"])', 'ytd-mini-guide-entry-renderer:has(a[title="Shorts"])',
      'yt-chip-cloud-chip-renderer:has([title="Shorts"])'],
    comments: ['ytd-comments#comments'],
    related: ['#secondary #related'],
    endCards: ['.ytp-ce-element'],
    infoCards: ['.ytp-cards-button', '.ytp-cards-teaser', '.ytp-suggested-action', '.iv-branding'],
    liveChat: ['ytd-live-chat-frame', '#chat-container'],
    merch: ['ytd-merch-shelf-renderer', '#merch-shelf', '#ticket-shelf', '#shopping-timely-shelf'],
    endWall: ['.html5-endscreen', '.ytp-endscreen-content', '.ytp-fullscreen-grid'],
  };
  const pageSheet = sheet(`
    ${Object.entries(HIDE).flatMap(([k, list]) => list.map((s) => `html[velo-${k.toLowerCase()}] ${s}`)).join(',')} { display: none !important; }

    html[velo-ads] .html5-video-player.ad-showing video { visibility: hidden !important; }
    html[velo-ads] .html5-video-player.ad-showing .video-ads { opacity: 0 !important; pointer-events: none !important; }

    .velo-btn {
      width: 40px; height: 40px; margin: 0 8px 0 0; padding: 0; border: 0; border-radius: 50%; flex: none;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
      background: transparent; color: #0f0f0f;
      transition: background-color 180ms cubic-bezier(.22,1,.36,1), transform 120ms cubic-bezier(.22,1,.36,1);
    }
    html[dark] .velo-btn { color: #f1f1f1; }
    .velo-back { margin: 0 4px 0 0; }
    .velo-btn:disabled { opacity: .35; cursor: default; pointer-events: none; }
    .velo-btn:hover { background: var(--yt-spec-10-percent-layer, rgb(128 128 128 / .15)); }
    .velo-btn:active { transform: scale(.92); }
    .velo-btn:focus-visible { outline: 2px solid var(--yt-spec-call-to-action, #3ea6ff); outline-offset: 2px; }
    .velo-btn svg { transition: transform 380ms cubic-bezier(.22,1,.36,1); }
    .velo-btn[aria-expanded="true"] svg { transform: rotate(90deg); }

    dislike-button-view-model button:has(.velo-dislikes) { width: auto !important; padding: 0 16px 0 12px !important; }
    .velo-dislikes { margin-left: 6px; font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; }

    .velo-marks { position: absolute; left: 0; right: 0; bottom: 0; height: 100%; pointer-events: none; z-index: 45; }
    .velo-marks i { position: absolute; top: 0; height: 100%; min-width: 3px; border-radius: 1px; }
  `);
  const adopt = () => { if (!document.adoptedStyleSheets.includes(pageSheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, pageSheet]; };
  const apply = () => {
    const r = document.documentElement;
    if (r) for (const k in HIDE) r.toggleAttribute('velo-' + k.toLowerCase(), !!S[k]);
  };

  // ---------- notice inside the player (visible in fullscreen too) ----------
  const toastSheet = sheet(`
    :host { position: absolute; z-index: 70; left: 16px; bottom: 84px; --dy: 8px; }
    :host([data-pos$="r"]) { left: auto; right: 16px; }
    :host([data-pos^="t"]) { bottom: auto; top: 16px; --dy: -8px; }
    .toast {
      display: flex; align-items: center; gap: 4px; padding: 6px 6px 6px 16px; border-radius: 12px;
      background: rgb(24 24 27 / .94); color: #f1f1f1; border: 1px solid rgb(255 255 255 / .1);
      box-shadow: 0 1px 2px rgb(0 0 0 / .4), 0 12px 28px -12px rgb(0 0 0 / .7);
      font: 500 14px/1.4 Roboto, "Segoe UI", system-ui, sans-serif; font-variant-numeric: tabular-nums; white-space: nowrap;
      opacity: 0; transform: translateY(var(--dy)) scale(.97); pointer-events: none;
      transition: opacity 160ms cubic-bezier(.22,1,.36,1), transform 160ms cubic-bezier(.22,1,.36,1);
    }
    .toast[data-plain] { padding: 9px 16px; }
    .toast[data-open] { opacity: 1; transform: none; pointer-events: auto; transition-duration: 260ms; }
    button {
      font: inherit; color: #4fd1bd; background: transparent; border: 0; border-radius: 8px; padding: 6px 10px; cursor: pointer;
      transition: background-color 180ms cubic-bezier(.22,1,.36,1), transform 120ms cubic-bezier(.22,1,.36,1);
    }
    button:hover { background: rgb(79 209 189 / .14); }
    button:active { transform: scale(.96); }
    button:focus-visible { outline: 2px solid #4fd1bd; outline-offset: 1px; }
    @media (prefers-reduced-motion: reduce) { .toast { transition-duration: 1ms !important; transform: none; } }
  `);
  let toastHost, toastBox, toastTimer;
  const hideToast = () => { clearTimeout(toastTimer); if (toastBox) delete toastBox.dataset.open; };
  // action: { label, run } adds a button. Repeated calls update the same box, so held keys do not flicker.
  const toast = (player, text, action, ms = S.toastTime * 1000) => {
    clearTimeout(toastTimer);
    if (toastHost?.parentNode !== player) {
      toastHost?.remove();
      toastHost = h('velo-toast');
      toastBox = h('div', { className: 'toast', role: 'status' });
      toastHost.attachShadow({ mode: 'open' }).append(toastBox);
      toastHost.shadowRoot.adoptedStyleSheets = [toastSheet];
      // A click on the notice must not pause the video.
      for (const ev of ['click', 'dblclick', 'mousedown', 'pointerdown']) toastHost.addEventListener(ev, (e) => e.stopPropagation());
      player.append(toastHost);
    }
    toastHost.dataset.pos = S.toastPos;
    toastBox.toggleAttribute('data-plain', !action);
    toastBox.replaceChildren(h('span', { textContent: text }),
      ...(action ? [h('button', { textContent: action.label, onclick: () => { hideToast(); action.run(); } })] : []));
    requestAnimationFrame(() => requestAnimationFrame(() => { toastBox.dataset.open = ''; }));
    toastTimer = setTimeout(hideToast, ms);
  };

  // ---------- SponsorBlock ----------
  const CATS = { sponsor: '#35c46a', selfpromo: '#e8c53a', interaction: '#c35cf0', intro: '#3cc8d8', outro: '#4a6cf0', preview: '#3b9ae8', music_offtopic: '#f09a3c', filler: '#8a63f0' };
  let vid = null, segs = [];
  const ignored = new Set(), asked = new Set();
  const loadSegs = async (id) => {
    segs = [];
    const cats = Object.keys(CATS).filter((c) => S['cat_' + c] !== 'off');
    if (S.sponsor && cats.length) {
      try {
        // Only a 4-character hash prefix leaves the app, not the video id.
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
        const prefix = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 4);
        const r = await nativeFetch(`https://sponsor.ajay.app/api/skipSegments/${prefix}?categories=${encodeURIComponent(JSON.stringify(cats))}`);
        const hit = r.ok ? parse(await r.text()).find((x) => x.videoID === id) : null;
        if (hit && id === vid) {
          segs = hit.segments.filter((s) => s.actionType === 'skip' && s.segment[1] - s.segment[0] >= S.minLen)
            .map((s) => ({ a: s.segment[0], b: s.segment[1], id: s.UUID, cat: s.category }));
        }
      } catch {}
    }
    drawMarkers();
  };
  const segAt = (now) => segs.find((s) => now >= s.a && now < s.b - 0.3);
  const doSkip = (p, v, s) => {
    const from = v.currentTime;
    v.currentTime = s.b;
    S.segSkipped++; S.secSaved += Math.max(0, s.b - from); save();
    if (S.toastSkip) toast(p, t('skipped').replace('{c}', t('c_' + s.cat)), { label: t('undo'), run: () => { ignored.add(s.id); v.currentTime = from; } });
  };

  document.addEventListener('timeupdate', (e) => {
    const v = e.target, p = v.closest?.('.html5-video-player');
    if (!p || p.id === 'inline-preview-player' || p.classList.contains('ad-showing')) return;
    const id = p.getVideoData?.().video_id;
    if (!id) return;
    if (id !== vid) {
      vid = id; ignored.clear(); asked.clear();
      loadSegs(id); loadVotes(id);
      if (S.speed !== 1) setRate(p, v, S.speed);
      if (S.quality !== 'auto') {
        const all = ['hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'], have = p.getAvailableQualityLevels?.() || [];
        const q = all.slice(all.indexOf(S.quality)).find((x) => have.includes(x));
        if (q) p.setPlaybackQualityRange?.(q, q);
      }
      return;
    }
    if (!S.sponsor) return;
    const now = v.currentTime, s = segAt(now);
    if (!s || ignored.has(s.id)) return;
    if (S['cat_' + s.cat] === 'auto') doSkip(p, v, s);
    else if (!asked.has(s.id)) {
      asked.add(s.id);
      toast(p, t('c_' + s.cat), { label: t('skip'), run: () => doSkip(p, v, s) }, Math.min(15000, (s.b - now) * 1000));
    }
  }, true);

  const drawMarkers = () => {
    const p = document.querySelector('#movie_player'), bar = p?.querySelector('.ytp-progress-bar'), v = p?.querySelector('video');
    let box = bar?.querySelector('.velo-marks');
    if (!bar || !S.markers || !segs.length || !isFinite(v?.duration) || p.classList.contains('ad-showing') || p.getVideoData?.().video_id !== vid) { box?.remove(); return; }
    const key = `${vid}:${segs.length}:${Math.round(v.duration)}`;
    if (box?.dataset.key === key) return;
    box?.remove();
    box = h('div', { className: 'velo-marks' });
    box.dataset.key = key;
    for (const s of segs) {
      const m = h('i');
      m.style.left = (s.a / v.duration) * 100 + '%';
      m.style.width = ((s.b - s.a) / v.duration) * 100 + '%';
      m.style.background = CATS[s.cat];
      box.append(m);
    }
    bar.append(box);
  };

  // ---------- Return YouTube Dislike ----------
  let dislikes = null;
  const loadVotes = async (id) => {
    dislikes = null;
    if (S.dislikes) {
      try {
        const r = await nativeFetch('https://returnyoutubedislikeapi.com/votes?videoId=' + encodeURIComponent(id));
        if (r.ok && id === vid) dislikes = parse(await r.text()).dislikes;
      } catch {}
    }
    drawDislikes();
  };
  const drawDislikes = () => {
    const b = document.querySelector('ytd-watch-metadata dislike-button-view-model button');
    let el = b?.querySelector('.velo-dislikes');
    const onWatch = location.pathname === '/watch' && new URLSearchParams(location.search).get('v') === vid;
    if (!b || !S.dislikes || dislikes == null || !onWatch) { el?.remove(); return; }
    if (!el) b.append((el = h('span', { className: 'velo-dislikes' })));
    const text = compact(dislikes);
    if (el.textContent !== text) el.textContent = text;
  };

  // ---------- player actions and shortcuts ----------
  const activePlayer = () => [...document.querySelectorAll('#movie_player, #shorts-player')].find((p) => p.offsetParent && p.querySelector('video'));
  const setRate = (p, v, r) => {
    r = Math.min(4, Math.max(0.25, Math.round(r * 100) / 100));
    // YouTube's own speed menu only knows its listed rates; anything else goes straight to the video.
    if (p.getAvailablePlaybackRates?.().includes(r)) p.setPlaybackRate(r); else v.playbackRate = r;
    return r;
  };
  const volume = (p, d) => {
    const n = Math.min(100, Math.max(0, p.getVolume() + d));
    if (d > 0 && p.isMuted()) p.unMute();
    p.setVolume(n);
    return t('o_vol') + ' ' + percent(n);
  };
  // Each action returns the text for the on-screen notice.
  const ACTIONS = {
    playPause: (p, v) => { const was = v.paused; was ? p.playVideo() : p.pauseVideo(); return t(was ? 'o_play' : 'o_pause'); },
    seekBack: (p, v) => { v.currentTime = Math.max(0, v.currentTime - S.seekStep); return '−' + unit(S.seekStep, 'second'); },
    seekFwd: (p, v) => { v.currentTime = Math.min(v.duration || Infinity, v.currentTime + S.seekStep); return '+' + unit(S.seekStep, 'second'); },
    volUp: (p) => volume(p, S.volStep),
    volDown: (p) => volume(p, -S.volStep),
    mute: (p) => { const was = p.isMuted(); was ? p.unMute() : p.mute(); return t(was ? 'o_unmuted' : 'o_muted'); },
    speedUp: (p, v) => rateText(setRate(p, v, v.playbackRate + S.speedStep)),
    speedDown: (p, v) => rateText(setRate(p, v, v.playbackRate - S.speedStep)),
    speedReset: (p, v) => rateText(setRate(p, v, 1)),
    fullscreen: (p) => { p.toggleFullscreen(); },
    loop: (p, v) => { v.loop = !v.loop; return t(v.loop ? 'o_loopOn' : 'o_loopOff'); },
    skipSeg: (p, v) => { const s = segAt(v.currentTime); if (s) doSkip(p, v, s); },
  };
  const combo = (e) => (/^(Control|Shift|Alt|Meta)$/.test(e.key) ? '' : (e.ctrlKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + e.code);
  window.addEventListener('keydown', (e) => {
    const c = combo(e), path = e.composedPath(), target = path[0], inPanel = path.includes(host);
    if (!c || (inPanel && target.hasAttribute?.('data-rec'))) return;
    if (c === S.k_openPanel) { e.preventDefault(); e.stopImmediatePropagation(); isOpen() ? close() : open(); return; }
    if (!S.keys || inPanel || target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    const name = Object.keys(ACTIONS).find((a) => S['k_' + a] === c);
    const p = name && activePlayer(), v = p?.querySelector('video');
    if (!v) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const text = ACTIONS[name](p, v);
    if (text && S.toastKeys) toast(p, text, null, 1200);
  }, true);

  document.addEventListener('wheel', (e) => {
    const p = S.wheelVolume && e.target.closest?.('#movie_player');
    if (!p || e.target.closest('.ytp-popup, velo-toast')) return;
    e.preventDefault();
    const text = volume(p, e.deltaY < 0 ? S.volStep : -S.volStep);
    if (S.toastKeys) toast(p, text, null, 1200);
  }, { capture: true, passive: false });

  // ---------- settings window ----------
  const panelSheet = sheet(`
    :host { all: initial; }
    .panel, .menu {
      --ease: cubic-bezier(.22,1,.36,1);
      --surface: #ffffff; --inset: #f1f1ef; --raised: #ffffff; --track: #c9c9c6; --knob: #ffffff; --border: rgb(0 0 0 / .1);
      --text: #101012; --muted: #62626a; --accent: #0e8a7a; --accent-contrast: #ffffff; --danger: #c43c3c;
      --hover: rgb(0 0 0 / .045); --hover2: #e6e6e3;
      --shadow: 0 1px 2px rgb(0 0 0 / .06), 0 18px 40px -16px rgb(0 0 0 / .28);
      color-scheme: light; color: var(--text); font: 14px/1.5 Roboto, "Segoe UI", system-ui, sans-serif; text-align: start;
    }
    .panel[data-theme="dark"], .menu[data-theme="dark"] {
      --surface: #1c1c1f; --inset: #26262a; --raised: #3a3a40; --track: #4a4a50; --knob: #f1f1f1; --border: rgb(255 255 255 / .1);
      --text: #f1f1f1; --muted: #a3a3ab; --accent: #4fd1bd; --accent-contrast: #0d1514; --danger: #d9534f;
      --hover: rgb(255 255 255 / .06); --hover2: #303035;
      --shadow: 0 1px 2px rgb(0 0 0 / .5), 0 20px 44px -16px rgb(0 0 0 / .8);
      color-scheme: dark;
    }
    .panel {
      position: fixed; z-index: 2147483646; box-sizing: border-box; width: 760px; max-width: calc(100vw - 16px);
      height: 620px; max-height: calc(100vh - 72px); display: grid; grid-template-columns: 204px minmax(0, 1fr); overflow: hidden;
      border-radius: 16px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow);
      transform-origin: top right; opacity: 0; transform: translateY(-6px) scale(.96); visibility: hidden;
      transition: opacity 140ms var(--ease), transform 140ms var(--ease), visibility 0s 140ms;
    }
    .panel[data-open] { opacity: 1; transform: none; visibility: visible; transition: opacity 240ms var(--ease), transform 240ms var(--ease); }

    .nav { display: flex; flex-direction: column; padding: 12px 8px; background: var(--inset); border-inline-end: 1px solid var(--border); overflow: auto; }
    .brand { display: flex; align-items: baseline; gap: 8px; padding: 4px 12px 14px; }
    .name { font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
    .ver { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
    .tabs { position: relative; display: flex; flex-direction: column; gap: 2px; }
    .ind {
      position: absolute; inset: 0 0 auto 0; height: 40px; border-radius: 10px; background: var(--raised);
      box-shadow: 0 1px 2px rgb(0 0 0 / .14); transform: translateY(calc(var(--at, 0) * 42px)); transition: transform 320ms var(--ease);
    }
    .tab {
      all: unset; box-sizing: border-box; position: relative; display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px;
      border-radius: 10px; cursor: pointer; color: var(--muted); font-weight: 500; white-space: nowrap; transition: color 180ms var(--ease);
    }
    .tab svg { flex: none; transition: transform 160ms var(--ease), color 180ms var(--ease); }
    .tab:hover, .tab[aria-selected="true"] { color: var(--text); }
    .tab[aria-selected="true"] svg { color: var(--accent); }
    .tab:active svg { transform: scale(.88); }

    .content { overflow: auto; padding: 14px 12px 16px; overscroll-behavior: contain; }
    h2 { margin: 6px 12px 10px; font-size: 20px; line-height: 1.3; font-weight: 600; letter-spacing: -.02em; }
    .sub { margin: 18px 12px 4px; font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: .04em; text-transform: uppercase; }
    .note { padding: 2px 12px 8px; font-size: 12px; color: var(--muted); }

    .row { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 8px 12px; border-radius: 12px; }
    button.row { cursor: pointer; transition: background-color 180ms var(--ease); }
    button.row:hover { background: var(--hover); }
    .txt { flex: 1; min-width: 0; }
    .txt b { display: block; font-weight: 500; }
    .txt span { display: block; font-size: 12px; color: var(--muted); }
    .dot { flex: none; width: 10px; height: 10px; border-radius: 5px; }

    .sw { flex: none; position: relative; width: 40px; height: 24px; border-radius: 12px; background: var(--track); transition: background-color 220ms var(--ease); }
    .sw::after {
      content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 9px;
      background: var(--knob); box-shadow: 0 1px 2px rgb(0 0 0 / .3);
      transition: transform 220ms var(--ease), width 160ms var(--ease), background-color 220ms var(--ease);
    }
    .row[aria-checked="true"] .sw { background: var(--accent); }
    .row[aria-checked="true"] .sw::after { transform: translateX(16px); background: var(--accent-contrast); }
    .row:active .sw::after { width: 22px; }
    .row[aria-checked="true"]:active .sw::after { transform: translateX(12px); }

    .segc { position: relative; flex: none; display: grid; grid-template-columns: repeat(3, 72px); padding: 2px; border-radius: 10px; background: var(--inset); }
    .pill {
      position: absolute; top: 2px; left: 2px; width: 72px; height: 28px; border-radius: 8px; background: var(--raised);
      box-shadow: 0 1px 2px rgb(0 0 0 / .16); transform: translateX(calc(var(--at, 0) * 72px)); transition: transform 260ms var(--ease);
    }
    .segc button {
      all: unset; position: relative; height: 28px; line-height: 28px; text-align: center; font-size: 13px; border-radius: 8px;
      color: var(--muted); cursor: pointer; transition: color 180ms var(--ease);
    }
    .segc button:hover, .segc button[aria-checked="true"] { color: var(--text); }
    .segc button[aria-checked="true"] { font-weight: 500; }

    .step { flex: none; display: flex; align-items: center; padding: 2px; border-radius: 10px; background: var(--inset); }
    .step button {
      all: unset; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--muted); cursor: pointer;
      transition: background-color 160ms var(--ease), color 160ms var(--ease), transform 120ms var(--ease);
    }
    .step button:hover { background: var(--raised); color: var(--text); }
    .step button:active { transform: scale(.88); }
    .step output { min-width: 60px; text-align: center; font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; }

    .pick, .keyb, .btn {
      all: unset; box-sizing: border-box; flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; height: 32px;
      border-radius: 10px; background: var(--inset); font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap;
      transition: background-color 160ms var(--ease), color 160ms var(--ease), box-shadow 180ms var(--ease), transform 120ms var(--ease);
    }
    .pick { padding: 0 8px 0 12px; }
    .pick svg { color: var(--muted); transition: transform 220ms var(--ease); }
    .pick[aria-expanded="true"] svg { transform: rotate(180deg); }
    .keyb { min-width: 76px; padding: 0 8px; gap: 4px; }
    .keyb[data-rec] { box-shadow: 0 0 0 2px var(--accent); color: var(--accent); }
    .btn { padding: 0 14px; }
    .btn.primary { background: var(--accent); color: var(--accent-contrast); }
    .btn[data-armed] { background: var(--danger); color: #ffffff; }
    .pick:hover, .keyb:hover, .btn:hover { background: var(--hover2); }
    .btn.primary:hover { background: color-mix(in srgb, var(--accent) 88%, var(--text)); }
    .btn[data-armed]:hover { background: var(--danger); }
    .btn:active, .pick:active, .keyb:active { transform: scale(.97); }
    kbd {
      font: 500 12px/20px Roboto, "Segoe UI", system-ui, sans-serif; min-width: 10px; height: 20px; padding: 0 6px; text-align: center;
      border-radius: 6px; background: var(--raised); border: 1px solid var(--border);
    }
    .none { color: var(--muted); font-weight: 400; }
    .acts { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 12px; }

    .stats { display: grid; grid-template-columns: repeat(3, 1fr); margin: 8px 12px; border-radius: 12px; background: var(--inset); }
    .stat { padding: 10px 14px; min-width: 0; }
    .stat + .stat { box-shadow: -1px 0 0 var(--border); }
    .stat b { display: block; font-size: 20px; line-height: 1.2; font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .stat span { font-size: 12px; color: var(--muted); }

    .menu {
      position: fixed; z-index: 2147483647; box-sizing: border-box; min-width: 180px; padding: 4px; border-radius: 12px;
      background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow);
      transform-origin: top right; opacity: 0; transform: translateY(-6px) scale(.96); visibility: hidden;
      transition: opacity 120ms var(--ease), transform 120ms var(--ease), visibility 0s 120ms;
    }
    .menu[data-up] { transform-origin: bottom right; transform: translateY(6px) scale(.96); }
    .menu[data-open] { opacity: 1; transform: none; visibility: visible; transition: opacity 200ms var(--ease), transform 200ms var(--ease); }
    .opt {
      all: unset; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      width: 100%; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background-color 160ms var(--ease);
    }
    .opt:hover, .opt:focus-visible { background: var(--hover); }
    .opt svg { color: var(--accent); visibility: hidden; }
    .opt[aria-selected="true"] { font-weight: 500; }
    .opt[aria-selected="true"] svg { visibility: visible; }

    :is(.tab, .row, .opt):focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
    :is(.pick, .keyb, .btn, .step button, .segc button):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media (max-width: 700px) {
      .panel { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); }
      .nav { flex-direction: row; align-items: center; padding: 8px; border-inline-end: 0; border-bottom: 1px solid var(--border); }
      .brand { display: none; }
      .tabs { flex-direction: row; }
      .ind { display: none; }
      .tab[aria-selected="true"] { background: var(--raised); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
    }
  `);

  const host = h('velo-ui');
  const tabs = h('div', { className: 'tabs', role: 'tablist' });
  const content = h('div', { className: 'content', role: 'tabpanel' });
  const panel = h('div', { className: 'panel', role: 'dialog' },
    h('div', { className: 'nav' }, h('div', { className: 'brand' }, h('span', { className: 'name', textContent: 'Velo' }), h('span', { className: 'ver', textContent: VERSION })), tabs),
    content);
  const menu = h('div', { className: 'menu', role: 'listbox', inert: true });
  host.attachShadow({ mode: 'open' }).append(panel, menu);
  host.shadowRoot.adoptedStyleSheets = [panelSheet];
  // Keys typed in the window must not trigger YouTube's player shortcuts.
  for (const ev of ['keydown', 'keyup', 'keypress']) host.addEventListener(ev, (e) => e.stopPropagation());

  const back = h('button', { className: 'velo-btn velo-back', type: 'button', onclick: () => history.back() }, icon(I.back, 22));
  const btn = h('button', { className: 'velo-btn', type: 'button', ariaExpanded: 'false', onclick: () => (isOpen() ? close() : open()) }, icon(I.sliders, 22));

  // One place for every change, so side effects never get forgotten.
  const set = (key, value) => {
    S[key] = value; save(); apply();
    if (/^(sponsor|minLen|cat_)/.test(key) && vid) loadSegs(vid);
    if (key === 'dislikes' && vid) loadVotes(vid);
    if (key === 'lang') render();
  };

  // ----- dropdown shared by all selects -----
  let menuAnchor;
  const closeMenu = () => {
    if (!menu.hasAttribute('data-open')) return;
    delete menu.dataset.open;
    menu.inert = true;
    menuAnchor.ariaExpanded = 'false';
  };
  const openMenu = (anchor, options, current, pick) => {
    if (menu.hasAttribute('data-open') && menuAnchor === anchor) return closeMenu();
    closeMenu();
    menuAnchor = anchor;
    anchor.ariaExpanded = 'true';
    menu.replaceChildren(...options.map(([value, label]) => h('button', {
      className: 'opt', type: 'button', role: 'option', ariaSelected: String(value === current),
      onclick: () => { closeMenu(); anchor.focus(); pick(value, label); },
    }, label, icon(I.check, 16))));
    const r = anchor.getBoundingClientRect(), up = r.bottom + options.length * 37 + 20 > innerHeight;
    menu.style.right = innerWidth - r.right + 'px';
    menu.style.top = up ? 'auto' : r.bottom + 4 + 'px';
    menu.style.bottom = up ? innerHeight - r.top + 4 + 'px' : 'auto';
    menu.toggleAttribute('data-up', up);
    menu.dataset.theme = panel.dataset.theme;
    menu.inert = false;
    menu.dataset.open = '';
    (menu.querySelector('[aria-selected="true"]') || menu.firstChild).focus();
  };
  menu.onkeydown = (e) => {
    const opts = [...menu.children], at = opts.indexOf(host.shadowRoot.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); opts[(at + (e.key === 'ArrowDown' ? 1 : opts.length - 1)) % opts.length].focus(); }
    if (e.key === 'Escape') { e.stopPropagation(); closeMenu(); menuAnchor.focus(); }
  };
  panel.addEventListener('pointerdown', (e) => { if (!e.composedPath().includes(menuAnchor)) closeMenu(); });
  content.addEventListener('scroll', closeMenu);

  // ----- controls -----
  const txt = (title, desc) => h('span', { className: 'txt' }, h('b', { textContent: title }), ...(desc ? [h('span', { textContent: desc })] : []));
  const sub = (key) => h('div', { className: 'sub', textContent: t(key) });
  const sw = (key) => {
    const row = h('button', { className: 'row', type: 'button', role: 'switch', ariaChecked: String(S[key]) }, txt(t(key), t(key + 'D')), h('span', { className: 'sw' }));
    row.onclick = () => { set(key, !S[key]); row.ariaChecked = String(S[key]); };
    return row;
  };
  const num = (key, min, max, step, fmt) => {
    const out = h('output', { textContent: fmt(S[key]) });
    const bump = (d) => { set(key, Math.min(max, Math.max(min, Math.round((S[key] + d) * 100) / 100))); out.textContent = fmt(S[key]); };
    return h('div', { className: 'row' }, txt(t(key), t(key + 'D')), h('span', { className: 'step' },
      h('button', { type: 'button', ariaLabel: '−', onclick: () => bump(-step) }, icon(I.minus, 16)), out,
      h('button', { type: 'button', ariaLabel: '+', onclick: () => bump(step) }, icon(I.plus, 16))));
  };
  const sel = (key, options) => {
    const label = h('span', { textContent: (options.find(([v]) => v === S[key]) || options[0])[1] });
    const b = h('button', { className: 'pick', type: 'button', ariaHasPopup: 'listbox', ariaExpanded: 'false' }, label, icon(I.chevron, 16));
    b.onclick = () => openMenu(b, options, S[key], (value, text) => { label.textContent = text; set(key, value); });
    return h('div', { className: 'row' }, txt(t(key), t(key + 'D')), b);
  };
  const MODES = ['auto', 'ask', 'off'];
  const mode = (cat) => {
    const key = 'cat_' + cat, group = h('span', { className: 'segc', role: 'radiogroup', ariaLabel: t('c_' + cat) }, h('i', { className: 'pill' }));
    const paint = () => {
      group.style.setProperty('--at', MODES.indexOf(S[key]));
      group.querySelectorAll('button').forEach((b, i) => { b.ariaChecked = String(MODES[i] === S[key]); });
    };
    for (const m of MODES) group.append(h('button', { type: 'button', role: 'radio', textContent: t('m_' + m), onclick: () => { set(key, m); paint(); } }));
    paint();
    const dot = h('i', { className: 'dot' });
    dot.style.background = CATS[cat];
    return h('div', { className: 'row' }, dot, txt(t('c_' + cat), t('cd_' + cat)), group);
  };
  const pretty = (c) => c.split('+').map((part) => ({
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: t('space'), Ctrl: t('ctrl'),
    Period: '.', Comma: ',', Slash: '/', Minus: '-', Equal: '=', Enter: '↵',
  }[part] ?? part.replace(/^(Key|Digit)/, '').replace(/^Numpad/, 'Num ')));
  const keyRow = (name) => {
    const key = 'k_' + name, b = h('button', { className: 'keyb', type: 'button' });
    b.dataset.k = key;
    const paint = (recording) => {
      b.toggleAttribute('data-rec', recording);
      b.replaceChildren(...(recording ? [t('press')] : S[key] ? pretty(S[key]).map((p) => h('kbd', { textContent: p })) : [h('span', { className: 'none', textContent: t('unbound') })]));
    };
    b.onclick = () => paint(!b.hasAttribute('data-rec'));
    b.onblur = () => paint(false);
    b.onkeydown = (e) => {
      if (!b.hasAttribute('data-rec')) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Escape') return paint(false);
      if (e.key === 'Backspace' || e.key === 'Delete') { set(key, ''); return paint(false); }
      const c = combo(e);
      if (!c) return;
      // A combination belongs to one action only: take it away from whoever had it.
      for (const other in S) if (other.startsWith('k_') && S[other] === c) S[other] = '';
      set(key, c);
      const top = content.scrollTop;
      renderContent();
      content.scrollTop = top;
      content.querySelector(`[data-k="${key}"]`).focus();
    };
    paint(false);
    return h('div', { className: 'row' }, txt(t(key)), b);
  };
  const confirmBtn = (key, run) => {
    const b = h('button', { className: 'btn', type: 'button', textContent: t(key) });
    b.onclick = () => {
      if (b.hasAttribute('data-armed')) return run();
      b.dataset.armed = ''; b.textContent = t('sure');
      setTimeout(() => { delete b.dataset.armed; b.textContent = t(key); }, 3000);
    };
    return b;
  };
  const secs = (n) => unit(n, 'second');

  // ----- sections -----
  const SECTIONS = {
    general: [I.sliders, () => {
      const signedIn = !!window.ytcfg?.get?.('LOGGED_IN');
      const signIn = h('button', {
        className: 'btn primary', type: 'button', textContent: t('signIn'),
        onclick: () => { location.href = document.querySelector('a[href*="accounts.google.com/ServiceLogin"]')?.href || 'https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2F'; },
      });
      const stat = (value, label) => h('div', { className: 'stat' }, h('b', { textContent: value }), h('span', { textContent: label }));
      const saved = S.secSaved < 60 ? secs(S.secSaved) : S.secSaved < 3600 ? unit(S.secSaved / 60, 'minute') : unit(S.secSaved / 3600, 'hour', 1);
      return [
        h('div', { className: 'row' }, txt(t('account'), t(signedIn ? 'accountIn' : 'accountD')), ...(signedIn ? [] : [signIn])),
        sel('lang', [['system', t('system')], ...Object.entries(NAMES)]),
        sel('startPage', [['home', t('sp_home')], ['subs', t('sp_subs')]]),
        h('div', { className: 'stats' }, stat(compact(S.adsBlocked), t('sAds')), stat(compact(S.segSkipped), t('sSegs')), stat(saved, t('sSaved'))),
        h('div', { className: 'acts' },
          confirmBtn('resetStats', () => { S.adsBlocked = S.segSkipped = S.secSaved = 0; save(); renderContent(); }),
          confirmBtn('resetAll', () => { Object.assign(S, DEF); save(); apply(); render(); if (vid) { loadSegs(vid); loadVotes(vid); } })),
        h('div', { className: 'note', textContent: t('credit') }),
      ];
    }],
    skip: [I.skip, () => [sw('ads'), sw('sponsor'), sub('subCats'), ...Object.keys(CATS).map(mode), sw('markers'), num('minLen', 0, 30, 1, secs)]],
    keys: [I.keys, () => [sw('keys'), ...[...Object.keys(ACTIONS), 'openPanel'].map(keyRow), sub('subSteps'),
      num('seekStep', 1, 60, 1, secs), num('volStep', 1, 25, 1, percent), num('speedStep', 0.05, 0.5, 0.05, rateText)]],
    player: [I.player, () => [num('speed', 0.25, 4, 0.25, rateText),
      sel('quality', [['auto', t('q_auto')], ['hd2160', '2160p (4K)'], ['hd1440', '1440p'], ['hd1080', '1080p'], ['hd720', '720p'], ['large', '480p'], ['medium', '360p']]),
      sw('wheelVolume'), sw('noIdle')]],
    look: [I.look, () => [sw('dislikes'), sub('subHide'), ...['shorts', 'comments', 'related', 'endCards', 'infoCards', 'liveChat', 'merch', 'endWall'].map(sw)]],
    notify: [I.notify, () => [sw('toastSkip'), sw('toastKeys'), num('toastTime', 2, 10, 1, secs),
      sel('toastPos', ['bl', 'br', 'tl', 'tr'].map((p) => [p, t('p_' + p)]))]],
  };
  const ORDER = Object.keys(SECTIONS);
  let tab = ORDER[0];

  // dir: -1 or 1 slides the new section in from above or below, 0 swaps without motion.
  const renderContent = (dir = 0) => {
    closeMenu();
    content.replaceChildren(h('h2', { textContent: t('n_' + tab) }), ...SECTIONS[tab][1]());
    if (!dir) return;
    content.scrollTop = 0;
    if (!reduce.matches) content.animate([{ opacity: 0, transform: `translateY(${dir * 14}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  const render = () => {
    btn.title = btn.ariaLabel = panel.ariaLabel = t('open');
    back.title = back.ariaLabel = t('back');
    tabs.style.setProperty('--at', ORDER.indexOf(tab));
    tabs.replaceChildren(h('i', { className: 'ind' }), ...ORDER.map((id) => h('button', {
      className: 'tab', type: 'button', role: 'tab', ariaSelected: String(id === tab),
      onclick: () => {
        if (id === tab) return;
        const dir = Math.sign(ORDER.indexOf(id) - ORDER.indexOf(tab));
        tab = id;
        tabs.style.setProperty('--at', ORDER.indexOf(tab));
        tabs.querySelectorAll('.tab').forEach((b, i) => { b.ariaSelected = String(ORDER[i] === tab); });
        renderContent(dir);
      },
    }, icon(SECTIONS[id][0], 18), t('n_' + id))));
    renderContent();
  };

  const isOpen = () => panel.hasAttribute('data-open');
  const open = () => {
    if (!host.isConnected) document.documentElement.append(host);
    panel.dataset.theme = document.documentElement.hasAttribute('dark') ? 'dark' : 'light';
    render();
    const r = btn.isConnected ? btn.getBoundingClientRect() : null, width = Math.min(760, innerWidth - 16);
    panel.style.top = (r ? r.bottom + 8 : 12) + 'px';
    panel.style.right = Math.max(8, Math.min(r ? innerWidth - r.right : 12, innerWidth - 8 - width)) + 'px';
    panel.dataset.open = '';
    btn.ariaExpanded = 'true';
    tabs.querySelector('[aria-selected="true"]').focus({ preventScroll: true });
  };
  const close = () => {
    if (!isOpen()) return;
    closeMenu();
    delete panel.dataset.open;
    btn.ariaExpanded = 'false';
  };
  document.addEventListener('pointerdown', (e) => {
    const path = e.composedPath();
    if (isOpen() && !path.includes(host) && !path.includes(btn)) close();
  }, true);
  host.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });

  // ---------- upkeep: YouTube rebuilds its DOM while navigating ----------
  setInterval(() => {
    if (!document.body) return;
    adopt(); apply();
    skipAd();
    if (S.noIdle) window._lact = Date.now();
    if (!btn.isConnected) document.querySelector('ytd-masthead #end')?.prepend(btn);
    if (!back.isConnected) document.querySelector('ytd-masthead #start')?.prepend(back);
    back.disabled = !navigation.canGoBack;
    drawDislikes(); drawMarkers();
  }, 400);
  adopt();
  render();
})();
