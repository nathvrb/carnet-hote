-- =====================================================================
--  Carnet d'Hôte · installation de la base de données (Supabase)
--
--  Où le coller : Supabase → SQL Editor → « New query » → coller tout
--  le fichier → « Run ». Le script peut être relancé sans risque après
--  une mise à jour du site : il ne supprime aucune donnée.
--
--  Principe de sécurité
--  - Les tables sont dans un schéma privé « cdh », invisible depuis le site.
--  - Le site passe uniquement par les fonctions « cdh_… » ci-dessous,
--    qui vérifient à chaque appel qui est connecté.
--  - Un voyageur (non connecté) peut seulement lire UN livret dont il
--    connaît l'adresse, et compter une ouverture. Il ne peut pas lister
--    les livrets.
--  - Un hôte connecté ne voit et ne modifie que les livrets qui lui
--    ont été attribués.
--  - Un administrateur (vous) voit et modifie tout.
-- =====================================================================

create schema if not exists cdh;
revoke all on schema cdh from public;
grant usage on schema cdh to authenticated;   -- pour les règles des photos

-- ---------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------
create table if not exists cdh.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  ajoute_le timestamptz not null default now()
);

create table if not exists cdh.livrets (
  id         text primary key
             constraint livret_id_format check (id ~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$'),
  contenu    jsonb not null
             constraint livret_contenu_objet check (jsonb_typeof(contenu) = 'object'),
  actif      boolean not null default true,       -- false : livret hors ligne
  cree_le    timestamptz not null default now(),
  publie_le  timestamptz not null default now(),
  publie_par uuid references auth.users (id) on delete set null,
  constraint livret_taille check (octet_length(contenu::text) <= 1000000)
);

create table if not exists cdh.acces (
  livret_id text not null references cdh.livrets (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  ajoute_le timestamptz not null default now(),
  primary key (livret_id, user_id)
);
create index if not exists acces_user_idx on cdh.acces (user_id);

-- 30 dernières versions de chaque livret (retour en arrière)
create table if not exists cdh.versions (
  id          bigint generated always as identity primary key,
  livret_id   text not null references cdh.livrets (id) on delete cascade,
  contenu     jsonb not null,
  publie_le   timestamptz not null,
  publie_par  uuid,
  remplace_le timestamptz not null default now()
);
create index if not exists versions_livret_idx on cdh.versions (livret_id, id desc);

-- Ouvertures par jour (aucune donnée personnelle)
create table if not exists cdh.vues (
  livret_id text not null references cdh.livrets (id) on delete cascade,
  jour      date not null,
  n         integer not null default 0,
  primary key (livret_id, jour)
);

alter table cdh.admins   enable row level security;
alter table cdh.livrets  enable row level security;
alter table cdh.acces    enable row level security;
alter table cdh.versions enable row level security;
alter table cdh.vues     enable row level security;
revoke all on all tables    in schema cdh from public, anon, authenticated;
revoke all on all sequences in schema cdh from public, anon, authenticated;

-- ---------------------------------------------------------------------
--  Historique : chaque publication garde l'ancienne version
-- ---------------------------------------------------------------------
create or replace function cdh.archiver() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.contenu is distinct from old.contenu then
    insert into cdh.versions (livret_id, contenu, publie_le, publie_par)
    values (old.id, old.contenu, old.publie_le, old.publie_par);
    delete from cdh.versions
     where livret_id = old.id
       and id not in (select v.id from cdh.versions v where v.livret_id = old.id order by v.id desc limit 30);
  end if;
  return new;
end $$;

drop trigger if exists archiver on cdh.livrets;
create trigger archiver before update on cdh.livrets
for each row execute function cdh.archiver();

-- ---------------------------------------------------------------------
--  Outils internes
-- ---------------------------------------------------------------------
create or replace function cdh.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
     and exists (select 1 from cdh.admins a where a.user_id = auth.uid());
$$;

create or replace function cdh.peut_modifier(p_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
     and (cdh.est_admin()
          or exists (select 1 from cdh.acces x where x.livret_id = p_id and x.user_id = auth.uid()));
$$;

create or replace function cdh.liste_acces(p_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(u.email order by u.email), '[]'::jsonb)
    from cdh.acces x join auth.users u on u.id = x.user_id
   where x.livret_id = p_id;
$$;

-- Nettoie un livret avant enregistrement
create or replace function cdh.nettoyer(p_contenu jsonb, p_id text, p_ancien jsonb) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb := p_contenu;
begin
  if v is null or jsonb_typeof(v) <> 'object' then
    raise exception 'contenu_invalide';
  end if;
  if octet_length(v::text) > 1000000 then
    raise exception 'trop_lourd';
  end if;
  v := (v - 'majLe') || jsonb_build_object('id', p_id);
  -- le bandeau « Exemple fictif » et le retrait de la mention (Premium) restent réservés à l'administrateur
  if not cdh.est_admin() then
    v := v - 'demo' - 'sansMention';
    if p_ancien ? 'demo' then v := v || jsonb_build_object('demo', p_ancien -> 'demo'); end if;
    if p_ancien ? 'sansMention' then v := v || jsonb_build_object('sansMention', p_ancien -> 'sansMention'); end if;
  end if;
  -- lien d'avis : uniquement une adresse web
  if v ? 'avisLien' and coalesce(v ->> 'avisLien', '') !~* '^(https?://|demo$|$)' then
    v := v - 'avisLien';
  end if;
  return v;
end $$;

-- À lancer une fois dans le SQL Editor pour devenir administrateur :
--   select cdh.ajouter_admin('votre@email.fr');
create or replace function cdh.ajouter_admin(p_email text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  select u.id into v_uid from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  if v_uid is null then
    raise exception 'Aucun compte pour %. Créez-le d''abord : Authentication → Users → Add user.', p_email;
  end if;
  insert into cdh.admins (user_id) values (v_uid) on conflict do nothing;
  return 'OK : ' || p_email || ' est administrateur.';
end $$;

-- Mot de passe oublié par un hôte (sans envoi d'e-mail), dans le SQL Editor :
--   select cdh.nouveau_mot_de_passe('hote@email.fr', 'MotDePasseProvisoire8');
create or replace function cdh.nouveau_mot_de_passe(p_email text, p_mdp text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if length(coalesce(p_mdp, '')) < 8 then raise exception 'Mot de passe trop court : 8 caractères minimum.'; end if;
  update auth.users u
     set encrypted_password = extensions.crypt(p_mdp, extensions.gen_salt('bf')),
         updated_at = now()
   where lower(u.email) = lower(trim(p_email));
  if not found then raise exception 'Aucun compte pour %.', p_email; end if;
  return 'OK : nouveau mot de passe enregistré pour ' || p_email || '.';
end $$;

revoke all on all functions in schema cdh from public, anon, authenticated;
grant execute on function cdh.est_admin()         to authenticated;
grant execute on function cdh.peut_modifier(text) to authenticated;

-- ---------------------------------------------------------------------
--  Fonctions appelées par le site
-- ---------------------------------------------------------------------

-- Voyageurs : lire un livret en ligne (null s'il n'existe pas ou est désactivé)
create or replace function public.cdh_livret(p_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select l.contenu || jsonb_build_object('id', l.id, 'majLe', l.publie_le)
    from cdh.livrets l
   where l.id = p_id and l.actif;
$$;

-- Voyageurs : compter une ouverture du livret
create or replace function public.cdh_compter(p_id text) returns void
language sql volatile security definer set search_path = '' as $$
  insert into cdh.vues as v (livret_id, jour, n)
  select l.id, (now() at time zone 'Europe/Paris')::date, 1
    from cdh.livrets l
   where l.id = p_id and l.actif
  on conflict (livret_id, jour) do update set n = v.n + 1;
$$;

-- Compte connecté : qui suis-je, quels livrets
create or replace function public.cdh_moi() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_admin boolean;
  v_jour  date := (now() at time zone 'Europe/Paris')::date;
begin
  if v_uid is null then raise exception 'non_connecte'; end if;
  v_admin := cdh.est_admin();
  return jsonb_build_object(
    'email', (select u.email from auth.users u where u.id = v_uid),
    'admin', v_admin,
    'livrets', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', l.id,
               'nom', l.contenu ->> 'nom',
               'ville', l.contenu ->> 'ville',
               'couverture', l.contenu #>> '{theme,couverture}',
               'accent', l.contenu #>> '{theme,accent}',
               'actif', l.actif,
               'publieLe', l.publie_le,
               'vues30', coalesce((select sum(v.n) from cdh.vues v
                                    where v.livret_id = l.id and v.jour > v_jour - 30), 0)
             ) order by lower(l.contenu ->> 'nom'))
        from cdh.livrets l
       where v_admin
          or exists (select 1 from cdh.acces x where x.livret_id = l.id and x.user_id = v_uid)
    ), '[]'::jsonb)
  );
end $$;

-- Compte connecté : ouvrir un livret pour le modifier
create or replace function public.cdh_lire(p_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  r cdh.livrets%rowtype;
begin
  if auth.uid() is null then raise exception 'non_connecte'; end if;
  if not cdh.peut_modifier(p_id) then raise exception 'acces_refuse'; end if;
  select * into r from cdh.livrets l where l.id = p_id;
  if not found then raise exception 'introuvable'; end if;
  return jsonb_build_object(
    'contenu', r.contenu || jsonb_build_object('id', r.id),
    'publieLe', r.publie_le,
    'actif', r.actif,
    'acces', case when cdh.est_admin() then cdh.liste_acces(r.id) else null end
  );
end $$;

-- Compte connecté : publier (p_base = date de la version modifiée, pour
-- ne pas écraser sans le savoir une publication faite entre-temps ailleurs)
create or replace function public.cdh_publier(p_id text, p_contenu jsonb, p_base timestamptz default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r     cdh.livrets%rowtype;
  v_le  timestamptz;
begin
  if auth.uid() is null then raise exception 'non_connecte'; end if;
  if not cdh.peut_modifier(p_id) then raise exception 'acces_refuse'; end if;
  select * into r from cdh.livrets l where l.id = p_id for update;
  if not found then raise exception 'introuvable'; end if;
  if p_base is not null and date_trunc('milliseconds', r.publie_le) <> date_trunc('milliseconds', p_base) then
    raise exception 'conflit' using detail = r.publie_le::text;
  end if;
  update cdh.livrets l
     set contenu = cdh.nettoyer(p_contenu, p_id, r.contenu),
         publie_le = clock_timestamp(),
         publie_par = auth.uid()
   where l.id = p_id
  returning l.publie_le into v_le;
  return jsonb_build_object('publieLe', v_le);
end $$;

-- Administrateur : mettre en ligne un nouveau livret
create or replace function public.cdh_creer(p_id text, p_contenu jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_le timestamptz;
begin
  if not cdh.est_admin() then raise exception 'acces_refuse'; end if;
  if p_id is null or p_id !~ '^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$' then raise exception 'identifiant_invalide'; end if;
  if exists (select 1 from cdh.livrets l where l.id = p_id) then raise exception 'existe_deja'; end if;
  insert into cdh.livrets (id, contenu, publie_par)
  values (p_id, cdh.nettoyer(p_contenu, p_id, '{}'::jsonb), auth.uid())
  returning publie_le into v_le;
  return jsonb_build_object('publieLe', v_le);
end $$;

-- Administrateur : donner / retirer l'accès d'un hôte (son compte doit exister)
create or replace function public.cdh_acces_ajouter(p_id text, p_email text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid;
begin
  if not cdh.est_admin() then raise exception 'acces_refuse'; end if;
  if not exists (select 1 from cdh.livrets l where l.id = p_id) then raise exception 'introuvable'; end if;
  select u.id into v_uid from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  if v_uid is null then raise exception 'compte_inconnu'; end if;
  insert into cdh.acces (livret_id, user_id) values (p_id, v_uid) on conflict do nothing;
  return cdh.liste_acces(p_id);
end $$;

create or replace function public.cdh_acces_retirer(p_id text, p_email text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not cdh.est_admin() then raise exception 'acces_refuse'; end if;
  delete from cdh.acces x
   using auth.users u
   where x.livret_id = p_id and u.id = x.user_id and lower(u.email) = lower(trim(p_email));
  return cdh.liste_acces(p_id);
end $$;

-- Administrateur : mettre un livret hors ligne / en ligne
create or replace function public.cdh_activer(p_id text, p_actif boolean) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not cdh.est_admin() then raise exception 'acces_refuse'; end if;
  update cdh.livrets l set actif = coalesce(p_actif, true) where l.id = p_id;
  if not found then raise exception 'introuvable'; end if;
  return jsonb_build_object('actif', coalesce(p_actif, true));
end $$;

-- Versions précédentes d'un livret
create or replace function public.cdh_versions(p_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not cdh.peut_modifier(p_id) then raise exception 'acces_refuse'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', v.id,
             'nom', v.contenu ->> 'nom',
             'publieLe', v.publie_le,
             'remplaceLe', v.remplace_le,
             'par', u.email
           ) order by v.id desc)
      from cdh.versions v left join auth.users u on u.id = v.publie_par
     where v.livret_id = p_id
  ), '[]'::jsonb);
end $$;

create or replace function public.cdh_version(p_version bigint) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r cdh.versions%rowtype;
begin
  select * into r from cdh.versions v where v.id = p_version;
  if not found or not cdh.peut_modifier(r.livret_id) then raise exception 'acces_refuse'; end if;
  return r.contenu || jsonb_build_object('id', r.livret_id);
end $$;

-- Ouvertures des 30 derniers jours
create or replace function public.cdh_stats(p_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_jour date := (now() at time zone 'Europe/Paris')::date;
begin
  if not cdh.peut_modifier(p_id) then raise exception 'acces_refuse'; end if;
  return (
    select jsonb_agg(jsonb_build_object('jour', d::date, 'n', coalesce(v.n, 0)) order by d)
      from generate_series(v_jour - 29, v_jour, interval '1 day') d
      left join cdh.vues v on v.livret_id = p_id and v.jour = d::date
  );
end $$;

-- Droits : rien par défaut, puis seulement ce qui est nécessaire
revoke all on function public.cdh_livret(text)                    from public, anon, authenticated;
revoke all on function public.cdh_compter(text)                   from public, anon, authenticated;
revoke all on function public.cdh_moi()                           from public, anon, authenticated;
revoke all on function public.cdh_lire(text)                      from public, anon, authenticated;
revoke all on function public.cdh_publier(text, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.cdh_creer(text, jsonb)              from public, anon, authenticated;
revoke all on function public.cdh_acces_ajouter(text, text)       from public, anon, authenticated;
revoke all on function public.cdh_acces_retirer(text, text)       from public, anon, authenticated;
revoke all on function public.cdh_activer(text, boolean)          from public, anon, authenticated;
revoke all on function public.cdh_versions(text)                  from public, anon, authenticated;
revoke all on function public.cdh_version(bigint)                 from public, anon, authenticated;
revoke all on function public.cdh_stats(text)                     from public, anon, authenticated;

grant execute on function public.cdh_livret(text)                    to anon, authenticated;
grant execute on function public.cdh_compter(text)                   to anon, authenticated;
grant execute on function public.cdh_moi()                           to authenticated;
grant execute on function public.cdh_lire(text)                      to authenticated;
grant execute on function public.cdh_publier(text, jsonb, timestamptz) to authenticated;
grant execute on function public.cdh_creer(text, jsonb)              to authenticated;
grant execute on function public.cdh_acces_ajouter(text, text)       to authenticated;
grant execute on function public.cdh_acces_retirer(text, text)       to authenticated;
grant execute on function public.cdh_activer(text, boolean)          to authenticated;
grant execute on function public.cdh_versions(text)                  to authenticated;
grant execute on function public.cdh_version(bigint)                 to authenticated;
grant execute on function public.cdh_stats(text)                     to authenticated;

-- ---------------------------------------------------------------------
--  Photos (Supabase Storage) : dossier « photos/<identifiant-du-livret>/ »
--  Lecture publique (les voyageurs voient les photos), envoi réservé
--  aux comptes qui peuvent modifier ce livret. 3 Mo maximum par photo.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cdh photos envoi" on storage.objects;
create policy "cdh photos envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and cdh.peut_modifier((storage.foldername(name))[1]));

drop policy if exists "cdh photos lecture" on storage.objects;
create policy "cdh photos lecture" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and cdh.peut_modifier((storage.foldername(name))[1]));

drop policy if exists "cdh photos suppression" on storage.objects;
create policy "cdh photos suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and cdh.peut_modifier((storage.foldername(name))[1]));

-- ---------------------------------------------------------------------
--  Photos des futurs clients (questionnaire en ligne) : dossier PRIVÉ
--  « depots/<dossier-du-client>/NN-sujet.jpg ».
--  Tout visiteur peut déposer des images (3 Mo maximum chacune, 40 par
--  dossier, noms contrôlés) mais personne ne peut les relire ni les
--  supprimer depuis le site : vous les consultez dans Supabase
--  (Storage → depots) ou, connecté en administrateur, depuis la console.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('depots', 'depots', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function cdh.nb_depots(p_dossier text) returns integer
language sql stable security definer set search_path = ''
as $$ select count(*)::int from storage.objects where bucket_id = 'depots' and (storage.foldername(name))[1] = p_dossier $$;
grant usage on schema cdh to anon;
grant execute on function cdh.nb_depots(text) to anon, authenticated;

drop policy if exists "cdh depots envoi" on storage.objects;
create policy "cdh depots envoi" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'depots'
    and name ~ '^[a-z0-9-]{8,80}/[0-9]{2}-[a-z0-9-]{1,60}\.(jpg|png|webp)$'
    and cdh.nb_depots((storage.foldername(name))[1]) < 40);

drop policy if exists "cdh depots lecture admin" on storage.objects;
create policy "cdh depots lecture admin" on storage.objects for select to authenticated
  using (bucket_id = 'depots' and cdh.est_admin());

drop policy if exists "cdh depots suppression admin" on storage.objects;
create policy "cdh depots suppression admin" on storage.objects for delete to authenticated
  using (bucket_id = 'depots' and cdh.est_admin());

-- Fin. Étape suivante : créez votre compte (Authentication → Users →
-- Add user → Create new user, « Auto Confirm User » coché), puis :
--   select cdh.ajouter_admin('votre@email.fr');
