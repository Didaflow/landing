"""Internal references of the static site must resolve to files that exist.

Stdlib only. Uses the production route map: / -> landing/, /_assets/ -> shared/design/.
Run: python3 -m unittest discover -s tests
"""
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
LANDING = ROOT / "landing"
ASSETS = ROOT / "shared" / "design"

# Attributes that point to a file. Absolute and mailto/tel/data URLs are not internal.
URL_ATTRS = {"href", "src", "poster"}
# Literal absolute paths in href="..." / src="..." inside site-chrome.js templates. Paths built at runtime
# (template interpolation) are not checked: href() in that file only varies fragments of the same pages.
IN_JS = re.compile(r"""\b(?:href|src)\s*=\s*["'](/[^"'$`{}]*)["']""")


def resolve(url: str, page: Path) -> Path | None:
    """Map an internal URL to the file it is served from, or None if it is not internal."""
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not (parts.path or parts.query):
        return None  # external, mailto:, or a bare #fragment
    path = unquote(parts.path)
    if not path:
        return None
    if not path.startswith("/"):
        path = "/" + str((page.parent.relative_to(LANDING) / path).as_posix())
    base, rel = (ASSETS, path[len("/_assets"):]) if path.startswith("/_assets/") else (LANDING, path)
    target = (base / rel.lstrip("/")).resolve()
    if target.is_dir() or rel.endswith("/"):
        target = (target / "index.html").resolve()  # resolve again: index.html may be a symlink
    # Like the web server, never serve outside the root that the route maps to.
    return target if base.resolve() in target.parents else base / "__fuori_dalla_radice__"


class Refs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in URL_ATTRS and value:
                self.urls.append(value)


class RiferimentiInterni(unittest.TestCase):
    def check(self, page: Path, urls: list[str]):
        missing = []
        for url in urls:
            target = resolve(url, page)
            if target is None:
                continue
            if not target.is_file():
                missing.append(url)
        self.assertEqual([], missing, f"{page.relative_to(ROOT)}: riferimenti senza file")

    def test_pagine_html(self):
        pages = sorted(LANDING.rglob("*.html"))
        self.assertTrue(pages, "nessuna pagina trovata")
        for page in pages:
            parser = Refs()
            parser.feed(page.read_text(encoding="utf-8"))
            self.check(page, parser.urls)

    def test_percorsi_letterali_in_site_chrome(self):
        # Header and footer are built by site-chrome.js, so its literal paths count too.
        js = LANDING / "assets" / "js" / "site-chrome.js"
        self.check(js, IN_JS.findall(js.read_text(encoding="utf-8")))

    def test_il_resolver_vede_i_file_mancanti(self):
        page = LANDING / "index.html"
        self.assertIsNone(resolve("https://example.com/x", page))
        self.assertIsNone(resolve("#contact", page))
        self.assertTrue(resolve("/methodology/", page).is_file())
        self.assertFalse(resolve("/non-esiste/", page).is_file())
        self.assertFalse(resolve("/_assets/non-esiste.svg", page).is_file())
        self.assertFalse(resolve("/../tests/test_sito.py", page).is_file())  # outside the served root


if __name__ == "__main__":
    unittest.main()
