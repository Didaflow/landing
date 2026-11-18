"""Design system tokens (#43, #60): contrasto AA nei due temi sui ruoli --df-* della v0.7.0, il ponte della
landing verso quei ruoli, e nessun valore sciolto nel CSS della landing."""
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "landing" / "assets" / "css"
# I valori vengono dai ruoli comuni della v0.7.0 (blocco «RUOLI COMUNI» di shared/design/css/tokens.css).
TOKENS = (ROOT / "shared" / "design" / "css" / "tokens.css").read_text(encoding="utf-8").split("RUOLI COMUNI", 1)[1]
PONTE = (CSS / "landing-tokens.css").read_text(encoding="utf-8")


def tema(nome):
    """Le variabili colore del blocco :root (chiaro) o :root[data-theme="dark"]."""
    sel = r":root \{" if nome == "light" else r':root\[data-theme="dark"\] \{'
    blocco = re.search(sel + r"(.*?)\n\}", TOKENS, re.S).group(1)
    return {k: v for k, v in re.findall(r"--df-([\w-]+): (#[0-9a-fA-F]{6});", blocco)}


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

    def test_ponte_dai_nomi_della_landing_ai_ruoli_df(self):
        """Ogni nome che la landing legge punta al ruolo --df-* omonimo: la v0.7.0 lascia i nomi di prima con
        i valori di prima (--ink è il blu dei dati), quindi senza il ponte la grafica cambierebbe."""
        for nome in ("ground", "surface", "surface-raised", "ink", "muted", "line", "border-strong", "accent",
                     "on-accent", "accent-strong", "ok", "warn", "error", "ochre", "ochre-soft", "moss",
                     "umber", "plum", "font-display", "font-sans", "elevation-1", "elevation-4",
                     "space-1", "space-7", "radius-sm", "radius-pill", "chart-1", "chart-5"):
            self.assertIn(f"  --{nome}: var(--df-{nome});", PONTE, nome)

    def test_nessun_file_satoshi_nel_repo_pubblico(self):
        """Il repo è pubblico e Satoshi (ITF FFL) non ci entra: lo fornisce il deploy (landing#60)."""
        self.assertIn("shared/design/fonts/satoshi/", (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines())
        self.assertIn("--exclude='*/fonts/satoshi/*'", (ROOT / "scripts" / "design.sh").read_text(encoding="utf-8"))
        try:
            tracciati = subprocess.run(["git", "ls-files", "shared/design/fonts/satoshi"], cwd=ROOT,
                                       capture_output=True, text=True, check=True).stdout.split()
        except (OSError, subprocess.CalledProcessError):
            self.skipTest("non è un clone git")
        self.assertEqual([], tracciati)

    def test_nessun_file_di_token_locale(self):
        self.assertFalse((CSS / "didaflow-tokens.css").exists())
        for pagina in (ROOT / "landing").rglob("*.html"):
            self.assertNotIn("didaflow-tokens", pagina.read_text(encoding="utf-8"), str(pagina))

    def test_nessun_colore_sciolto_nel_css_della_landing(self):
        for f in ("site.css", "editorial.css", "chapters.css"):
            testo = (CSS / f).read_text(encoding="utf-8")
            self.assertEqual([], re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", re.sub(r"/\*.*?\*/", "", testo, flags=re.S)), f)
        testo = (ROOT / "landing" / "commons" / "commons.css").read_text(encoding="utf-8")
        self.assertEqual([], re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", re.sub(r"/\*.*?\*/", "", testo, flags=re.S)), "commons.css")


if __name__ == "__main__":
    unittest.main()
