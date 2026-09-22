/** Shared military-grade layout tokens + shell — sand/khaki, mobile-first */

import {
  DEFAULT_LANG,
  LOCALE_LABELS,
  SELECTOR_COUNTRIES,
  SITE_LOCALES,
  catalogPath,
  contactPath,
  homePath,
  solutionsIndexPath,
  investPath,
  partnersPath,
  langsForCountry,
  rewritePathForLang,
  CALL_SWITCHBOARD_URL,
  HQ_PHONE_DISPLAY,
} from "../i18n/locales";
import { pageCopy } from "../i18n/page-copy";
import { inlineMarkSvg } from "./brand-assets";
import { platformSearchMarkup } from "./platform-search";
import { legalKicker, legalNav } from "../legal";

export { SITE_LOCALES, DEFAULT_LANG };

export const FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
`;

export const CSS = `
:root {
  /* Off-White / Açık Kum — page background */
  --bg: #F4F3EF;
  --sand: #F4F3EF;
  --sand-warm: #EDE6D4;
  /* Açık Vizon / Açık Çamur — cards, elevated */
  --bg-elev: #E2DFC9;
  --khaki: #C4B896;
  --coyote: #A67C52;
  /* Koyu Toprak — body text / footer */
  --fg: #2B261F;
  --muted: #5C564C;
  --line: rgba(43, 38, 31, .14);
  /* Çamur Yeşili / Haki */
  --brand: #4B5320;
  --olive: #4B5320;
  --accent: var(--brand);
  --accent-dim: rgba(75, 83, 32, .14);
  /* Askeri Turuncu / Coyote CTA */
  --cta: #D96B27;
  --cta-hot: #F08A3A;
  --cta-dim: rgba(217, 107, 39, .16);
  --on-cta: #2B261F;
  /* Energy accents */
  --signal: #1FA6A0;
  --signal-dim: rgba(31, 166, 160, .16);
  --amber: #E8A317;
  --mark-red: #EC3536;
  --steel: #6B6458;
  --warn: #B87A3A;
  --danger: #A34848;
  --max: 1180px;
  --appbar-h: 56px;
  --pad-x: clamp(0.85rem, 3.5vw, 1.35rem);
  --safe-t: env(safe-area-inset-top, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
  --font-display: "Barlow Condensed", sans-serif;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
* { box-sizing: border-box; }
html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
html, body { max-width: 100%; overflow-x: hidden; }
body {
  margin: 0;
  color: var(--fg);
  background: var(--bg);
  font-family: var(--font-body);
  font-size: clamp(15px, 2.6vw, 16px);
  line-height: 1.55;
  min-height: 100vh;
  min-height: 100dvh;
  padding-left: var(--safe-l);
  padding-right: var(--safe-r);
}
body::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(900px 520px at 92% -6%, rgba(217, 107, 39, .28), transparent 55%),
    radial-gradient(760px 480px at -10% 20%, rgba(75, 83, 32, .22), transparent 52%),
    radial-gradient(640px 420px at 48% 108%, rgba(31, 166, 160, .18), transparent 55%),
    radial-gradient(420px 300px at 70% 40%, rgba(232, 163, 23, .12), transparent 50%),
    linear-gradient(165deg, #EDE6D4 0%, var(--bg) 45%, #E8E2D0 100%);
}
body::after {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: .22;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 70%);
}
a { color: var(--brand); text-decoration: none; cursor: pointer; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
img, svg, video { max-width: 100%; height: auto; display: block; }
img#lb-img {
  max-width: 100% !important;
  max-height: 100% !important;
  width: auto !important;
  height: auto !important;
}
.wrap {
  width: min(var(--max), calc(100% - (var(--pad-x) * 2)));
  margin-inline: auto;
  position: relative;
  z-index: 1;
}

/* ——— App bar: 3 locked zones — brand | nav | tools ——— */
.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(16px) saturate(1.15);
  -webkit-backdrop-filter: blur(16px) saturate(1.15);
  background: linear-gradient(180deg, rgba(244, 243, 239, .94), rgba(226, 223, 201, .88));
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, var(--brand), var(--cta), var(--amber), var(--signal)) 1;
  padding-top: var(--safe-t);
}
.appbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 12px;
  height: var(--appbar-h);
  min-height: var(--appbar-h);
  max-height: var(--appbar-h);
  overflow: visible;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 44px;
  max-width: 200px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  letter-spacing: .04em;
  color: var(--fg);
  text-decoration: none;
  text-transform: uppercase;
  line-height: 1;
  flex: 0 0 auto;
  min-width: 0;
  overflow: hidden;
}
/* Mark SVG (currentColor) + wordmark share one token — do not split accent on "bull" */
.brand span { color: inherit; }
.brand:hover { text-decoration: none; color: var(--fg); }
.brand-mark {
  width: 36px; height: 36px; flex: 0 0 36px;
  display: block;
  color: inherit;
  flex-shrink: 0;
}
.brand-word {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  color: inherit;
}
.appbar-nav {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 0 4px;
  min-width: 0;
  height: var(--appbar-h);
  overflow: hidden;
  margin: 0;
  padding: 0;
}
.appbar-nav a:not(.btn) {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 0.45rem;
  color: var(--muted);
  font-size: .72rem;
  letter-spacing: .05em;
  text-transform: uppercase;
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
  flex: 0 0 auto;
}
.appbar-nav a:not(.btn):hover { color: var(--fg); }
.appbar-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  gap: 8px;
  height: var(--appbar-h);
  flex: 0 0 auto;
}
.appbar-cta.btn {
  display: none;
  height: 36px;
  min-height: 36px;
  padding: 0 0.85rem;
  white-space: nowrap;
  flex: 0 0 auto;
  align-items: center;
  box-shadow: none;
}
.appbar-call.btn {
  display: none;
  height: 36px;
  min-height: 36px;
  padding: 0 0.75rem;
  white-space: nowrap;
  flex: 0 0 auto;
  align-items: center;
  box-shadow: none;
}
.appbar-call-drawer { display: none; }
.appbar-cta-drawer { display: none; }
.nav-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(145deg, #FFF, var(--bg-elev));
  color: var(--fg);
  cursor: pointer;
  flex: 0 0 44px;
}
.nav-toggle:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
.nav-search {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(145deg, #FFFEF9, var(--bg-elev));
  color: var(--muted);
  cursor: pointer;
  flex: 0 0 auto;
  font: inherit;
  box-shadow: 0 1px 0 rgba(255,255,255,.55) inset;
  transition: color .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease;
}
.nav-search:hover {
  color: var(--fg);
  border-color: rgba(75, 83, 32, .4);
  background: linear-gradient(145deg, #FFF, #E8E4D0);
}
.nav-search:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
.nav-search-icon { font-size: 1.2rem; line-height: 1; flex: 0 0 auto; }
.nav-search-label { display: none; font-size: .88rem; font-weight: 600; letter-spacing: .02em; color: inherit; }
.nav-search-kbd { display: none; }
.nav-search-kbd, .ps-kbd, .hero-find-kbd {
  font-family: var(--font-mono);
  font-size: .72rem;
  font-weight: 500;
  letter-spacing: .06em;
  border: 1px solid rgba(43, 38, 31, .18);
  border-radius: 6px;
  background: rgba(255,255,255,.88);
  color: var(--fg);
  padding: .28rem .45rem;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(43, 38, 31, .08);
}
.nav-toggle-bars {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 16px;
}
.nav-toggle-bars span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--fg);
  transition: transform .2s ease, opacity .2s ease;
}
.site-header.is-open .nav-toggle-bars span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.site-header.is-open .nav-toggle-bars span:nth-child(2) { opacity: 0; }
.site-header.is-open .nav-toggle-bars span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
.locale-wrap {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: 36px;
}
.locale-field {
  display: block;
  margin: 0;
  height: 36px;
}
.locale-select {
  display: block;
  box-sizing: border-box;
  height: 36px;
  width: 58px;
  max-width: 58px;
  padding: 0 16px 0 6px;
  margin: 0;
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .04em;
  color: var(--fg);
  background: #FFFFFF;
  border: 1px solid var(--line);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 10px) 16px, calc(100% - 6px) 16px;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
}
.locale-select.locale-lang {
  width: 72px;
  max-width: 72px;
}
.locale-select:focus {
  outline: 2px solid var(--signal);
  border-color: var(--signal);
}
@media (min-width: 420px) {
  .brand { max-width: 220px; font-size: 1.28rem; }
  .brand-mark { width: 40px; height: 40px; flex-basis: 40px; }
}
@media (min-width: 640px) {
  .nav-search {
    width: auto;
    min-width: 0;
    padding: 0 .7rem 0 .85rem;
    gap: .55rem;
  }
  .nav-search-label { display: inline; }
  .nav-search-kbd { display: inline-flex; align-items: center; }
}
@media (min-width: 1100px) {
  .appbar { column-gap: 16px; }
  .appbar-nav { display: flex; }
  .appbar-cta { display: inline-flex; }
  .appbar-call { display: inline-flex; }
  .appbar-cta-drawer { display: none !important; }
  .appbar-call-drawer { display: none !important; }
  .nav-toggle { display: none; }
  .nav-search {
    min-height: 44px;
    height: 44px;
    padding: 0 .85rem 0 1rem;
    border-radius: 12px;
  }
  .nav-search-label { font-size: .92rem; }
  .nav-search-kbd { font-size: .75rem; padding: .3rem .5rem; }
  .locale-select { width: 64px; max-width: 64px; }
  .locale-select.locale-lang { width: 84px; max-width: 84px; }
}
.footer-bar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem 1.5rem;
}
.footer-identity {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 1.15rem;
  min-width: 0;
  flex: 1 1 auto;
}
.footer-brand {
  display: flex;
  align-items: center;
  margin: 0;
  flex: 0 0 auto;
  line-height: 0;
  text-decoration: none;
  height: calc(0.9rem * 1.45 * 2 + 0.28rem);
}
.footer-brand:hover { text-decoration: none; opacity: .92; }
.footer-lockup {
  display: block;
  height: 100%;
  width: auto;
  max-width: none;
  max-height: none;
}
.footer-copy {
  min-width: 0;
  flex: 1 1 auto;
  font-size: 0.9rem;
}
.footer-copy p {
  margin: 0;
  line-height: 1.45;
}
.footer-copy p + p { margin-top: .28rem; }
.footer-legal {
  flex: 1 1 100%;
  display: flex;
  flex-wrap: wrap;
  gap: .35rem 1.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.footer-legal a { text-decoration: none; }
.footer-legal a:hover { text-decoration: underline; text-underline-offset: 3px; }
.legal-doc { max-width: 44rem; }
.legal-doc .page-lead { margin-bottom: 1.15rem; }
.legal-switch {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem .7rem;
  margin: 0 0 1.85rem;
}
.legal-switch a {
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  border: 1px solid var(--line);
  padding: .42rem .7rem;
  color: var(--fg);
  text-decoration: none;
  background: var(--bg-elev);
}
.legal-switch a:hover {
  border-color: var(--brand);
  color: var(--brand);
  text-decoration: none;
}
.legal-switch a[aria-current="page"] {
  border-color: var(--brand);
  background: var(--accent-dim);
  color: var(--brand);
}
.legal-doc h2 {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 3.2vw, 1.55rem);
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--brand);
  margin: 1.85rem 0 .65rem;
  line-height: 1.15;
}
.legal-doc p { margin: 0 0 .85rem; color: var(--fg); }
.legal-updated {
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 1rem;
}
.badge {
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .12em;
  text-transform: uppercase; color: var(--on-cta);
  border: 1px solid rgba(217, 107, 39, .45); background: var(--cta-dim);
  padding: .28rem .55rem;
}
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  min-height: 44px;
  font-family: var(--font-display); font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; text-decoration: none !important;
  padding: .75rem 1.15rem; border: 1px solid transparent; cursor: pointer;
  transition: transform .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.btn-primary {
  background: linear-gradient(135deg, var(--cta) 0%, var(--cta-hot) 55%, var(--amber) 100%);
  color: var(--on-cta);
  box-shadow: 0 6px 18px rgba(217, 107, 39, .28);
}
.btn-primary:hover { transform: translateY(-1px); filter: brightness(1.06); }
.btn-ghost {
  background: rgba(255, 255, 255, .45);
  color: var(--fg);
  border-color: rgba(43, 38, 31, .28);
}
.btn-ghost:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--accent-dim);
}
.hero {
  position: relative; z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 1.25rem;
  min-height: 0;
  padding: clamp(1.5rem, 4vw, 2.75rem) 0 clamp(1.25rem, 3.5vw, 2.25rem);
  overflow: hidden;
}
.hero-copy { position: relative; max-width: 36rem; min-width: 0; }
.hero-media { position: relative; min-width: 0; }
.hero-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: min(52vh, 460px);
  border: 1px solid rgba(43, 38, 31, .22);
  background:
    linear-gradient(135deg, #1c1a16, #2a241c),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M0 24h48M24 0v48' stroke='%23D96B2733' stroke-width='1'/%3E%3C/svg%3E");
  overflow: hidden;
  box-shadow:
    inset 0 0 0 1px rgba(31, 166, 160, .28),
    0 18px 40px rgba(43, 38, 31, .18);
}
.hero-frame video,
.hero-frame img,
.hero-video,
.hero-still {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  display: block;
}
.hero-still { z-index: 0; }
.hero-video { z-index: 1; }
.hero-scan {
  position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background:
    linear-gradient(180deg, rgba(20, 18, 14, .18), transparent 22%, transparent 72%, rgba(20, 18, 14, .38)),
    repeating-linear-gradient(to bottom, transparent 0 3px, rgba(31, 166, 160, .05) 3px 4px);
}
.hero-scan::after {
  content: "";
  position: absolute; left: 0; right: 0; height: 22%;
  background: linear-gradient(180deg, transparent, rgba(232, 163, 23, .16), transparent);
  animation: hero-scan 8s ease-in-out infinite;
}
.hero-media-meta {
  position: absolute; left: 12px; right: 12px; bottom: 10px; z-index: 3;
  display: flex; justify-content: space-between; gap: .75rem;
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .12em;
  text-transform: uppercase; color: #EDE6D4;
  text-shadow: 0 1px 8px rgba(0,0,0,.55);
  pointer-events: none;
}
@keyframes hero-scan { from { top: -24%; } to { top: 100%; } }
@keyframes hero-ken {
  from { transform: scale(1.03) translate3d(-1%, 0, 0); }
  to { transform: scale(1.1) translate3d(1.2%, -1%, 0); }
}
.hero-still { animation: hero-ken 22s ease-in-out infinite alternate; }
@media (prefers-reduced-motion: reduce) {
  .hero-frame, .hero-scan::after, .hero-still, .reveal { animation: none !important; }
  .hero-video { display: none; }
}
@media (min-width: 768px) {
  .hero {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
    gap: 2rem 2.25rem;
    align-items: center;
    min-height: min(58vh, 520px);
    padding: clamp(1.75rem, 4vw, 2.75rem) 0;
  }
  .hero-frame { max-height: min(56vh, 480px); }
}
.kicker {
  font-family: var(--font-mono); font-size: .72rem; letter-spacing: .14em;
  text-transform: uppercase; margin: 0 0 1rem;
  color: var(--brand);
}
.hero h1 {
  font-family: var(--font-display); font-weight: 800;
  font-size: clamp(2.4rem, 8vw, 4.6rem); line-height: .92;
  letter-spacing: .02em; text-transform: uppercase; margin: 0;
  word-break: break-word;
}
.hero h1 .tm { color: var(--brand); }
.hero .lede {
  margin: 1rem 0 0; color: var(--muted);
  font-size: clamp(0.95rem, 2.8vw, 1.05rem); max-width: 34rem;
}
.cta-row { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.5rem; }
.section {
  padding: clamp(2.5rem, 6vw, 4.5rem) 0;
  position: relative; z-index: 1;
  border-top: 1px solid var(--line);
}
.section-flush { border-top: 0; padding-top: clamp(1.75rem, 5vw, 3rem); }
.section-head { display: grid; gap: .6rem; margin-bottom: 1.75rem; max-width: 40rem; }
.section-head h2 {
  font-family: var(--font-display); font-size: clamp(1.65rem, 5vw, 2.6rem);
  text-transform: uppercase; letter-spacing: .04em; margin: 0; line-height: 1.05;
  color: var(--brand);
}
.section-head p { margin: 0; color: var(--muted); }
.solution-media {
  position: relative;
  border: 1px solid var(--line);
  background: #1a1814;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  max-height: min(62vh, 640px);
}
.solution-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #12100e;
}
.rail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  background: linear-gradient(135deg, var(--brand), var(--cta), var(--signal));
  border: 1px solid transparent;
}
.rail a, .rail .cell {
  background: var(--bg-elev);
  padding: 1.2rem 1.1rem;
  display: block;
  color: inherit;
  text-decoration: none;
  min-height: 132px;
  transition: background .2s ease, transform .2s ease;
  min-width: 0;
}
.rail a:hover {
  background: linear-gradient(160deg, #F7F4E8, #D9EFEB);
  transform: translateY(-1px);
}
.rail .code {
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .12em;
  color: var(--cta); text-transform: uppercase; margin-bottom: .55rem;
}
.rail h3 {
  font-family: var(--font-display); font-size: 1.3rem; margin: 0 0 .4rem;
  text-transform: uppercase; letter-spacing: .03em;
}
.rail p { margin: 0; color: var(--muted); font-size: .92rem; }
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: .15rem;
}
.product-list-fold {
  margin-top: 1.15rem;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #F7F5EC, var(--bg-elev));
}
.product-list-fold > summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: .65rem .9rem;
  flex-wrap: wrap;
  min-height: 52px;
  padding: .85rem 1.1rem;
  user-select: none;
}
.product-list-fold > summary::-webkit-details-marker { display: none; }
.product-list-fold > summary::marker { content: ""; }
.product-list-kicker {
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--cta); margin: 0;
}
.product-list-title {
  font-family: var(--font-display); font-size: 1.15rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .04em; margin: 0;
}
.product-list-count {
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .08em;
  text-transform: uppercase; color: var(--steel);
}
.product-list-chev {
  margin-left: auto; color: var(--steel); font-size: 1.15rem; line-height: 1;
  transition: transform .18s ease;
}
.product-list-fold[open] > summary {
  border-bottom: 1px solid var(--line);
}
.product-list-fold[open] .product-list-chev { transform: rotate(180deg); }
.product-list-fold .product-grid {
  padding: 1rem 1.05rem 1.15rem;
}
.product.is-out { display: none !important; }
.product {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #F7F5EC, var(--bg-elev));
  display: flex; flex-direction: column; overflow: hidden;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}
