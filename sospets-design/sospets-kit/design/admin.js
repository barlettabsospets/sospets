// SOS Pets DF Águas Claras: ajudas comuns da área do administrador (carrega depois de app.js).

// listas em páginas de 10 linhas, com os mesmos botões em todas (‹ 1 2 3 ›).
// paginar(lista, pagina, nav, cont, rotulo) devolve só as linhas da página e desenha os botões e o "mostrando 1–10".
const POR_PAG = 10;
const SETA = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
function paginar(L, pagina, nav, cont, rotulo) {
  const pags = Math.max(1, Math.ceil(L.length / POR_PAG)), p = Math.min(Math.max(1, pagina), pags);
  const V = L.slice((p - 1) * POR_PAG, p * POR_PAG);
  if (cont) cont.textContent = L.length ? `${L.length} ${L.length === 1 ? rotulo[0] : rotulo[1]}${L.length > POR_PAG ? ` · mostrando ${(p - 1) * POR_PAG + 1}–${(p - 1) * POR_PAG + V.length}` : ''}` : '';
  nav.hidden = pags < 2;
  nav.innerHTML = `<button type="button" data-p="${p - 1}" ${p === 1 ? 'disabled' : ''} aria-label="Página anterior">${SETA('m15 5-7 7 7 7')}</button>` +
    Array.from({ length: pags }, (_, k) => k + 1).map(n => `<button type="button" data-p="${n}"${n === p ? ' aria-current="page"' : ''} aria-label="Página ${n} de ${pags}">${n}</button>`).join('') +
    `<button type="button" data-p="${p + 1}" ${p === pags ? 'disabled' : ''} aria-label="Próxima página">${SETA('m9 5 7 7-7 7')}</button>`;
  return { V, pagina: p };
}
// liga os botões de página: ao trocar, redesenha e devolve o foco para a página atual
function ligarPaginas(nav, ir) {
  nav.addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; ir(+b.dataset.p); $('button[aria-current]', nav)?.focus(); });
}

// lista de escolha no mesmo visual do "Selecione o mês" (sem as setas): botão com o valor atual e lista que abre embaixo.
// options: [{ v, label, cor }]. Teclado: setas, Home/End, Enter ou espaço escolhe, Esc fecha.
function escolha(root, { label, options, value, onChange }) {
  const id = root.id;
  const ponto = o => o.cor ? `<i style="background:${o.cor}" aria-hidden="true"></i>` : '';
  root.classList.add('ad-sel');
  root.innerHTML = `<button class="pdrop-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-list" aria-labelledby="${label} ${id}-txt"><span id="${id}-txt"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    <ul class="pdrop-list" id="${id}-list" role="listbox" tabindex="-1" aria-labelledby="${label}" hidden>${options.map(o => `<li role="option" id="${id}-op-${o.v}" data-v="${o.v}">${ponto(o)}<span>${o.label}</span></li>`).join('')}</ul>`;
  const btn = $('.pdrop-btn', root), list = $('.pdrop-list', root), opts = $$('[role=option]', list);
  let cur = value, ativo = 0;
  const marcar = k => { ativo = (k + opts.length) % opts.length; opts.forEach((li, j) => li.classList.toggle('act', j === ativo)); list.setAttribute('aria-activedescendant', opts[ativo].id); };
  const abrir = () => { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); marcar(Math.max(0, opts.findIndex(li => li.dataset.v === cur))); list.focus(); };
  const fechar = foco => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (foco) btn.focus(); };
  function set(v, silent) {
    cur = v; const o = options.find(o => o.v === v); $(`#${id}-txt`).innerHTML = ponto(o) + o.label;
    opts.forEach(li => li.setAttribute('aria-selected', li.dataset.v === v));
    if (!silent && onChange) onChange(v);
  }
  btn.addEventListener('click', () => list.hidden ? abrir() : fechar());
  btn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrir(); } });
  list.addEventListener('click', e => { const li = e.target.closest('[role=option]'); if (li) { set(li.dataset.v); fechar(true); } });
  list.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); marcar(ativo + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(ativo - 1); }
    else if (e.key === 'Home') { e.preventDefault(); marcar(0); } else if (e.key === 'End') { e.preventDefault(); marcar(opts.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(opts[ativo].dataset.v); fechar(true); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(true); } else if (e.key === 'Tab') fechar();
  });
  document.addEventListener('pointerdown', e => { if (!list.hidden && !root.contains(e.target)) fechar(); });
  set(value, true);
  return { set, get: () => cur };
}
