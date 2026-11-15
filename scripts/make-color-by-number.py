#!/usr/bin/env python3
"""Builds data/coloring-numbers.json: Color by Number pages (self-authored SVG, 300 x 300, many segments).

Each page is a hand-laid picture cut into 35 to 50 segments. Every segment has one right colour; the app writes a short
sum in each segment, and the legend says which answer is which colour ("7 is pink").
A page: id, name, svg (each segment has class "r"; details that are not coloured, such as eyes, smiles, scales and
sparkles, sit in <g class="ln">), colors: [[hex, name], ...] (at most 8) and paint: the colour index of each segment.
The drawings use soft curves throughout (no rulers): flowing sky ribbons, bumpy clouds, rounded bodies.
Segments use no transforms, and each must leave room for a sum (the app test measures this).
Run:  python3 scripts/make-color-by-number.py
"""
import json, math, os

INK = '#2b2140'
COLORS = {
    'red': '#f03e3e', 'orange': '#fd7e14', 'yellow': '#ffd43b', 'green': '#40c057', 'blue': '#339af0', 'purple': '#845ef7',
    'pink': '#f783ac', 'brown': '#a0623a', 'gray': '#adb5bd', 'black': '#495057', 'light blue': '#a5d8ff', 'peach': '#ffd8b5',
}
f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')
P = lambda d: f'<path class="r" d="{d}"/>'
C = lambda cx, cy, r: f'<circle class="r" cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"/>'

def smooth(points):
    """A closed, soft outline through the points (Catmull-Rom spline as Bezier curves)."""
    n = len(points); d = f'M{f(points[0][0])} {f(points[0][1])}'
    for i in range(n):
        p0, p1, p2, p3 = points[(i - 1) % n], points[i], points[(i + 1) % n], points[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6); c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f'C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}'
    return d + 'Z'
S = lambda points: P(smooth(points))

def blob(cx, cy, rx, ry, wob=(1, .94, 1.05, .97, 1, 1.06, .95, 1.02), rot=0):
    """A pebble: an oval that is not quite regular."""
    pts = []
    for i, w in enumerate(wob):
        a = math.radians(rot + 360 * i / len(wob)); pts.append((cx + rx * w * math.cos(a), cy + ry * w * math.sin(a)))
    return S(pts)

def cloud(cx, cy, s=1.0):
    q = lambda x, y: f'{f(cx + x * s)} {f(cy + y * s)}'
    return P(f'M{q(-30, 10)}Q{q(-42, -2)} {q(-26, -8)}Q{q(-24, -24)} {q(-6, -17)}Q{q(6, -30)} {q(20, -15)}Q{q(40, -16)} {q(35, 0)}Q{q(42, 12)} {q(26, 11)}Q{q(0, 16)} {q(-30, 10)}Z')

def leaf(x, y, a, length, width):
    """A leaf from (x, y) pointing at angle a (degrees)."""
    r = math.radians(a); ex, ey = x + length * math.cos(r), y + length * math.sin(r)
    nx, ny = -math.sin(r) * width, math.cos(r) * width; mx, my = (x + ex) / 2, (y + ey) / 2
    return P(f'M{f(x)} {f(y)}Q{f(mx + nx)} {f(my + ny)} {f(ex)} {f(ey)}Q{f(mx - nx)} {f(my - ny)} {f(x)} {f(y)}Z')

def star(cx, cy, R, r, n=5, rot=-90):
    """A star with soft points."""
    pts = [(cx + (r if i % 2 else R) * math.cos(math.radians(rot + 180 / n * i)), cy + (r if i % 2 else R) * math.sin(math.radians(rot + 180 / n * i))) for i in range(n * 2)]
    m = len(pts); mid = lambda i: ((pts[i % m][0] + pts[(i + 1) % m][0]) / 2, (pts[i % m][1] + pts[(i + 1) % m][1]) / 2)
    d = f'M{f(mid(0)[0])} {f(mid(0)[1])}'
    for i in range(1, m + 1):
        x, y = pts[i % m]; mx, my = mid(i)
        d += f'Q{f(x)} {f(y)} {f(mx)} {f(my)}'
    return P(d + 'Z')