.product:hover {
  border-color: rgba(217, 107, 39, .5);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(75, 83, 32, 0.14);
  text-decoration: none;
}
.product .media {
  aspect-ratio: 16/11;
  background: linear-gradient(135deg, var(--khaki), #B8C9A0 45%, #7EC4C0);
  overflow: hidden;
  position: relative;
}
.product .media img { width: 100%; height: 100%; object-fit: cover; opacity: .96; }
.product .media img[data-lightbox] { cursor: zoom-in; position: relative; z-index: 1; }
.product .media::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(43, 38, 31, .35));
  pointer-events: none;
}
.product .body { padding: 1rem 1.05rem 1.15rem; display: grid; gap: .35rem; }
.product .model {
  font-family: var(--font-mono); font-size: .72rem;
  color: var(--signal); letter-spacing: .08em;
}
.product h3 {
  font-family: var(--font-display); font-size: 1.15rem; margin: 0;
  text-transform: uppercase; letter-spacing: .03em; line-height: 1.15;
  color: var(--fg);
}
.product p { margin: 0; color: var(--muted); font-size: .88rem; }
.rd-stage {
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #F7F4E8 0%, var(--bg-elev) 62%, #E8D9C4 130%);
  padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.15rem, 3vw, 1.65rem) 1.55rem;
  display: grid;
  gap: .55rem;
  max-width: 42rem;
}
.rd-stage .kicker { margin: 0; color: var(--cta); }
.rd-stage h3 {
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 4.5vw, 2.05rem);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin: 0;
  line-height: 1.1;
  color: var(--fg);
}
.rd-stage p { margin: 0; color: var(--muted); max-width: 36rem; font-size: .95rem; }
.rd-stage .cta-row { margin-top: .45rem; }
.rd-note {
  margin: 1.15rem 0 0;
  color: var(--muted);
  font-size: .9rem;
  max-width: 40rem;
}
.invest-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(1.85rem, 5.4vw, 3.35rem);
  text-transform: uppercase;
  letter-spacing: .03em;
  line-height: 1.05;
  margin: 0 0 1rem;
  max-width: 28ch;
  color: var(--brand);
}
.invest-page { padding-top: 1.25rem; }
.invest-lede {
  margin: 0;
  color: var(--muted);
  font-size: clamp(.95rem, 2.4vw, 1.08rem);
  max-width: 44rem;
  line-height: 1.5;
}
.invest-band-head { margin-top: 2.4rem; max-width: 44rem; }
.invest-quote, .invest-close {
  margin: 2rem 0 1.25rem;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #F7F4E8 0%, var(--bg-elev) 62%, #E8D9C4 130%);
  padding: clamp(1.2rem, 3vw, 1.7rem);
  display: grid;
  gap: .65rem;
}
.invest-quote h3, .invest-close .kicker + blockquote {
  margin: 0;
}
.invest-quote h3 {
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 3.5vw, 1.9rem);
  text-transform: uppercase;
  letter-spacing: .04em;
  line-height: 1.1;
  color: var(--fg);
}
.invest-quote blockquote, .invest-close blockquote {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--fg);
  font-size: 1.02rem;
  line-height: 1.55;
  max-width: 46rem;
}
.invest-rule, .invest-office {
  margin: .35rem 0 0;
  font-family: var(--font-mono);
  font-size: .78rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--cta);
}
.invest-protocol {
  margin: 0;
  color: var(--muted);
  font-size: .92rem;
}
.invest-close .cta-row { margin-top: .35rem; }
.sf-related-label {
  grid-column: 1 / -1;
  margin: 0 0 .15rem;
  font-family: var(--font-mono);
  font-size: .72rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--cta);
}

