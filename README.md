# Tarjetas Amarradas

Juego de cartas al estilo UNO para practicar dependencias funcionales, contra la Máquina.

Cada carta es un dato de una tabla (Cédula, Nombre, ID_Pedido…). Sobre la carta de la mesa se puede tirar el mismo dato o uno amarrado por un hilo directo, es decir, por una dependencia funcional entre los dos. El color de la carta es su tabla y las claves van subrayadas.

## Reglas

- **+2:** la Máquina roba 2 cartas y pierde el turno.
- **SALTA:** la Máquina pierde el turno.
- **CLAVE:** va sobre cualquier carta y el jugador elige qué clave queda en la mesa.
- Sin jugada posible, se roba una carta.
- Con 2 cartas en la mano hay que pulsar `UNO` antes de tirar la penúltima.
- Gana quien se quede sin cartas.

Un hilo falso no pasa: el juego explica por qué esas dos cartas no están amarradas.

## Partidas

| Partida | Caso | Tablas |
|---|---|---|
| 1 | El cliente y su pedido | Cliente, Pedido |
| 2 | El pedido completo | Cliente, Pedido, Producto, Detalle |
| 3 | Reto: la veterinaria | Cliente, Mascota, Vacuna, Aplicación |

Cada partida ganada da de 1 a 3 estrellas según los errores (hilos falsos u olvidos de avisar `UNO`). Si gana la Máquina, hay revancha con cartas nuevas. Al ganar las tres partidas se genera una constancia imprimible. Solo se pide nombre y apellido; el avance se guarda en el mismo navegador.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | El juego listo para abrir (se genera, no se edita a mano) |
| `fuente/juego.src.html` | Código del juego: reglas, Máquina, partidas y pantallas |
| `fuente/construir.py` | Arma `index.html` con los stickers incrustados |
| `pruebas/prueba.mjs` | Juega las tres partidas en Chrome sin interfaz, en modo computador o celular |
| `pruebas/simulacion.mjs` | Simula partidas para medir su duración |

## Construir y probar

```
python fuente/construir.py
node pruebas/prueba.mjs pc
node pruebas/prueba.mjs cel
```

El juego es un solo archivo: basta con abrir `index.html` en el navegador.