def heart(cx, cy, s):
    return P(f'M{f(cx)} {f(cy + s)}C{f(cx - 1.7 * s)} {f(cy - 0.1 * s)} {f(cx - 0.9 * s)} {f(cy - 1.5 * s)} {f(cx)} {f(cy - 0.5 * s)}C{f(cx + 0.9 * s)} {f(cy - 1.5 * s)} {f(cx + 1.7 * s)} {f(cy - 0.1 * s)} {f(cx)} {f(cy + s)}Z')

def flower(cx, cy, r, col, mid='yellow', n=5, rot=-90):
    out = []
    for i in range(n):
        a = math.radians(rot + 360 / n * i)
        out.append((blob(cx + r * 1.25 * math.cos(a), cy + r * 1.25 * math.sin(a), r * 0.82, r * 0.82, rot=i * 40), col))
    return out + [(C(cx, cy, r * 0.72), mid)]

def page(pid, name, shapes, lines=''):
    names = []
    for _, c in shapes:
        if c not in names: names.append(c)
    assert len(names) <= 8, f'{pid}: {len(names)} colours (8 at most): {names}'
    svg = ''.join(s for s, _ in shapes) + (f'<g class="ln">{lines}</g>' if lines else '')
    assert 'transform' not in svg, pid
    return {'id': pid, 'name': name, 'vb': 300, 'svg': svg, 'colors': [[COLORS[n], n] for n in names], 'paint': [names.index(c) for _, c in shapes]}

# details that are drawn, not coloured
dot = lambda x, y, r=3: f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{INK}" stroke="none"/>'
def line(d, w=None):
    """Drawn strokes. Each stroke is its own element, so the app can keep the sums clear of every one of them."""
    return ''.join(f'<path d="M{part}" fill="none"' + (f' stroke-width="{w}"' if w else '') + '/>' for part in d.split('M') if part)
def eye(x, y, r=7, look=(1.5, 0.5)):
    return (f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="#fff"/>' + dot(x + look[0], y + look[1], r * 0.55) +
            f'<circle cx="{f(x + look[0] + r * 0.2)}" cy="{f(y + look[1] - r * 0.22)}" r="{f(r * 0.18)}" fill="#fff" stroke="none"/>')
cheek = lambda x, y, r=5: f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="#ff8787" opacity=".5" stroke="none"/>'
spark = lambda x, y, s=5: line(f'M{f(x)} {f(y - s)}V{f(y + s)}M{f(x - s)} {f(y)}H{f(x + s)}', 1.6)
tuft = lambda x, y: line(f'M{x} {y}q-3 -8 -7 -10M{x} {y}q0 -9 1 -13M{x} {y}q3 -7 8 -9', 1.8)

