// Simula partidas de UNO amarrado (jugador perfecto contra la Máquina) para medir su duración. uso: node pruebas/simulacion.mjs
const F1 = [[["Cédula"], ["Nombre", "Dirección"]], [["ID_Pedido"], ["Fecha", "Cédula"]]];
const F2 = [...F1, [["Producto"], ["Precio"]], [["ID_Pedido", "Producto"], ["Cantidad"]]];
const F3 = [[["MascotaID"], ["Mascota", "Cedula"]], [["Cedula"], ["Cliente", "Telefono"]], [["VacunaID"], ["Vacuna"]], [["MascotaID", "VacunaID"], ["Fecha"]]];
const attrs = F => [...new Set(F.flatMap(([d, a]) => d.concat(a)))];
const claves = F => [...new Set(F.flatMap(([d]) => d))];
const am = (F, x, y) => x !== y && F.some(([d, a]) => (a.includes(y) && d.includes(x)) || (a.includes(x) && d.includes(y)));
const mesa = (F, x) => { const h = F.find(([d, a]) => a.includes(x) && d.length === 1); return claves(F).includes(x) ? x : h ? h[0][0] : x; };
const TIPO = { hilo: 0, mismo: 0, clave: 0 }; let atasco = 0; let s = 1; const az = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const bar = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(az() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function partida(F, { copias, mano, comod, duda, regla }) {
  const alc = (x, y) => { let C = [x], ch = true; while (ch) { ch = false; for (const [d, a] of F) if (d.every(z => C.includes(z))) for (const z of a) if (!C.includes(z)) { C.push(z); ch = true; } } return C.includes(y); };
  const val = (c, top) => c.t === "clave" || am(F, c.a, top) || (regla === "mesa" && mesa(F, c.a) === mesa(F, top))
    || (regla === "cierre" && c.a !== top && (alc(c.a, top) || alc(top, c.a))) || (regla === "mismo" && c.a === top);
  let mazo = []; for (const a of attrs(F)) for (let k = 0; k < copias; k++) mazo.push({ a, t: "dato" });
  bar(mazo); const n = Math.round(mazo.length * .15), lib = mazo.filter(c => !claves(F).includes(c.a));
  lib.slice(0, n).forEach(c => c.t = "mas2"); lib.slice(n, 2 * n).forEach(c => c.t = "salta");
  for (let k = 0; k < comod; k++) mazo.push({ t: "clave" }); bar(mazo);
  const H = { yo: [], bot: [] }; for (let k = 0; k < mano; k++) { H.yo.push(mazo.pop()); H.bot.push(mazo.pop()); }
  const i = mazo.findIndex(c => c.t === "dato" && claves(F).includes(c.a)); let pila = [mazo.splice(i, 1)[0]], top = pila[0].a;
  const roba = q => { if (!mazo.length && pila.length > 1) { const t = pila.pop(); mazo = bar(pila); pila = [t]; } if (mazo.length) { H[q].push(mazo.pop()); return true; } return false; };
  let q = "yo", turnosYo = 0;
  for (let t = 0; t < 2000; t++) {
    if (q === "yo") turnosYo++;
    let ops = H[q].filter(c => val(c, top));
    if (q === "bot" && ops.length && az() < duda) ops = [];
    if (!ops.length) { if (!roba(q)) { const ks = claves(F); top = ks[Math.floor(az() * ks.length)]; atasco++; } const c = H[q][H[q].length - 1]; if (c && val(c, top) && (q === "yo" || az() < .6)) ops = [c]; else { q = q === "yo" ? "bot" : "yo"; continue; } }
    const c = ops.find(x => x.t !== "clave") || ops[0];
    if (q === "yo") TIPO[c.t === "clave" ? "clave" : c.a === top ? "mismo" : "hilo"]++;
    H[q].splice(H[q].indexOf(c), 1); pila.push(c);
    top = c.t === "clave" ? claves(F).map(k => [k, H[q].filter(x => x.a && am(F, x.a, k)).length]).sort((a, b) => b[1] - a[1])[0][0] : c.a;
    if (!H[q].length) return { gana: q, turnosYo };
    const o = q === "yo" ? "bot" : "yo";
    if (c.t === "mas2") { roba(o); roba(o); continue; }
    if (c.t === "salta") continue;
    q = o;
  }
  return { gana: "nadie", turnosYo };
}
const casos = { P1: [F1, 3, .3], P2: [F2, 2, .22], P3: [F3, 2, .15] };
for (const v of [{ mano: 5, comod: 4, regla: "mismo" }]) {
  for (const k in TIPO) TIPO[k] = 0;
  const fila = [];
  for (const [k, [F, copias, duda]] of Object.entries(casos)) {
    let g = 0, tt = 0, N = 400, maxT = 0;
    for (let r = 0; r < N; r++) { const x = partida(F, { copias: v.copias2 || copias, mano: v.mano, comod: v.comod, duda, regla: v.regla }); if (x.gana === "yo") g++; tt += x.turnosYo; maxT = Math.max(maxT, x.turnosYo); }
    fila.push(`${k}: gana ${Math.round(100 * g / N)}% · ${(tt / N).toFixed(1)} turnos (máx ${maxT})`);
  }
  console.log(JSON.stringify(v), "\n   ", fila.join("  |  "));
  const tot = TIPO.hilo + TIPO.mismo + TIPO.clave;
  console.log("    jugadas del jugador:", Object.entries(TIPO).map(([k, n]) => k + " " + Math.round(100 * n / tot) + "%").join(" · "), "· atascos:", atasco);
}
