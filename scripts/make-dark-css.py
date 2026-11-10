#!/usr/bin/env python3
"""Writes dark.css, the dark background look, from style.css, ui-improvements.css and workbook.css:
    pip install tinycss2 && python3 scripts/make-dark-css.py
Re-run it after changing colours in those files. For every rule it keeps only the colour parts and turns
  light backgrounds and borders  -> deep night colours (same hue, so tiles keep their family colour)
  dark text                      -> light text
Bright, saturated colours (category tiles, buttons) are left alone. Paper stays paper: the coloring picture,
the drawing pad, tracing and worksheets keep their white page. Hand-made fixes go in DARK_EXTRA at the bottom.
The rules apply when a grown-up picks Dark (html[data-theme=dark]) or picks "Same as the device" and the
device is in dark mode (no data-theme)."""
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
    l2 = 0.12 + (1 - l) * 0.5            # white -> #211d33-ish, pale tints a little lighter
    return fmt(*colorsys.hls_to_rgb(h, l2, min(s, 0.2) if s > 0.05 else 0.18), a) if s > 0.05 else fmt(*colorsys.hls_to_rgb(0.70, l2, 0.22), a)


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
                n = (swap(v, to_dark_surface) if p in BG_PROPS else swap(v, to_light_text) if p in TEXT_PROPS
                     else swap(v, to_dark_line) if p in LINE_PROPS else None)
                if n: decls.append(f'{p}: {n}' + (' !important' if d.important else ''))
            if decls: out.append((wrap, sels, '; '.join(decls)))
    return out


DARK_EXTRA = """
body { background-color: var(--bg); color: #ece8f7; }
input, select, textarea { background: #2a2540; color: #ece8f7; border-color: #4a4266; }
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


def block(scope):
    lines = []
    for wrap, sels, decls in dark_rules():
        r = f'{scoped(sels, scope)} {{ {decls} }}'
        lines.append(f'{wrap} {{ {r} }}' if wrap else r)
    for raw in DARK_EXTRA.strip().splitlines():
        sel, body = raw.split('{', 1)
        lines.append(f'{scoped([s.strip() for s in sel.split(",")], scope)} {{{body}')
    return '\n'.join(lines)


if __name__ == '__main__':
    css = ('/* Dark background look. Made by scripts/make-dark-css.py from style.css, ui-improvements.css and workbook.css: do not edit by hand. */\n'
           + block(':root[data-theme="dark"]') + '\n@media (prefers-color-scheme: dark) {\n'
           + block(':root:not([data-theme])') + '\n}\n')
    open(os.path.join(ROOT, 'dark.css'), 'w').write(css)
    print('dark.css', len(css) // 1024, 'KB')
