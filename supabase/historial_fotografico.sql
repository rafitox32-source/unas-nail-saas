-- ============================================================================
-- Historial fotográfico y fórmulas de color por visita
-- ============================================================================

create table public.notas_visita (
  id uuid primary key default gen_random_uuid(),
  id_manicurista uuid not null references public.usuarios_manicuristas (id) on delete cascade,
  id_cita uuid not null unique references public.citas_apartados (id) on delete cascade,
  formula_color text,
  notas text,
  rutas_fotos text[] not null default '{}',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index idx_notas_visita_id_manicurista on public.notas_visita (id_manicurista);

alter table public.notas_visita enable row level security;

create policy "manicurista_administra_sus_notas_visita"
  on public.notas_visita for all
  to authenticated
  using ((select auth.uid()) = id_manicurista)
  with check ((select auth.uid()) = id_manicurista);

create trigger trg_notas_visita_actualizado_en
  before update on public.notas_visita
  for each row execute function public.actualizar_marca_de_tiempo();

-- ============================================================================
-- Storage: bucket privado para las fotos. Cada archivo vive en
-- {id_manicurista}/{id_cita}/{archivo} — las políticas usan el primer
-- segmento de la ruta para aislar a cada tenant, igual que el resto del RLS.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-clientas', 'fotos-clientas', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "manicurista_sube_sus_fotos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'fotos-clientas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "manicurista_ve_sus_fotos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'fotos-clientas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "manicurista_borra_sus_fotos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'fotos-clientas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
