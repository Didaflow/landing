"""Design system tokens (#43): contrasto AA nei due temi e nessun valore sciolto nel CSS della landing."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "landing" / "assets" / "css"
TOKENS = (CSS / "didaflow-tokens.css").read_text(encoding="utf-8")


def tema(nome):
    """Le variabili colore del blocco :root (chiaro) o :root[data-theme="dark"]."""
    sel = r":root \{" if nome == "light" else r':root\[data-theme="dark"\] \{'
    blocco = re.search(sel + r"(.*?)\n\}", TOKENS, re.S).group(1)
    return dict(re.findall(r"--([\w-]+): (#[0-9a-fA-F]{6});", blocco))


def luminanza(hex_):
    c = [int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrasto(a, b):
    la, lb = sorted((luminanza(a), luminanza(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


# (primo piano, sfondo, minimo)
COPPIE = [
    ("ink", "ground", 7), ("ink", "surface", 7), ("muted", "ground", 4.5), ("muted", "surface", 4.5),
    ("accent-strong", "ground", 4.5), ("accent-strong", "surface", 4.5),
    ("on-accent", "accent", 4.5), ("border-strong", "ground", 3), ("border-strong", "surface", 3),
    ("ok", "ground", 4.5), ("warn", "ground", 4.5), ("error", "ground", 4.5),
    # fascia scura della landing: sezioni «ink» e blocco di invito
    ("accent-strong", "surface-raised", 4.5), ("ink", "surface-raised", 7), ("muted", "surface-raised", 4.5),
]


class Token(unittest.TestCase):
    def test_contrasto_aa_in_entrambi_i_temi(self):
        for nome in ("light", "dark"):
            t = tema(nome)
            for fg, bg, minimo in COPPIE:
                if nome == "light" and bg == "surface-raised":
                    continue  # nel tema chiaro la fascia usa ink come sfondo: coppia sotto
                self.assertGreaterEqual(contrasto(t[fg], t[bg]), minimo, f"{nome}: {fg} su {bg}")

    def test_fascia_scura_nel_tema_chiaro(self):
        t = tema("light")
        for fg, minimo in (("ground", 7), ("accent", 4.5)):
            self.assertGreaterEqual(contrasto(t[fg], t["ink"]), minimo, f"light: {fg} su ink (fascia)")

    def test_nessun_colore_sciolto_nel_css_della_landing(self):
        for f in ("site.css", "editorial.css", "chapters.css"):
            testo = (CSS / f).read_text(encoding="utf-8")
            self.assertEqual([], re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", re.sub(r"/\*.*?\*/", "", testo, flags=re.S)), f)
        testo = (ROOT / "landing" / "commons" / "commons.css").read_text(encoding="utf-8")
        self.assertEqual([], re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", re.sub(r"/\*.*?\*/", "", testo, flags=re.S)), "commons.css")


if __name__ == "__main__":
    unittest.main()
