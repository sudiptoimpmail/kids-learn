"""Cartoon pieces for The Wonderful Wizard of Oz (L. Frank Baum, 1900, public domain).
Same conventions as cartoon.py: (x, y) is the middle-bottom of a character; s scales; flip turns it to face right."""
from cartoon import *
from garden import shoe

SILVER = '#dee2e6'


def dorothy(x, y, s=1, flip=False, mood='smile', arms_up=False, shoes=SILVER, basket=False):
    arm = shp('M-26 -30 q-34 -30 -26 -66', 'none', 10) if arms_up else shp('M-28 -24 q-24 26 -8 44', 'none', 10)
    dress = shp('M-30 -44 H30 L44 30 q-44 14 -88 0z', '#74b9ff')
    check = ''.join(f'<path d="M{-36 + k * 12} -40 L{-40 + k * 13} 28" stroke="#fff" stroke-width="3" opacity=".7"/>' for k in range(7))
    check += ''.join(f'<path d="M-34 {-34 + k * 12} H34" stroke="#fff" stroke-width="3" opacity=".7"/>' for k in range(6))
    apron = shp('M-18 -40 H18 V24 q-18 6 -36 0z', '#fff', 3)
    legs = shp('M-14 30 V58 M14 30 V58', 'none', 9) + shp('M-26 56 h20 v10 h-24z', shoes, 3) + shp('M6 56 h20 v10 h-20z', shoes, 3)
    head = (shp('M-40 -78 q-16 20 -6 44 q8 -18 6 -40z', '#8d5428', 3) + shp('M40 -78 q16 20 6 44 q-8 -18 -6 -40z', '#8d5428', 3)
            + circ(0, -80, 32, '#ffd6b0') + shp('M-34 -84 q4 -40 34 -38 q32 -2 34 38 q-14 -18 -34 -16 q-22 0 -34 16z', '#8d5428')
            + ell(-38, -48, 8, 6, '#74b9ff', 2) + ell(38, -48, 8, 6, '#74b9ff', 2) + face(0, -76, .66, mood))
    bk = (shp('M24 -6 h40 l-6 34 h-28z', '#e0a65e') + shp('M28 -6 q16 -26 32 0', 'none', 4)) if basket else ''
    return g(x, y, s, flip, legs + dress + check + apron + arm + bk + head)


def toto(x, y, s=1, flip=False, mood='smile'):
    return dog(x, y, s * 0.55, flip, mood).replace('#d9a066', '#3b3b3b').replace('#c48a4f', '#2b2b2b').replace('#8d5428', '#1e1e1e').replace('#fff0d8', '#5a5a5a')


def scarecrow(x, y, s=1, flip=False, mood='smile', on_pole=False):
    pole = shp('M0 70 V-150 M-90 -40 H90', 'none', 10) + '<path d="M0 70 V-150 M-90 -40 H90" stroke="#8d5a2b" stroke-width="5"/>' if on_pole else ''
    straw = ''.join(f'<path d="M{dx} {dy} l{ex} {ey}" stroke="#f2c94c" stroke-width="5" stroke-linecap="round"/>' for dx, dy, ex, ey in ((-64, -38, -14, 6), (-64, -30, -12, 12), (64, -38, 14, 6), (64, -30, 12, 12), (-14, 62, -6, 12), (14, 62, 6, 12)))
    arms = shp('M-28 -40 H-64', 'none', 14) + '<path d="M-28 -40 H-64" stroke="#4dabf7" stroke-width="8"/>' + shp('M28 -40 H64', 'none', 14) + '<path d="M28 -40 H64" stroke="#4dabf7" stroke-width="8"/>'
    body = (shp('M-30 -54 H30 V20 q-30 10 -60 0z', '#4dabf7') + shp('M-12 -30 h16 v14 h-16z', '#ff8787', 2) + shp('M-30 20 H-6 V62 H-30z', '#a9743f') + shp('M6 20 H30 V62 H6z', '#a9743f'))
    head = (circ(0, -86, 32, '#f8e3b5') + shp('M-12 -78 h4 M8 -78 h4', 'none', 3) + face(0, -90, .6, mood)
            + '<path d="M-16 -66 q16 8 32 0" fill="none" stroke="#3b2a3f" stroke-width="3" stroke-dasharray="4 4"/>'
            + shp('M-56 -112 h112 q-8 10 -24 8 h-64 q-16 2 -24 -8z', '#d9a066') + shp('M-28 -112 q0 -36 28 -38 q28 2 28 38z', '#d9a066'))
    return g(x, y, s, flip, pole + straw + arms + body + head)


