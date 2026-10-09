/* SOS Pets DF Águas Claras: dados do protótipo (fictícios), usados pelas três páginas públicas.
   Um lugar só, para que Prestação de contas, Pets e Despesas mostrem sempre os mesmos números.
   Datas no formato "AAAA-MM". Hoje é outubro de 2026. */
const HOJE = '2026-10';

/* Pets: n nome, e espécie, sx sexo (f/m), id idade (filhote/adulto), pel pelagem,
   ent quando o grupo passou a acompanhar, lar quando foi para lar temporário, ado quando foi adotado,
   cast quando foi castrado, vac vacinado, verm vermifugado, fiv testado para FIV/FeLV (só gatos),
   precisaLar está na rua e pronto para ir para um lar temporário, nec necessidade atual,
   obito quando faleceu (falecidos saem de "na rua", "em lar temporário" e da fila de castração). */
const PETS = [
  {n: "Bento", e: "cachorro", sx: "m", id: "adulto", pel: "caramelo, porte médio", ent: "2026-05", ado: "2026-10", cast: "2026-06", vac: true, verm: true},
  {n: "Pipoca", e: "cachorro", sx: "f", id: "adulto", pel: "branca com manchas pretas", ent: "2026-04", lar: "2026-07", cast: "2026-08", vac: true, verm: true},
  {n: "Thor", e: "cachorro", sx: "m", id: "filhote", pel: "preto e branco", ent: "2026-08", cast: "2026-09", vac: true, verm: true, precisaLar: true},
  {n: "Caramelo", e: "cachorro", sx: "m", id: "adulto", pel: "caramelo", ent: "2026-03", lar: "2026-05", ado: "2026-09", cast: "2026-08", vac: true, verm: true},
  {n: "Fred", e: "cachorro", sx: "m", id: "adulto", pel: "marrom com branco", ent: "2026-06", ado: "2026-09", cast: "2026-07", vac: true, verm: true},
  {n: "Nelson", e: "cachorro", sx: "m", id: "adulto", pel: "caramelo claro", ent: "2026-02", lar: "2026-02", ado: "2026-04", cast: "2026-03", vac: true, verm: true},
  {n: "Max", e: "cachorro", sx: "m", id: "adulto", pel: "preto, porte grande", ent: "2025-09", ado: "2026-01", vac: true, verm: true},
  {n: "Pretinha", e: "cachorro", sx: "f", id: "adulto", pel: "preta, pequena", ent: "2025-11", vac: false, verm: true},
  {n: "Zeca", e: "cachorro", sx: "m", id: "adulto", pel: "tigrado", ent: "2026-07", vac: false, verm: false},
  {n: "Stuart", e: "cachorro", sx: "m", id: "adulto", pel: "branco e marrom", ent: "2026-08", lar: "2026-08", vac: true, verm: true, nec: "Precisa de cirurgia"},
  {n: "Tobias", e: "cachorro", sx: "m", id: "adulto", pel: "cinza, porte médio", ent: "2025-08", lar: "2025-09", ado: "2025-12", cast: "2025-10", vac: true, verm: true},
  {n: "Nala", e: "cachorro", sx: "f", id: "adulto", pel: "preta e caramelo", ent: "2026-01", lar: "2026-02", ado: "2026-06", cast: "2026-02", vac: true, verm: true},
  {n: "Rex", e: "cachorro", sx: "m", id: "adulto", pel: "preto", ent: "2025-10", vac: false, verm: false},
  {n: "Amora", e: "cachorro", sx: "f", id: "filhote", pel: "marrom", ent: "2026-09", lar: "2026-09", cast: "2026-10", vac: true, verm: true},
  {n: "Mel", e: "gato", sx: "f", id: "filhote", pel: "rajada", ent: "2026-06", lar: "2026-07", cast: "2026-09", vac: true, verm: true, fiv: true},
  {n: "Luna", e: "gato", sx: "f", id: "adulto", pel: "cinza de olhos azuis", ent: "2026-05", lar: "2026-06", cast: "2026-06", vac: true, verm: true, fiv: true},
  {n: "Tigre", e: "gato", sx: "m", id: "adulto", pel: "frajola", ent: "2026-02", cast: "2026-05", vac: true, verm: true, fiv: true, precisaLar: true},
  {n: "Nina", e: "gato", sx: "f", id: "adulto", pel: "preta", ent: "2025-08", ado: "2025-11", vac: true, verm: true, fiv: true},
  {n: "Mia", e: "gato", sx: "f", id: "adulto", pel: "laranja", ent: "2026-07", lar: "2026-08", cast: "2026-09", vac: true, verm: true, fiv: true},
  {n: "Lua", e: "gato", sx: "f", id: "filhote", pel: "branca", ent: "2026-07", ado: "2026-09", cast: "2026-09", vac: true, verm: true, fiv: true},
  {n: "Bolinha", e: "gato", sx: "m", id: "filhote", pel: "cinza com branco", ent: "2026-08", ado: "2026-10", cast: "2026-10", vac: true, verm: true, fiv: true},
  {n: "Frajola", e: "gato", sx: "m", id: "adulto", pel: "frajola", ent: "2025-12", vac: false, verm: true},
  {n: "Mimi", e: "gato", sx: "f", id: "adulto", pel: "branca e cinza", ent: "2025-12", lar: "2026-01", ado: "2026-02", cast: "2026-01", vac: true, verm: true, fiv: true},
  {n: "Pandora", e: "gato", sx: "f", id: "adulto", pel: "tricolor", ent: "2026-01", ado: "2026-02", cast: "2026-01", vac: true, verm: true, fiv: true},
  {n: "Salem", e: "gato", sx: "m", id: "adulto", pel: "preto", ent: "2026-03", cast: "2026-07", vac: true, verm: true, fiv: true, precisaLar: true},
  {n: "Kiara", e: "gato", sx: "f", id: "filhote", pel: "escaminha", ent: "2026-09", lar: "2026-09", vac: true, verm: true},
  {n: "Fumaça", e: "gato", sx: "m", id: "adulto", pel: "cinza", ent: "2026-04", vac: false, verm: false},
  {n: "Chico", e: "gato", sx: "m", id: "adulto", pel: "rajado", ent: "2025-10", vac: false, verm: true},
  {n: "Tom", e: "gato", sx: "m", id: "adulto", pel: "preto e branco", ent: "2026-01", lar: "2026-02", ado: "2026-03", cast: "2026-02", vac: true, verm: true, fiv: true},
  {n: "Belinha", e: "gato", sx: "f", id: "adulto", pel: "branca", ent: "2026-01", ado: "2026-03", cast: "2026-02", vac: true, verm: true, fiv: true},
  {n: "Pantera", e: "gato", sx: "f", id: "adulto", pel: "preta", ent: "2026-05", vac: false, verm: true},
  {n: "Nescau", e: "gato", sx: "m", id: "adulto", pel: "marrom rajado", ent: "2026-06", vac: false, verm: false},
  {n: "Biscoito", e: "gato", sx: "m", id: "filhote", pel: "caramelo", ent: "2026-02", lar: "2026-03", ado: "2026-04", cast: "2026-03", vac: true, verm: true, fiv: true},
  {n: "Pérola", e: "gato", sx: "f", id: "adulto", pel: "branca de olhos verdes", ent: "2025-09", ado: "2025-12", vac: true, verm: true, fiv: true},
  {n: "Sushi", e: "gato", sx: "m", id: "adulto", pel: "siamês", ent: "2026-08", vac: false, verm: false},
  {n: "Algodão", e: "gato", sx: "m", id: "adulto", pel: "branco", ent: "2025-10", lar: "2025-11", ado: "2025-12", cast: "2025-11", vac: true, verm: true, fiv: true},
  {n: "Manchinha", e: "gato", sx: "f", id: "adulto", pel: "manchada", ent: "2026-07", vac: false, verm: true},
  {n: "Garfield", e: "gato", sx: "m", id: "adulto", pel: "laranja", ent: "2025-11", vac: false, verm: false},
  {n: "Laranjinha", e: "gato", sx: "f", id: "filhote", pel: "laranja", ent: "2026-03", ado: "2026-05", cast: "2026-04", vac: true, verm: true, fiv: true},
  {n: "Princesa", e: "gato", sx: "f", id: "adulto", pel: "tricolor", ent: "2026-03", ado: "2026-05", cast: "2026-04", vac: true, verm: true, fiv: true},
  {n: "Simba", e: "gato", sx: "m", id: "adulto", pel: "laranja rajado", ent: "2026-08", lar: "2026-09", cast: "2026-10", vac: true, verm: true, fiv: true},
  {n: "Jade", e: "gato", sx: "f", id: "filhote", pel: "escaminha", ent: "2026-04", lar: "2026-05", ado: "2026-06", cast: "2026-05", vac: true, verm: true, fiv: true},
  {n: "Fofinha", e: "gato", sx: "f", id: "filhote", pel: "cinza", ent: "2026-05", lar: "2026-06", ado: "2026-07", cast: "2026-06", vac: true, verm: true, fiv: true},
  {n: "Olívia", e: "gato", sx: "f", id: "adulto", pel: "rajada", ent: "2026-05", ado: "2026-07", cast: "2026-06", vac: true, verm: true, fiv: true},
  {n: "Zara", e: "gato", sx: "f", id: "adulto", pel: "preta e branca", ent: "2026-09", vac: false, verm: false},
  {n: "Branquinha", e: "gato", sx: "f", id: "adulto", pel: "branca", ent: "2026-06", ado: "2026-08", cast: "2026-07", vac: true, verm: true, fiv: true},
  {n: "Félix", e: "gato", sx: "m", id: "adulto", pel: "preto e branco", ent: "2026-10", vac: false, verm: false},
  {n: "Bartolomeu", e: "gato", sx: "m", id: "adulto", pel: "cinza rajado", ent: "2025-07", vac: false, verm: true}
];