/* ——— Products flying dock: category + solution + search ——— */
.fly-dock {
  position: sticky;
  top: calc(var(--appbar-h) + var(--safe-t) + .45rem);
  z-index: 40;
  margin: .2rem 0 1rem;
  padding: .85rem .85rem .75rem;
  background: rgba(247, 245, 236, .96);
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  border: 1px solid rgba(43, 38, 31, .16);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .75) inset,
    0 16px 36px rgba(43, 38, 31, .14);
}
.fly-dock::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--brand), var(--cta), var(--signal));
  pointer-events: none;
}
.fly-dock-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: .65rem .7rem;
  align-items: end;
}
.fly-field { display: block; min-width: 0; }
.fly-label {
  display: block;
  margin: 0 0 .3rem;
  font-family: var(--font-mono);
  font-size: .68rem;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--brand);
}
.fly-search {
  width: 100%;
  min-height: 60px;
  margin: 0;
  padding: .4rem .95rem;
  border: 2px solid var(--brand);
  background: #fff;
  color: var(--fg);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.35rem, 2.8vw, 1.7rem);
  letter-spacing: .02em;
  line-height: 1.1;
  outline: none;
  appearance: none;
}
.fly-search::placeholder {
  color: var(--steel);
  font-weight: 600;
  opacity: 1;
}
.fly-search::-webkit-search-decoration,
.fly-search::-webkit-search-cancel-button,
.fly-search::-webkit-search-results-button {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}
.fly-search:focus,
.fly-search.is-set {
  border-color: var(--cta);
  box-shadow: 0 0 0 3px var(--cta-dim);
}
.fly-select {
  width: 100%;
  min-height: 52px;
  margin: 0;
  padding: 0 .75rem;
  border: 1px solid rgba(43, 38, 31, .28);
  background: #fff;
  color: var(--fg);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 1.02rem;
  line-height: 1.2;
  outline: none;
}
.fly-select:focus,
.fly-select.is-set {
  border-color: var(--cta);
  box-shadow: inset 0 -3px 0 var(--cta);
}
.fly-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  min-height: 2rem;
}
.fly-count {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--fg);
}
.fly-clear {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--cta);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  padding: .35rem .15rem;
  cursor: pointer;
}
.fly-clear:hover { text-decoration: underline; text-underline-offset: 3px; }
.fly-clear[hidden] { display: none !important; }
.fly-empty {
  margin: .85rem 0 0;
  padding: .95rem 1rem;
  border: 1px dashed rgba(43, 38, 31, .28);
  background: rgba(247, 245, 236, .9);
  color: var(--fg);
  font-weight: 600;
  font-size: 1.02rem;
}
.fly-empty[hidden] { display: none !important; }
.fly-dock-sentinel { height: 1px; pointer-events: none; }
.fly-dock.is-stuck {
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .75) inset,
    0 20px 42px rgba(43, 38, 31, .2);
}
@media (min-width: 720px) {
  .fly-dock-grid {
    grid-template-columns: minmax(0, 1.45fr) minmax(10.5rem, .85fr) minmax(10.5rem, .85fr);
  }
  .fly-meta { grid-column: 1 / -1; }
}
@media (max-width: 719px) {
  .fly-dock-grid { grid-template-columns: 1fr 1fr; }
  .fly-field-search,
  .fly-meta { grid-column: 1 / -1; }
}

/* ——— Smart filter (Products) — Spotify / Spotlight popover ——— */
.smart-filter {
  margin: 0 0 1.15rem;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(247, 245, 236, .95), rgba(226, 223, 201, .72));
  padding: 0.85rem 1rem;
}
.smart-filter.is-collapsed { margin-bottom: 1rem; }
.sf-fold-body[hidden] { display: none !important; }
.sf-fold-lead { margin: 0 0 .75rem; color: var(--muted); font-size: .9rem; }
.sf-toggle { min-height: 40px; padding: .45rem .85rem; font-size: .85rem; }
.sf-fold { border: 0; background: transparent; }
.sf-fold > summary.smart-filter-head {
  cursor: pointer;
  list-style: none;
  user-select: none;
  margin-bottom: 0;
}
.sf-fold > summary.smart-filter-head::-webkit-details-marker { display: none; }
.sf-fold > summary.smart-filter-head::marker { content: ""; }
.sf-fold-label {
  font-family: var(--font-mono);
  font-size: .72rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--cta);
}
.sf-fold-open { display: none; }
.sf-fold[open] .sf-fold-closed { display: none; }
.sf-fold[open] .sf-fold-open { display: inline; }
.sf-fold-chev {
  color: var(--steel);
  font-size: 1.15rem;
  line-height: 1;
  transition: transform .18s ease;
}
.sf-fold[open] .sf-fold-chev { transform: rotate(180deg); }
.sf-fold[open] > summary.smart-filter-head { margin-bottom: .85rem; }
.sf-fold-body { padding-top: .1rem; }
.sf-fold-toolbar { margin: 0 0 .65rem; }
.smart-filter-head {
  display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
  gap: .75rem 1.25rem; margin-bottom: .85rem;
}
.smart-filter-head h3 {
  font-family: var(--font-display); font-size: 1.35rem; margin: 0;
  text-transform: uppercase; letter-spacing: .04em; line-height: 1.1;
}
.sf-sub { margin: .2rem 0 0; color: var(--muted); font-size: .88rem; }
.sf-recommend {
  margin: .45rem 0 0;
  color: var(--fg);
  font-size: .9rem;
  line-height: 1.4;
  max-width: 40rem;
}
.sf-hints {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin: .75rem 0 .15rem;
}
.sf-hint {
  appearance: none;
  border: 1px solid var(--line);
  background: var(--bg-elev);
  color: var(--fg);
  font: inherit;
  font-size: .78rem;
  padding: .35rem .65rem;
  cursor: pointer;
}
.sf-hint:hover { border-color: rgba(217, 107, 39, .55); color: var(--brand); }
.sf-actions { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
.sf-status {
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .06em;
  text-transform: uppercase; color: var(--steel);
}
.sf-clear { min-height: 40px; padding: .45rem .85rem; font-size: .85rem; }

/* Spotify-like search field */
.sf-spotify { position: relative; margin: 0 0 .85rem; z-index: 2; }
.sf-search-wrap {
  display: flex; align-items: center; gap: .55rem;
  background: rgba(255,255,255,.82);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: .35rem .85rem .35rem 1rem;
  min-height: 48px;
  box-shadow: 0 1px 0 rgba(255,255,255,.6) inset;
}
.sf-search-icon {
  font-size: 1.1rem; color: var(--steel); line-height: 1; flex: 0 0 auto;
}
.sf-search {
  flex: 1; min-width: 0; border: 0; background: transparent;
  font-family: var(--font-body); font-size: 1rem; color: var(--fg);
  outline: none; min-height: 40px;
}
.sf-search::placeholder { color: var(--steel); }
.sf-search-clear {
  appearance: none; border: 0; background: rgba(0,0,0,.06);
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
  font-size: 1.1rem; line-height: 1; color: var(--muted);
}
.sf-live {
  margin-top: .45rem;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.92);
  max-height: min(42vh, 320px); overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.sf-live-label, .sf-pop-results .sf-live-label {
  margin: 0; padding: .55rem .75rem .25rem;
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .08em;
  text-transform: uppercase; color: var(--steel);
}
.sf-live-list { display: grid; }
.sf-hit {
  display: flex; align-items: center; gap: .65rem;
  padding: .55rem .75rem; text-decoration: none; color: inherit;
  border-top: 1px solid rgba(0,0,0,.04); min-height: 52px;
}
.sf-hit:hover, .sf-hit.is-active { background: var(--cta-dim); }
.sf-hit img, .sf-hit-ph {
  width: 40px; height: 40px; object-fit: cover; flex: 0 0 auto;
  background: var(--bg-elev); border: 1px solid var(--line);
}
.sf-hit-body { display: grid; gap: .1rem; min-width: 0; }
.sf-hit-sku {
  font-family: var(--font-mono); font-size: .65rem; letter-spacing: .06em;
  text-transform: uppercase; color: var(--cta);
}
.sf-hit-name {
  font-size: .9rem; font-weight: 600; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}

.sf-rows { display: grid; gap: .4rem; }
.sf-row {
  appearance: none; width: 100%; text-align: left; cursor: pointer;
  display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: .5rem;
  min-height: 48px; padding: .55rem .75rem;
  border: 1px solid transparent;
  background: rgba(255,255,255,.28);
  color: inherit; font: inherit;
  transition: border-color .15s ease, background .15s ease;
}
.sf-row.is-active, .sf-row.is-bold {
  border-color: rgba(75, 83, 32, .35);
  background: rgba(255, 255, 255, .55);
}
.sf-row.is-bold .sf-group-name { font-weight: 800; color: var(--fg); }
.sf-group-name {
  font-family: var(--font-display); font-size: 1.05rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .04em; line-height: 1.15;
}
.sf-group-meta {
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .08em;
  text-transform: uppercase; color: var(--steel); white-space: nowrap;
}
.sf-chev { color: var(--steel); font-size: 1.25rem; line-height: 1; }

.sf-panel-kicker {
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--cta); margin: 0 0 .45rem;
}
.sf-top-values, .sf-values {
  display: flex; flex-wrap: wrap; gap: .35rem;
  margin: 0 0 .55rem;
}
.sf-chip {
  appearance: none; border: 1px solid var(--line);
  background: rgba(244, 243, 239, .9); color: var(--fg);
  font-family: var(--font-mono); font-size: .72rem; letter-spacing: .02em;
  padding: .35rem .55rem; cursor: pointer; min-height: 36px;
  transition: border-color .15s ease, background .15s ease;
}
.sf-chip span { color: var(--steel); margin-left: .25rem; }
.sf-chip:hover, .sf-prop-btn:hover {
  border-color: rgba(217, 107, 39, .55);
  background: var(--cta-dim);
}
.sf-props { display: grid; gap: .65rem; }
.sf-prop-btn {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  gap: .5rem; text-align: left; border: 1px solid var(--line);
  background: rgba(255,255,255,.4); padding: .45rem .6rem; cursor: pointer;
  font: inherit; color: inherit; min-height: 40px;
}
.sf-prop-label { font-weight: 600; font-size: .9rem; }
.sf-prop-count {
  font-family: var(--font-mono); font-size: .65rem; color: var(--steel);
}
.sf-range { margin: .35rem 0 .5rem; padding: 0 .15rem; }
.sf-range-labels {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: .5rem; margin-bottom: .25rem;
  font-size: .8rem; color: var(--muted);
}
.sf-range-val {
  font-family: var(--font-mono); font-size: .78rem; color: var(--cta); font-weight: 600;
}
.sf-slider {
  width: 100%; accent-color: var(--cta); height: 28px; cursor: pointer;
}
.sf-range-ends {
  display: flex; justify-content: space-between;
  font-family: var(--font-mono); font-size: .6rem; color: var(--steel);
}
.sf-empty, .sf-empty-grid {
  margin: 0; color: var(--muted); font-size: .9rem; padding: .35rem 0;
}
.sf-result-bar {
  margin: 0 0 1rem; padding: .65rem .85rem;
  border-left: 3px solid var(--cta);
  background: var(--cta-dim);
  font-family: var(--font-mono); font-size: .72rem; letter-spacing: .04em;
  text-transform: uppercase; color: var(--fg);
}
.sf-result-bar p { margin: 0; }

/* Popover cell — macOS Spotlight / Spotify filter chip */
.sf-popover-root {
  position: fixed; inset: 0; z-index: 80;
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0; padding-bottom: env(safe-area-inset-bottom, 0);
}
.sf-popover-root[hidden] { display: none !important; }
.sf-popover-backdrop {
  position: absolute; inset: 0;
  background: rgba(43, 38, 31, .45);
  border: 0; cursor: pointer;
}
.sf-popover {
  position: relative; z-index: 1;
  width: min(100%, 520px);
  max-height: min(88vh, 720px);
  margin: 0;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #F7F5EC, #EDE9D8);
  border: 1px solid var(--line);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -12px 40px rgba(0,0,0,.18);
  overflow: hidden;
}
.sf-pop-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: .75rem; padding: 1rem 1rem .65rem;
  border-bottom: 1px solid var(--line);
  flex: 0 0 auto;
}
.sf-pop-kicker {
  margin: 0; font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .1em; text-transform: uppercase; color: var(--cta);
}
.sf-pop-head h4 {
  margin: .15rem 0 0; font-family: var(--font-display);
  font-size: 1.25rem; text-transform: uppercase; letter-spacing: .04em;
}
.sf-pop-close {
  appearance: none; border: 1px solid var(--line); background: rgba(255,255,255,.7);
  width: 40px; height: 40px; border-radius: 50%; font-size: 1.35rem;
  line-height: 1; cursor: pointer; color: var(--fg); flex: 0 0 auto;
}
.sf-pop-body {
  flex: 1 1 auto; overflow: auto; padding: .75rem 1rem;
  -webkit-overflow-scrolling: touch;
}
.sf-pop-results {
  flex: 0 0 auto; max-height: 38%; overflow: auto;
  border-top: 1px solid var(--line);
  background: rgba(255,255,255,.55);
  -webkit-overflow-scrolling: touch;
}
html.sf-pop-open { overflow: hidden; }
html.sf-pop-open .site-header {
  /* keep sticky appbar above dim, below popover */
  z-index: 70;
}

