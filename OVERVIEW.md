# paseo-descuento

El descuento nocturno de Alibaba, visible desde el composer de Paseo.

- Una píldora por agente cuyo modelo empiece por `alibaba` (el prefijo es lo que la dispara; el residente local
  `qwen38-flash-next` no la pinta). Sirve también de aviso de «voy con Alibaba».
- Etiqueta: `−40 % · quedan 3 h 12 m` dentro de la franja; `−40 % · desde las 15:00` fuera.
- Al tocar, el popover dice el estado, la cuenta atrás y las dos franjas con su nombre (España y Singapur), como
  manda la fuente de verdad.
- La verdad única de la franja y del % por modelo está en `night_window()` de `dgx-infra/services/dashboard/pricing.py`;
  `shared/ventana.ts` es un espejo de esa regla fija (ver el comentario `shortcut:` allí).
- No hay mitad de servidor: la ventana se calcula sobre el reloj del cliente.

## Install

```sh
paseo plugin add git:pocharlies-org/paseo-descuento.git
```

## Development

`npm ci --ignore-scripts && npm run typecheck && npm test`.