/* Despesas detalhadas (registradas a partir de agosto de 2026). a = nome do pet; vazio = vários pets.
   Os totais de cada mês batem com a Prestação de contas (ago R$ 610, set R$ 724, out R$ 354). */
const DESPESAS = [
  ['2026-10-06','Ração para gatos de rua','Ração',120,''],['2026-10-05','Consulta e antibiótico','Veterinário e consultas',180,'Luna'],
  ['2026-10-03','Vacina V4','Vacinas',24,'Mel'],['2026-10-02','Transporte até a clínica','Transporte',30,'Luna'],
  ['2026-09-28','Transporte até a clínica','Transporte',30,'Bento'],['2026-09-23','Vacina V4','Vacinas',24,'Thor'],
  ['2026-09-19','Hemograma e teste FIV/FeLV','Exames',40,'Luna'],['2026-09-15','Antipulgas (2 doses)','Medicamentos',60,''],
  ['2026-09-12','Ração para gatos de rua','Ração',120,''],['2026-09-08','Consulta e vermífugo','Veterinário e consultas',140,'Lua'],
  ['2026-09-03','Castração','Castração',310,'Mia'],
  ['2026-08-30','Transporte de animal resgatado','Transporte',10,'Bolinha'],['2026-08-25','Areia higiênica no lar temporário','Lar temporário',40,'Luna'],
  ['2026-08-20','Exame de sangue','Exames',30,'Fred'],['2026-08-14','Medicação pós-cirúrgica','Medicamentos',70,'Caramelo'],
  ['2026-08-11','Ração para cães de rua','Ração',110,''],['2026-08-06','Consulta de retorno','Veterinário e consultas',150,'Bento'],
  ['2026-08-02','Castração','Castração',200,'Pipoca']
].map(r => ({ d: r[0], t: r[1], c: r[2], v: r[3], a: r[4] }));