/* Fact code under spec name */
.spec-fact-label { display: grid; gap: .2rem; }
.spec-fact-code {
  display: block;
  font-family: var(--font-mono);
  font-size: .62rem;
  letter-spacing: .04em;
  text-transform: none;
  color: var(--steel);
  font-weight: 400;
  word-break: break-all;
}
.spec-group-title {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin: 0 0 .35rem;
}
.spec-group-key {
  font-family: var(--font-mono);
  font-size: .68rem;
  color: var(--steel);
  margin: 0 0 .65rem;
}

.meta-bar {
  display: flex; flex-wrap: wrap; gap: .85rem 1.35rem;
  padding: 1.1rem 0;
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  font-family: var(--font-mono); font-size: .7rem; letter-spacing: .08em;
  text-transform: uppercase; color: var(--muted);
}
.meta-bar strong { color: var(--fg); font-weight: 600; }
.site-footer {
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, var(--brand), var(--signal), var(--cta), var(--amber)) 1;
  padding: 2.25rem 0 calc(2.5rem + var(--safe-b));
  position: relative; z-index: 1;
  color: #C9C2B4; font-size: .9rem;
  background: linear-gradient(180deg, #342E26, #2B261F);
}
.site-footer strong { color: #F4F3EF; }
.site-footer a { color: #E2DFC9; }
.site-footer a:hover { color: var(--cta-hot); }
.site-footer .footer-brand { color: #F4F3EF; }
.reveal { animation: rise .7s ease both; }
@keyframes rise { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: none;} }
.hud-corners { position: relative; }
.hud-corners::before, .hud-corners::after {
  content: ""; position: absolute; width: 16px; height: 16px;
  border: 2px solid var(--cta); opacity: .7; z-index: 1; pointer-events: none;
}
.hud-corners::before { top: 6px; left: 6px; border-right: 0; border-bottom: 0; }
.hud-corners::after { bottom: 6px; right: 6px; border-left: 0; border-top: 0; }
.form-grid { display: grid; gap: 1rem; max-width: 640px; width: 100%; }
.contact-layout {
  display: grid;
  gap: 1.75rem;
  grid-template-columns: 1fr;
  align-items: start;
}
.contact-layout .form-grid { max-width: none; }
.contact-map-panel { display: grid; gap: 1rem; min-width: 0; }
.contact-map {
  position: relative;
  border: 1px solid var(--line);
  background: var(--bg-elev);
  overflow: hidden;
  aspect-ratio: 4 / 3;
  min-height: 280px;
}
.contact-map iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.contact-hq {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  padding: 1.15rem 1.2rem;
}
.contact-hq .kicker { margin-bottom: .45rem; }
.contact-hq address {
  font-style: normal;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 3.2vw, 1.45rem);
  text-transform: uppercase;
  letter-spacing: .03em;
  line-height: 1.3;
  margin: 0;
}
.contact-hq p { margin: .55rem 0 0; color: var(--muted); font-size: .92rem; }
.contact-hq .cta-row { margin-top: 1rem; }
.partner-filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin: 0 0 1.5rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--line);
  background: var(--bg-elev);
}
.partner-filters label {
  display: grid; gap: .4rem;
  font-family: var(--font-mono); font-size: .72rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
}
.partner-filters select {
  font-family: var(--font-body); font-size: 1rem; color: var(--fg);
  background: #fff; border: 1px solid var(--line);
  padding: .85rem 1rem; width: 100%; min-height: 44px;
}
.partner-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}
.partner-card {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #F7F5EC, var(--bg-elev));
  padding: 1.15rem 1.2rem;
  min-width: 0;
}
.partner-card.is-hq-fallback {
  background: linear-gradient(180deg, #EEF4F2, var(--bg-elev));
}
.partner-card .code {
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .12em;
  color: var(--cta); text-transform: uppercase; margin: 0 0 .45rem;
}
.partner-card h3 {
  font-family: var(--font-display); font-size: 1.35rem;
  text-transform: uppercase; letter-spacing: .03em; margin: 0 0 .65rem;
}
.partner-card address {
  font-style: normal; color: var(--fg); line-height: 1.45; margin: 0 0 .55rem;
}
.partner-card p { margin: .35rem 0 0; color: var(--muted); font-size: .92rem; }
.partner-empty {
  border: 1px dashed var(--line);
  padding: 1.25rem 1.2rem;
  color: var(--muted);
}
.partner-apply { margin-top: 2.5rem; }

/* Product Buy — country → authorized seller / HQ */
.buy-root {
  position: fixed; inset: 0; z-index: 96;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 12vh 1rem 1rem;
}
.buy-root[hidden] { display: none !important; }
.buy-backdrop {
  position: absolute; inset: 0;
  background: rgba(43, 38, 31, .5);
  border: 0; cursor: pointer;
}
.buy-dialog {
  position: relative; z-index: 1;
  width: min(100%, 560px);
  max-height: min(84vh, 720px);
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #F7F5EC, #EDE9D8);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 18px 50px rgba(0,0,0,.26);
  overflow: hidden;
}
.buy-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: .65rem; padding: .9rem 1rem .45rem;
  flex: 0 0 auto;
}
.buy-kicker {
  margin: 0; font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .1em; text-transform: uppercase; color: var(--cta);
}
.buy-head h4 {
  margin: .15rem 0 0; font-family: var(--font-display);
  font-size: 1.2rem; text-transform: uppercase; letter-spacing: .04em;
}
.buy-close {
  appearance: none; border: 1px solid var(--line); background: rgba(255,255,255,.7);
  width: 40px; height: 40px; border-radius: 50%; font-size: 1.35rem;
  line-height: 1; cursor: pointer; color: var(--fg); flex: 0 0 auto;
}
.buy-product {
  display: flex; align-items: center; gap: .75rem;
  margin: 0 .9rem .7rem; padding: .7rem .75rem;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.62);
}
.buy-product[hidden] { display: none !important; }
.buy-product img,
.buy-product-ph {
  flex: 0 0 auto;
  width: 72px; height: 72px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: var(--bg-elev);
}
.buy-product-ph { display: block; }
.buy-product-ph[hidden] { display: none !important; }
.buy-product-copy { min-width: 0; flex: 1 1 auto; }
.buy-product-sku {
  margin: 0; font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .1em; text-transform: uppercase; color: var(--cta);
}
.buy-product-name {
  margin: .2rem 0 0; font-family: var(--font-display);
  font-size: 1.05rem; text-transform: uppercase; letter-spacing: .03em;
  line-height: 1.15; color: var(--fg);
}
.buy-product-link {
  display: inline-block; margin-top: .35rem;
  font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .08em; text-transform: uppercase; color: var(--signal);
}
.buy-product-link[hidden] { display: none !important; }
.buy-country-label {
  display: grid; gap: .35rem;
  margin: 0 .9rem .55rem;
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
}
.buy-country-label select {
  font-family: var(--font-body); font-size: 1rem; color: var(--fg);
  background: #fff; border: 1px solid var(--line);
  padding: .75rem 1rem; width: 100%; min-height: 48px;
}
.buy-wa { display: none; margin: 0 .9rem .35rem; }
.buy-wa.is-on, .buy-wa:not([hidden]) { display: block; }
.buy-wa[hidden] { display: none !important; }
.buy-wa-row {
  display: flex; align-items: stretch; gap: .4rem;
}
.buy-wa-dial {
  display: flex; align-items: center; justify-content: center;
  min-width: 3.6rem; padding: 0 .55rem;
  font-family: var(--font-mono); font-size: .82rem; letter-spacing: .04em;
  color: var(--fg); background: rgba(255,255,255,.7);
  border: 1px solid var(--line);
}
.buy-wa-row input {
  flex: 1 1 auto; min-width: 0; min-height: 48px;
  font-family: var(--font-body); font-size: 1rem; color: var(--fg);
  background: #fff; border: 1px solid var(--line);
  padding: .75rem .9rem;
}
.buy-wa-row .btn { flex: 0 0 auto; min-height: 48px; white-space: nowrap; }
.buy-wa-hint {
  margin: .4rem 0 0;
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .04em;
  color: var(--steel);
}
.buy-status {
  margin: 0 .9rem .45rem;
  font-family: var(--font-mono); font-size: .68rem; letter-spacing: .06em;
  text-transform: uppercase; color: var(--steel);
}
.buy-list {
  flex: 1 1 auto; overflow: auto;
  padding: 0 .9rem 1rem;
  display: grid; gap: .75rem;
  -webkit-overflow-scrolling: touch;
}
.buy-card {
  border: 1px solid var(--line);
  background: rgba(255,255,255,.55);
  padding: 1rem 1.05rem;
}
.buy-card .code {
  font-family: var(--font-mono); font-size: .62rem; letter-spacing: .1em;
  color: var(--cta); text-transform: uppercase; margin: 0 0 .4rem;
}
.buy-card h3 {
  font-family: var(--font-display); font-size: 1.2rem;
  text-transform: uppercase; letter-spacing: .03em; margin: 0 0 .5rem;
}
.buy-card address {
  font-style: normal; color: var(--fg); line-height: 1.45; margin: 0 0 .45rem;
}
.buy-card p { margin: .25rem 0 0; color: var(--muted); font-size: .9rem; }
.buy-card-actions { margin-top: .85rem; }
html.buy-open { overflow: hidden; }
html.buy-open .site-header { z-index: 70; }
@media (max-width: 479px) {
  .buy-root {
    align-items: flex-end;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .buy-dialog {
    width: 100%;
    max-height: min(90vh, 760px);
    border-radius: 18px 18px 0 0;
  }
}
@media (min-width: 640px) {
  .partner-filters { grid-template-columns: 1fr 1fr; }
  .partner-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.form-grid label {
  display: grid; gap: .4rem;
  font-family: var(--font-mono); font-size: .72rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
}
.form-grid input, .form-grid select, .form-grid textarea {
  font-family: var(--font-body); font-size: 1rem; color: var(--fg);
  background: #FFFFFF; border: 1px solid var(--line);
  padding: .85rem 1rem; width: 100%; min-height: 44px;
}
.form-grid input:focus, .form-grid select:focus, .form-grid textarea:focus {
  outline: 2px solid var(--signal); border-color: var(--signal);
}
.form-grid .row2 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.form-grid .form-bool {
  margin: 0;
  padding: 0;
  border: 0;
  display: grid;
  gap: .5rem;
}
.form-grid .form-bool legend {
  font-family: var(--font-mono); font-size: .72rem; letter-spacing: .1em;
  text-transform: uppercase; color: var(--muted);
}
.form-grid .form-bool-opts {
  display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; align-items: center;
}
.form-grid .form-bool-opts label {
  display: flex; flex-direction: row; align-items: center; gap: .45rem;
  text-transform: none; letter-spacing: 0; font-family: var(--font-body);
  font-size: .95rem; color: var(--fg); cursor: pointer;
}
.form-grid .form-bool-opts input {
  width: auto; min-height: 0; padding: 0; accent-color: var(--cta);
}
.form-note { color: var(--muted); font-size: .88rem; margin-top: .5rem; }
.quote-product-chip {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: .45rem .75rem;
  margin: 0 0 .25rem; padding: .85rem 1rem;
  border: 1px solid var(--line); background: var(--bg-elev);
}
.quote-product-chip .quote-product-sku {
  font-family: var(--font-mono); font-size: .78rem; letter-spacing: .06em;
  text-transform: uppercase; color: var(--accent);
}
.quote-product-chip .quote-product-name {
  font-family: var(--font-body); font-size: .95rem; color: var(--fg); text-transform: none; letter-spacing: 0;
}
.form-ok {
  border: 1px solid rgba(75, 83, 32, .35);
  background: var(--accent-dim);
  padding: 1rem 1.15rem; color: var(--fg);
}
.form-err {
  border: 1px solid rgba(163, 72, 72, .45);
  background: rgba(163, 72, 72, .10);
  padding: 1rem 1.15rem; color: #6B2E2E;
}
.split-hero {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  align-items: start;
}
.split-cards {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}
.sol-hero {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  align-items: start;
}
.sol-hero .solution-media { margin: 0; max-height: min(52vh, 420px); }
.sol-scene {
  position: relative;
  z-index: 1;
  min-height: min(78vh, 680px);
  display: grid;
  align-items: end;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
}
.sol-scene-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: 50% 42%;
}
.sol-scene-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(18, 16, 12, .88) 0%, rgba(18, 16, 12, .62) 38%, rgba(18, 16, 12, .22) 68%, rgba(18, 16, 12, .38) 100%),
    linear-gradient(180deg, rgba(18, 16, 12, .28) 0%, transparent 34%, rgba(18, 16, 12, .58) 100%);
}
.sol-scene-copy {
  position: relative;
  z-index: 1;
  padding: clamp(2.4rem, 8vw, 5.2rem) 0 clamp(2.6rem, 7vw, 4.4rem);
  max-width: 38rem;
}
.sol-scene .kicker { color: var(--cta-hot); }
.sol-scene .page-title { color: #F4F3EF; text-shadow: 0 2px 18px rgba(0,0,0,.45); }
.sol-scene .page-lead {
  color: rgba(244, 243, 239, .86);
  max-width: 34rem;
}
.sol-scene .btn-ghost {
  background: transparent;
  color: #F4F3EF;
  border-color: rgba(244, 243, 239, .42);
}
.sol-scene .btn-ghost:hover {
  border-color: var(--cta-hot);
  color: var(--cta-hot);
  background: rgba(217, 107, 39, .12);
}
.sol-scene-credit {
  position: absolute;
  right: max(var(--pad-x), var(--safe-r));
  bottom: 10px;
  z-index: 2;
  margin: 0;
  font-family: var(--font-mono);
  font-size: .62rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(237, 230, 212, .72);
}
.sol-scene-credit a { color: inherit; text-decoration: none; }
.sol-scene-credit a:hover { color: #F4F3EF; text-decoration: underline; }
@media (max-width: 767px) {
  .sol-scene { min-height: min(88vh, 620px); }
  .sol-scene-photo { object-position: inherit; }
  .sol-scene-veil {
    background:
      linear-gradient(180deg, rgba(18, 16, 12, .35) 0%, rgba(18, 16, 12, .55) 38%, rgba(18, 16, 12, .82) 100%);
  }
}
.sol-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.sol-card {
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #F7F5EC, var(--bg-elev));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  min-width: 0;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.sol-card:hover {
  border-color: rgba(217, 107, 39, .5);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(75, 83, 32, 0.14);
  text-decoration: none;
}
.sol-card-media {
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, var(--khaki), #B8C9A0 45%, #7EC4C0);
  overflow: hidden;
}
.sol-card-media img { width: 100%; height: 100%; object-fit: cover; }
.sol-card-body { padding: 1rem 1.05rem 1.2rem; display: grid; gap: .35rem; }
.sol-card-body h3 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: .03em;
  line-height: 1.15;
}
.sol-card-body p { margin: 0; color: var(--muted); font-size: .9rem; }
.sol-caps {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}
.sol-cap { background: var(--bg-elev); padding: 1.05rem 1.1rem; }
.sol-cap p { margin: 0; color: var(--fg); font-size: .95rem; line-height: 1.45; }
a.sol-cap {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  text-decoration: none;
  color: inherit;
  min-height: 100%;
  transition: background .15s ease;
}
a.sol-cap:hover {
  background: var(--bg);
  text-decoration: none;
}
.sol-cap-more {
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--cta);
}
.sol-crumb {
  display: flex;
  flex-wrap: wrap;
  gap: .35rem .55rem;
  align-items: center;
  margin: 0 0 1rem;
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--steel);
}
.sol-crumb a { color: var(--cta); text-decoration: none; }
.sol-crumb a:hover { text-decoration: underline; }
.cap-body { max-width: 46rem; display: grid; gap: .95rem; margin: 0 0 1.35rem; }
.cap-body p { margin: 0; color: var(--muted); font-size: 1.02rem; line-height: 1.55; }
.cap-field {
  margin: 0 0 1.5rem;
  max-width: 46rem;
  border: 1px solid var(--line);
  background: linear-gradient(160deg, #F7F4E8 0%, var(--bg-elev) 62%, #E8D9C4 130%);
  padding: 1.05rem 1.15rem;
  display: grid;
  gap: .4rem;
}
.cap-field p { margin: 0; color: var(--fg); font-size: .98rem; line-height: 1.5; }
.app-chips {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin-top: .65rem;
}
.app-chip {
  display: inline-flex;
  align-items: center;
  padding: .42rem .7rem;
  border: 1px solid var(--line);
  background: var(--bg-elev);
  color: var(--fg);
  font-size: .82rem;
  line-height: 1.25;
  text-decoration: none;
}
a.app-chip:hover {
  border-color: rgba(217, 107, 39, .55);
  color: var(--brand);
  text-decoration: none;
}
.thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: .5rem;
  margin-top: .75rem;
}
.thumb-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 1px solid var(--line);
}
.thumb-grid img[data-lightbox],
img.product-hero[data-lightbox] { cursor: zoom-in; }

