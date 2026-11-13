#!/usr/bin/env python3
"""Builds data/coloring-themes.json: flag and holiday coloring pages (self-authored SVG, 200 x 200).

Each page: id, name, group, svg (colourable shapes have class "r"; the first is the background, class "r bg";
drawn details that are not coloured sit in <g class="ln"> or <g class="deco">), and orig: the real colour of every
shape after the background, in order (the 👀 peek button and the puzzles use it).
Run:  python3 scripts/make-coloring-themes.py
"""
import json, math, os

BG = '<rect class="r bg" x="0" y="0" width="200" height="200"/>'
INK = '#2b2140'

def star(cx, cy, R, r, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + 180 / n * i); rr = r if i % 2 else R
        pts.append(f'{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
    return ' '.join(pts)

def R(shape, color):          # one colourable shape and its real colour
    return (shape, color)

def page(pid, name, group, shapes, lines='', deco=''):
    svg = BG + ''.join(s for s, _ in shapes)
    if deco: svg += f'<g class="deco">{deco}</g>'
    if lines: svg += f'<g class="ln">{lines}</g>'
    return {'id': pid, 'name': name, 'group': group, 'svg': svg, 'orig': [c for _, c in shapes]}

def mirror(d):                # mirror a list of (x, y) points left to right
    return [(200 - x, y) for x, y in d]

def poly(pts): return ' '.join(f'{x:g},{y:g}' for x, y in pts)

# ---------------------------------------------------------------- flags
FX, FW = 10, 180              # every flag is 180 wide, centred on the page

def frame(y, h):              # a thin outline so white parts show against a white page
    return f'<rect x="{FX}" y="{y}" width="{FW}" height="{h}" fill="none" stroke="{INK}" stroke-width="2.5"/>'

def flag_us():
    h, y0 = 104, 48; sh = h / 13
    shapes = [R(f'<rect class="r" x="{FX}" y="{y0 + i * sh:g}" width="{FW}" height="{sh:g}"/>', '#b22234' if i % 2 == 0 else '#ffffff') for i in range(13)]
    cw, ch = 72, sh * 7
    shapes.append(R(f'<rect class="r" x="{FX}" y="{y0}" width="{cw}" height="{ch:g}"/>', '#3c3b6e'))
    stars = ''
    for row in range(9):
        n = 6 if row % 2 == 0 else 5
        for i in range(n):
            x = FX + cw / 12 * (1 + 2 * i + (0 if row % 2 == 0 else 1)); yy = y0 + ch / 10 * (row + 1)
            stars += f'<polygon points="{star(x, yy, 2.6, 1.05)}" fill="#fff"/>'
    return page('flag-us', 'United States 🇺🇸', 'flags', shapes, deco=stars + frame(y0, h))

MAPLE = [(0, -50), (7, -37), (16, -41), (12, -15), (24, -26), (27, -19), (40, -22), (36, -8), (43, -4), (25, 12), (28, 21), (3, 18), (3, 40)]
def flag_ca():
    h, y0 = 90, 55
    cx, cy, s = 100, y0 + 45, 0.82
    half = [(cx + x * s, cy + y * s) for x, y in MAPLE]
    leaf = half + [(2 * cx - x, y) for x, y in reversed(half)]
    shapes = [
        R(f'<rect class="r" x="{FX}" y="{y0}" width="45" height="{h}"/>', '#d52b1e'),
        R(f'<rect class="r" x="{FX + 45}" y="{y0}" width="90" height="{h}"/>', '#ffffff'),
        R(f'<rect class="r" x="{FX + 135}" y="{y0}" width="45" height="{h}"/>', '#d52b1e'),
        R(f'<polygon class="r" points="{poly(leaf)}"/>', '#d52b1e'),
    ]
    return page('flag-ca', 'Canada 🇨🇦', 'flags', shapes, deco=frame(y0, h))

def flag_in():
    h, y0 = 120, 40
    shapes = [R(f'<rect class="r" x="{FX}" y="{y0 + i * 40}" width="{FW}" height="40"/>', c) for i, c in enumerate(['#ff9933', '#ffffff', '#138808'])]
    cx, cy, r = 100, y0 + 60, 17
    wheel = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#000080" stroke-width="2.5"/><circle cx="{cx}" cy="{cy}" r="3" fill="#000080"/>'
    wheel += ''.join(f'<line x1="{cx}" y1="{cy}" x2="{cx + r * math.cos(math.radians(a)):.1f}" y2="{cy + r * math.sin(math.radians(a)):.1f}" stroke="#000080" stroke-width="1"/>' for a in range(0, 360, 15))
    return page('flag-in', 'India 🇮🇳', 'flags', shapes, deco=wheel + frame(y0, h))

def union_jack(x0, y0, w, h):
    """The Union Jack in a box. Returns shapes: blue field, 2 white diagonals, 4 red diagonal pieces, white cross, red cross."""
    L = math.hypot(w, h); ux, uy = w / L, h / L               # along the top-left to bottom-right diagonal
    cx, cy = x0 + w / 2, y0 + h / 2
    clip = f'jk{int(x0)}{int(y0)}{int(w)}'
    def band(dx, dy, a, b, t0, t1):
        # a strip along direction (dx, dy) from the centre, between perpendicular offsets a..b, from t0 to t1 along the arm
        px, py = -dy, dx
        pts = [(cx + dx * t0 + px * a, cy + dy * t0 + py * a), (cx + dx * t1 + px * a, cy + dy * t1 + py * a),
               (cx + dx * t1 + px * b, cy + dy * t1 + py * b), (cx + dx * t0 + px * b, cy + dy * t0 + py * b)]
        return ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    ww = h / 5 / 2                                             # half the width of a white diagonal (1/5 of the height)
    out = [R(f'<rect class="r" x="{x0}" y="{y0}" width="{w}" height="{h}"/>', '#012169')]
    g = f'<clipPath id="{clip}"><rect x="{x0}" y="{y0}" width="{w}" height="{h}"/></clipPath>'
    for dx, dy in ((ux, uy), (ux, -uy)):
        out.append(R(f'<polygon class="r" clip-path="url(#{clip})" points="{band(dx, dy, -ww, ww, -L, L)}"/>', '#ffffff'))
    # red diagonals: a third of the white width, each shifted to the anticlockwise side of its arm
    rw = h / 15
    for dx, dy in ((ux, uy), (-ux, -uy), (ux, -uy), (-ux, uy)):
        out.append(R(f'<polygon class="r" clip-path="url(#{clip})" points="{band(dx, dy, -rw, 0, 0, L)}"/>', '#c8102e'))
    def cross(t):
        return (f'M{x0} {cy - t:g}H{cx - t:g}V{y0}H{cx + t:g}V{cy - t:g}H{x0 + w}V{cy + t:g}H{cx + t:g}V{y0 + h}H{cx - t:g}V{cy + t:g}H{x0}Z')
    out.append(R(f'<path class="r" d="{cross(h / 6)}"/>', '#ffffff'))
    out.append(R(f'<path class="r" d="{cross(h / 10)}"/>', '#c8102e'))
    return g, out

def flag_uk():
    h, y0 = 90, 55
    g, shapes = union_jack(FX, y0, FW, h)
    shapes[0] = (g + shapes[0][0], shapes[0][1])
    return page('flag-uk', 'United Kingdom 🇬🇧', 'flags', shapes, deco=frame(y0, h))

def flag_au():
    h, y0 = 90, 55
    field = R(f'<rect class="r" x="{FX}" y="{y0}" width="{FW}" height="{h}"/>', '#012169')
    g, jack = union_jack(FX, y0, FW / 2, h / 2)
    jack[0] = (g + jack[0][0], jack[0][1])
    S = lambda fx, fy, d, n=7: R(f'<polygon class="r" points="{star(FX + fx, y0 + fy, d / 2, d / 2 * (4 / 9 if n == 7 else 0.4), n)}"/>', '#ffffff')
    # the Southern Cross is drawn a little larger than on the real flag so small fingers can colour each star
    stars = [S(45, 67.5, 30), S(135, 75, 19), S(110, 39.4, 19), S(135, 15, 19), S(158, 31, 19), S(146, 52, 12, 5)]
    return page('flag-au', 'Australia 🇦🇺', 'flags', [field] + jack + stars, deco=frame(y0, h))

# ---------------------------------------------------------------- Christmas
def santa():
    shapes = [
        R('<path class="r" d="M46 84Q58 16 118 18Q150 20 166 60L154 84Z"/>', '#e03131'),
        R('<ellipse class="r" cx="100" cy="112" rx="50" ry="34"/>', '#ffd8b5'),
        R('<path class="r" d="M48 108Q40 170 100 190Q160 170 152 108Q140 134 100 134Q60 134 48 108Z"/>', '#ffffff'),
        R('<rect class="r" x="38" y="76" width="124" height="20" rx="10"/>', '#ffffff'),
        R('<path class="r" d="M100 128Q84 116 64 128Q84 144 100 134Q116 144 136 128Q116 116 100 128Z"/>', '#f1f3f5'),
        R('<circle class="r" cx="100" cy="120" r="8"/>', '#ff8787'),
        R('<circle class="r" cx="168" cy="62" r="13"/>', '#ffffff'),
    ]
    lines = f'<circle cx="82" cy="106" r="4" fill="{INK}"/><circle cx="118" cy="106" r="4" fill="{INK}"/><path d="M92 146q8 6 16 0" fill="none"/>'
    return page('xmas-santa', 'Santa 🎅', 'christmas', shapes, lines)

def reindeer():
    antler = [(72, 64), (58, 46), (56, 20), (66, 22), (66, 36), (74, 46), (76, 30), (86, 26), (88, 36), (82, 44), (84, 62)]
    shapes = [
        R(f'<polygon class="r" points="{poly(antler)}"/>', '#8d5a2b'),
        R(f'<polygon class="r" points="{poly(mirror(antler))}"/>', '#8d5a2b'),
        R('<ellipse class="r" cx="50" cy="88" rx="18" ry="10" transform="rotate(-25 50 88)"/>', '#b9774a'),
        R('<ellipse class="r" cx="150" cy="88" rx="18" ry="10" transform="rotate(25 150 88)"/>', '#b9774a'),
        R('<ellipse class="r" cx="100" cy="110" rx="46" ry="52"/>', '#b9774a'),
        R('<ellipse class="r" cx="100" cy="140" rx="30" ry="24"/>', '#e8c39e'),
        R('<circle class="r" cx="100" cy="128" r="12"/>', '#e03131'),
        R('<rect class="r" x="60" y="164" width="80" height="18" rx="9"/>', '#2f9e44'),
    ]
    lines = f'<circle cx="82" cy="100" r="5" fill="{INK}"/><circle cx="118" cy="100" r="5" fill="{INK}"/><path d="M88 150q12 10 24 0" fill="none"/>'
    return page('xmas-reindeer', 'Reindeer 🦌', 'christmas', shapes, lines)

def stocking():
    shapes = [
        R('<path class="r" d="M70 40L130 40L130 120Q130 136 146 142Q176 152 172 172Q168 190 140 190L96 190Q70 190 70 160Z"/>', '#e03131'),
        R('<rect class="r" x="70" y="72" width="60" height="14"/>', '#ffffff'),
        R('<rect class="r" x="70" y="100" width="60" height="14"/>', '#2f9e44'),
        R('<path class="r" d="M70 150L70 160Q70 190 96 190L104 190Q84 178 84 150Z"/>', '#2f9e44'),
        R('<path class="r" d="M150 144Q176 152 172 172Q168 190 140 190Q152 168 150 144Z"/>', '#2f9e44'),
        R('<rect class="r" x="62" y="26" width="76" height="30" rx="8"/>', '#ffffff'),
        R(f'<polygon class="r" points="{star(40, 150, 16, 7)}"/>', '#fcc419'),
        R(f'<polygon class="r" points="{star(166, 60, 13, 5.5)}"/>', '#fcc419'),
    ]
    return page('xmas-stocking', 'Stocking 🧦', 'christmas', shapes, '<path d="M66 30q-18 -12 -6 -24" fill="none"/>')

def gingerbread():
    b = '#c68642'
    shapes = [
        R('<rect class="r" x="28" y="84" width="56" height="22" rx="11"/>', b), R('<rect class="r" x="116" y="84" width="56" height="22" rx="11"/>', b),
        R('<rect class="r" x="70" y="126" width="24" height="58" rx="12"/>', b), R('<rect class="r" x="106" y="126" width="24" height="58" rx="12"/>', b),
        R('<rect class="r" x="72" y="76" width="56" height="66" rx="20"/>', b), R('<circle class="r" cx="100" cy="50" r="30"/>', b),
        R('<circle class="r" cx="100" cy="104" r="6"/>', '#e03131'), R('<circle class="r" cx="100" cy="124" r="6"/>', '#2f9e44'),
        R('<polygon class="r" points="84,76 100,83 116,76 116,92 100,85 84,92"/>', '#e03131'),
    ]
    lines = (f'<circle cx="90" cy="44" r="3.5" fill="{INK}"/><circle cx="110" cy="44" r="3.5" fill="{INK}"/><path d="M88 58q12 10 24 0" fill="none"/>'
             '<path d="M34 95q4-6 8 0t8 0M150 95q4-6 8 0t8 0M74 172q4-6 8 0t8 0M110 172q4-6 8 0t8 0" fill="none"/>')
    return page('xmas-gingerbread', 'Gingerbread Man 🍪', 'christmas', shapes, lines)

# ---------------------------------------------------------------- Thanksgiving
def turkey():
    cols = ['#c92a2a', '#e8590c', '#f08c00', '#fcc419', '#f08c00', '#e8590c', '#c92a2a']
    shapes = []
    for i, a in enumerate(range(-75, 76, 25)):
        r = math.radians(a - 90); x = 100 + 56 * math.cos(r); y = 124 + 56 * math.sin(r)
        shapes.append(R(f'<ellipse class="r" cx="{x:.1f}" cy="{y:.1f}" rx="15" ry="44" transform="rotate({a} {x:.1f} {y:.1f})"/>', cols[i]))
    foot = [(86, 168), (78, 190), (86, 185), (90, 192), (94, 185), (100, 190), (94, 168)]
    shapes += [
        R(f'<polygon class="r" points="{poly(foot)}"/>', '#f08c00'), R(f'<polygon class="r" points="{poly(mirror(foot))}"/>', '#f08c00'),
        R('<ellipse class="r" cx="100" cy="138" rx="40" ry="36"/>', '#8d5a2b'),
        R('<circle class="r" cx="100" cy="92" r="21"/>', '#a9713d'),
        R('<polygon class="r" points="92,94 108,94 100,108"/>', '#fab005'),
        R('<path class="r" d="M105 100q9 4 5 18q-8 0 -8 -11z"/>', '#e03131'),
    ]
    lines = f'<circle cx="92" cy="86" r="3.5" fill="{INK}"/><circle cx="108" cy="86" r="3.5" fill="{INK}"/>'
    return page('thanks-turkey', 'Turkey 🦃', 'thanksgiving', shapes, lines)

def pie():
    shapes = [
        R('<ellipse class="r" cx="100" cy="152" rx="92" ry="22"/>', '#dee2e6'),
        R('<path class="r" d="M26 112L174 112L152 152L48 152Z"/>', '#e0a458'),
        R('<ellipse class="r" cx="100" cy="110" rx="80" ry="24"/>', '#f0c27b'),
        R('<ellipse class="r" cx="100" cy="110" rx="64" ry="16"/>', '#d9480f'),
        R('<path class="r" d="M82 108Q76 90 100 84Q124 90 118 108Q100 116 82 108Z"/>', '#ffffff'),
    ]
    lines = '<path d="M70 66q-8 -12 0 -24M100 58q-8 -12 0 -24M130 66q-8 -12 0 -24" fill="none"/><path d="M92 98q8 -8 16 0" fill="none"/>'
    return page('thanks-pie', 'Pumpkin Pie 🥧', 'thanksgiving', shapes, lines)

def pilgrim_hat():
    leaf = lambda cx, cy, a: f'<path class="r" transform="rotate({a} {cx} {cy})" d="M{cx} {cy - 18}q14 6 10 22q-4 10 -10 14q-6 -4 -10 -14q-4 -16 10 -22z"/>'
    shapes = [
        R('<ellipse class="r" cx="100" cy="150" rx="86" ry="18"/>', '#343a40'),
        R('<path class="r" d="M62 150L70 52L130 52L138 150Z"/>', '#343a40'),
        R('<path class="r" d="M64 124L136 124L138 150L62 150Z"/>', '#8d5a2b'),
        R('<rect class="r" x="84" y="120" width="32" height="34" rx="3"/>', '#fcc419'),
        R('<rect class="r" x="92" y="128" width="16" height="18"/>', '#343a40'),
        R(leaf(34, 44, -25), '#e8590c'), R(leaf(168, 40, 20), '#f08c00'), R(leaf(172, 182, 35), '#c92a2a'),
    ]
    return page('thanks-hat', 'Pilgrim Hat 🎩', 'thanksgiving', shapes)

def corn():
    shapes = [
        R('<path class="r" d="M100 20Q130 60 124 150Q118 180 100 184Q82 180 76 150Q70 60 100 20Z"/>', '#fcc419'),
        R('<path class="r" d="M76 186Q30 150 44 78Q66 110 82 170Q88 184 76 186Z"/>', '#74b816'),
        R('<path class="r" d="M124 186Q170 150 156 78Q134 110 118 170Q112 184 124 186Z"/>', '#74b816'),
        R('<path class="r" d="M84 190Q100 150 116 190Q100 198 84 190Z"/>', '#a9e34b'),
    ]
    rows = ''.join(f'M{80 + (y - 40) * -0.05:.0f} {y}q20 8 {40 + (y - 40) * 0.1:.0f} 0' for y in range(56, 150, 16))
    lines = f'<path d="{rows}M90 34V160M100 24V168M110 34V160" fill="none"/>'
    return page('thanks-corn', 'Harvest Corn 🌽', 'thanksgiving', shapes, lines)

# ---------------------------------------------------------------- Halloween
def jack():
    o = ['#f76707', '#f76707', '#fd7e14', '#fd7e14', '#ff922b']
    lobes = [(58, 34, 56), (142, 34, 56), (80, 34, 62), (120, 34, 62), (100, 30, 66)]
    shapes = [R('<path class="r" d="M92 50Q92 28 108 22L116 30Q106 36 108 52Z"/>', '#2f9e44')]
    shapes += [R(f'<ellipse class="r" cx="{x}" cy="120" rx="{rx}" ry="{ry}"/>', o[i]) for i, (x, rx, ry) in enumerate(lobes)]
    y = '#ffd43b'
    shapes += [
        R('<polygon class="r" points="64,106 88,106 76,84"/>', y), R('<polygon class="r" points="112,106 136,106 124,84"/>', y),
        R('<polygon class="r" points="93,124 107,124 100,112"/>', y),
        R('<path class="r" d="M60 134L74 142L82 134L91 144L100 134L109 144L118 134L126 142L140 134Q100 180 60 134Z"/>', y),
    ]
    return page('hallo-jack', "Jack-o'-Lantern 🎃", 'halloween', shapes)

def ghost():
    shapes = [
        R('<circle class="r" cx="160" cy="40" r="22"/>', '#ffe066'),
        R('<path class="r" d="M46 120Q46 36 96 36Q146 36 146 120L146 180Q134 168 121 180Q108 192 96 180Q84 168 71 180Q58 192 46 180Z"/>', '#ffffff'),
        R('<polygon class="r" points="80,128 96,135 112,128 112,144 96,137 80,144"/>', '#e64980'),
        R('<path class="r" d="M150 150L190 150L184 186L156 186Z"/>', '#f76707'),
        R(f'<polygon class="r" points="{star(30, 36, 12, 5)}"/>', '#ffe066'),
    ]
    lines = (f'<ellipse cx="80" cy="90" rx="6" ry="9" fill="{INK}"/><ellipse cx="112" cy="90" rx="6" ry="9" fill="{INK}"/><ellipse cx="96" cy="114" rx="8" ry="6" fill="{INK}"/>'
             '<path d="M152 150Q170 122 188 150" fill="none"/><path d="M162 164l4 6l4 -6M172 164l4 6l4 -6M162 176h18" fill="none"/>')
    return page('hallo-ghost', 'Friendly Ghost 👻', 'halloween', shapes, lines)

def cat():
    k = '#343a40'
    shapes = [
        R('<circle class="r" cx="100" cy="96" r="80"/>', '#ffe066'),
        R('<rect class="r" x="0" y="182" width="200" height="18"/>', '#5c3b1e'),
        R('<path class="r" d="M128 168Q168 170 162 130Q158 112 170 102L178 110Q170 120 174 134Q182 184 128 184Z"/>', k),
        R('<ellipse class="r" cx="100" cy="148" rx="34" ry="38"/>', k),
        R('<polygon class="r" points="74,86 78,54 98,74"/>', k), R('<polygon class="r" points="126,86 122,54 102,74"/>', k),
        R('<circle class="r" cx="100" cy="98" r="29"/>', k),
        R('<ellipse class="r" cx="88" cy="96" rx="7" ry="9"/>', '#94d82d'), R('<ellipse class="r" cx="112" cy="96" rx="7" ry="9"/>', '#94d82d'),
        R('<polygon class="r" points="95,108 105,108 100,115"/>', '#ffa8a8'),
    ]
    return page('hallo-cat', 'Black Cat 🐈‍⬛', 'halloween', shapes, '<path d="M88 89v14M112 89v14" fill="none"/>')

def bat():
    k = '#495057'
    wing = [(86, 100), (60, 72), (14, 78), (30, 92), (26, 114), (42, 106), (52, 124), (66, 112), (78, 130), (86, 118)]
    shapes = [
        R('<circle class="r" cx="152" cy="44" r="26"/>', '#ffe066'),
        R(f'<polygon class="r" points="{poly(wing)}"/>', k), R(f'<polygon class="r" points="{poly(mirror(wing))}"/>', k),
        R('<ellipse class="r" cx="100" cy="118" rx="20" ry="28"/>', k),
        R('<polygon class="r" points="83,78 83,50 99,68"/>', k), R('<polygon class="r" points="117,78 117,50 101,68"/>', k),
        R('<circle class="r" cx="100" cy="84" r="21"/>', k),
        R('<circle class="r" cx="91" cy="82" r="6"/>', '#ffffff'), R('<circle class="r" cx="109" cy="82" r="6"/>', '#ffffff'),
        R(f'<polygon class="r" points="{star(38, 36, 11, 4.5)}"/>', '#ffe066'), R(f'<polygon class="r" points="{star(60, 170, 9, 4)}"/>', '#ffe066'),
        R(f'<polygon class="r" points="{star(160, 160, 12, 5)}"/>', '#ffe066'),
    ]
    lines = f'<circle cx="92" cy="83" r="2.5" fill="{INK}"/><circle cx="108" cy="83" r="2.5" fill="{INK}"/><path d="M92 95q8 6 16 0" fill="none"/><path d="M95 96l2 5l2 -5M101 96l2 5l2 -5" fill="#fff"/>'
    return page('hallo-bat', 'Bat 🦇', 'halloween', shapes, lines)

PAGES = [flag_us(), flag_ca(), flag_in(), flag_uk(), flag_au(),
         santa(), reindeer(), stocking(), gingerbread(),
         turkey(), pie(), pilgrim_hat(), corn(),
         jack(), ghost(), cat(), bat()]
OUT = {
    'schema': 1, 'namespace': 'coloring-themes',
    'datasets': {
        'about': 'Flag and holiday coloring pages, built by scripts/make-coloring-themes.py (self-authored shapes; flags are public symbols). The 👀 button shows the real colours.',
        'GROUPS': [['flags', '🏳️ Flags'], ['christmas', '🎄 Christmas'], ['thanksgiving', '🦃 Thanksgiving'], ['halloween', '🎃 Halloween']],
        'ALSO': {'sc-xmas': 'christmas', 'sc-pumpkin': 'halloween'},
        'THEME_PAGES': PAGES,
    },
}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, '..', 'data', 'coloring-themes.json'), 'w') as f:
    json.dump(OUT, f, ensure_ascii=False, indent=1); f.write('\n')
print(len(PAGES), 'pages')