# ------------------------------------------------------------------ 1. Dino Valley
def dino():
    s = [(P('M0 0H300V56Q232 28 152 58Q72 90 0 50Z'), 'light blue'), (P('M0 50Q72 90 152 58Q232 28 300 56V112Q224 84 150 116Q76 148 0 104Z'), 'blue'),
         (P('M0 104Q76 148 150 116Q224 84 300 112V196H0Z'), 'light blue')]
    s += [(C(50, 44, 24), 'yellow'), (cloud(214, 36, 0.95), 'purple')]
    s += [(blob(118, 46, 15, 13), 'purple'), (blob(138, 24, 12, 10, rot=30), 'purple')]
    s += [(P('M44 190Q78 152 94 96Q98 72 114 72Q130 72 134 96Q148 150 176 180V190Z'), 'brown'),
          (P('M94 96Q98 72 114 72Q130 72 134 96Q134 116 126 104Q121 96 118 110Q115 126 109 108Q105 98 101 112Q95 110 94 96Z'), 'red')]
    s += [(P('M0 182Q150 172 300 184V224Q230 208 150 226Q70 242 0 222Z'), 'green'),
          (P('M0 222Q70 242 150 226L136 300H0Z'), 'brown'), (P('M150 226Q230 208 300 224V300H136Z'), 'orange')]
    s += [(blob(58, 274, 36, 13), 'blue')]                                                              # a pond
    s += [(blob(272, 282, 20, 12, rot=20), 'brown'), (blob(236, 290, 13, 9), 'brown')]                    # rocks
    # palm tree
    s += [(leaf(50, 128, 200, 62, 26), 'green'), (leaf(50, 128, 248, 70, 26), 'green'), (leaf(50, 128, 305, 68, 26), 'green'), (leaf(50, 128, 350, 66, 26), 'green')]
    s += [(P('M22 224Q20 206 26 192L46 192Q44 208 48 226Z'), 'brown'), (P('M26 192Q28 174 34 160L52 160Q48 176 46 192Z'), 'orange'),
          (P('M34 160Q38 144 44 128L60 130Q54 146 52 160Z'), 'brown')]
    # the dinosaur
    for i in range(5):
        x = 122 + i * 22; by = 150 - 10 * math.sin(math.pi * i / 4); h = 30 + 10 * math.sin(math.pi * i / 4)
        s.append((P(f'M{f(x - 13)} {f(by + 8)}Q{f(x - 14)} {f(by - h * 0.5)} {f(x)} {f(by - h)}Q{f(x + 14)} {f(by - h * 0.5)} {f(x + 13)} {f(by + 8)}Z'), 'orange' if i % 2 else 'red'))
    s += [(P('M70 204Q54 190 52 166Q72 178 84 198Z'), 'yellow'), (P('M92 190Q80 172 84 148Q102 166 108 184Z'), 'yellow')]
    s += [(P('M110 176Q90 170 76 186Q66 198 54 202Q66 218 84 216Q96 214 104 210Z'), 'purple')]
    s += [(P('M150 206Q148 234 146 250Q146 260 156 260L170 260Q176 260 176 250L176 206Z'), 'blue'), (P('M206 200Q208 230 206 248Q206 258 216 258L228 258Q234 258 234 248L232 200Z'), 'blue')]
    s += [(S([(98, 196), (104, 162), (140, 146), (188, 140), (224, 158), (236, 190), (220, 214), (170, 226), (122, 222)]), 'purple')]
    s += [(P('M112 210Q162 194 220 206Q206 222 170 226Q134 226 112 210Z'), 'yellow')]
    s += [(P('M114 210Q112 238 110 252Q110 262 120 262L136 262Q142 262 142 252L142 214Z'), 'blue'), (P('M178 214Q178 240 176 252Q176 262 186 262L200 262Q206 262 206 252L206 212Z'), 'blue')]
    s += [(S([(206, 164), (226, 142), (232, 114), (244, 94), (266, 90), (286, 100), (290, 120), (280, 136), (262, 142), (254, 160), (238, 188)]), 'purple')]
    s += [(blob(138, 172, 13, 10), 'orange'), (blob(172, 164, 14, 10, rot=25), 'orange'), (blob(200, 184, 12, 9, rot=50), 'orange')]
    s += [(P('M246 256Q244 232 262 230Q280 232 278 256L270 249L262 258L254 249Z'), 'yellow'), (P('M246 256L254 249L262 258L270 249L278 256Q280 280 262 282Q244 280 246 256Z'), 'red')]
    lines = (eye(266, 110, 8) + line('M270 128q9 2 14 -5') + dot(286, 114, 1.6) + cheek(256, 126, 5) + line('M50 14v-8M24 22l-6 -6M76 22l6 -6M18 44h-9M82 44h9M26 66l-6 6M74 66l6 6', 2) +
             line('M116 256v6M124 256v6M132 256v6M182 256v6M190 256v6M198 256v6', 1.6) + tuft(90, 240) + tuft(196, 286) + tuft(14, 244) + line('M40 270q10 -4 20 0M56 278q10 -4 20 0', 1.6))
    return page('cbn-dino', 'Dino Valley 🦕', s, lines)

