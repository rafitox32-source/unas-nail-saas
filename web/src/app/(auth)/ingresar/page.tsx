"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, Loader2, MessageCircle } from "lucide-react";
import { IconoMarca } from "@/components/icono-marca";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { emailInternoDesdeUsuario } from "@/lib/autenticacion";
import { urlWhatsappSoporte } from "@/lib/soporte";
import { CampoConIcono } from "@/components/campo-con-icono";

function traducirError(mensaje: string) {
  if (mensaje.includes("Invalid login credentials")) return "Usuario o contraseña incorrectos.";
  if (mensaje.includes("Email not confirmed")) return "Esa cuenta todavía no está activa.";
  return mensaje;
}

export default function PaginaIngresar() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { error: errorIngreso } = await supabase.auth.signInWithPassword({
      email: emailInternoDesdeUsuario(usuario),
      password,
    });

    setEnviando(false);

    if (errorIngreso) {
      setError(traducirError(errorIngreso.message));
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form onSubmit={alEnviar} className="animar-aparecer w-full max-w-sm">
        <div className="text-center">
          <IconoMarca className="mx-auto h-7 w-7 text-rosado-texto" />
          <h1 className="font-titulo mt-2 text-2xl font-semibold text-texto-primario">
            Iniciá sesión
          </h1>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <label className="text-sm text-texto-secundario">
            Usuario
            <CampoConIcono
              icono={AtSign}
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="bg-superficie"
            />
          </label>

          <label className="text-sm text-texto-secundario">
            Contraseña
            <CampoConIcono
              icono={Lock}
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-superficie"
            />
          </label>

          <a
            href={urlWhatsappSoporte(
              usuario
                ? `Hola! Olvidé mi contraseña. Mi usuario es "${usuario}".`
                : "Hola! Olvidé mi contraseña.",
            )}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 self-start text-xs font-semibold text-texto-secundario transition-colors hover:text-rosado-texto"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            ¿Olvidaste tu contraseña? Escribinos por WhatsApp
          </a>

          {error && <p className="animar-aparecer text-sm text-alerta">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-rosado py-3 text-sm font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>

          <p className="text-center text-sm text-texto-secundario">
            ¿Todavía no tenés cuenta?{" "}
            <a href="/registro" className="font-semibold text-rosado-texto hover:underline">
              Creá una
            </a>
          </p>
        </div>
      </form>
    </main>
  );
}
