// El roster vive aquí y en ninguna otra parte: cada snapshot pasa por `apply`, que deja solo los agentes con modelo de
// Alibaba; la vista se suscribe y repinta. La ventana se calcula en shared/ventana.ts sobre el reloj — no hay datos que
// caduquen—, así que el repinte es un tick, no una relectura.
import type { PluginClientContext } from "@getpaseo/plugin/client";
import { fmtLeft, isAlibaba, nightPct, nightWindow, spainFrom, ventanaLinea, type Ventana } from "../shared/ventana.ts";

type Paseo = PluginClientContext["paseo"];

// Campos que este plugin lee del snapshot, escritos a mano porque el bundle cliente del plugin no puede importar
// @getpaseo/client (frontera de runtime); los snapshots llegan estructurales.
type PaseoAgent = { id: string; workspaceId?: string | null; model?: string | null };

export type AgenteAlibaba = { workspaceId: string; model: string };

const agents = new Map<string, AgenteAlibaba>();
const listeners = new Set<() => void>();

export function alibabaAgents(): Map<string, AgenteAlibaba> {
  return agents;
}

export function subscribePildora(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

function upsert(agent: PaseoAgent): void {
  if (isAlibaba(agent.model)) {
    const prev = agents.get(agent.id);
    if (!prev || prev.model !== agent.model || prev.workspaceId !== (agent.workspaceId ?? "")) {
      agents.set(agent.id, { workspaceId: agent.workspaceId ?? "", model: agent.model });
      notify();
    }
  } else if (agents.delete(agent.id)) {
    notify();
  }
}

export function pildoraLabel(model: string, nowMs: number): string {
  const v = nightWindow(nowMs);
  const pct = nightPct(model);
  const dto = pct ? `−${pct} %` : "dto nocturno";
  const from = spainFrom(v);
  return v.active ? `${dto} · quedan ${fmtLeft(v.secondsLeft)}` : from ? `${dto} · desde las ${from}` : `${dto} · 22:00 UTC+8`;
}

export function pildoraLineas(model: string, nowMs: number): string[] {
  const v: Ventana = nightWindow(nowMs);
  const pct = nightPct(model);
  const dto = pct ? `Descuento nocturno Alibaba −${pct} %` : "Descuento nocturno de Alibaba";
  const when = v.active
    ? `ACTIVO ahora · queda ${fmtLeft(v.secondsLeft)}`
    : `empieza en ${fmtLeft(v.secondsLeft)}`;
  return [`${dto} — ${when}`, ventanaLinea(v)];
}

export function startPildora(paseo: Paseo): () => void {
  // La suscripción propia del plugin al daemon: `agents.subscribe()` a secas es un listener local sobre la caché de la
  // app y calla para una sesión de plugin; `list({subscribe:{}})` abre una enrutada cuyos updates traen los snapshots.
  let stopObserver: (() => void) | null = null;
  let subscription: Awaited<ReturnType<Paseo["agents"]["list"]>>["subscription"] | null = null;
  paseo.agents.list({ subscribe: {} }).then(
    (result) => {
      subscription = result.subscription ?? null;
      // El roster del snapshot es autoritativo: los agentes que faltan pierden su píldora.
      const vistos = new Set<string>();
      for (const entry of result.entries) {
        vistos.add(entry.agent.id);
        upsert(entry.agent);
      }
      for (const id of [...agents.keys()]) if (!vistos.has(id)) agents.delete(id);
      if (subscription) {
        stopObserver = subscription.subscribe({
          snapshot: (snap) => {
            const ids = new Set<string>();
            for (const entry of snap.entries) {
              ids.add(entry.agent.id);
              upsert(entry.agent);
            }
            for (const id of [...agents.keys()]) if (!ids.has(id)) agents.delete(id);
            notify();
          },
          update: (message) => {
            const payload = (message as { payload?: { kind?: string; agent?: PaseoAgent } }).payload;
            if (message.type === "agent_update" && payload?.kind === "upsert" && payload.agent) upsert(payload.agent);
          },
        });
      }
      notify();
    },
    () => {},
  );
  return () => {
    if (stopObserver) stopObserver();
    void subscription?.release();
  };
}
