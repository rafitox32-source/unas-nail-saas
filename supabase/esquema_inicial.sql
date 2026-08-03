-- ============================================================================
-- Esquema inicial - SaaS multi-inquilino para Nail Artists
-- Paso 1: tablas core + Row Level Security (RLS)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. usuarios_manicuristas
-- Un registro por inquilino (tenant). El id coincide con auth.users(id).
-- ============================================================================
create table public.usuarios_manicuristas (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_negocio text not null,
  nombre_completo text not null,
  telefono text,
  url_avatar text,
  url_portada text,
  biografia text,
  color_marca text default '#D9A6A6',
  slug_publico text unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.usuarios_manicuristas is 'Inquilinos de la plataforma: cada manicurista es un negocio independiente.';
comment on column public.usuarios_manicuristas.slug_publico is 'Identificador usado en la URL pública de la carta de presentación.';

-- ============================================================================
-- 2. clientas
-- Expediente de clientas, siempre asociado a una manicurista (tenant).
-- ============================================================================
create table public.clientas (
  id uuid primary key default gen_random_uuid(),
  id_manicurista uuid not null references public.usuarios_manicuristas (id) on delete cascade,
  nombre_completo text not null,
  telefono text,
  email text,
  fecha_nacimiento date,
  alergias text,
  notas_internas text,
  valor_vida_cliente numeric(10, 2) not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on column public.clientas.valor_vida_cliente is 'LTV acumulado: suma de pagos liquidados de la clienta.';

create index idx_clientas_id_manicurista on public.clientas (id_manicurista);

-- ============================================================================
-- 3. servicios
-- Catálogo de servicios ofrecidos por cada manicurista.
-- ============================================================================
create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  id_manicurista uuid not null references public.usuarios_manicuristas (id) on delete cascade,
  nombre text not null,
  descripcion text,
  precio numeric(10, 2) not null check (precio >= 0),
  duracion_minutos integer not null check (duracion_minutos > 0),
  monto_seña numeric(10, 2) not null default 0 check (monto_seña >= 0),
  url_imagen text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index idx_servicios_id_manicurista on public.servicios (id_manicurista);

-- ============================================================================
-- 4. promociones
-- Cupones de descuento por porcentaje o monto fijo, con caducidad.
-- Va antes que citas_apartados porque esa tabla la referencia por FK.
-- ============================================================================
create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  id_manicurista uuid not null references public.usuarios_manicuristas (id) on delete cascade,
  codigo text not null,
  descripcion text,
  tipo_descuento text not null check (tipo_descuento in ('porcentaje', 'monto_fijo')),
  valor_descuento numeric(10, 2) not null check (valor_descuento > 0),
  fecha_inicio date not null default current_date,
  fecha_expiracion date,
  usos_maximos integer,
  usos_actuales integer not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint uq_promociones_codigo_por_manicurista unique (id_manicurista, codigo)
);

create index idx_promociones_id_manicurista on public.promociones (id_manicurista);

-- ============================================================================
-- 5. citas_apartados
-- Reservas con seña (depósito parcial) para confirmar la cita.
-- ============================================================================
create table public.citas_apartados (
  id uuid primary key default gen_random_uuid(),
  id_manicurista uuid not null references public.usuarios_manicuristas (id) on delete cascade,
  id_clienta uuid not null references public.clientas (id) on delete cascade,
  id_servicio uuid not null references public.servicios (id) on delete restrict,
  id_promocion uuid references public.promociones (id) on delete set null,
  fecha_hora_inicio timestamptz not null,
  fecha_hora_fin timestamptz,
  estado_cita text not null default 'pendiente_seña'
    check (estado_cita in ('pendiente_seña', 'confirmada', 'completada', 'cancelada', 'no_asistio')),
  monto_total numeric(10, 2) not null check (monto_total >= 0),
  monto_seña_pagado numeric(10, 2) not null default 0 check (monto_seña_pagado >= 0),
  monto_restante numeric(10, 2) generated always as (monto_total - monto_seña_pagado) stored,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on column public.citas_apartados.estado_cita is 'pendiente_seña -> confirmada -> completada, o cancelada / no_asistio.';

create index idx_citas_id_manicurista on public.citas_apartados (id_manicurista);
create index idx_citas_id_clienta on public.citas_apartados (id_clienta);
create index idx_citas_id_servicio on public.citas_apartados (id_servicio);
create index idx_citas_id_promocion on public.citas_apartados (id_promocion);
create index idx_citas_fecha_hora_inicio on public.citas_apartados (fecha_hora_inicio);

-- ============================================================================
-- 6. inventario
-- Insumos con alertas de reabastecimiento.
-- ============================================================================
create table public.inventario (
  id uuid primary key default gen_random_uuid(),
  id_manicurista uuid not null references public.usuarios_manicuristas (id) on delete cascade,
  nombre_insumo text not null,
  categoria text,
  cantidad_actual numeric(10, 2) not null default 0 check (cantidad_actual >= 0),
  unidad_medida text not null default 'unidad',
  cantidad_minima_alerta numeric(10, 2) not null default 0,
  costo_unitario numeric(10, 2),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index idx_inventario_id_manicurista on public.inventario (id_manicurista);

-- ============================================================================
-- Row Level Security
-- Regla general: cada manicurista (tenant) solo ve y modifica sus propios
-- datos. Se agregan políticas públicas de solo lectura donde el front-end
-- de clientas (sin sesión) las necesita para el portal público.
-- ============================================================================

alter table public.usuarios_manicuristas enable row level security;
alter table public.clientas enable row level security;
alter table public.servicios enable row level security;
alter table public.citas_apartados enable row level security;
alter table public.promociones enable row level security;
alter table public.inventario enable row level security;

-- --- usuarios_manicuristas --------------------------------------------------

-- `to authenticated` + `(select auth.uid())`: evita que la política se
-- evalúe también para el rol anon (ver publico_ve_perfil_para_carta_publica)
-- y que auth.uid() se re-ejecute por fila en vez de una vez por consulta.
create policy "manicurista_ve_su_propio_perfil"
  on public.usuarios_manicuristas for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "manicurista_actualiza_su_propio_perfil"
  on public.usuarios_manicuristas for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "publico_ve_perfil_para_carta_publica"
  on public.usuarios_manicuristas for select
  to anon
  using (slug_publico is not null);

-- --- clientas ---------------------------------------------------------------
-- Sin acceso público: son datos privados del CRM de la manicurista.

create policy "manicurista_administra_sus_clientas"
  on public.clientas for all
  to authenticated
  using ((select auth.uid()) = id_manicurista)
  with check ((select auth.uid()) = id_manicurista);

-- --- servicios ----------------------------------------------------------------

create policy "manicurista_administra_sus_servicios"
  on public.servicios for all
  to authenticated
  using ((select auth.uid()) = id_manicurista)
  with check ((select auth.uid()) = id_manicurista);

create policy "publico_ve_servicios_activos"
  on public.servicios for select
  to anon
  using (activo = true);

-- --- citas_apartados ---------------------------------------------------------
-- La creación de citas desde el portal público (sin sesión) se resolverá en
-- el Paso 2 mediante una función RPC (security definer) que valide la seña
-- antes de insertar, en vez de un INSERT directo de anon. Por ahora solo la
-- manicurista dueña del tenant puede leer/escribir directamente.

create policy "manicurista_administra_sus_citas"
  on public.citas_apartados for all
  to authenticated
  using ((select auth.uid()) = id_manicurista)
  with check ((select auth.uid()) = id_manicurista);

-- --- promociones ---------------------------------------------------------------

create policy "manicurista_administra_sus_promociones"
  on public.promociones for all
  to authenticated
  using ((select auth.uid()) = id_manicurista)
  with check ((select auth.uid()) = id_manicurista);

create policy "publico_valida_codigo_promocional_activo"
  on public.promociones for select
  to anon
  using (
    activo = true
    and current_date between fecha_inicio and coalesce(fecha_expiracion, current_date)
  );

-- --- inventario ----------------------------------------------------------------
-- Sin acceso público: información interna del negocio.

create policy "manicurista_administra_su_inventario"
  on public.inventario for all
  to authenticated
  using ((select auth.uid()) = id_manicurista)
  with check ((select auth.uid()) = id_manicurista);

-- ============================================================================
-- Triggers de actualizado_en
-- ============================================================================

create or replace function public.actualizar_marca_de_tiempo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger trg_usuarios_manicuristas_actualizado_en
  before update on public.usuarios_manicuristas
  for each row execute function public.actualizar_marca_de_tiempo();

create trigger trg_clientas_actualizado_en
  before update on public.clientas
  for each row execute function public.actualizar_marca_de_tiempo();

create trigger trg_servicios_actualizado_en
  before update on public.servicios
  for each row execute function public.actualizar_marca_de_tiempo();

create trigger trg_citas_apartados_actualizado_en
  before update on public.citas_apartados
  for each row execute function public.actualizar_marca_de_tiempo();

create trigger trg_inventario_actualizado_en
  before update on public.inventario
  for each row execute function public.actualizar_marca_de_tiempo();
