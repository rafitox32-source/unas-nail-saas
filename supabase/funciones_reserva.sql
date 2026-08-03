-- ============================================================================
-- Paso 4: flujo de reserva, seña y promociones
-- Funciones públicas (security definer) que le dan a la clienta anónima una
-- puerta de entrada controlada, sin exponerle INSERT/SELECT directo sobre
-- citas_apartados, clientas ni promociones.
-- ============================================================================

create or replace function public.horarios_ocupados(p_id_manicurista uuid, p_fecha date)
returns table (inicio timestamptz, fin timestamptz)
language sql
security definer
set search_path = public
as $$
  select fecha_hora_inicio, coalesce(fecha_hora_fin, fecha_hora_inicio + interval '1 hour')
  from public.citas_apartados
  where id_manicurista = p_id_manicurista
    and estado_cita not in ('cancelada', 'no_asistio')
    and fecha_hora_inicio::date = p_fecha
  order by fecha_hora_inicio;
$$;

revoke all on function public.horarios_ocupados(uuid, date) from public;
grant execute on function public.horarios_ocupados(uuid, date) to anon, authenticated;

-- Chequeo público de un código antes de reservar (misma idea que
-- slug_disponible / horarios_ocupados: vista previa sin exponer la tabla).
create or replace function public.validar_codigo_promocional(p_id_manicurista uuid, p_codigo text)
returns table (tipo_descuento text, valor_descuento numeric, descripcion text)
language sql
security definer
set search_path = public
stable
as $$
  select promociones.tipo_descuento, promociones.valor_descuento, promociones.descripcion
  from public.promociones
  where promociones.id_manicurista = p_id_manicurista
    and upper(promociones.codigo) = upper(p_codigo)
    and promociones.activo = true
    and current_date between promociones.fecha_inicio and coalesce(promociones.fecha_expiracion, current_date)
    and (promociones.usos_maximos is null or promociones.usos_actuales < promociones.usos_maximos);
$$;

revoke all on function public.validar_codigo_promocional(uuid, text) from public;
grant execute on function public.validar_codigo_promocional(uuid, text) to anon, authenticated;

-- crear_apartado acepta un código promocional opcional: valida, calcula el
-- descuento (con tope al precio del servicio), lo aplica a monto_total,
-- guarda el vínculo en citas_apartados.id_promocion y descuenta un uso.
create or replace function public.crear_apartado(
  p_id_manicurista uuid,
  p_id_servicio uuid,
  p_nombre_clienta text,
  p_telefono_clienta text,
  p_fecha_hora_inicio timestamptz,
  p_codigo_promocional text default null
)
returns table (id uuid, estado_cita text, monto_total numeric, monto_seña numeric, descuento_aplicado numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_servicio record;
  v_id_promocion uuid;
  v_id_clienta uuid;
  v_id_cita uuid;
  v_fecha_hora_fin timestamptz;
  v_monto_total numeric(10, 2);
  v_descuento numeric(10, 2) := 0;
begin
  if length(trim(p_nombre_clienta)) = 0 then
    raise exception 'Falta el nombre de la clienta.';
  end if;

  if length(trim(p_telefono_clienta)) = 0 then
    raise exception 'Falta el teléfono de la clienta.';
  end if;

  -- Todas las columnas se califican explícitamente con el nombre de la
  -- tabla: "id" y "estado_cita" también son nombres de columna de salida
  -- de esta función (returns table), y quedan ambiguos si no se califican.
  select servicios.* into v_servicio
  from public.servicios
  where servicios.id = p_id_servicio
    and servicios.id_manicurista = p_id_manicurista
    and servicios.activo = true;

  if not found then
    raise exception 'El servicio no existe o no está disponible.';
  end if;

  if p_fecha_hora_inicio <= now() then
    raise exception 'Elegí una fecha y hora futura.';
  end if;

  v_fecha_hora_fin := p_fecha_hora_inicio + (v_servicio.duracion_minutos || ' minutes')::interval;

  if exists (
    select 1 from public.citas_apartados
    where citas_apartados.id_manicurista = p_id_manicurista
      and citas_apartados.estado_cita not in ('cancelada', 'no_asistio')
      and citas_apartados.fecha_hora_inicio < v_fecha_hora_fin
      and coalesce(citas_apartados.fecha_hora_fin, citas_apartados.fecha_hora_inicio + interval '1 hour') > p_fecha_hora_inicio
  ) then
    raise exception 'Ese horario ya está ocupado. Elegí otro.';
  end if;

  v_monto_total := v_servicio.precio;

  -- v_promocion vive en su propio bloque: si no entra a este if, la
  -- variable ni se declara, así que no hay riesgo de leer un record sin
  -- asignar más abajo (eso rompía toda reserva sin código promocional).
  if p_codigo_promocional is not null and length(trim(p_codigo_promocional)) > 0 then
    declare
      v_promocion record;
    begin
      select promociones.* into v_promocion
      from public.promociones
      where promociones.id_manicurista = p_id_manicurista
        and upper(promociones.codigo) = upper(p_codigo_promocional)
        and promociones.activo = true
        and current_date between promociones.fecha_inicio and coalesce(promociones.fecha_expiracion, current_date)
        and (promociones.usos_maximos is null or promociones.usos_actuales < promociones.usos_maximos);

      if not found then
        raise exception 'Ese código promocional no es válido o ya venció.';
      end if;

      v_id_promocion := v_promocion.id;

      if v_promocion.tipo_descuento = 'porcentaje' then
        v_descuento := round(v_servicio.precio * v_promocion.valor_descuento / 100, 2);
      else
        v_descuento := v_promocion.valor_descuento;
      end if;

      v_descuento := least(v_descuento, v_servicio.precio);
      v_monto_total := v_servicio.precio - v_descuento;
    end;
  end if;

  select cl.id into v_id_clienta
  from public.clientas cl
  where cl.id_manicurista = p_id_manicurista and cl.telefono = p_telefono_clienta
  limit 1;

  if v_id_clienta is null then
    insert into public.clientas (id_manicurista, nombre_completo, telefono)
    values (p_id_manicurista, p_nombre_clienta, p_telefono_clienta)
    returning clientas.id into v_id_clienta;
  end if;

  insert into public.citas_apartados (
    id_manicurista, id_clienta, id_servicio, id_promocion,
    fecha_hora_inicio, fecha_hora_fin,
    estado_cita, monto_total, monto_seña_pagado
  ) values (
    p_id_manicurista, v_id_clienta, p_id_servicio, v_id_promocion,
    p_fecha_hora_inicio, v_fecha_hora_fin,
    'pendiente_seña', v_monto_total, 0
  )
  returning citas_apartados.id into v_id_cita;

  if v_id_promocion is not null then
    update public.promociones
    set usos_actuales = usos_actuales + 1
    where promociones.id = v_id_promocion;
  end if;

  return query
    select v_id_cita, 'pendiente_seña'::text, v_monto_total, v_servicio.monto_seña, v_descuento;
end;
$$;

revoke all on function public.crear_apartado(uuid, uuid, text, text, timestamptz, text) from public;
grant execute on function public.crear_apartado(uuid, uuid, text, text, timestamptz, text) to anon, authenticated;
