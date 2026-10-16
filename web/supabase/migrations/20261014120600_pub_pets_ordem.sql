-- T4.2: o catálogo de Pets lista do cadastro mais recente para o mais antigo,
-- como o protótipo (pet novo entra no topo). Para isso pub_pets passa a ter criado_em.
create or replace view public.pub_pets
with (security_invoker = false) as
select
  id, nome, especie, sexo, faixa_idade, pelagem,
  entrou_em, lar_em, adotado_em, obito_em,
  castrado, castrado_em, vacinado, vermifugado, fiv_felv_testado,
  precisa_lar, necessidade, foto_path,
  criado_em
from public.pets
where not oculto;
