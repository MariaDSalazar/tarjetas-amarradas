// Prueba de Tarjetas amarradas · UNO en Chrome headless (CDP). uso: node pruebas/prueba.mjs [pc|cel] [semilla]
import { spawn } from "node:child_process";
import fs from "node:fs";
fs.mkdirSync("png", { recursive: true });
const modo = process.argv[2] || "pc", semilla = process.argv[3] || "7";
const puerto = modo === "pc" ? 9371 : 9372;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", `--remote-debugging-port=${puerto}`, "--user-data-dir=" + process.env.TEMP + "/cdpuno" + Date.now(), "about:blank"]);
await new Promise(r => setTimeout(r, 2500));
const tabs = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json();
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errores = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; }
  if (d.method === "Runtime.exceptionThrown") errores.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errores.push("console: " + JSON.stringify(d.params.args.map(a => a.value)));
};
const cmd = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => {
  const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails)).split("\n")[0]);
  return r.result.result.value;
};
const dormir = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { if (!c) throw new Error("FALLA: " + msg); console.log("  ✓", msg); };
const cel = modo === "cel";
await cmd("Runtime.enable"); await cmd("Page.enable");
await cmd("Emulation.setDeviceMetricsOverride", cel ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } : { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
if (cel) await cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
const url = new URL("../index.html", import.meta.url).href + "?semilla=" + semilla;
await cmd("Page.navigate", { url }); await dormir(1000);
await ev("localStorage.clear(); location.reload(); 1"); await dormir(1000);

async function toca(x, y) {
  if (cel) {
    await cmd("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await cmd("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await cmd("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await cmd("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  }
  await dormir(110);
}
const clic = async sel => {
  const p = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:"nearest",inline:"center"});
    const b=e.getBoundingClientRect(); return [b.x+b.width/2, b.y+Math.min(b.height/2, 40)];})()`);
  if (!p) throw new Error("no está: " + sel);
  await toca(p[0], p[1]);
};
const foto = async nom => fs.writeFileSync(`png/uno_${modo}_${nom}.png`, Buffer.from((await cmd("Page.captureScreenshot", { format: "png" })).result.data, "base64"));
const hojaTit = () => ev(`document.querySelector('#hoja.on h2')?.textContent || ''`);
const hojaTxt = () => ev(`document.querySelector('#hoja.on')?.innerText || ''`);
const est = () => ev(`(()=>{const {G}=__UNO.estado(); if(!G) return null; return {turno:G.turno, fin:G.fin, ocupado:G.ocupado, robo:G.robo, uno:G.uno, err:G.err,
  top:G.top.a, yo:G.yo.map(c=>({id:c.id,a:c.a||null,t:c.tipo})), bot:G.bot.length, partida:__UNO.estado().P.partida};})()`);
const amarradas = (a, b) => ev(`__UNO.vale(__UNO.estado().G.Pt, ${JSON.stringify(a)}, ${JSON.stringify(b)})`);

try {
  // ---------------------------------------------------------------- lógica de los hilos
  console.log("Lógica:");
  const L = await ev(`(()=>{const U=__UNO, P1=U.PARTIDAS[1], P2=U.PARTIDAS[2]; return {
    simetria: U.amarradas(P1,"Cédula","Nombre") && U.amarradas(P1,"Nombre","Cédula"),
    hermanas: U.amarradas(P1,"Nombre","Dirección"),
    fk: U.amarradas(P1,"ID_Pedido","Cédula"),
    nudo: U.amarradas(P1,"Cantidad","Producto") && U.amarradas(P1,"Cantidad","ID_Pedido"),
    nudoNo: U.amarradas(P1,"Cantidad","Precio"),
    sentidoNudo: U.sentido(P1,"Cantidad","Producto"),
    sentidoFk: U.sentido(P1,"Cédula","ID_Pedido"),
    pqHermanas: U.porQue(P1,"Dirección","Nombre"),
    pqCadena: U.porQue(P1,"Nombre","ID_Pedido"),
    pqNada: U.porQue(P1,"Producto","Nombre"),
    pqFk: U.porQue(P1,"Fecha","Cédula"), mismo: U.vale(P1,"Fecha","Fecha"),
    claves1: U.claves(P1), claves2: U.claves(P2),
    vet: U.amarradas(P2,"Fecha","VacunaID") && U.amarradas(P2,"MascotaID","Cedula") && !U.amarradas(P2,"Telefono","MascotaID"),
    pqVet: U.porQue(P2,"Telefono","MascotaID")
  };})()`);
  ok(L.simetria, "el hilo vale en los dos sentidos (Cédula–Nombre)");
  ok(!L.hermanas && L.pqHermanas.includes("obedecen a Cédula"), "Nombre y Dirección: misma mesa, sin hilo · " + L.pqHermanas);
  ok(L.fk && L.sentidoFk === "ID_Pedido → Cédula", "ID_Pedido–Cédula amarradas: " + L.sentidoFk);
  ok(L.nudo && !L.nudoNo && L.sentidoNudo === "ID_Pedido + Producto → Cantidad", "nudo: Cantidad con ID_Pedido y con Producto, no con Precio");
  ok(L.pqCadena.includes("ID_Pedido → Cédula → Nombre"), "Nombre sobre ID_Pedido: solo por la cadena · " + L.pqCadena);
  ok(L.pqNada.includes("no hay hilo") && L.pqNada.includes("Cédula"), "Producto sobre Nombre: sin hilo, y dice qué se podía · " + L.pqNada);
  ok(L.mismo, "el mismo dato siempre vale (como el mismo número del UNO)");
  ok(L.pqFk.includes("las dos obedecen a ID_Pedido") && !L.pqFk.includes("misma mesa"), "Fecha sobre Cédula: mesas distintas, mismo jefe · " + L.pqFk);
  ok(L.claves1.join() === "Cédula,ID_Pedido,Producto" && L.claves2.join() === "MascotaID,Cedula,VacunaID", "claves del comodín: " + L.claves1 + " | " + L.claves2);
  ok(L.vet && L.pqVet.includes("MascotaID → Cedula → Telefono"), "veterinaria: Telefono sobre MascotaID solo por la cadena");

  // ---------------------------------------------------------------- partida real
  console.log("Partida:");
  ok(await ev(`document.querySelector('#bEmpezar').disabled`), "sin nombre y apellido no se puede empezar");
  await clic("#iNom"); await cmd("Input.insertText", { text: "Ana" });
  await clic("#iApe"); await cmd("Input.insertText", { text: "Prueba" });
  await foto("00_portada");
  await clic("#bEmpezar"); await dormir(500);
  ok((await hojaTit()).includes("Cómo se juega"), "la primera partida abre con la ayuda");
  await foto("01_ayuda");
  await clic("#bListo"); await dormir(350);
  await foto("02_mesa");

  let provocado = false, unoOlvidado = false, comodin = false, fotos = 0, revanchas = 0, jugadas = 0, robos = 0, ganadas = 0;
  for (let paso = 0; paso < 900; paso++) {
    const t = await hojaTit();
    if (t) {
      if (t.includes("Ganó la partida")) {
        ganadas++; await foto(`gana_${ganadas}`);
        if (await ev(`!!document.querySelector('#bSig')`)) { const fin = (await ev(`document.querySelector('#bSig').textContent`)).includes("constancia"); await clic("#bSig"); await dormir(500); if (fin) break; continue; }
      }
      if (t.includes("La Máquina ganó")) { revanchas++; await clic("#bRevancha"); await dormir(500); continue; }
      if (t.includes("¿Qué clave")) { await clic("#hoja [data-k]"); await dormir(300); continue; }
      if (await ev(`!!document.querySelector('#bEntendido')`)) { await clic("#bEntendido"); await dormir(300); continue; }
      if (await ev(`!!document.querySelector('#bListo')`)) { await clic("#bListo"); await dormir(300); continue; }
    }
    const s = await est();
    if (!s || s.fin || s.ocupado || s.turno !== "yo") { await dormir(350); continue; }
    // 1) un hilo falso a propósito, la primera vez que se pueda
    if (!provocado) {
      const malo = [];
      for (const c of s.yo) if (c.t !== "clave" && !(await amarradas(c.a, s.top))) malo.push(c);
      if (malo.length) {
        await clic(`#mano .naipe[data-id="${malo[0].id}"]`); await clic(`#mano .naipe[data-id="${malo[0].id}"]`); await dormir(300);
        const tx = await hojaTxt();
        ok((await hojaTit()).includes("Hilo falso") && tx.includes("Sobre " + s.top) && tx.includes("roba 1"), `hilo falso ${malo[0].a} sobre ${s.top}: sticker, porqué y castigo`);
        await foto("03_hilo_falso");
        const antes = s.yo.length; await clic("#bEntendido"); await dormir(400);
        const d = await est(); ok(d.yo.length === antes + 1 && d.turno === "bot", "castigo: +1 carta y pasa el turno");
        provocado = true; continue;
      }
    }
    // 2) con dos cartas: la primera vez se olvida el ¡UNO!, luego se dice
    const buenas = [];
    for (const c of s.yo) if (c.t === "clave" || await amarradas(c.a, s.top)) buenas.push(c);
    if (s.yo.length === 2 && buenas.length) {
      if (unoOlvidado) { await clic("#bUno"); await dormir(150); ok(await ev(`__UNO.estado().G.uno`), "¡UNO! dicho a tiempo"); }
    }
    if (buenas.length) {
      const c = buenas.find(x => x.t !== "clave") || buenas[0];
      await clic(`#mano .naipe[data-id="${c.id}"]`); await clic(`#mano .naipe[data-id="${c.id}"]`); await dormir(250);
      jugadas++;
      if (c.t === "clave" && !comodin) { comodin = true; ok((await hojaTit()).includes("¿Qué clave"), "el comodín CLAVE pregunta qué clave poner"); await foto("05_clave"); }
      if (s.yo.length === 2 && !unoOlvidado) {
        const t2 = await hojaTit();
        if (t2.includes("Olvidó")) { unoOlvidado = true; ok((await est()).yo.length === 3, "olvidó decir ¡UNO!: roba 2"); await foto("04_uno_olvidado"); }
      }
      if (fotos < 2 && jugadas % 7 === 0) { fotos++; await foto(`06_juego_${fotos}`); }
      continue;
    }
    // 3) sin jugada: robar y, si no sirve, pasar
    robos++;
    await clic("#bRobar"); await dormir(250);
    const r = await est();
    const nueva = r.yo[r.yo.length - 1];
    if (nueva && (nueva.t === "clave" || await amarradas(nueva.a, r.top))) continue;
    await clic("#bRobar"); await dormir(300);
  }
  console.log(`  · jugadas ${jugadas}, robos ${robos}, revanchas ${revanchas}`);
  ok(await ev(`document.querySelector('#final').classList.contains('on')`), "las 3 partidas ganadas: constancia");
  const c = await ev(`document.querySelector('#constancia').innerText`);
  ok(c.includes("Ana Prueba") && c.includes("de 9"), "constancia: " + c.split("\n").slice(2, 4).join(" | "));
  ok(provocado && unoOlvidado && comodin, "se probaron hilo falso, ¡UNO! olvidado y comodín");
  await foto("07_constancia");
  await ev("location.reload(); 1"); await dormir(900);
  ok((await ev(`document.querySelector('#bSeguir').textContent`)).includes("constancia"), "al recargar ofrece ver la constancia");
  console.log(errores.length ? "ERRORES:\n" + errores.join("\n") : "Sin excepciones en la consola.");
} catch (e) {
  console.log(e.message); await foto("zz_falla"); console.log(errores.join("\n")); process.exitCode = 1;
} finally { ws.close(); chrome.kill(); }
