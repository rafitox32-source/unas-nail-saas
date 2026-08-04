import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formateadorPrecio } from "@/lib/formato";
import { ingresosPorMes, topServiciosPorIngreso } from "@/lib/reportes";
import type { CitaReporte } from "@/lib/tipos";

export function ReportesIngresos({ citas }: { citas: CitaReporte[] }) {
  if (citas.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-borde bg-superficie p-8 text-center shadow-sm">
        <BarChart3 className="h-8 w-8 text-texto-secundario" strokeWidth={1.5} />
        <p className="text-sm text-texto-secundario">
          Todavía no tenés citas completadas. Los reportes de ingresos aparecen acá en cuanto
          liquides tu primera cita.
        </p>
      </div>
    );
  }

  const meses = ingresosPorMes(citas);
  const servicios = topServiciosPorIngreso(citas);
  const maxMes = Math.max(1, ...meses.map((m) => m.total));
  const maxServicio = Math.max(1, ...servicios.map((s) => s.total));

  const totalEsteMes = meses[meses.length - 1]?.total ?? 0;
  const totalMesAnterior = meses[meses.length - 2]?.total ?? 0;
  const cambio =
    totalMesAnterior > 0
      ? ((totalEsteMes - totalMesAnterior) / totalMesAnterior) * 100
      : totalEsteMes > 0
        ? 100
        : 0;

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-6 shadow-sm">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-texto-primario">
        <BarChart3 className="h-4 w-4 text-rosado-texto" /> Ingresos
      </p>

      <div className="flex items-baseline gap-2">
        <span className="font-titulo text-2xl font-semibold text-texto-primario">
          {formateadorPrecio.format(totalEsteMes)}
        </span>
        <span className="text-xs text-texto-secundario">este mes</span>
        {totalMesAnterior > 0 && (
          <span
            className={`ml-auto flex shrink-0 items-center gap-0.5 text-xs font-semibold ${
              cambio >= 0 ? "text-exito" : "text-alerta"
            }`}
          >
            {cambio >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(cambio).toFixed(0)}%
          </span>
        )}
      </div>

      <div className="flex gap-2" style={{ height: "7rem" }}>
        {meses.map((mes) => (
          <div key={mes.etiqueta} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-rosado transition-all"
                style={{ height: `${Math.max(4, (mes.total / maxMes) * 100)}%` }}
                title={formateadorPrecio.format(mes.total)}
              />
            </div>
            <span className="text-[10px] text-texto-secundario">{mes.etiqueta}</span>
          </div>
        ))}
      </div>

      {servicios.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t border-borde pt-4">
          <p className="text-xs font-semibold text-texto-secundario">Servicios más rentables</p>
          {servicios.map((s) => (
            <div key={s.nombre} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-texto-primario">{s.nombre}</span>
                <span className="shrink-0 font-semibold text-texto-primario">
                  {formateadorPrecio.format(s.total)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-rosado-suave">
                <div
                  className="h-full rounded-full bg-rosado"
                  style={{ width: `${(s.total / maxServicio) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