/* Product image lightbox + catalog product peek */
.lb-root {
  position: fixed; inset: 0; z-index: 90;
  width: 100%;
  height: 100%;
  height: 100dvh;
  display: flex; align-items: stretch; justify-content: center;
  padding: 0;
  overflow: hidden;
}
.lb-root[hidden] { display: none !important; }
.lb-backdrop {
  position: absolute; inset: 0;
  background: rgba(20, 18, 14, .72);
  border: 0; cursor: pointer;
}
.lb-dialog {
  position: relative; z-index: 1;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background: #1a1814;
  border: 0;
  overflow: hidden;
}
.lb-root.is-peek {
  align-items: center;
  justify-content: center;
  padding: max(1rem, env(safe-area-inset-top, 0px)) 1rem max(1rem, env(safe-area-inset-bottom, 0px));
}
.lb-root.is-peek .lb-backdrop {
  background: rgba(43, 38, 31, .55);
}
.lb-root.is-peek .lb-dialog {
  width: min(100%, 980px);
  height: auto;
  max-height: min(90dvh, 720px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: linear-gradient(165deg, #F7F5EC 0%, #EDE9D8 55%, #E6E1CF 100%);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 22px 56px rgba(0,0,0,.28);
}
.lb-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: .65rem;
  padding: calc(.55rem + env(safe-area-inset-top, 0px)) 0.75rem .55rem;
  border-bottom: 1px solid rgba(255,255,255,.12);
  flex: 0 0 auto;
  min-width: 0;
}
.lb-root.is-peek .lb-head {
  padding: .85rem 1rem .55rem;
  border-bottom: 1px solid var(--line);
}
.lb-kicker {
  margin: 0; font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .1em; text-transform: uppercase; color: #E8A317;
}
.lb-root.is-peek .lb-kicker { color: var(--cta); }
.lb-title {
  margin: .1rem 0 0; font-family: var(--font-display);
  font-size: .98rem; text-transform: uppercase; letter-spacing: .04em;
  line-height: 1.2; color: #F4F3EF;
  max-width: min(70vw, 36rem); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.lb-root.is-peek .lb-title {
  color: var(--fg);
  white-space: normal;
  max-width: min(80vw, 42rem);
}
.lb-close {
  appearance: none; border: 1px solid rgba(255,255,255,.22);
  background: rgba(255,255,255,.12);
  width: 44px; height: 44px; border-radius: 50%; font-size: 1.35rem;
  line-height: 1; cursor: pointer; color: #F4F3EF; flex: 0 0 auto;
}
.lb-root.is-peek .lb-close {
  border-color: var(--line);
  background: rgba(255,255,255,.72);
  color: var(--fg);
}
.lb-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  touch-action: pan-y;
}
.lb-stage img,
#lb-img {
  position: absolute;
  inset: 0;
  margin: auto;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  display: block;
}
.lb-body {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 0;
  overflow: hidden;
}
.lb-root.is-peek .lb-body {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.lb-root.is-peek .lb-stage {
  min-height: min(52vh, 420px);
  background: #1f1c17;
  border-right: 1px solid var(--line);
}
.lb-root.is-peek #lb-img {
  position: absolute;
}
.lb-side {
  padding: 1rem 1.1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
  background: transparent;
}
.lb-side[hidden] { display: none !important; }
.lb-sku {
  margin: 0; font-family: var(--font-mono); font-size: .68rem;
  letter-spacing: .1em; text-transform: uppercase; color: var(--cta);
}
.lb-summary {
  margin: 0; color: var(--steel); line-height: 1.45; font-size: .95rem;
}
.lb-apps-label {
  margin: .35rem 0 0; font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .1em; text-transform: uppercase; color: var(--muted);
}
.lb-apps {
  display: flex; flex-wrap: wrap; gap: .4rem;
  margin: 0; padding: 0; list-style: none;
}
.lb-apps li {
  margin: 0; padding: .35rem .55rem;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.55);
  font-family: var(--font-mono); font-size: .62rem;
  letter-spacing: .04em; color: var(--fg);
}
.lb-cta {
  display: flex; flex-wrap: wrap; gap: .5rem;
  margin-top: auto; padding-top: .35rem;
}
.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 52px;
  height: 52px;
  border: 1px solid rgba(255,255,255,.28);
  border-radius: 50%;
  background: rgba(20, 18, 14, .62);
  color: #F4F3EF;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.lb-nav[hidden] { display: none !important; }
