/* utilidades do protótipo */
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = n => brl.format(n).replace(/ /g, ' ');
const fmtInt = n => new Intl.NumberFormat('pt-BR').format(Math.round(n));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function parseMoney(v) { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* contagem animada dos números */
function countTo(el, to, f, ms = 900) {
  if (!el) return;
  const from = parseFloat(el.dataset.v || 0); el.dataset.v = to;
  if (reduce || from === to) { el.textContent = f(to); return; }
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 4);
    el.textContent = f(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step); else el.textContent = f(to);
  })(t0);
}

/* revelar ao rolar */
(function () {
  const els = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('in'); }), 60);
})();

/* controle segmentado */
const CAMP_DEFAULT = [
  { id: 1, n: 'Campanha Stuart (exemplo)', d: 'Tratamento e cirurgia do Stuart, resgatado na quadra 105.', meta: 2000, inn: 1200, out: 980, st: 'open', ini: '2026-08-10' },
  { id: 2, n: 'Campanha Nelson (exemplo)', d: 'Resgate e recuperação do Nelson.', meta: 640, inn: 640, out: 640, st: 'closed', ini: '2026-03-02' }];
const Camps = {
  get() { try { const v = localStorage.getItem('sp_camps'); if (v) return JSON.parse(v); } catch (e) {} return JSON.parse(JSON.stringify(CAMP_DEFAULT)); },
  set(a) { try { localStorage.setItem('sp_camps', JSON.stringify(a)); } catch (e) {} }
};
function psel(root, onChange) {
  const sel = $('select', root), p = $('.p-prev', root), n = $('.p-next', root);
  const upd = () => { p.disabled = sel.selectedIndex >= sel.options.length - 1; n.disabled = sel.selectedIndex <= 0; };
  const go = d => { sel.selectedIndex = Math.min(sel.options.length - 1, Math.max(0, sel.selectedIndex + d)); upd(); onChange(sel.value); };
  p.addEventListener('click', () => go(1)); n.addEventListener('click', () => go(-1));
  sel.addEventListener('change', () => { upd(); onChange(sel.value); }); upd();
}
function segmented(el, onChange) {
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', el).forEach(x => x.setAttribute('aria-pressed', x === b));
    onChange(b.dataset.v);
  });
}

/* seletor de período das páginas públicas: setas + botão + lista própria (a lista nativa não segue o visual).
   options: [{ v, label, list?, tag?, group? }] na ordem da lista; steps: valores em ordem cronológica para as setas.
   As setas andam pelos steps; fora deles (ex.: "desde o início"), a seta da esquerda volta para o último. */
function periodPicker(root, { label, options, steps, value, onChange }) {
  const id = root.id || 'pp';
  root.classList.add('pbar');
  root.innerHTML = `<button class="pbtn" type="button" data-d="-1" aria-label="Mês anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>
    <div class="pdrop"><button class="pdrop-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-list" aria-labelledby="${label} ${id}-txt"><span id="${id}-txt"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    <ul class="pdrop-list" id="${id}-list" role="listbox" tabindex="-1" aria-labelledby="${label}" hidden>${options.map(o => (o.group ? `<li class="grp" role="presentation">${o.group}</li>` : '') +
      `<li role="option" id="${id}-op-${o.v}" data-v="${o.v}">${o.list || o.label}${o.tag ? `<small>${o.tag}</small>` : ''}</li>`).join('')}</ul></div>
    <button class="pbtn" type="button" data-d="1" aria-label="Próximo mês"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>`;
  const btn = $('.pdrop-btn', root), list = $('.pdrop-list', root), opts = $$('[role=option]', list), [prev, next] = $$('.pbtn', root);
  let cur = value, ativo = 0;
  const marcar = k => { ativo = (k + opts.length) % opts.length; opts.forEach((li, j) => li.classList.toggle('act', j === ativo)); list.setAttribute('aria-activedescendant', opts[ativo].id); opts[ativo].scrollIntoView({ block: 'nearest' }); };
  const abrir = () => { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); marcar(opts.findIndex(li => li.dataset.v === cur)); list.focus(); };
  const fechar = foco => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (foco) btn.focus(); };
  function set(v, silent) {
    cur = v; $(`#${id}-txt`).textContent = options.find(o => o.v === v).label;
    opts.forEach(li => li.setAttribute('aria-selected', li.dataset.v === v));
    const k = steps.indexOf(v); prev.disabled = k === 0; next.disabled = k === -1 || k === steps.length - 1;
    if (!silent) onChange(v);
  }
  btn.addEventListener('click', () => list.hidden ? abrir() : fechar());
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(); } });
  list.addEventListener('click', e => { const li = e.target.closest('[role=option]'); if (li) { set(li.dataset.v); fechar(true); } });
  list.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); marcar(ativo + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(ativo - 1); }
    else if (e.key === 'Home') { e.preventDefault(); marcar(0); } else if (e.key === 'End') { e.preventDefault(); marcar(opts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(opts[ativo].dataset.v); fechar(true); }
    else if (e.key === 'Escape' || e.key === 'Tab') fechar(e.key === 'Escape');
  });
  document.addEventListener('pointerdown', e => { if (!list.hidden && !root.contains(e.target)) fechar(); });
  [prev, next].forEach(b => b.addEventListener('click', () => { const k = steps.indexOf(cur), d = +b.dataset.d; set(k === -1 ? steps[steps.length - 1] : steps[k + d]); }));
  set(value, true);
  return { set, get: () => cur };
}
