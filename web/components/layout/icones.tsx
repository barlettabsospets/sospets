// Ícones dos cabeçalhos e da tabbar, copiados do protótipo. Sempre decorativos (aria-hidden).

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
);

export const IconeContas = () => <Svg><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;

export const IconePetsPublico = () => (
  <Svg>
    <circle cx="6" cy="11" r="1.8" /><circle cx="10" cy="6.5" r="1.8" /><circle cx="14" cy="6.5" r="1.8" /><circle cx="18" cy="11" r="1.8" />
    <path d="M12 12.5c-2.8 0-5 2.6-5 4.8 0 1.6 1.2 2.2 2.5 2.2 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c1.3 0 2.5-.6 2.5-2.2 0-2.2-2.2-4.8-5-4.8z" />
  </Svg>
);

export const IconeDespesas = () => <Svg><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></Svg>;

export const IconeCadeado = () => <Svg><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Svg>;

export const IconeContribuicoes = () => (
  <Svg><path d="M12 20s-7-4.4-9-9c-1.3-3.2.8-6.5 4-6.5 2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.2 0 5.3 3.3 4 6.5-2 4.6-9 9-9 9z" /></Svg>
);

export const IconePetsAdmin = () => (
  <Svg>
    <circle cx="6" cy="11" r="2" /><circle cx="10" cy="6" r="2" /><circle cx="16" cy="6" r="2" /><circle cx="20" cy="11" r="2" />
    <path d="M12 12c-3 0-6 3-6 5.5 0 2 1.5 2.5 3 2.5 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.5 0 3-.5 3-2.5C18 15 15 12 12 12z" />
  </Svg>
);

export const IconeMembros = () => (
  <Svg><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2c2.2.8 3.5 2.8 3.5 5.8" /></Svg>
);

export const IconeMais = () => <Svg><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Svg>;

export const IconeSair = () => <Svg><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></Svg>;