.lb-root.is-peek .lb-nav { display: none !important; }
.lb-prev { left: max(8px, env(safe-area-inset-left, 0px)); }
.lb-next { right: max(8px, env(safe-area-inset-right, 0px)); }
.lb-foot {
  display: flex; align-items: center; justify-content: center;
  min-height: 44px;
  padding: .4rem 0.75rem calc(.55rem + env(safe-area-inset-bottom, 0px));
  color: #C9C2B4;
  font-family: var(--font-mono);
  font-size: .72rem;
  letter-spacing: .1em;
}
.lb-root.is-peek .lb-foot { display: none; }
html.lb-open, html.lb-open body {
  overflow: hidden !important;
  overscroll-behavior: none;
}
html.lb-open .site-header { z-index: 70; }
@media (max-width: 719px) {
  .lb-root.is-peek {
    align-items: flex-end;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .lb-root.is-peek .lb-dialog {
    width: 100%;
    max-height: min(94dvh, 860px);
    border-radius: 18px 18px 0 0;
  }
  .lb-root.is-peek .lb-body {
    grid-template-columns: 1fr;
  }
  .lb-root.is-peek .lb-stage {
    min-height: min(38vh, 280px);
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
}

/* Ctrl/Cmd+K Find platforms — Spotlight palette */
.ps-root {
  position: fixed; inset: 0; z-index: 96;
  display: flex; align-items: flex-start; justify-content: center;
  padding: max(8vh, 2rem) 1rem 1.5rem;
}
.ps-root[hidden] { display: none !important; }
.ps-backdrop {
  position: absolute; inset: 0;
  background: rgba(43, 38, 31, .58);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 0; cursor: pointer;
}
.ps-dialog {
  position: relative; z-index: 1;
  width: min(100%, 720px);
  max-height: min(86vh, 760px);
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #F9F7F0, #EDE9D8);
  border: 1px solid rgba(43, 38, 31, .16);
  border-radius: 18px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.35) inset,
    0 24px 64px rgba(0,0,0,.32);
  overflow: hidden;
}
.ps-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: .75rem; padding: 1.1rem 1.15rem .55rem;
  flex: 0 0 auto;
}
.ps-head-copy { min-width: 0; flex: 1 1 auto; }
.ps-head-tools {
  display: inline-flex; align-items: center; gap: .45rem;
  flex: 0 0 auto;
}
.ps-kicker {
  margin: 0; font-family: var(--font-mono); font-size: .68rem;
  letter-spacing: .12em; text-transform: uppercase; color: var(--cta);
}
.ps-head h4 {
  margin: .2rem 0 0; font-family: var(--font-display);
  font-size: clamp(1.35rem, 3.5vw, 1.65rem); text-transform: uppercase; letter-spacing: .04em;
  line-height: 1.1;
}
.ps-kbd {
  display: inline-flex; align-items: center;
  font-size: .75rem; padding: .32rem .5rem;
}
.ps-close {
  appearance: none;
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; min-width: 44px; min-height: 44px;
  margin: 0; padding: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255,255,255,.78);
  color: var(--fg);
  font-size: 1.45rem; line-height: 1;
  cursor: pointer;
}
.ps-close:hover { background: #FFF; border-color: rgba(75, 83, 32, .35); }
.ps-close:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
.ps-search-wrap {
  margin: 0 1.1rem .55rem;
  flex: 0 0 auto;
  min-height: 56px;
  padding: .45rem 1rem .45rem 1.1rem;
  border-radius: 14px;
  border: 1.5px solid rgba(75, 83, 32, .28);
  background: rgba(255,255,255,.92);
  box-shadow: 0 1px 0 rgba(255,255,255,.7) inset, 0 8px 24px rgba(43, 38, 31, .06);
}
.ps-search-wrap:focus-within {
  border-color: var(--cta);
  box-shadow: 0 0 0 3px var(--cta-dim), 0 1px 0 rgba(255,255,255,.7) inset;
}
.ps-search-wrap .sf-search {
  font-size: 1.12rem;
  min-height: 44px;
}
.ps-search-wrap .sf-search-icon { font-size: 1.25rem; color: var(--brand); }
.ps-search-wrap .sf-search-clear {
  width: 32px; height: 32px; min-width: 32px;
}
.ps-list {
  flex: 1 1 auto; overflow: auto; max-height: min(58vh, 520px);
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid var(--line);
  background: rgba(255,255,255,.62);
}
.ps-list .sf-hit {
  min-height: 60px;
  padding: .7rem 1rem;
  gap: .85rem;
}
.ps-list .sf-hit img, .ps-list .sf-hit-ph {
  width: 48px; height: 48px;
}
.ps-list .sf-hit-name { font-size: .98rem; }
.ps-list .sf-hit-sku { font-size: .7rem; }
.ps-list .sf-empty { padding: 1.15rem 1rem; font-size: .95rem; }
.ps-root .sf-live-label {
  padding: .45rem 1.1rem .35rem;
  font-size: .68rem;
}
html.ps-open { overflow: hidden; }
html.ps-open .site-header { z-index: 70; }

.hero-find {
  display: flex; align-items: center; gap: .65rem;
  width: min(100%, 34rem);
  min-height: 52px;
  margin-top: 1rem;
  padding: .4rem .85rem .4rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255,255,255,.82);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  text-align: left;
  box-shadow: 0 1px 0 rgba(255,255,255,.6) inset;
}
.hero-find:hover { border-color: rgba(75, 83, 32, .4); color: var(--fg); }
.hero-find:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
.hero-find-icon { font-size: 1.2rem; line-height: 1; flex: 0 0 auto; }
.hero-find-text {
  flex: 1; min-width: 0;
  font-size: .98rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hero-find-kbd { display: inline-flex; margin-left: auto; flex: 0 0 auto; }

@media (min-width: 768px) {
  .lb-root { padding: 1.25rem; align-items: center; }
  .lb-dialog {
    width: min(100%, 980px);
    height: min(90dvh, 860px);
    max-height: min(90dvh, 860px);
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.12);
    box-shadow: 0 18px 50px rgba(0,0,0,.35);
  }
  .lb-head { padding-top: .75rem; }
  .lb-foot { padding-bottom: .65rem; }
}
@media (max-width: 479px) {
  .ps-root {
    align-items: flex-end;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .ps-dialog {
    width: 100%;
    max-height: min(92vh, 820px);
    border-radius: 20px 20px 0 0;
  }
  .ps-search-wrap { margin: 0 .85rem .45rem; }
  .hero-find-kbd { display: none; }
}
.page-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 8vw, 3.2rem);
  text-transform: uppercase;
  line-height: 1.05;
  margin: 0 0 1rem;
  word-break: break-word;
  color: var(--brand);
}
.page-lead { color: var(--muted); max-width: 40rem; }
.spec-block table, table.spec {
  width: 100%;
  border-collapse: collapse;
}
.spec-block table th, .spec-block table td,
table.spec th, table.spec td {
  border: 1px solid var(--line);
  padding: .65rem .75rem;
  text-align: left;
  vertical-align: top;
}
.spec-block table th, table.spec th {
  width: 32%;
  color: var(--cta);
  font-family: var(--font-mono);
  font-size: .72rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-weight: 500;
}
.spec-block table td, table.spec td { color: var(--muted); }
.spec-block table code, table.spec code {
  margin-right: .5rem; color: var(--steel); font-size: .72rem;
}

