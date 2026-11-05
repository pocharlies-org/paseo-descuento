import type {
  PluginButtonContentProps,
  PluginButtonIconProps,
  PluginButtonRegistration,
  PluginClientContext,
} from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { alibabaAgents, pildoraLabel, pildoraLineas, startPildora, subscribePildora } from "./client/pildora.ts";

// Una píldora por agente con modelo de Alibaba (el prefijo `alibaba` en el snapshot es lo que la dispara): dice si el
// descuento nocturno está activo ahora y cuánto queda. El popover trae las dos franjas completas (España y Singapur).
// Se repinta con cada snapshot y con un tick de 30 s para la cuenta atrás. Sin mitad de servidor: la ventana es reloj.

function MoonIcon(props: PluginButtonIconProps) {
  return <Icon name="Moon" size={props.size} color={props.color} />;
}

function DescuentoPopover(props: PluginButtonContentProps) {
  const [, tick] = useState(0); // la cuenta atrás sigue moviéndose mientras el popover está abierto
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(timer);
  }, []);
  const agentId = props.context === "agent" ? props.agentId : "";
  const model = alibabaAgents().get(agentId)?.model ?? "";
  const lines = pildoraLineas(model, Date.now());
  return (
    <View style={{ padding: 4, gap: 2 }}>
      {lines.map((line) => (
        <Text key={line} style={{ color: props.theme.colors.foreground, fontSize: 13 }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function contribute(client: PluginClientContext) {
  const stopStore = startPildora(client.paseo);
  const pills = new Map<string, { reg: PluginButtonRegistration; label: string }>();

  const refresh = () => {
    const now = Date.now();
    for (const [agentId, agent] of alibabaAgents()) {
      const text = pildoraLabel(agent.model, now);
      let pill = pills.get(agentId);
      if (!pill) {
        pill = {
          label: text,
          reg: client.addComposerPill({
            id: `descuento-${agentId}`,
            workspaceId: agent.workspaceId,
            agentId,
            button: {
              title: "Descuento nocturno de Alibaba",
              icon: MoonIcon,
              label: text,
              behavior: { kind: "popover", Content: DescuentoPopover },
            },
          }),
        };
        pills.set(agentId, pill);
        continue;
      }
      if (pill.label !== text) {
        pill.label = text;
        pill.reg.update({ label: text });
      }
    }
    for (const [agentId, pill] of [...pills]) {
      if (!alibabaAgents().has(agentId)) {
        pill.reg.remove();
        pills.delete(agentId);
      }
    }
  };

  const off = subscribePildora(refresh);
  const timer = setInterval(refresh, 30_000);
  return () => {
    clearInterval(timer);
    off();
    stopStore();
    for (const pill of pills.values()) pill.reg.remove();
    pills.clear();
  };
}
