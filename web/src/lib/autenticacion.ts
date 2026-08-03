// Supabase Auth exige un "email" para signUp/signInWithPassword, pero acá
// el login es solo usuario + contraseña — este dominio nunca recibe correos
// reales, es puramente el email interno que usa Supabase para identificar
// la cuenta. OJO: no usar TLDs reservados (.internal, .test, .local,
// .example, .invalid) — GoTrue los rechaza como "invalid" (mismo motivo que
// la trampa #1 de CLAUDE.md con .test/example.com), por eso el dominio de
// abajo tiene forma de dominio real aunque no esté registrado.
const DOMINIO_INTERNO = "usuarios.uas-login.com";

export function emailInternoDesdeUsuario(usuario: string) {
  return `${usuario.trim().toLowerCase()}@${DOMINIO_INTERNO}`;
}