/* cor fixa de cada categoria de despesa, a mesma em todas as páginas (validada: separação para daltonismo e
   claridade; o nome da categoria sempre aparece escrito ao lado da cor). "Outros" e categorias novas ficam em bege. */
const COR_CAT = { 'Veterinário e consultas': '#2D5F9A', 'Ração': '#C2477A', 'Castração': '#DB7838', 'Exames': '#2A9D8F', 'Medicamentos': '#D4A017',
  'Vacinas': '#7A5BA6', 'Transporte': '#8C9A2B', 'Lar temporário': '#A8432F' }, COR_OUTRAS = '#CFC3B4';
const corCat = c => COR_CAT[c] || COR_OUTRAS;

/* situação de um pet no fim de um mês (padrão: hoje) */
function situacaoPet(p, ym = HOJE) {
  if (p.ent > ym) return null;
  if (p.obito && p.obito <= ym) return 'falecido';
  if (p.ado && p.ado <= ym) return 'adotado';
  if (p.lar && p.lar <= ym) return 'lar';
  return 'rua';
}
const petPorNome = n => PETS.find(p => p.n === n);
const especiePet = n => (petPorNome(n) || {}).e;
/* meses entre duas datas "AAAA-MM" */
const mesesEntre = (a, b) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5) - +a.slice(5));
/* quanto foi gasto com um pet nas despesas registradas */
const gastoPet = n => DESPESAS.filter(d => d.a === n).reduce((s, d) => s + d.v, 0);