/* Breakpoints: ~320–360 Duo/SE, 390/393, 428 Pro Max */
@media (min-width: 480px) {
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .form-grid .row2 { grid-template-columns: 1fr 1fr; }
  .rail { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sf-row { min-height: 52px; }
  .sf-group-name { font-size: 1.12rem; }
  .sf-popover-root { align-items: center; padding: 1rem; }
  .sf-popover {
    border-radius: 16px;
    max-height: min(80vh, 680px);
    box-shadow: 0 18px 50px rgba(0,0,0,.22);
  }
}
@media (min-width: 640px) {
  .split-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sol-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sol-caps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
  .split-hero { grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 2rem; }
  .sol-hero { grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 2rem; }
  .contact-layout { grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 2rem; }
  .contact-map-panel { height: 100%; grid-template-rows: 1fr auto; }
  .contact-map { aspect-ratio: auto; min-height: 380px; height: 100%; }
  .rail { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .thumb-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); }
}
@media (min-width: 900px) {
  .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }
  .sol-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1100px) {
  .rail { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
}

/* Drawer below 1100 — links never share the locked 56px bar */
@media (max-width: 1099px) {
  .appbar-nav {
    display: none;
    position: absolute;
    top: calc(var(--appbar-h) + var(--safe-t));
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    max-height: min(72vh, 520px);
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 0;
    padding: 0.4rem var(--pad-x) calc(0.85rem + var(--safe-b));
    background: linear-gradient(180deg, #FFFEF9, var(--bg-elev));
    border-bottom: 2px solid var(--cta);
    box-shadow: 0 16px 36px rgba(43, 38, 31, 0.16);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .site-header.is-open .appbar-nav { display: flex; }
  .appbar-nav a:not(.btn) {
    width: 100%;
    height: 44px;
    border-bottom: 1px solid var(--line);
    padding: 0 0.15rem;
    font-size: .82rem;
  }
  .appbar-nav .appbar-cta-drawer,
  .appbar-nav .appbar-call-drawer {
    display: inline-flex;
    width: 100%;
    height: 44px;
    min-height: 44px;
    margin-top: 0.65rem;
    justify-content: center;
    align-items: center;
  }
  .appbar-nav .appbar-call-drawer { margin-top: 0.45rem; }
  .hero-frame { max-height: min(42vh, 280px); }
  .meta-bar { gap: 0.65rem 1rem; font-size: .65rem; }
  .footer-bar { gap: .75rem 1rem; }
  .footer-identity { gap: .85rem; }
  .footer-copy { font-size: .82rem; }
  .footer-brand { height: calc(0.82rem * 1.45 * 2 + 0.28rem); }
}
@media (max-width: 419px) {
  .brand-word { display: none; }
  .brand { max-width: 40px; }
}
@media (max-width: 359px) {
  .hero h1 { font-size: clamp(2.2rem, 12vw, 2.8rem); }
}
@media (prefers-reduced-motion: reduce) {
  .btn, .product, .rail a { transition: none; }
}
`;

export const CDN_BASE = "https://cdn.circuitbull.com";

/** Decode common HTML entities before escaping plain text fields. */
export function decodeEntities(s: unknown) {
  return String(s ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&deg;/gi, "°")
    .replace(/&times;/gi, "×")
    .replace(/&plusmn;/gi, "±")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

export function escapeHtml(s: unknown) {
  return decodeEntities(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Allow scraped catalog HTML; strip scripts/handlers. */
export function sanitizeCatalogHtml(html: unknown) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/** Datasheet HTML filename from the product display name in the active language. */
export function datasheetNameSlug(input: unknown, max = 160) {
  const normalized = String(input || "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = [...normalized].slice(0, max).join("").replace(/-+$/g, "");
  return cut || "product";
}

function encodeCdnKey(key: string) {
  return String(key || "")
    .replace(/^\//, "")
    .split("/")
    .map((seg) => {
      try {
        if (decodeURIComponent(seg) !== seg) return seg;
      } catch {
        /* already encoded or malformed */
      }
      return encodeURIComponent(seg);
    })
    .join("/");
}

export function cdnUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl);
  const wrap = (rest: string) => `${CDN_BASE}/${encodeCdnKey(rest)}`;
  if (s.startsWith("https://cdn.circuitbull.com/")) return wrap(s.slice("https://cdn.circuitbull.com/".length));
  if (s.startsWith("https://circuitbull.com/cdn/")) return wrap(s.slice("https://circuitbull.com/cdn/".length));
  if (s.startsWith("http://circuitbull.com/cdn/")) return wrap(s.slice("http://circuitbull.com/cdn/".length));
  if (s.startsWith("/cdn/")) return wrap(s.slice(5));
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return wrap(s);
}

/** CDN HTML datasheet named from the localized product title. */
export function productDatasheetCdnHref(p: any, copyName: string, lang: string) {
  const stored = p?.cdn?.datasheetSlugs?.[lang] || p?.cdn?.datasheetSlugs?.en;
  const slug = stored || datasheetNameSlug(copyName || p?.name || p?.slug);
  return cdnUrl(`products/${slug}.html`);
}

function resolveSelectorCountry(lang: string, countryHint?: string): string {
  const hint = countryHint ? String(countryHint).toUpperCase() : "";
  if (hint && SELECTOR_COUNTRIES.some((c) => c.code === hint)) return hint;
  // Prefer a country that offers the active language (US for shared English).
  if (lang === "en") return "US";
  const match = SELECTOR_COUNTRIES.find((c) => c.langs.includes(lang));
  return match?.code || "US";
}

function localeSwitcherHtml(lang: string, countryHint?: string) {
  const selectedCc = resolveSelectorCountry(lang, countryHint);
  const countryLangs = langsForCountry(selectedCc);
  const selectedLang = countryLangs.includes(lang) ? lang : countryLangs[0] || DEFAULT_LANG;

  const countryOpts = SELECTOR_COUNTRIES.map(
    (c) =>
      `<option value="${c.code}" title="${escapeHtml(c.label)}"${c.code === selectedCc ? " selected" : ""}>${escapeHtml(c.code)}</option>`
  ).join("");

  const langOpts = countryLangs
    .map(
      (l) =>
        `<option value="${escapeHtml(l)}"${l === selectedLang ? " selected" : ""}>${escapeHtml(l === "zh-Hant" ? "ZH" : (l || "en").toUpperCase())}</option>`
    )
    .join("");

  return `<div class="locale-wrap">
  <label class="locale-field">
    <span class="visually-hidden">Country</span>
    <select id="cb-country" class="locale-select" aria-label="Country" title="${escapeHtml(SELECTOR_COUNTRIES.find((c) => c.code === selectedCc)?.label || selectedCc)}">${countryOpts}</select>
  </label>
  <label class="locale-field">
    <span class="visually-hidden">Language</span>
    <select id="cb-lang" class="locale-select locale-lang" aria-label="Language" data-lang="${escapeHtml(selectedLang)}" title="${escapeHtml(LOCALE_LABELS[selectedLang] || selectedLang)}">${langOpts}</select>
  </label>
</div>`;
}

function localeScript(lang: string, pathname: string) {
  const map: Record<string, string[]> = {};
  for (const c of SELECTOR_COUNTRIES) map[c.code] = [...c.langs];
  const labels: Record<string, string> = {};
  for (const l of SITE_LOCALES) labels[l] = LOCALE_LABELS[l] || l;
  // Server-computed targets (same rules as rewritePathForLang) so SSR reloads in the new lang.
  const alternates: Record<string, string> = {};
  for (const l of SITE_LOCALES) alternates[l] = rewritePathForLang(pathname || "/", l);

  return `<script>
(function(){
  var LANG=${JSON.stringify(lang)};
  var KEY_LANG='cb_lang';
  var KEY_CC='cb_country';
  var COUNTRY_LANGS=${JSON.stringify(map)};
  var LANG_LABELS=${JSON.stringify(labels)};
  var ALTERNATES=${JSON.stringify(alternates)};
  function setCookie(n,v,days){
    var d=new Date(); d.setDate(d.getDate()+(days||365));
    document.cookie=n+'='+encodeURIComponent(v)+';path=/;expires='+d.toUTCString()+';SameSite=Lax';
  }
  /** Fallback mirrors worker/src/i18n/locales.ts rewritePathForLang */
  function rewrite(path, lang){
    if(ALTERNATES[lang]) return ALTERNATES[lang];
    var p=path||'/';
    var loc='(?:[a-z]{2}(?:-[A-Za-z]+)?|zh-Hant)';
    var ds=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?products\\\\/([^/]+)\\\\/datasheet(?:\\\\.pdf)?\\\\/?$','i'));
    if(ds){
      if(lang==='en') return '/products/'+ds[2]+'/datasheet';
      return '/'+lang+'/products/'+ds[2]+'/datasheet';
    }
    var m=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?products(?:\\\\/([^/]+))?\\\\/?$','i'));
    if(m){
      var slug=m[2];
      if(lang==='en') return slug?('/products/'+slug):'/products';
      return slug?('/'+lang+'/products/'+slug):('/'+lang+'/products');
    }
    var sc=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?solutions\\\\/([^/]+)\\\\/([^/]+)\\\\/?$','i'));
    if(sc) return lang==='en'?('/en/solutions/'+sc[2]+'/'+sc[3]):('/'+lang+'/solutions/'+sc[2]+'/'+sc[3]);
    var s=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?solutions\\\\/([^/]+)\\\\/?$','i'));
    if(s) return lang==='en'?('/en/solutions/'+s[2]):('/'+lang+'/solutions/'+s[2]);
    var si=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?solutions\\\\/?$','i'));
    if(si) return lang==='en'?'/solutions':('/'+lang+'/solutions');
    var inv=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?invest\\\\/?$','i'));
    if(inv) return lang==='en'?'/invest':('/'+lang+'/invest');
    var ct=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?contact\\\\/?$','i'));
    if(ct) return lang==='en'?'/contact':('/'+lang+'/contact');
    var pt=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?partners\\\\/?$','i'));
    if(pt) return lang==='en'?'/partners':('/'+lang+'/partners');
    var lg=p.match(new RegExp('^\\\\/(?:('+loc+')\\\\/)?(terms|gdpr|data-policy|code-of-conduct)\\\\/?$','i'));
    if(lg) return lang==='en'?('/'+lg[2]):('/'+lang+'/'+lg[2]);
    if(p==='/' || new RegExp('^\\\\/([a-z]{2}|zh-Hant)\\\\/?$','i').test(p)) return lang==='en'?'/':('/'+lang);
    return p;
  }
  function stripBust(q){
    if(!q) return '';
    var params=new URLSearchParams(q.charAt(0)==='?'?q.slice(1):q);
    params.delete('_cb');
    var s=params.toString();
    return s?('?'+s):'';
  }
  function persist(cc, lang){
    try {
      localStorage.setItem(KEY_LANG, lang);
      localStorage.setItem(KEY_CC, cc);
      setCookie(KEY_LANG, lang);
      setCookie(KEY_CC, cc);
    } catch(e){}
  }
  function go(lang){
    var path=rewrite(location.pathname, lang);
    var q=stripBust(location.search||'');
    var h=location.hash||'';
    // Always navigate so SSR HTML reloads in the selected language (cookies alone are not enough).
    if(path===location.pathname){
      var sep=q?'&':'?';
      location.replace(path+q+sep+'_cb='+Date.now()+h);
    } else {
      location.assign(path+q+h);
    }
  }
  function fillLangs(cc, prefer){
    var langs=COUNTRY_LANGS[cc]||['en'];
    var sel=document.getElementById('cb-lang');
    if(!sel) return langs[0]||'en';
    sel.innerHTML='';
    var pick=langs.indexOf(prefer)>=0?prefer:langs[0];
    for(var i=0;i<langs.length;i++){
      var l=langs[i];
      var opt=document.createElement('option');
      opt.value=l;
      opt.textContent=l==='zh-Hant'?'ZH':(l||'en').toUpperCase();
      if(l===pick) opt.selected=true;
      sel.appendChild(opt);
    }
    sel.setAttribute('data-lang', pick);
    return pick;
  }
  var countrySel=document.getElementById('cb-country');
  var langSel=document.getElementById('cb-lang');
  try {
    localStorage.setItem(KEY_LANG, LANG);
    setCookie(KEY_LANG, LANG);
    if(countrySel && countrySel.value){
      localStorage.setItem(KEY_CC, countrySel.value);
      setCookie(KEY_CC, countrySel.value);
    }
  } catch(e){}
  if(countrySel && langSel){
    countrySel.addEventListener('change', function(){
      var cc=countrySel.value;
      var next=fillLangs(cc, LANG);
      persist(cc, next);
      go(next);
    });
    langSel.addEventListener('change', function(){
      var cc=countrySel.value;
      var next=langSel.value||'en';
      persist(cc, next);
      go(next);
    });
  }
  var header=document.querySelector('.site-header');
  var toggle=document.querySelector('.nav-toggle');
  var nav=document.getElementById('primary-nav');
  if(header && toggle && nav){
    function setOpen(open){
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', function(){
      setOpen(!header.classList.contains('is-open'));
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ setOpen(false); });
    });
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape') setOpen(false);
    });
    window.addEventListener('resize', function(){
      if(window.matchMedia('(min-width:1100px)').matches) setOpen(false);
    });
  }
})();
</script>`;
}

function lightboxMarkupAndScript() {
  return `<div class="lb-root" id="lb-root" hidden>
  <button type="button" class="lb-backdrop" data-lb-close tabindex="-1" aria-label="Close"></button>
  <div class="lb-dialog" role="dialog" aria-modal="true" aria-labelledby="lb-title">
    <div class="lb-head">
      <div>
        <p class="lb-kicker" id="lb-kicker">Product image</p>
        <h4 class="lb-title" id="lb-title">Preview</h4>
      </div>
      <button type="button" class="lb-close" data-lb-close aria-label="Close">×</button>
    </div>
    <div class="lb-body" id="lb-body">
      <div class="lb-stage" id="lb-stage">
        <button type="button" class="lb-nav lb-prev" id="lb-prev" aria-label="Previous image">‹</button>
        <img id="lb-img" alt=""/>
        <button type="button" class="lb-nav lb-next" id="lb-next" aria-label="Next image">›</button>
      </div>
      <aside class="lb-side" id="lb-side" hidden>
        <p class="lb-sku" id="lb-sku"></p>
        <p class="lb-summary" id="lb-summary"></p>
        <p class="lb-apps-label" id="lb-apps-label" hidden>Applications</p>
        <ul class="lb-apps" id="lb-apps" hidden></ul>
        <div class="lb-cta" id="lb-cta">
          <a class="btn btn-primary" id="lb-view" href="#">View product</a>
          <a class="btn btn-ghost" id="lb-quote" href="/contact">Request quote</a>
          <button type="button" class="btn btn-ghost" id="lb-buy" hidden data-open-buy>Buy</button>
        </div>
      </aside>
    </div>
    <div class="lb-foot" id="lb-count" aria-live="polite"></div>
  </div>
