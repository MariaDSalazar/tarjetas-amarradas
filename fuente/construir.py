# Arma index.html desde juego.src.html, con los stickers incrustados. Uso: python fuente/construir.py
import pathlib

F = pathlib.Path(__file__).resolve().parent
j = (F / "juego.src.html").read_text(encoding="utf-8")
j = j.replace("__STICKERS__", (F / "stickers.json").read_text(encoding="utf-8").strip())
assert "__STICKERS__" not in j
(F.parent / "index.html").write_text(j, encoding="utf-8")
print("OK index.html", len(j.encode("utf-8")), "bytes")
