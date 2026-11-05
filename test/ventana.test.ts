import assert from "node:assert/strict";
import { test } from "node:test";
import { fmtLeft, isAlibaba, nightPct, nightWindow, spainRange } from "../shared/ventana.ts";

// 2026-11-05: Madrid en horario de invierno (UTC+1). La franja UTC+8 22:00–08:00 cruza medianoche.
test("dentro de la franja: 23:00 UTC+8 está activa y termina a las 08:00 UTC+8", () => {
  const v = nightWindow(Date.parse("2026-11-05T15:00:00Z")); // 23:00 UTC+8
  assert.equal(v.active, true);
  assert.equal(v.changesAtMs, Date.parse("2026-11-06T00:00:00Z")); // 08:00 UTC+8
  assert.equal(v.secondsLeft, 9 * 3600);
});

test("borde 22:00 UTC+8 en punto: activo", () => {
  assert.equal(nightWindow(Date.parse("2026-11-05T14:00:00Z")).active, true);
});

test("borde 08:00 UTC+8 en punto: inactivo (la franja es [22,8))", () => {
  assert.equal(nightWindow(Date.parse("2026-11-05T00:00:00Z")).active, false);
});

test("fuera: 18:00 UTC+8 espera a las 22:00 UTC+8 de hoy", () => {
  const v = nightWindow(Date.parse("2026-11-05T10:00:00Z")); // 18:00 UTC+8
  assert.equal(v.active, false);
  assert.equal(v.changesAtMs, Date.parse("2026-11-05T14:00:00Z"));
});

test("la franja dicha en hora de Madrid (invierno: 15:00–01:00)", () => {
  assert.equal(spainRange(nightWindow(Date.parse("2026-11-05T10:00:00Z"))), "15:00–01:00");
});

test("% por modelo: Qwen 40, DeepSeek 50, otro modelo alibaba sin %", () => {
  assert.equal(nightPct("alibaba-q38-flash"), 40);
  assert.equal(nightPct("alibaba-ds41f1017"), 50);
  assert.equal(nightPct("alibaba-otro"), null);
});

test("el residente local (qwen38-flash-next) NO es Alibaba; el prefijo manda", () => {
  assert.equal(isAlibaba("qwen38-flash-next"), false);
  assert.equal(isAlibaba("alibaba-q38-flash"), true);
  assert.equal(isAlibaba(undefined), false);
});

test("cuenta atrás legible", () => {
  assert.equal(fmtLeft(3 * 3600 + 12 * 60), "3 h 12 m");
  assert.equal(fmtLeft(40 * 60), "40 m");
});
