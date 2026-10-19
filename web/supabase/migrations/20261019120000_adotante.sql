-- Contato do adotante (pedido da Barbara, 19/10): nome, telefone e endereço de quem adotou.
-- Dado pessoal: só a equipe vê. pub_pets lista as colunas uma a uma e não ganha estas.
-- Só existe enquanto o pet está adotado; se deixar de estar, o contato é apagado junto.

alter table public.pets
  add column adotante_nome text check (btrim(adotante_nome) <> '' and length(adotante_nome) <= 120),
  add column adotante_telefone text check (btrim(adotante_telefone) <> '' and length(adotante_telefone) <= 30),
  add column adotante_endereco text check (btrim(adotante_endereco) <> '' and length(adotante_endereco) <= 200),
  add constraint pets_adotante_so_se_adotado check (
    adotado_em is not null
    or (adotante_nome is null and adotante_telefone is null and adotante_endereco is null)
  );