</div>
<script>
(function(){
  var root=document.getElementById('lb-root');
  if(!root) return;
  var imgEl=document.getElementById('lb-img');
  var titleEl=document.getElementById('lb-title');
  var kickerEl=document.getElementById('lb-kicker');
  var countEl=document.getElementById('lb-count');
  var prevBtn=document.getElementById('lb-prev');
  var nextBtn=document.getElementById('lb-next');
  var stage=document.getElementById('lb-stage');
  var side=document.getElementById('lb-side');
  var skuEl=document.getElementById('lb-sku');
  var summaryEl=document.getElementById('lb-summary');
  var appsLabel=document.getElementById('lb-apps-label');
  var appsEl=document.getElementById('lb-apps');
  var viewBtn=document.getElementById('lb-view');
  var quoteBtn=document.getElementById('lb-quote');
  var buyBtn=document.getElementById('lb-buy');
  var lastFocus=null;
  var items=[];
  var index=0;
  var peekMode=false;
  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function uniqSrc(list){
    var seen={};
    return list.filter(function(it){
      if(!it.src||seen[it.src]) return false;
      seen[it.src]=true;
      return true;
    });
  }
  function readPeek(el){
    if(!el||!el.getAttribute) return null;
    var path=el.getAttribute('data-product-path')||'';
    var sku=el.getAttribute('data-sku')||'';
    var name=el.getAttribute('data-product-name')||el.getAttribute('alt')||'';
    var summary=el.getAttribute('data-summary')||'';
    var apps=(el.getAttribute('data-apps')||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
    var areas=(el.getAttribute('data-areas')||'').split('|').map(function(x){return x.trim();}).filter(Boolean);
    var image=el.getAttribute('data-full')||el.getAttribute('src')||'';
    if(!path && !sku && el.getAttribute('data-product-peek')==null) return null;
    if(!path && !sku) return null;
    return {src:image,alt:name,sku:sku,name:name,summary:summary,path:path,apps:apps,areas:areas,peek:true};
  }
  function collect(startEl){
    var peek=readPeek(startEl);
    if(peek){
      items=[peek];
      index=0;
      peekMode=true;
      return;
    }
    peekMode=false;
    var all=document.querySelectorAll('[data-lightbox]');
    var out=[];
    for(var i=0;i<all.length;i++){
      var el=all[i];
      if(readPeek(el)) continue;
      out.push({
        src: el.getAttribute('data-full')||el.getAttribute('src')||'',
        alt: el.getAttribute('alt')||''
      });
    }
    items=uniqSrc(out);
    var start=startEl.getAttribute('data-full')||startEl.getAttribute('src')||'';
    index=0;
    for(var j=0;j<items.length;j++) if(items[j].src===start){ index=j; break; }
  }
  function quoteHref(it){
    var params=new URLSearchParams();
    params.set('interest','catalog');
    if(it.path){
      var slug=String(it.path).replace(/\\/$/,'').split('/').pop();
      if(slug) params.set('product',slug);
    }
    if(it.sku) params.set('sku',it.sku);
    if(it.name) params.set('productName',it.name);
    return '/contact?'+params.toString();
  }
  function paintPeek(it){
    root.classList.add('is-peek');
    if(side) side.hidden=false;
    if(kickerEl) kickerEl.textContent=it.sku?('SKU · '+it.sku):'Platform';
    if(titleEl) titleEl.textContent=it.name||it.alt||'Product';
    if(skuEl) skuEl.textContent=it.sku||'';
    if(summaryEl) summaryEl.textContent=it.summary||'';
    var tags=[].concat(it.apps||[], it.areas||[]);
    var seen={}; tags=tags.filter(function(t){ if(!t||seen[t]) return false; seen[t]=true; return true; }).slice(0,8);
    if(appsEl){
      appsEl.innerHTML=tags.map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('');
      appsEl.hidden=!tags.length;
    }
    if(appsLabel) appsLabel.hidden=!tags.length;
    if(viewBtn){
      viewBtn.href=it.path||'#';
      viewBtn.hidden=!it.path;
    }
    if(quoteBtn) quoteBtn.href=quoteHref(it);
    var hasBuy=!!document.getElementById('buy-root');
    if(buyBtn){
      buyBtn.hidden=!hasBuy;
      buyBtn.setAttribute('data-sku',it.sku||'');
      buyBtn.setAttribute('data-product-name',it.name||'');
      buyBtn.setAttribute('data-product-path',it.path||'');
      buyBtn.setAttribute('data-product-image',it.src||'');
    }
    if(imgEl){ imgEl.src=it.src; imgEl.alt=it.name||it.alt||''; }
    if(prevBtn) prevBtn.hidden=true;
    if(nextBtn) nextBtn.hidden=true;
    if(countEl) countEl.textContent='';
  }
  function paintGallery(){
    root.classList.remove('is-peek');
    if(side) side.hidden=true;
    if(kickerEl) kickerEl.textContent='Product image';
    var it=items[index];
    if(!it||!imgEl) return;
    imgEl.src=it.src;
    imgEl.alt=it.alt||'';
    if(titleEl) titleEl.textContent=it.alt||'Product image';
    if(countEl) countEl.textContent=items.length?(index+1)+' / '+items.length:'';
    var many=items.length>1;
    if(prevBtn) prevBtn.hidden=!many;
    if(nextBtn) nextBtn.hidden=!many;
  }
  function paint(){
    var it=items[index];
    if(!it) return;
    if(peekMode||it.peek) paintPeek(it);
    else paintGallery();
  }
  function go(delta){
    if(peekMode||items.length<2) return;
    index=(index+delta+items.length)%items.length;
    paint();
  }
  function openLb(startEl){
    collect(startEl);
    if(!items.length) return;
    lastFocus=document.activeElement;
    paint();
    root.hidden=false;
    document.documentElement.classList.add('lb-open');
    var closeBtn=root.querySelector('.lb-close');
    if(closeBtn) closeBtn.focus();
  }
  function closeLb(){
    if(root.hidden) return;
    root.hidden=true;
    document.documentElement.classList.remove('lb-open');
    root.classList.remove('is-peek');
    if(imgEl){ imgEl.removeAttribute('src'); imgEl.alt=''; }
    items=[];
    peekMode=false;
    if(lastFocus&&lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} }
  }
  document.addEventListener('click',function(e){
    var t=e.target;
    if(!t||!t.closest) return;
    if(t.closest('[data-lb-close]')){
      e.preventDefault();
      closeLb();
      return;
    }
    if(t.closest('#lb-prev')){ e.preventDefault(); go(-1); return; }
    if(t.closest('#lb-next')){ e.preventDefault(); go(1); return; }
    if(t.closest('#lb-buy')){
      e.preventDefault();
      e.stopPropagation();
      closeLb();
      var btn=document.getElementById('lb-buy');
      if(window.__cbOpenBuy && btn){
        window.__cbOpenBuy({
          sku:btn.getAttribute('data-sku')||'',
          productName:btn.getAttribute('data-product-name')||'',
          path:btn.getAttribute('data-product-path')||'',
          image:btn.getAttribute('data-product-image')||''
        });
      } else if(btn){
        btn.click();
      }
      return;
    }
    var trigger=t.closest('[data-lightbox]');
    if(!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    openLb(trigger);
  }, true);
  document.addEventListener('keydown',function(e){
    if(root.hidden) return;
    if(e.key==='Escape'){ e.preventDefault(); closeLb(); }
    if(!peekMode && e.key==='ArrowLeft'){ e.preventDefault(); go(-1); }
    if(!peekMode && e.key==='ArrowRight'){ e.preventDefault(); go(1); }
  });
  var sx=0, sy=0;
  if(stage){
    stage.addEventListener('touchstart',function(e){
      if(!e.changedTouches||!e.changedTouches[0]) return;
      sx=e.changedTouches[0].clientX;
      sy=e.changedTouches[0].clientY;
    },{passive:true});
    stage.addEventListener('touchend',function(e){
      if(peekMode) return;
      if(!e.changedTouches||!e.changedTouches[0]) return;
      var dx=e.changedTouches[0].clientX-sx;
      var dy=e.changedTouches[0].clientY-sy;
      if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)) return;
      go(dx<0?1:-1);
    },{passive:true});
  }
})();
</script>`;
}

function pathnameFromLayoutOpts(opts: { canonical: string; path?: string; localeSwitchPath?: string; lang?: string }) {
  if (opts.path) return opts.path;
  try {
    if (opts.canonical) return new URL(opts.canonical).pathname || "/";
  } catch {
    /* ignore */
  }
  // localeSwitchPath is a template like "/{lang}/products/slug" — materialize for active lang.
  if (opts.localeSwitchPath) {
    const l = opts.lang || DEFAULT_LANG;
    const filled =
      l === DEFAULT_LANG
        ? opts.localeSwitchPath.replace("/{lang}", "").replace("{lang}", "") || "/"
        : opts.localeSwitchPath.replace("{lang}", l);
    return filled.startsWith("/") ? filled : `/${filled}`;
  }
  return "/";
}

export function layout(opts: {
  title: string;
  description: string;
  canonical: string;
  lang?: string;
  country?: string;
  jsonld?: unknown;
  hreflang?: { lang: string; href: string }[];
  body: string;
  path?: string;
  localeSwitchPath?: string;
}) {
  const lang = opts.lang || DEFAULT_LANG;
  const ui = pageCopy(lang);
  const pagePath = pathnameFromLayoutOpts(opts);
  const home = homePath(lang);
  const catalogHref = catalogPath(lang);
  const partnersHref = partnersPath(lang);
  const contactHref = contactPath(lang);
  const ogAlts = SITE_LOCALES.filter((l) => l !== lang)
    .map((l) => `<meta property="og:locale:alternate" content="${escapeHtml(l === "zh-Hant" ? "zh_TW" : l)}"/>`)
    .join("\n");
  const jsonld = opts.jsonld
    ? Array.isArray(opts.jsonld)
      ? opts.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")
      : `<script type="application/ld+json">${JSON.stringify(opts.jsonld)}</script>`
    : "";
  const hreflang = [
    ...(opts.hreflang || []),
    ...(opts.hreflang?.length
      ? [{ lang: "x-default", href: opts.hreflang.find((h) => h.lang === "en")?.href || opts.canonical }]
      : []),
  ]
    .map((h) => `<link rel="alternate" hreflang="${h.lang}" href="${h.href}"/>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "ar" ? ' dir="rtl"' : ""}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<link rel="canonical" href="${escapeHtml(opts.canonical)}"/>
${hreflang}
<meta property="og:site_name" content="Circuitbull®"/>
<meta property="og:title" content="${escapeHtml(opts.title)}"/>
<meta property="og:description" content="${escapeHtml(opts.description)}"/>
<meta property="og:url" content="${escapeHtml(opts.canonical)}"/>
<meta property="og:locale" content="${escapeHtml(lang === "zh-Hant" ? "zh_TW" : lang)}"/>
${ogAlts}
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(opts.title)}"/>
<meta name="twitter:description" content="${escapeHtml(opts.description)}"/>
<meta name="theme-color" content="#F4F3EF"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3"/>
<link rel="icon" href="/favicon.ico?v=3" sizes="32x32"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3"/>
${FONTS}
<style>${CSS}</style>
${jsonld}
</head>
<body>
<header class="site-header">
  <div class="wrap appbar">
    <a class="brand" href="${home}">
      ${inlineMarkSvg()}
      <span class="brand-word">Circuit<span>bull</span>®</span>
    </a>
    <nav id="primary-nav" class="appbar-nav" aria-label="${escapeHtml(ui.nav.primaryNav)}">
      <a href="${home}#usa">${escapeHtml(ui.nav.systems)}</a>
      <a href="${solutionsIndexPath(lang)}">${escapeHtml(ui.nav.solutions)}</a>
      <a href="${catalogHref}">${escapeHtml(ui.nav.catalog)}</a>
      <a href="${investPath(lang)}" title="${escapeHtml(ui.nav.investTitle)}" aria-label="${escapeHtml(ui.nav.investTitle)}">${escapeHtml(ui.nav.invest)}</a>
      <a href="${partnersHref}">${escapeHtml(ui.nav.partners)}</a>
      <a href="${contactHref}">${escapeHtml(ui.nav.contact)}</a>
      <a class="btn btn-ghost appbar-call-drawer" href="${CALL_SWITCHBOARD_URL}">${escapeHtml(ui.nav.callNow)}</a>
      <a class="btn btn-primary appbar-cta-drawer" href="${contactHref}">${escapeHtml(ui.nav.requestBrief)}</a>
    </nav>
    <div class="appbar-tools">
      <button type="button" class="nav-search" data-open-platform-search aria-label="${escapeHtml(ui.nav.find)}" aria-keyshortcuts="Control+K Meta+K">
        <span class="nav-search-icon" aria-hidden="true">⌕</span>
        <span class="nav-search-label">${escapeHtml(ui.nav.find)}</span>
        <kbd class="nav-search-kbd" data-ps-kbd>Ctrl K</kbd>
      </button>
      ${localeSwitcherHtml(lang, opts.country)}
      <a class="btn btn-ghost appbar-call" href="${CALL_SWITCHBOARD_URL}">${escapeHtml(ui.nav.callNow)}</a>
      <a class="btn btn-primary appbar-cta" href="${contactHref}">${escapeHtml(ui.nav.requestBrief)}</a>
      <button type="button" class="nav-toggle" aria-controls="primary-nav" aria-expanded="false" aria-label="${escapeHtml(ui.nav.menu)}">
        <span class="nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
    </div>
  </div>
</header>
${opts.body}
<footer class="site-footer">
  <div class="wrap footer-bar">
    <div class="footer-identity">
      <a class="footer-brand" href="${home}">
        <img class="footer-lockup" src="/brand/logo-on-dark.svg" alt="Circuitbull" width="220" height="122"/>
      </a>
      <div class="footer-copy">
        <p><strong>Volls Global Inc</strong> · Circuitbull® trademark registered</p>
        <p>1207 Delaware Ave #5352, Wilmington, DE 19806, United States of America · <a href="${CALL_SWITCHBOARD_URL}">${HQ_PHONE_DISPLAY}</a> · <a href="mailto:info@circuitbull.com">info@circuitbull.com</a></p>
      </div>
    </div>
    <nav class="footer-legal" aria-label="${escapeHtml(legalKicker(lang))}">
      ${legalNav(lang).map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`).join("")}
    </nav>
  </div>
</footer>
${localeScript(lang, pagePath)}
${lightboxMarkupAndScript()}
${platformSearchMarkup(lang)}
</body>
</html>`;
}
