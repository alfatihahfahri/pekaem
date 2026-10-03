import { esc } from '../util.js';

export function barisBertahap(teks, jeda) {
  const langkah = jeda || 0.26;
  return String(teks).split('\n').map((b) => b.trim()).filter(Boolean)
    .map((b, i) => `<span class="baris-jawab" style="animation-delay:${(0.06 + i * langkah).toFixed(2)}s">${esc(b)}</span>`)
    .join('');
}

export function bertahap(akar, selektor, jeda) {
  const langkah = jeda || 0.14;
  document.querySelectorAll(selektor).forEach((el, i) => {
    el.style.animation = `fadeUp .5s ${(0.06 + i * langkah).toFixed(2)}s var(--ease-out) both`;
  });
}
