#!/usr/bin/env python3
"""Writes looks.css, the Medium and Dark backgrounds, from style.css, ui-improvements.css and workbook.css:
    pip install tinycss2 && python3 scripts/make-looks-css.py
Re-run it after changing colours in those files. A grown-up picks the look in Settings (kids-core CoreScheme).
  Medium (html[data-theme=medium]): a bright, deeper page colour per child theme with bolder bubbles; cards stay white.
  Dark   (html[data-theme=dark], or "Same as device" on a dark-mode device): a colourful night sky with stars.
    Light backgrounds and borders -> rich night colours (same hue, so tiles keep their family colour)
    dark text                     -> light text
Bright, saturated colours (category tiles, buttons) are left alone. Paper stays paper: the coloring picture,
the drawing pad, tracing and worksheets keep their white page. Hand-made parts are in the *_EXTRA blocks."""
import colorsys, os, re
import tinycss2

ROOT = os.path.join(os.path.dirname(__file__), '..')
SOURCES = ['style.css', 'ui-improvements.css', 'workbook.css']
PAPER = re.compile(r'\.pic(?![\w-])|color-wrap|\.cz-|dr-pad|canvas|trace|\.wb-|workbook|\.cb-c\b|\.cb-sw|\.dr-ink|swatch|pz-peek|#splash|\.splash')
BG_PROPS = {'background', 'background-color', 'background-image', '--bg'}
TEXT_PROPS = {'color', 'fill', '-webkit-text-fill-color'}
LINE_PROPS = {'border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right', 'outline', 'border-top-color', 'border-bottom-color'}
NAMED = {'white': '#ffffff', 'black': '#000000'}
HEX = re.compile(r'#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\bwhite\b')


def parse(c):
    c = NAMED.get(c.lower(), c).lstrip('#')
    if len(c) in (3, 4): c = ''.join(ch * 2 for ch in c)
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
    a = c[6:8] if len(c) == 8 else ''
    return r, g, b, a


def fmt(r, g, b, a):
    return '#' + ''.join(f'{round(max(0, min(1, v)) * 255):02x}' for v in (r, g, b)) + a


def to_dark_surface(c):
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l < 0.80: return None
    if (s <= 0.05 or l > 0.985) and not a: return 'var(--card)'                                         # white cards -> the skin's night card
    if s <= 0.05 or l > 0.985: return fmt(*colorsys.hls_to_rgb(0.69, 0.27 + (1 - l) * 0.2, 0.45), a)
    return fmt(*colorsys.hls_to_rgb(h, 0.25 + (1 - l) * 0.25, max(0.35, min(s, 0.6))), a)            # tints keep their colour


def to_night_bubble(c):                 # the big soft circles behind the page
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l < 0.6: return None
    return fmt(*colorsys.hls_to_rgb(h, 0.28, 0.62), a)


def to_medium_bubble(c):
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l < 0.6: return None
    return fmt(*colorsys.hls_to_rgb(h, 0.78, 0.8), a)


def to_medium_page(c):
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l < 0.8: return None
    return fmt(*colorsys.hls_to_rgb(h, 0.82, 0.6), a)


def to_light_text(c):
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l > 0.42: return None
    return fmt(*colorsys.hls_to_rgb(h, 0.90 - l * 0.35, min(s, 0.55)), a)


def to_dark_line(c):
    r, g, b, a = parse(c)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if l < 0.78: return None
    return fmt(*colorsys.hls_to_rgb(h, 0.30, min(s, 0.35)), a)


def swap(value, fn):
    changed = False
    def rep(m):
        nonlocal changed
        n = fn(m.group(0))
        if n is None: return m.group(0)
        changed = True; return n
    out = HEX.sub(rep, value)
    return out if changed else None


def rules(nodes, wrap=None):
    for n in nodes:
        if n.type == 'qualified-rule':
            yield wrap, tinycss2.serialize(n.prelude).strip(), n.content
        elif n.type == 'at-rule' and n.lower_at_keyword in ('media', 'supports') and n.content:
            inner = tinycss2.parse_rule_list(n.content, skip_comments=True, skip_whitespace=True)
            yield from rules(inner, f'@{n.lower_at_keyword} {tinycss2.serialize(n.prelude).strip()}')


PAGE_SEL = re.compile(r'^(body(\.[\w-]+)?|#[\w-]+)$')   # whole-page backgrounds (body, a screen)
BG_THEME = {   # page colour for each child theme: (medium, dark)
    'rainbow': ('#d6c9ff', '#1b1846'), 'unicorn': ('#ffc4e2', '#2c1442'), 'dino': ('#c2eba6', '#0f2b1f'), 'space': ('#c0c9ff', '#0d1142'),
    'ocean': ('#a9e6f5', '#06293b'), 'sports': ('#b5ecc1', '#0c2a1d'), 'cars': ('#cdd6ea', '#191d3a'), 'jungle': ('#cbe99c', '#13290e'),
}


def theme_of(sel):
    m = re.match(r'^body\.theme-([\w-]+)$', sel)
    return m.group(1) if m else None


