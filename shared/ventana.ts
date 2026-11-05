// Espejo de `night_window()` en dgx-infra/services/dashboard/pricing.py — ahí está la verdad única (la franja y el %
// por modelo, que el panel lee de la consola). shortcut: la franja es una regla fija de la promo de Alibaba
// (22:00–08:00 hora de facturación de la cuenta, UTC+8); si se mueve, se cambia primero pricing.py y este fichero en la
// misma pasada.
const H = 3_600_000;
const DAY = 86_400_000;
const NIGHT_HOURS_UTC8 = "22:00–08:00";

export type Ventana = { active: boolean; changesAtMs: number; secondsLeft: number };

export function nightWindow(nowMs: number): Ventana {
  // epoch desplazado: sus campos UTC leen la hora de facturación de la cuenta (UTC+8), que es la que usa Alibaba.
  const t8 = nowMs + 8 * H;
  const hour = new Date(t8).getUTCHours();
  const active = hour >= 22 || hour < 8;
  const midnight8 = Math.floor(t8 / DAY) * DAY;
  const at08 = midnight8 + 8 * H;
  const at22 = midnight8 + 22 * H;
  const next = hour >= 22 ? at08 + DAY : hour < 8 ? at08 : at22;
  return { active, changesAtMs: next - 8 * H, secondsLeft: Math.max(0, Math.round((next - t8) / 1000)) };
}

// % nocturno por modelo, de ALIBABA_TOKEN_PLAN_MODELS en pricing.py (Qwen 40, DeepSeek 50).
export function nightPct(model: string): number | null {
  if (/ds|deepseek/i.test(model)) return 50;
  if (/q3[78]|qwen/i.test(model)) return 40;
  return null;
}

export function isAlibaba(model: string | null | undefined): model is string {
  return !!model && model.startsWith("alibaba");
}

export function fmtLeft(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
}

function hhmmMadrid(ms: number): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(ms));
  } catch {
    return "";
  }
}

// Las dos franjas siempre juntas y cada una con su nombre (ley de pricing.py: sola, la de Singapur se lee como propia).
// La de España se deriva de los instantes reales, así que el cambio de hora de Madrid sale solo.
export function spainRange(v: Ventana): string {
  const start = v.active ? v.changesAtMs - 10 * H : v.changesAtMs;
  const from = hhmmMadrid(start);
  const to = hhmmMadrid(start + 10 * H);
  return from && to ? `${from}–${to}` : "";
}

export function spainFrom(v: Ventana): string {
  return v.active ? "" : hhmmMadrid(v.changesAtMs);
}

export function ventanaLinea(v: Ventana): string {
  const spain = spainRange(v);
  return `España ${spain || "?"} · Singapur ${NIGHT_HOURS_UTC8}`;
}