def tinman(x, y, s=1, flip=False, mood='smile', axe=True, rusty=False):
    m = '#b8c2cc' if not rusty else '#c98b52'
    ax = (shp('M44 -60 V40', 'none', 7) + '<path d="M44 -60 V40" stroke="#8d5a2b" stroke-width="3"/>' + shp('M44 -64 q30 -10 34 16 q-20 2 -34 -2z', '#ced4da')) if axe else ''
    body = (shp('M-30 -56 H30 V24 H-30z', m) + shine(-10, -36, 14, 24) + circ(0, -30, 8, '#ff6b6b', 3)
            + shp('M-30 -48 q-30 10 -34 50', 'none', 13) + '<path d="M-30 -48 q-30 10 -34 50" stroke="' + m + '" stroke-width="7"/>'
            + shp('M-26 24 H-6 V74 H-26z', m) + shp('M6 24 H26 V74 H6z', m) + shp('M-30 72 h26 v10 h-28z', '#868e96', 3) + shp('M4 72 h26 v10 h-26z', '#868e96', 3))
    head = (shp('M-26 -60 V-114 H26 V-60z', m) + shine(-8, -98, 8, 12) + face(0, -92, .58, mood) + shp('M-14 -114 L0 -150 L14 -114z', m)
            + shp('M-30 -114 H30', 'none', 5))
    return g(x, y, s, flip, ax + body + head)


def witch_good(x, y, s=1, flip=False):
    dress = shp('M-34 -50 H34 L56 50 q-56 14 -112 0z', '#ffffff') + ''.join(circ(dx, dy, 4, '#ffd23f', 0) for dx, dy in ((-20, -10), (16, 0), (-6, 24), (24, 34), (-30, 36)))
    head = circ(0, -80, 30, '#ffe3cf') + face(0, -84, .58, 'smile') + shp('M-30 -96 q30 -16 60 0 L0 -180z', '#ffffff') + circ(0, -180, 8, '#ffd23f', 3)
    wand = shp('M36 -40 L70 -110', 'none', 5) + '<path d="M70 -126 l5 12 13 1 -10 8 3 13 -11 -7 -11 7 3 -13 -10 -8 13 -1z" fill="#ffd23f" stroke="#3b2a3f" stroke-width="3"/>'
    hair = shp('M-30 -80 q-10 40 6 60 M30 -80 q10 40 -6 60', 'none', 7) + '<path d="M-30 -80 q-10 40 6 60 M30 -80 q10 40 -6 60" stroke="#e9ecef" stroke-width="3"/>'
    return g(x, y, s, flip, dress + hair + head + wand)


def witch_bad(x, y, s=1, flip=False, melting=0):
    """Wicked Witch of the West: black dress, green face, a hat; melting 0..1 sinks her into a puddle."""
    puddle = ell(0, 52, 90 * (0.4 + melting), 14 * (0.5 + melting), '#2b2b2b', 3)
    sink = melting * 70
    body = (f'<g transform="translate(0 {sink}) scale(1 {1 - melting * 0.45})">' + shp('M-34 -50 H34 L50 50 q-50 12 -100 0z', '#2b2b2b')
            + circ(0, -80, 30, '#8ce99a') + face(0, -84, .58, 'oh') + shp('M-8 -66 l8 12 l6 -12z', '#69db7c', 2)
            + shp('M-56 -100 h112 q-10 8 -28 6 h-56 q-18 2 -28 -6z', '#2b2b2b') + shp('M-26 -100 L4 -176 L26 -100z', '#2b2b2b') + '</g>')
    return g(x, y, s, flip, puddle + body)


def wizard_head(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + '<circle r="150" fill="#b2f2bb" opacity=".35"/>' + circ(0, 0, 110, '#ffd8a8')
            + ell(-40, -20, 22, 26, '#fff', 4) + ell(40, -20, 22, 26, '#fff', 4) + circ(-40, -16, 11, OL, 0) + circ(40, -16, 11, OL, 0)
            + shp('M-50 -60 q20 -14 40 0 M10 -60 q20 -14 40 0', 'none', 7) + shp('M-10 10 q10 20 20 0', 'none', 5) + shp('M-40 50 q40 26 80 0', 'none', 6) + '</g>')


def wizard(x, y, s=1, flip=False):
    body = (shp('M-30 -50 H30 V40 q-30 10 -60 0z', '#7048e8') + ''.join(circ(dx, dy, 4, '#ffd23f', 0) for dx, dy in ((-14, -20), (12, 0), (-8, 24)))
            + shp('M-24 40 V70 M24 40 V70', 'none', 9) + circ(0, -80, 30, '#f6c9a0') + face(0, -84, .58, 'smile')
            + shp('M-20 -60 q20 30 40 0', '#e9ecef', 3) + shp('M-44 -100 h88 q-8 8 -22 6 h-44 q-14 2 -22 -6z', '#2b2b2b') + shp('M-24 -100 V-140 H24 V-100z', '#2b2b2b'))
    return g(x, y, s, flip, body)


def munchkin(x, y, s=1, flip=False, coat='#4dabf7'):
    body = (shp('M-24 -36 H24 V20 q-24 8 -48 0z', coat) + shp('M-20 20 V44 M20 20 V44', 'none', 8) + circ(0, -60, 24, '#ffd6b0') + face(0, -62, .5, 'smile')
            + shp('M-40 -78 h80 q-8 8 -20 6 h-40 q-12 2 -20 -6z', coat) + shp('M-20 -78 L0 -136 L20 -78z', coat) + circ(0, -136, 6, '#ffd23f', 3))
    return g(x, y, s * 0.8, flip, body)