def medium_rules():
    out = []
    for src in SOURCES:
        sheet = tinycss2.parse_stylesheet(open(os.path.join(ROOT, src)).read(), skip_comments=True, skip_whitespace=True)
        for wrap, sel, content in rules(sheet):
            sels = [x.strip() for x in sel.split(',') if PAGE_SEL.match(x.strip())]
            if not sels: continue
            decls = []
            for d in tinycss2.parse_declaration_list(content, skip_comments=True, skip_whitespace=True):
                if d.type != 'declaration': continue
                v = tinycss2.serialize(d.value).strip(); p = d.lower_name
                if p == '--bg' and theme_of(sels[0]) in BG_THEME: n = BG_THEME[theme_of(sels[0])][0]
                elif p in BG_PROPS and 'gradient' in v and sels[0].startswith('body'): n = swap(v, to_medium_bubble)
                elif p in BG_PROPS: n = swap(v, to_medium_page)
                else: n = None
                if n: decls.append(f'{p}: {n}')
            if decls: out.append((wrap, sels, '; '.join(decls)))
    return out


def dark_rules():
    out = []
    for src in SOURCES:
        sheet = tinycss2.parse_stylesheet(open(os.path.join(ROOT, src)).read(), skip_comments=True, skip_whitespace=True)
        for wrap, sel, content in rules(sheet):
            if sel.startswith(('from', 'to')) or re.match(r'^[\d.]+%', sel): continue   # keyframes
            sels = [s.strip() for s in sel.split(',') if s.strip() and not PAPER.search(s)]
            if not sels: continue
            decls = []
            for d in tinycss2.parse_declaration_list(content, skip_comments=True, skip_whitespace=True):
                if d.type != 'declaration': continue
                v = tinycss2.serialize(d.value).strip(); p = d.lower_name
                body = sels[0].startswith('body')
                if p == '--bg' and theme_of(sels[0]) in BG_THEME: n = BG_THEME[theme_of(sels[0])][1]
                elif body and p in BG_PROPS and 'gradient' in v: n = swap(v, to_night_bubble)
                else: n = (swap(v, to_dark_surface) if p in BG_PROPS else swap(v, to_light_text) if p in TEXT_PROPS
                     else swap(v, to_dark_line) if p in LINE_PROPS else None)
                if n: decls.append(f'{p}: {n}' + (' !important' if d.important else ''))
            if decls: out.append((wrap, sels, '; '.join(decls)))
    return out


DARK_EXTRA = """
body { background-color: var(--bg); color: #f4f1ff; }
body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; opacity: .75; background-image: radial-gradient(1.6px 1.6px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1.2px 1.2px at 32% 62%, #ffe066 50%, transparent 51%), radial-gradient(2px 2px at 58% 12%, #fff 50%, transparent 51%), radial-gradient(1.3px 1.3px at 76% 48%, #a5d8ff 50%, transparent 51%), radial-gradient(1.8px 1.8px at 88% 82%, #fff 50%, transparent 51%), radial-gradient(1.2px 1.2px at 44% 88%, #ffc9e8 50%, transparent 51%); background-size: 260px 260px; }
.quest-go { background: #ffd43b; color: #3d2a00; }
.rec-section h2, .catalog-section h2 { color: #ffe27a; }
input, select, textarea { background: var(--theme-soft); color: #f4f1ff; border-color: var(--theme-line); }
.pic, .dr-pad, .color-wrap svg { background: #fff; }
.dr-choose .ref-svg { background: #fff; border-radius: 12px; }
"""


def scoped(sel_list, scope):
    out = []
    for s in sel_list:
        if s.startswith(':root'): out.append(scope + s[5:])
        elif s.startswith('html'): out.append(scope + s[4:])
        else: out.append(f'{scope} {s}')
    return ', '.join(out)


MEDIUM_EXTRA = """
:root { --bg: #d6c9ff; --soft: #564a72; }   /* each mascot skin sets its own (kids-core theme pack) */
body { background-color: var(--bg); }
"""


def block(scope, made=None, extra=None):
    made = dark_rules() if made is None else made
    extra = DARK_EXTRA if extra is None else extra
    lines = []
    for wrap, sels, decls in made:
        r = f'{scoped(sels, scope)} {{ {decls} }}'
        lines.append(f'{wrap} {{ {r} }}' if wrap else r)
    for raw in extra.strip().splitlines():
        sel, body = raw.split('{', 1)
        lines.append(f'{scoped([s.strip() for s in sel.split(",")], scope)} {{{body}')
    return '\n'.join(lines)


if __name__ == '__main__':
    css = ('/* Medium and Dark looks. Made by scripts/make-looks-css.py from style.css, ui-improvements.css and workbook.css: do not edit by hand. */\n'
           + block(':root[data-theme="medium"]', medium_rules(), MEDIUM_EXTRA) + '\n'
           + block(':root[data-theme="dark"]') + '\n@media (prefers-color-scheme: dark) {\n'
           + block(':root:not([data-theme])') + '\n}\n')
    open(os.path.join(ROOT, 'looks.css'), 'w').write(css)
    print('looks.css', len(css) // 1024, 'KB')
