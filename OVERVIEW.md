# paseo-descuento

El descuento nocturno de Alibaba, visible desde el composer de Paseo.

- Una píldora por agente cuyo modelo empiece por `alibaba` (el prefijo es lo que la dispara; el residente local
  `qwen38-flash-next` no la pinta). Sirve también de aviso de «voy con Alibaba».
- Etiqueta: `−40 % · quedan 3 h 12 m` dentro de la franja; `−40 % · desde las 15:00` fuera.
- Al tocar, el popover dice el estado, la cuenta atrás y las dos franjas con su nombre (España y Singapur), como
  manda la fuente de verdad.
- No hay mitad de servidor: la ventana se calcula sobre el reloj del cliente.

La franja y el % por modelo son los del panel de precios de la organización; `shared/ventana.ts` es un espejo de esa
regla. Instalación y desarrollo, en el README del repositorio.