# ------------------------------------------------------------------ 2. Fire Truck
def truck():
    s = [(P('M0 0H300V48Q220 66 150 44Q80 24 0 52Z'), 'blue'), (P('M0 52Q80 24 150 44Q220 66 300 48V118Q220 100 150 122Q80 142 0 116Z'), 'light blue'),
         (P('M0 116Q80 142 150 122Q220 100 300 118V190H0Z'), 'blue')]
    s += [(C(252, 40, 24), 'yellow'), (cloud(66, 34, 0.95), 'gray'), (cloud(160, 82, 0.8), 'gray')]
    # town: soft-cornered houses, round trees
    s += [(P('M10 190V84Q10 74 20 74H72Q82 74 82 84V190Z'), 'orange'), (P('M214 190V72Q214 62 224 62H282Q292 62 292 72V190Z'), 'orange')]
    for x, y, c in ((18, 86, 'yellow'), (50, 86, 'light blue'), (18, 126, 'light blue'), (50, 126, 'yellow'), (224, 76, 'light blue'), (258, 76, 'yellow'), (224, 118, 'yellow'), (258, 118, 'light blue')):
        s.append((P(f'M{x} {y + 30}V{y + 8}Q{x} {y} {x + 8} {y}H{x + 16}Q{x + 24} {y} {x + 24} {y + 8}V{y + 30}Z'), c))
    s += [(S([(161, 84), (190, 98), (196, 126), (176, 146), (146, 146), (126, 126), (132, 98)]), 'green')]
    s += [(S([(98, 124), (122, 134), (126, 160), (108, 174), (88, 172), (74, 158), (78, 134)]), 'green')]
    s += [(P('M0 186Q150 176 300 188V236H0Z'), 'green')]
    s += [(P('M0 232Q150 224 300 234V300H0Z'), 'black')]
    for x in (10, 118, 226):
        s.append((P(f'M{x + 8} 262H{x + 56}Q{x + 64} 262 {x + 64} 270Q{x + 64} 279 {x + 56} 279H{x + 8}Q{x} 279 {x} 270Q{x} 262 {x + 8} 262Z'), 'yellow'))
    # ladder: four rounded sections, tilted up
    a, b, c, d = (116, 128), (280, 92), (282, 112), (118, 148)
    lerp = lambda p, q, t: (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
    for i in range(4):
        t0, t1 = i / 4 + 0.012, (i + 1) / 4 - 0.012
        q = [lerp(a, b, t0), lerp(a, b, t1), lerp(d, c, t1), lerp(d, c, t0)]
        s.append((P(f'M{f(q[0][0])} {f(q[0][1])}L{f(q[1][0])} {f(q[1][1])}Q{f(q[1][0] + 4)} {f((q[1][1] + q[2][1]) / 2)} {f(q[2][0])} {f(q[2][1])}L{f(q[3][0])} {f(q[3][1])}Q{f(q[3][0] - 4)} {f((q[0][1] + q[3][1]) / 2)} {f(q[0][0])} {f(q[0][1])}Z'), 'gray' if i % 2 else 'yellow'))
    # body: three lockers and a stripe, cab with a big window
    s += [(P('M110 196V158Q110 150 118 150H164V196Z'), 'red'), (P('M164 150H218V196H164Z'), 'orange'), (P('M218 150H264Q272 150 272 158V196H218Z'), 'red'),
          (P('M110 196H272V208Q272 216 264 216H110Z'), 'yellow')]
    s += [(C(200, 173, 13), 'gray')]
    s += [(P('M22 204Q22 198 28 198H42V220H28Q22 220 22 214Z'), 'gray'),
          (P('M40 216V176Q40 152 66 148H102Q110 148 110 156V216Z'), 'red'), (P('M52 184Q52 160 70 158H94Q100 158 100 164V184Z'), 'light blue'),
          (P('M68 148V136Q68 128 76 128H88Q96 128 96 136V148Z'), 'blue')]
    s += [(C(92, 234, 27), 'black'), (C(92, 234, 13), 'gray'), (C(228, 234, 27), 'black'), (C(228, 234, 13), 'gray')]
    lines = (line('M104 194h-10', 3) + line('M58 164q8 -4 16 -3', 1.6) +
             line('M252 8v-6M228 16l-5 -5M276 16l5 -5M220 40h-8M284 40h8', 2) + tuft(8, 222) + tuft(288, 216) + spark(82, 122, 4) + spark(82, 134, 3))
    return page('cbn-truck', 'Fire Truck 🚒', s, lines)

# ------------------------------------------------------------------ 3. Princess and her castle
def princess():
    s = [(P('M0 0H300V60Q230 36 150 64Q70 92 0 58Z'), 'light blue'), (P('M0 58Q70 92 150 64Q230 36 300 60V128Q226 104 150 130Q74 156 0 124Z'), 'pink'),
         (P('M0 124Q74 156 150 130Q226 104 300 128V260H0Z'), 'light blue')]
    s += [(cloud(56, 34, 0.9), 'purple'), (cloud(262, 152, 0.75), 'purple'), (heart(116, 40, 13), 'red'), (heart(272, 56, 13), 'red')]
    s += [(P('M0 256Q78 214 156 252V300H0Z'), 'green'), (P('M140 256Q226 210 300 250V300H140Z'), 'green')]
    s += [(P('M174 300Q196 268 190 234H212Q224 268 236 300Z'), 'yellow')]
    # the castle: rounded towers, pointed roofs with a curve, arched door and windows
    s += [(P('M144 234V140Q144 132 152 132H172Q180 132 180 140V234Z'), 'pink'), (P('M222 234V140Q222 132 230 132H250Q258 132 258 140V234Z'), 'pink'),
          (P('M180 234V108Q180 100 188 100H214Q222 100 222 108V234Z'), 'yellow')]
    s += [(P('M134 134Q152 116 162 86Q172 116 190 134Z'), 'purple'), (P('M212 134Q230 116 240 86Q250 116 268 134Z'), 'purple'), (P('M168 102Q190 80 201 44Q212 80 234 102Z'), 'red')]
    s += [(P('M188 234V206Q201 184 214 206V234Z'), 'brown'), (P('M191 152V130Q201 114 211 130V152Z'), 'purple'),
          (P('M152 178V158Q162 146 172 158V178Z'), 'yellow'), (P('M230 178V158Q240 146 250 158V178Z'), 'yellow')]
    s += flower(266, 270, 12.5, 'red')
    # the princess: long wavy hair, a gown in five curved panels with a scalloped hem
    s += [(S([(80, 48), (108, 58), (120, 92), (120, 128), (132, 160), (108, 156), (98, 134), (62, 134), (52, 156), (28, 160), (40, 128), (40, 92), (52, 58)]), 'brown')]
    hem = [14, 42, 68, 92, 118, 146]
    for i in range(5):
        x0, x1 = 66 + i * 5.6, 66 + (i + 1) * 5.6; h0, h1 = hem[i], hem[i + 1]
        s.append((P(f'M{f(x0)} 172L{f(x1)} 172Q{f((x1 + h1) / 2 + 4)} 230 {h1} 280Q{f((h0 + h1) / 2)} 294 {h0} 280Q{f((x0 + h0) / 2 + 4)} 230 {f(x0)} 172Z'), 'pink' if i % 2 else 'purple'))
    s += [(P('M50 146Q60 146 64 154Q58 176 50 192Q40 194 34 186Q40 166 50 146Z'), 'peach'), (P('M96 154Q100 146 110 146Q124 160 136 176Q132 186 122 188Q108 172 96 154Z'), 'peach')]
    s += [(P('M62 136Q80 144 98 136L96 172H64Z'), 'red'), (blob(54, 142, 13, 12), 'yellow'), (blob(106, 142, 13, 12, rot=40), 'yellow')]
    s += [(P('M60 88L62 62L72 76L80 56L88 76L98 62L100 88Q80 94 60 88Z'), 'yellow')]
    s += [(star(140, 166, 17, 8), 'yellow')]
    lines = ('<circle cx="80" cy="108" r="23" fill="#ffd8b5"/>' + eye(72, 106, 4.5, (0.6, 0.4)) + eye(88, 106, 4.5, (0.6, 0.4)) + line('M72 118q8 7 16 0') + cheek(66, 114, 4) + cheek(94, 114, 4) + line('M128 182L134 172', 2.4) +
             line('M201 44V28', 2) + '<path d="M201 28q8 2 14 6q-6 4 -14 5z" fill="#f03e3e"/>' + line('M162 86V74M240 86V74', 2) +
             spark(40, 96, 5) + spark(128, 98, 4) + spark(254, 104, 5) + tuft(120, 262) + tuft(156, 290) + line('M201 214v12', 1.6) + dot(207, 220, 1.6))
    return page('cbn-princess', 'Princess Castle 👑', s, lines)

# ------------------------------------------------------------------ 4. Robot friend
def robot():
    s = [(P('M0 0H300V70Q224 50 150 74Q76 98 0 66Z'), 'light blue'), (P('M0 66Q76 98 150 74Q224 50 300 70V138Q224 116 150 140Q76 164 0 134Z'), 'blue'),
         (P('M0 134Q76 164 150 140Q224 116 300 138V200H0Z'), 'light blue')]
    s += [(P('M0 196Q150 184 300 198V300H0Z'), 'gray'), (S([(150, 252), (228, 262), (252, 284), (150, 298), (48, 284), (72, 262)]), 'purple')]
    # gears on the wall, a lightning bolt, a battery
    for cx, cy, r in ((42, 50, 30), (256, 48, 28)):
        pts = []
        for i in range(16):
            a = math.radians(360 * i / 16); rr = r * (1.0 if i % 2 else 0.8); pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        s += [(S(pts), 'orange'), (C(cx, cy, r * 0.3), 'yellow')]
    s += [(P('M266 104Q254 124 244 140H258L246 172Q262 150 278 128H262Q268 116 274 104Z'), 'yellow')]
    s += [(P('M18 280V242Q18 234 26 234H50Q58 234 58 242V280Q58 288 50 288H26Q18 288 18 280Z'), 'red'), (P('M26 234V222Q26 216 32 216H44Q50 216 50 222V234Z'), 'yellow')]
    s += [(blob(270, 258, 15, 11), 'orange'), (blob(240, 284, 13, 9, rot=30), 'yellow'), (cloud(246, 196, 0.5), 'purple'), (heart(40, 150, 12), 'red')]
    # the robot: round shoulders, soft corners
    s += [(C(150, 24, 11), 'red')]
    s += [(P('M88 70Q88 62 96 62H104V94H96Q88 94 88 86Z'), 'yellow'), (P('M196 62H204Q212 62 212 70V86Q212 94 204 94H196Z'), 'yellow'),
          (P('M102 60Q102 42 120 42H180Q198 42 198 60V96Q198 114 180 114H120Q102 114 102 96Z'), 'gray')]
    s += [(P('M116 64Q116 54 126 54H174Q184 54 184 64V92Q184 102 174 102H126Q116 102 116 92Z'), 'black')]
    s += [(P('M132 112H168V134H132Z'), 'orange')]
    s += [(P('M70 142Q70 132 80 132H96V178H70Z'), 'orange'), (P('M204 132H220Q230 132 230 142V178H204Z'), 'orange'),
          (P('M70 178H96V206Q96 216 86 216H80Q70 216 70 206Z'), 'gray'), (P('M204 178H230V206Q230 216 220 216H214Q204 216 204 206Z'), 'gray'),
          (blob(83, 230, 15, 14), 'red'), (blob(217, 230, 15, 14, rot=30), 'red')]
    s += [(P('M112 214H140V264H112Z'), 'gray'), (P('M160 214H188V264H160Z'), 'gray'),
          (P('M102 272Q102 262 112 262H140Q150 262 150 272V278Q150 286 142 286H110Q102 286 102 278Z'), 'purple'),
          (P('M150 272Q150 262 160 262H188Q198 262 198 272V278Q198 286 190 286H158Q150 286 150 278Z'), 'purple')]
    s += [(P('M96 148Q96 130 114 130H186Q204 130 204 148V198Q204 216 186 216H114Q96 216 96 198Z'), 'blue')]
    s += [(C(128, 153, 10), 'red'), (C(150, 153, 10), 'orange'), (C(172, 153, 10), 'yellow'),
          (P('M118 180Q118 170 128 170H172Q182 170 182 180Q182 190 172 190H128Q118 190 118 180Z'), 'purple')]
    lines = (line('M150 35V42', 3) + '<circle cx="134" cy="67" r="8.5" fill="#ffd43b"/><circle cx="166" cy="67" r="8.5" fill="#ffd43b"/>' + dot(135, 68, 3.4) + dot(167, 68, 3.4) + '<circle cx="136.5" cy="66" r="1.3" fill="#fff" stroke="none"/><circle cx="168.5" cy="66" r="1.3" fill="#fff" stroke="none"/>' +
             line('M143 108q7 4 14 0', 2) + dot(108, 138, 1.6) + dot(192, 138, 1.6) + dot(108, 204, 1.6) + dot(192, 204, 1.6) +
             line('M76 190h14M210 190h14M118 238h16M166 238h16', 1.6) + spark(24, 110, 5) + spark(226, 30, 4) + line('M32 250v20M44 250v20', 1.6))
    return page('cbn-robot', 'Robot Friend 🤖', s, lines)

# ------------------------------------------------------------------ 5. Rocket in space
def rocket():
    # space in four flowing ribbons
    s = [(P('M0 0H300V70Q220 40 150 78Q70 120 0 76Z'), 'black'), (P('M0 76Q70 120 150 78Q220 40 300 70V150Q224 122 150 158Q70 196 0 150Z'), 'purple'),
         (P('M0 150Q70 196 150 158Q224 122 300 150V226Q226 200 150 232Q70 266 0 226Z'), 'blue'), (P('M0 226Q70 266 150 232Q226 200 300 226V300H0Z'), 'black')]
    s += [(C(244, 62, 32), 'orange'), (S([(186, 66), (214, 52), (270, 50), (300, 62), (274, 76), (214, 80)]), 'pink')]
    s += [(blob(48, 246, 38, 37), 'gray'), (blob(34, 232, 10, 9), 'black'), (blob(62, 258, 11, 10, rot=30), 'black')]
    s += [(C(74, 112, 17), 'pink')]
    for x, y in ((36, 36), (112, 30), (270, 164), (254, 262), (26, 162), (206, 110), (70, 184)):
        s.append((star(x, y, 18, 8.5), 'yellow'))
    s += [(blob(238, 214, 34, 12), 'gray'), (P('M216 208Q238 172 260 208Q238 214 216 208Z'), 'pink')]
    # the rocket: a rounded body in three bands, big window, swept fins, three flames
    s += [(P('M122 238Q134 240 138 240Q134 272 118 290Q108 264 122 238Z'), 'orange'), (P('M162 240Q166 240 178 238Q192 264 182 290Q166 272 162 240Z'), 'orange'),
          (P('M138 240H162Q162 276 150 298Q138 276 138 240Z'), 'yellow')]
    s += [(P('M120 168Q96 196 86 236Q104 228 122 224Z'), 'red'), (P('M180 168Q204 196 214 236Q196 228 178 224Z'), 'red')]
    s += [(P('M150 22Q182 56 184 100H116Q118 56 150 22Z'), 'red'), (P('M150 22Q166 38 174 60H126Q134 38 150 22Z'), 'orange'), (P('M116 100H184Q186 124 184 144H116Q114 124 116 100Z'), 'gray'),
          (P('M116 144H184Q184 166 182 186H118Q116 166 116 144Z'), 'blue'), (P('M118 186H182Q180 206 174 224H126Q120 206 118 186Z'), 'gray'),
          (P('M126 224H174L180 240H120Z'), 'black')]
    s += [(C(150, 122, 15), 'yellow'), (C(150, 165, 13), 'yellow')]
    lines = (line('M136 205h28', 2) + line('M142 116q6 -8 16 -6', 1.6) + line('M144 160q5 -6 12 -5', 1.4) + spark(96, 62, 5) + spark(170, 268, 4) + 
             dot(200, 30, 1.8) + dot(64, 68, 1.8) + dot(286, 110, 1.8) + dot(210, 276, 1.8) + dot(12, 110, 1.8) +
             line('M220 52q24 -8 48 0', 1.4))
    return page('cbn-rocket', 'Rocket Ship 🚀', s, lines)

# ------------------------------------------------------------------ 6. Butterfly garden
def butterfly():
    s = [(P('M0 0H300V54Q226 30 150 58Q74 86 0 52Z'), 'light blue'), (P('M0 52Q74 86 150 58Q226 30 300 54V118Q226 94 150 122Q74 150 0 114Z'), 'blue'),
         (P('M0 114Q74 150 150 122Q226 94 300 118V246H0Z'), 'light blue')]
    s += [(C(40, 36, 22), 'yellow'), (cloud(250, 34, 0.8), 'pink')]
    s += [(P('M0 240Q52 222 104 240V300H0Z'), 'green'), (P('M96 242Q150 224 204 242V300H96Z'), 'green'), (P('M196 240Q248 222 300 240V300H196Z'), 'green')]
    # wings: soft lobes, one inside the next, with an eye spot on each
    def lobe(side, pts):
        return S(pts if side < 0 else [(300 - x, y) for x, y in pts])
    for side in (-1, 1):
        s += [(lobe(side, [(142, 124), (118, 78), (76, 52), (38, 58), (24, 92), (40, 126), (86, 140)]), 'purple')]
        s += [(lobe(side, [(142, 126), (120, 92), (84, 72), (56, 80), (50, 104), (66, 124), (100, 134)]), 'pink')]
        s += [(lobe(side, [(142, 128), (124, 106), (98, 96), (82, 106), (88, 122), (112, 132)]), 'orange')]
        s += [(blob(40 if side < 0 else 260, 88, 10, 11), 'yellow')]
        s += [(lobe(side, [(142, 138), (98, 144), (60, 164), (56, 198), (84, 218), (118, 204), (140, 172)]), 'orange')]
        s += [(lobe(side, [(142, 142), (110, 152), (84, 172), (88, 194), (108, 196), (130, 176)]), 'purple')]
        s += [(blob(70 if side < 0 else 230, 196, 10, 10), 'yellow')]
    s += [(S([(150, 100), (159, 112), (160, 150), (156, 182), (150, 192), (144, 182), (140, 150), (141, 112)]), 'black')]
    s += flower(40, 264, 12.5, 'purple') + flower(150, 270, 12.5, 'pink') + flower(260, 264, 12.5, 'orange')
    lines = (line('M144 82Q134 60 120 56M156 82Q166 60 180 56', 2) + dot(120, 56, 3) + dot(180, 56, 3) + '<circle cx="150" cy="90" r="12" fill="#495057"/>' + eye(145, 89, 3.2, (0.4, 0.3)) + eye(155, 89, 3.2, (0.4, 0.3)) +
             line('M146 96q4 3 8 0', 1.4) + line('M40 8v-6M18 14l-5 -5M62 14l5 -5M12 36h-8M68 36h8', 2) + line('M143 118h14M142 134h16M142 150h16M143 166h14', 1.4) +
             tuft(84, 258) + tuft(206, 260) + tuft(110, 290) + spark(96, 30, 4) + spark(200, 84, 4))
    return page('cbn-butterfly', 'Butterfly Garden 🦋', s, lines)

PAGES = [dino(), truck(), princess(), robot(), rocket(), butterfly()]
OUT = {
    'schema': 1, 'namespace': 'coloring-numbers',
    'datasets': {
        'about': ('Color by Number pages, built by scripts/make-color-by-number.py (self-authored). The app writes a short sum in every segment; '
                  'the legend says which answer is which colour. "rules" says what kind of sum each grade gets and which answers may be used.'),
        'rules': {
            'prek': {'kind': 'number', 'values': [1, 2, 3, 4, 5, 6, 7, 8, 9]},
            'k':    {'kind': 'addsub', 'values': [2, 3, 4, 5, 6, 7, 8, 9, 10], 'max': 10},
            'g1':   {'kind': 'addsub', 'values': [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], 'max': 20},
            'g2':   {'kind': 'addsub', 'values': [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 27, 30], 'max': 60},
            'g3':   {'kind': 'muldiv', 'values': [4, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24], 'max': 10},
        },
        'PAGES': PAGES,
    },
}
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, '..', 'data', 'coloring-numbers.json'), 'w') as fh:
    json.dump(OUT, fh, ensure_ascii=False, indent=1); fh.write('\n')
print(', '.join(f"{p['name'].split(' ')[0]} {len(p['paint'])} segments/{len(p['colors'])} colours" for p in PAGES))