def farmhouse(x, y, s=1, rot=0):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">' + shp('M-90 0 V-90 H90 V0z', '#e9c46a') + shp('M-104 -86 L0 -150 L104 -86z', '#9c6644')
            + shp('M-20 0 V-52 H20 V0z', '#8d5428') + shp('M-70 -64 h34 v26 h-34z M36 -64 h34 v26 h-34z', '#a5d8ff', 3) + '</g>')


def cyclone(x, y, s=1):
    rings = ''.join(f'<ellipse cx="{k * 6}" cy="{-k * 46}" rx="{30 + k * 22}" ry="{10 + k * 3}" fill="none" stroke="#868e96" stroke-width="{10 - k}" opacity=".8"/>' for k in range(8))
    return f'<g transform="translate({x} {y}) scale({s})">' + f'<path d="M-10 0 Q-60 -200 -190 -360 H210 Q60 -200 10 0z" fill="#adb5bd" opacity=".55"/>' + rings + '</g>'


def brick_road(y0=320, x_far=430, w_far=40):
    """The yellow brick road running from the bottom of the picture to the horizon."""
    rows = ''.join(f'<path d="M{(400 - 230) + (x_far - w_far / 2 - 170) * k / 8 + 0} {500 - k * (500 - y0) / 8} H{(400 + 230) - (630 - x_far - w_far / 2) * k / 8}" stroke="#d4a017" stroke-width="3"/>' for k in range(1, 8))
    return f'<path d="M170 500 L{x_far - w_far / 2} {y0} H{x_far + w_far / 2} L630 500z" fill="#ffd43b" stroke="#d4a017" stroke-width="4"/>' + rows


def cornfield(y=330, x0=0, x1=800):
    out = f'<rect x="{x0}" y="{y - 60}" width="{x1 - x0}" height="80" fill="#c5e18a"/>'
    for x in range(x0 + 10, x1, 34):
        out += shp(f'M{x} {y + 20} V{y - 80}', 'none', 5) + f'<path d="M{x} {y + 20} V{y - 80}" stroke="#58b947" stroke-width="3"/>' + ell(x + 8, y - 60, 7, 16, '#ffd23f', 2) + shp(f'M{x} {y - 30} q-20 -6 -26 -26 M{x} {y - 10} q20 -6 26 -26', 'none', 3)
    return out


def crow(x, y, s=1, flip=False):
    return bird(x, y, s, flip).replace('#47a8ff', '#343a40').replace('#2f86d9', '#212529')


def forest(y=330):
    return ''.join(shp(f'M{x - 50} {y + 10} L{x} {y - 170 - (x % 3) * 20} L{x + 50} {y + 10}z', ['#2b8a3e', '#2f9e44', '#37b24d'][(x // 90) % 3]) for x in range(-20, 840, 90))


def oil_can(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-22 0 V-30 q22 -14 44 0 V0z', '#fcc419') + shp('M14 -30 L48 -64 l6 6 L22 -22z', '#fcc419') + shp('M-22 -16 q-22 -6 -20 14', 'none', 5) + '</g>'


def emerald_city(x, y, s=1):
    towers = ''.join(shp(f'M{dx - w} 0 V{-h} L{dx} {-h - 50} L{dx + w} {-h}V0z', c) for dx, w, h, c in ((-150, 34, 150, '#51cf66'), (-80, 30, 220, '#2f9e44'), (0, 44, 290, '#40c057'), (80, 30, 230, '#2f9e44'), (150, 34, 160, '#51cf66')))
    gems = ''.join(circ(dx, dy, 8, '#b2f2bb', 2) for dx, dy in ((0, -260), (-80, -190), (80, -200), (-150, -120), (150, -130)))
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-200 0 V-70 H200 V0z', '#69db7c') + towers + gems + shp('M-34 0 V-56 q34 -30 68 0 V0z', '#2b8a3e') + '</g>'


def balloon(x, y, s=1):
    stripes = ''.join(f'<path d="M{-60 + k * 30} -40 Q{-60 + k * 30} -150 0 -160" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/>' for k in range(5))
    return (f'<g transform="translate({x} {y}) scale({s})">' + ell(0, -90, 80, 92, '#ff6b6b') + stripes + shp('M-40 -10 L-18 40 M40 -10 L18 40', 'none', 3) + shp('M-22 40 h44 v30 h-44z', '#c0874f') + '</g>')


def throne_room():
    return ('<rect width="800" height="500" fill="#2b8a3e"/>' + ''.join(f'<rect x="{x}" y="0" width="40" height="500" fill="#37b24d"/>' for x in range(0, 800, 120))
            + '<path d="M0 420 H800 V500 H0z" fill="#1e6b30"/>' + shp('M300 420 V250 q100 -60 200 0 V420z', '#ffd43b'))


def kansas(y=340):
    return f'<path d="M0 {y} H800 V500 H0z" fill="#d9c27a"/><path d="M0 {y} Q400 {y - 16} 800 {y}" fill="none" stroke="#b5a05c" stroke-width="4"/>'
