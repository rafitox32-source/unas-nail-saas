export type EstadoCuenta = "pendiente" | "aprobada" | "rechazada";

// Declarado al registrarse: en qué se especializa el negocio, o si ofrece
// de todo (spa_completo). Informativo — no restringe qué categorías de
// servicio puede cargar después.
export type TipoNegocio = "cabello" | "pestañas" | "uñas" | "spa_completo";

export interface Manicurista {
  id: string;
  nombre_negocio: string;
  nombre_completo: string;
  telefono: string | null;
  biografia: string | null;
  color_marca: string | null;
  slug_publico: string | null;
  url_avatar: string | null;
  politica_cancelacion: string | null;
}

export interface SesionManicurista {
  estado_cuenta: EstadoCuenta;
  es_admin: boolean;
  nombre_negocio: string;
}

export interface CuentaAdmin {
  id: string;
  usuario: string;
  nombre_negocio: string;
  nombre_completo: string;
  telefono: string | null;
  estado_cuenta: EstadoCuenta;
  creado_en: string;
}

export interface ProgramaLealtad {
  lealtad_activo: boolean;
  lealtad_visitas_objetivo: number | null;
  lealtad_premio_descripcion: string | null;
}

export type CategoriaServicio = "cabello" | "pestañas" | "uñas" | "otro";

export interface Personal {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  url_foto: string | null;
  activo: boolean;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_minutos: number;
  monto_seña: number;
  categoria: CategoriaServicio;
  id_empleado: string | null;
}

export interface ServicioAdmin extends Servicio {
  activo: boolean;
}

export type EstadoCita =
  | "pendiente_seña"
  | "confirmada"
  | "completada"
  | "cancelada"
  | "no_asistio";

export interface BloqueoAgenda {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo: string | null;
  id_empleado: string | null;
}

export interface RangoOcupado {
  inicio: string;
  fin: string;
}

export interface CitaAgenda {
  id: string;
  fecha_hora_inicio: string;
  estado_cita: EstadoCita;
  monto_total: number;
  monto_seña_pagado: number;
  monto_restante: number;
  id_empleado: string | null;
  clientas: { nombre_completo: string; telefono: string | null } | null;
  servicios: { nombre: string } | null;
  personal: { nombre: string } | null;
}

export interface ClientaAdmin {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  alergias: string | null;
  notas_internas: string | null;
  valor_vida_cliente: number;
  visitas_completadas: number;
  premios_canjeados: number;
}

export interface CitaHistorial {
  id: string;
  fecha_hora_inicio: string;
  estado_cita: EstadoCita;
  monto_total: number;
  servicios: { nombre: string } | null;
}

export interface CitaReporte {
  monto_total: number;
  fecha_hora_inicio: string;
  servicios: { nombre: string } | null;
}

export interface ResenaAdmin {
  id: string;
  nombre_clienta: string;
  calificacion: number;
  comentario: string;
  visible: boolean;
}

export interface ResenaPublica {
  id: string;
  nombre_clienta: string;
  calificacion: number;
  comentario: string;
}

export interface InsumoInventario {
  id: string;
  nombre_insumo: string;
  categoria: string | null;
  cantidad_actual: number;
  unidad_medida: string;
  cantidad_minima_alerta: number;
  costo_unitario: number | null;
}

export interface NotaVisita {
  id: string;
  id_cita: string;
  formula_color: string | null;
  notas: string | null;
  rutas_fotos: string[];
}

export interface FotoFirmada {
  ruta: string;
  url: string;
}

export interface ReciboDatos {
  id: string;
  fecha_hora_inicio: string;
  monto_total: number;
  monto_seña_pagado: number;
  clientas: { nombre_completo: string; telefono: string | null } | null;
  servicios: { nombre: string } | null;
  usuarios_manicuristas: { nombre_negocio: string; telefono: string | null } | null;
}

export interface FotoGaleria {
  id: string;
  ruta_archivo: string;
  orden: number;
}

export interface FotoGaleriaAdmin extends FotoGaleria {
  url: string;
}

export type TipoDescuento = "porcentaje" | "monto_fijo";

export interface PromocionAdmin {
  id: string;
  codigo: string;
  descripcion: string | null;
  tipo_descuento: TipoDescuento;
  valor_descuento: number;
  fecha_inicio: string;
  fecha_expiracion: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
  activo: boolean;
}
