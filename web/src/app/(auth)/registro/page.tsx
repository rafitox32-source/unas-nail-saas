"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Link as LinkIcon,
  User,
  Phone,
  AtSign,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { generarSlug } from "@/lib/slug";
import { emailInternoDesdeUsuario } from "@/lib/autenticacion";
import { CampoConIcono } from "@/components/campo-con-icono";

const MENSAJE_FALTA_CONFIRM_EMAIL_OFF =
  'El proyecto todavía tiene activada la confirmación por email en Supabase Auth, y acá no usamos emails reales. Hay que apagar "Confirm email" en el panel de Supabase (Authentication → Sign In / Up → Email) para que las cuentas queden activas al crearse.';

function traducirError(mensaje: string) {
  if (mensaje.includes("already registered")) return "Ese usuario ya está registrado.";
  if (mensaje.includes("Password should be")) return "La contraseña debe tener al menos 6 caracteres.";
  if (mensaje.includes("duplicate key") && mensaje.includes("slug_publico"))
    return "Ese nombre de página ya está en uso, elegí otro.";
  if (mensaje.includes("duplicate key") && mensaje.includes("usuario"))
    return "Ese usuario ya está en uso, elegí otro.";
  // Estos dos solo pasan mientras "Confirm email" siga activo: GoTrue intenta
  // mandar un correo de confirmación a un dominio que no existe (no hay
  // emails reales acá) y falla, ya sea por dirección "inválida" o porque el
  // mailer gratuito de Supabase se quedó sin cupo de envíos.
  if (mensaje.includes("is invalid") || mensaje.includes("rate limit"))
    return MENSAJE_FALTA_CONFIRM_EMAIL_OFF;
  return mensaje;
}

export default function PaginaRegistro() {
  const router = useRouter();

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoAMano, setSlugEditadoAMano] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const [slugDisponible, setSlugDisponible] = useState<boolean | null>(null);
  const [usuarioDisponible, setUsuarioDisponible] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentaPendienteDeConfirmar, setCuentaPendienteDeConfirmar] = useState(false);

  useEffect(() => {
    if (!slugEditadoAMano) setSlug(generarSlug(nombreNegocio));
  }, [nombreNegocio, slugEditadoAMano]);

  useEffect(() => {
    if (!slug) {
      setSlugDisponible(null);
      return;
    }
    let cancelado = false;
    const temporizador = setTimeout(() => {
      const supabase = crearClienteNavegador();
      supabase.rpc("slug_disponible", { p_slug: slug }).then(({ data }) => {
        if (!cancelado) setSlugDisponible(data ?? null);
      });
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [slug]);

  useEffect(() => {
    if (!usuario) {
      setUsuarioDisponible(null);
      return;
    }
    let cancelado = false;
    const temporizador = setTimeout(() => {
      const supabase = crearClienteNavegador();
      supabase.rpc("usuario_disponible", { p_usuario: usuario }).then(({ data }) => {
        if (!cancelado) setUsuarioDisponible(data ?? null);
      });
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [usuario]);

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (slugDisponible === false) {
      setError("Elegí otro nombre de página, ese ya está en uso.");
      return;
    }
    if (usuarioDisponible === false) {
      setError("Elegí otro usuario, ese ya está en uso.");
      return;
    }

    setEnviando(true);
    const supabase = crearClienteNavegador();
    const { data, error: errorRegistro } = await supabase.auth.signUp({
      email: emailInternoDesdeUsuario(usuario),
      password,
      options: {
        data: {
          nombre_negocio: nombreNegocio,
          nombre_completo: nombreCompleto,
          telefono: telefono || null,
          slug_publico: slug,
          usuario: usuario.trim().toLowerCase(),
        },
      },
    });
    setEnviando(false);

    if (errorRegistro) {
      setError(traducirError(errorRegistro.message));
      return;
    }

    if (data.session) {
      router.push("/panel");
    } else {
      // No debería pasar con "Confirm email" apagado en Supabase Auth: acá
      // no hay un email real al que mandar nada para confirmar.
      setCuentaPendienteDeConfirmar(true);
    }
  }

  if (cuentaPendienteDeConfirmar) {
    return (
      <main className="animar-aparecer flex flex-1 items-center justify-center px-6 py-24 text-center">
        <div>
          <h1 className="font-titulo mt-3 text-2xl font-semibold text-texto-primario">
            Tu cuenta se creó, pero falta un paso
          </h1>
          <p className="mt-3 max-w-sm text-sm text-texto-secundario">
            {MENSAJE_FALTA_CONFIRM_EMAIL_OFF}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form onSubmit={alEnviar} className="animar-aparecer w-full max-w-sm">
        <div className="text-center">
          <Sparkles className="mx-auto h-7 w-7 text-rosado" strokeWidth={1.5} />
          <h1 className="font-titulo mt-2 text-2xl font-semibold text-texto-primario">
            Creá tu cuenta
          </h1>
        </div>
        <p className="mt-1 text-center text-sm text-texto-secundario">
          Armá la página pública de tu negocio en minutos.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <label className="text-sm text-texto-secundario">
            Nombre del negocio
            <CampoConIcono
              icono={Store}
              required
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              className="bg-superficie"
            />
          </label>

          <label className="text-sm text-texto-secundario">
            Dirección de tu página
            <div className="relative mt-1">
              <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-secundario" />
              <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-texto-secundario">
                /
              </span>
              <input
                required
                value={slug}
                onChange={(e) => {
                  setSlugEditadoAMano(true);
                  setSlug(generarSlug(e.target.value));
                }}
                className="w-full rounded-xl border border-borde bg-superficie py-2.5 pl-[3.25rem] pr-4 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
              />
            </div>
            {slug && slugDisponible === true && (
              <span className="animar-aparecer mt-1 flex items-center gap-1 text-xs text-exito">
                <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
              </span>
            )}
            {slug && slugDisponible === false && (
              <span className="animar-aparecer mt-1 flex items-center gap-1 text-xs text-alerta">
                <XCircle className="h-3.5 w-3.5" /> Ya está en uso
              </span>
            )}
          </label>

          <label className="text-sm text-texto-secundario">
            Tu nombre completo
            <CampoConIcono
              icono={User}
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="bg-superficie"
            />
          </label>

          <label className="text-sm text-texto-secundario">
            Teléfono (WhatsApp)
            <CampoConIcono
              icono={Phone}
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="bg-superficie"
            />
          </label>

          <label className="text-sm text-texto-secundario">
            Usuario
            <CampoConIcono
              icono={AtSign}
              required
              value={usuario}
              onChange={(e) => setUsuario(generarSlug(e.target.value))}
              className="bg-superficie"
            />
            {usuario && usuarioDisponible === true && (
              <span className="animar-aparecer mt-1 flex items-center gap-1 text-xs text-exito">
                <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
              </span>
            )}
            {usuario && usuarioDisponible === false && (
              <span className="animar-aparecer mt-1 flex items-center gap-1 text-xs text-alerta">
                <XCircle className="h-3.5 w-3.5" /> Ya está en uso
              </span>
            )}
          </label>

          <label className="text-sm text-texto-secundario">
            Contraseña
            <CampoConIcono
              icono={Lock}
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-superficie"
            />
          </label>

          {error && <p className="animar-aparecer text-sm text-alerta">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-rosado py-3 text-sm font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-texto-secundario">
            ¿Ya tenés cuenta?{" "}
            <a href="/ingresar" className="font-semibold text-rosado hover:underline">
              Iniciá sesión
            </a>
          </p>
        </div>
      </form>
    </main>
  );
}
