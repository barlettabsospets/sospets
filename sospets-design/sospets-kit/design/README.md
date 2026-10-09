# Protótipo de design (HTML estático)

Abra `index.html` no navegador. Não precisa instalar nada: as fontes (Nunito, Fraunces e Barlow Condensed) estão em `assets/fonts`.

| Arquivo | O que é |
|---|---|
| `index.html` | Prestação de contas: painel público que abre no mês atual (seletor de período, gráficos clicáveis) |
| `animais.html` | Animais: filtro por espécie, situação clicável e grade de animais |
| `despesas.html` | Despesas do mês: filtros por categoria e por animal, lista com o animal de cada gasto |
| `login.html` | Login da Área do administrador (qualquer e-mail e senha entram) |
| `admin-*.html` | Área do administrador: contribuições, despesas, animais, membros, campanhas e mais |
| `sistema.html` | Design system: cores, contraste, tipografia, componentes |
| `tokens.css` / `styles.css` / `theme4.css` | Variáveis da marca e componentes base (usados também pela Área do administrador) |
| `publico.css` | Base das três páginas públicas: página inteira, letras que crescem com a tela, cabeçalho com abas, cartões, seletor de período |
| `transparencia.css` / `animais.css` / `despesas.css` | O que é específico de cada página pública |
| `app.js` | Utilidades e componentes em JavaScript, incluindo o seletor de período (`periodPicker`) |
| `assets/logo-provisorio.png` | Logo provisório com fundo transparente, extraído de uma imagem de referência (o texto embutido nele está desatualizado; só o design system ainda usa) |
| `assets/logo-ilustracao.png` | Só o desenho do logo (cão e gato). O nome vem em texto embaixo: "SOS Pets" e "DF Águas Claras" |

Todos os dados são **fictícios**. Os valores de outubro de 2026 são os mesmos nas páginas públicas e na Área do administrador. Quando o logo original (SVG/PNG transparente) chegar, troque `assets/logo-provisorio.png`.

Na implementação, `tokens.css` vira o tema do Tailwind (`@theme`) e os componentes viram componentes React em `src/components/ui`.
