"""Extra cartoon pieces for Peter Rabbit: rabbits, Mr. McGregor, the vegetable garden and its props.
Same conventions as cartoon.py: (x, y) is the middle-bottom of a character, s scales, characters face left
unless flip=True."""
from cartoon import *


def rabbit(x, y, s=1, flip=False, mood='smile', jacket='#3d7bd9', apron=None, run=False, small=False):
    """A brown rabbit. jacket=None for no jacket (Peter after he lost it); apron for Mother."""
    fur, belly, ear_in = '#b98a5e', '#f3e1c6', '#ffb3c6'
    legs = (shp('M-30 26 q-30 6 -40 -6', 'none', 10) + shp('M24 28 q34 4 42 -10', 'none', 10)) if run else (ell(-24, 32, 20, 9, fur, 4) + ell(22, 32, 20, 9, fur, 4))
    tail = circ(48, 0, 13, '#fff', 3)
    body = shp('M-40 24 q-8 -66 40 -70 q50 4 44 70 q-6 16 -44 16 q-38 0 -40 -16z', fur) + shine(6, -24, 26, 18)
    tummy = shp('M-18 20 q-4 -34 18 -36 q22 2 18 36 q-18 8 -36 0z', belly, 3)
    cloth = ''
    if jacket:
        cloth = (shp('M-40 -6 q-4 -40 40 -44 q46 4 42 44 q-10 6 -24 4 L0 -18 L-18 -2 q-14 4 -40 -2z', jacket)
                 + circ(-8, -16, 4.5, '#ffd23f', 2) + circ(8, -16, 4.5, '#ffd23f', 2) + circ(-6, -2, 4.5, '#ffd23f', 2))
    if apron:
        cloth = shp('M-26 -30 h52 v46 q-26 12 -52 0z', apron) + shp('M-26 -30 q26 -10 52 0', 'none', 3)
    arms = shp('M-34 -20 q-22 6 -26 22', 'none', 9)
    head = (shp('M-30 -98 q-22 -70 -2 -78 q14 2 14 70z', fur) + shp('M-24 -102 q-12 -48 -2 -56 q6 2 8 50z', ear_in, 0)
            + shp('M6 -100 q2 -72 22 -74 q18 8 -8 76z', fur) + shp('M10 -104 q4 -48 14 -52 q8 6 -6 52z', ear_in, 0)
            + ell(-6, -66, 38, 34, fur) + shine(-18, -80, 18, 12) + face(-12, -70, .62, mood)
            + shp('M-16 -54 q4 4 8 0', '#ff8fa3', 2)
            + '<path d="M-26 -52 h-22 M-26 -48 l-20 6 M2 -52 h22 M2 -48 l20 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>')
    sc = s * (0.72 if small else 1)
    return g(x, y, sc, flip, tail + legs + body + tummy + cloth + arms + head)


def farmer(x, y, s=1, flip=False, mood='open', rake=True):
    """Mr. McGregor: straw hat, white beard, blue overalls, a rake held high."""
    tool = (shp('M-60 -150 L-20 40', 'none', 7) + shp('M-84 -160 h50 M-80 -160 v14 M-70 -160 v14 M-60 -160 v14 M-50 -160 v14 M-40 -160 v14', 'none', 5)) if rake else ''
    body = (shp('M-34 -50 H34 V44 q-34 12 -68 0z', '#4a6fd6') + shp('M-34 -50 H34 V-10 H-34z', '#f2f2f2', 3)
            + shp('M-22 -50 V0 M22 -50 V0', 'none', 6) + shp('M-34 44 H-6 V96 H-34z', '#4a6fd6') + shp('M6 44 H34 V96 H6z', '#4a6fd6')
            + shp('M-38 94 h32 v10 h-36z', '#5c3b1e', 3) + shp('M4 94 h32 v10 h-32z', '#5c3b1e', 3)
            + shp('M-34 -40 q-30 -40 -34 -100', 'none', 11) + shp('M34 -40 q24 30 20 70', 'none', 11)
            + circ(0, -82, 32, '#f6c9a0') + shp('M-28 -70 q28 60 56 0 q-10 26 -28 30 q-18 -4 -28 -30z', '#fff', 3)
            + face(0, -90, .6, mood) + shp('M-60 -104 h120 q-10 10 -24 8 h-72 q-14 2 -24 -8z', '#f2c94c')
            + shp('M-32 -104 q4 -38 32 -38 q28 0 32 38z', '#f2c94c') + shp('M-32 -110 h64', 'none', 6))
    return g(x, y, s, flip, tool + body)


def lettuce(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + circ(0, 0, 24, '#8fd16a') + shp('M-18 -4 q18 -26 36 0 M-12 8 q12 -16 24 0', '#b5e48c', 3) + '</g>'


def cabbage(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + circ(0, 0, 28, '#6fbf73') + shp('M-20 -2 q20 -30 40 0 q-20 18 -40 0z', '#a9dfa0', 3) + shp('M0 -26 v40', 'none', 3) + '</g>'


def radish(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-4 -16 q-14 -24 -2 -30 M4 -16 q14 -24 2 -30', '#58b947', 3)
            + shp('M-16 -4 q16 -20 32 0 q-2 20 -16 30 q-14 -10 -16 -30z', '#e64980') + '</g>')


def bean_pole(x, y, s=1):
    leaves = ''.join(ell(-10 + 20 * (k % 2), -20 - k * 26, 13, 8, '#6fcb55', 3) for k in range(5))
    pods = ''.join(shp(f'M{6 - 12 * (k % 2)} {-34 - k * 30} q4 18 0 30', 'none', 5) for k in range(3))
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M0 10 V-150', 'none', 7) + '<path d="M0 10 V-150" stroke="#a9743f" stroke-width="3"/>' + leaves + pods + '</g>'


def veg_rows(y0=380, kinds=('lettuce', 'cabbage', 'radish'), x0=40, x1=780, gap=80):
    fn = {'lettuce': lettuce, 'cabbage': cabbage, 'radish': radish}
    soil = ''.join(f'<path d="M0 {y0 + 6 + r * 44} H800" stroke="#7a4e26" stroke-width="16" stroke-linecap="round" opacity=".55"/>' for r in range(len(kinds)))
    out = soil
    for r, k in enumerate(kinds):
        for x in range(x0 + (r % 2) * gap // 2, x1, gap):
            out += fn[k](x, y0 + r * 44, 0.9 - r * 0.0)
    return out


def garden_ground(y=330):
    return (f'<path d="M0 {y} H800 V500 H0z" fill="#9b6a43"/>' + f'<path d="M0 {y} Q200 {y - 22} 400 {y} T800 {y} V{y + 14} H0z" fill="#6fcf5a" stroke="#3e9c3a" stroke-width="3"/>')


def brick_wall(y=330, x0=0, x1=800, h=70):
    bricks = ''.join(f'<rect x="{x + (row % 2) * 22}" y="{y - h + row * 18}" width="40" height="15" rx="3" fill="#c46a4a" stroke="#8d3f2a" stroke-width="2"/>'
                     for row in range(h // 18) for x in range(x0 - 22, x1, 44))
    return f'<rect x="{x0}" y="{y - h}" width="{x1 - x0}" height="{h}" fill="#a95638"/>' + bricks


def gate(x, y, s=1, open_=False):
    bars = ''.join(shp(f'M{-60 + k * 24} 0 V-110', 'none', 8) for k in range(6))
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-70 0 V-120 M70 0 V-120', 'none', 12)
            + '<path d="M-70 0 V-120 M70 0 V-120" stroke="#8d5a2b" stroke-width="7"/>' + bars + shp('M-64 -96 H64 M-64 -22 H64', 'none', 8)
            + '<path d="M-64 -96 H64 M-64 -22 H64" stroke="#c0874f" stroke-width="4"/></g>')


def watering_can(x, y, s=1, peek=False):
    out = (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-46 0 V-70 q46 -14 92 0 V0 q-46 10 -92 0z', '#74c0fc') + shine(-16, -46, 20, 18)
           + shp('M46 -50 L96 -92 l10 8 L52 -30z', '#74c0fc') + ell(102, -92, 14, 7, '#a5d8ff', 3) + shp('M-46 -56 q-34 -6 -30 26 q2 18 30 10', 'none', 8))
    if peek:
        out += shp('M-20 -72 q-10 -50 4 -54 q10 4 6 54z', '#b98a5e') + shp('M2 -72 q4 -48 18 -50 q10 8 -8 50z', '#b98a5e')
    return out + '</g>'


def net(x, y, w=180, h=110):
    lines = ''.join(f'<path d="M{x + i * w / 8} {y} L{x + i * w / 8 + 10} {y + h}" stroke="#f1f3f5" stroke-width="2.5"/>' for i in range(9))
    lines += ''.join(f'<path d="M{x} {y + j * h / 5} Q{x + w / 2} {y + j * h / 5 + 12} {x + w} {y + j * h / 5}" fill="none" stroke="#f1f3f5" stroke-width="2.5"/>' for j in range(6))
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#2b8a3e" opacity=".25"/>' + lines


def gooseberry_bush(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + circ(-40, -30, 46, '#4caf50') + circ(40, -30, 46, '#4caf50') + circ(0, -60, 54, '#5cbf4a') + ''.join(circ(dx, dy, 7, '#c0eb75', 2) for dx, dy in ((-40, -40), (20, -70), (50, -20), (-10, -20))) + '</g>'


def fir_tree_home(x, y, s=1):
    """The big fir tree with the rabbit hole in a sandbank among its roots."""
    tiers = ''.join(shp(f'M{-120 + k * 18} {-60 - k * 70} L0 {-170 - k * 70} L{120 - k * 18} {-60 - k * 70}z', ['#2f9e44', '#37b24d', '#40c057'][k % 3]) for k in range(3))
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-150 20 q150 -100 300 0z', '#e9c46a') + shp('M-24 20 V-70 H24 V20z', '#8d5428') + tiers
            + shp('M-56 20 q0 -66 56 -66 q56 0 56 66z', '#3b2a3f', 3) + shp('M-30 20 q-40 0 -60 -24 M30 20 q40 0 60 -24', 'none', 8) + '</g>')


def shoe(x, y, s=1, rot=0):
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">' + shp('M-22 0 q0 -16 18 -16 q8 0 10 8 q12 2 16 8 q0 6 -6 6 h-38z', '#5c3b1e') + '</g>'


def jacket(x, y, s=1, rot=0):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">' + shp('M-40 30 q-4 -40 40 -44 q46 4 42 44 q-20 6 -42 4 q-20 2 -40 -4z', '#3d7bd9')
            + circ(-8, 8, 5, '#ffd23f', 2) + circ(10, 8, 5, '#ffd23f', 2) + '</g>')


def bed_scene(x, y, s=1):
    """Inside the burrow: a little bed with a patchwork quilt and a teacup on a stool."""
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-110 0 V-70 H-90 V-40 H110 V0z', '#a9743f') + shp('M-90 -40 H110 V-10 H-90z', '#ffd8a8', 3)
            + ''.join(f'<rect x="{-90 + k * 40}" y="-40" width="40" height="30" fill="{c}" stroke="{OL}" stroke-width="2"/>' for k, c in enumerate(['#ffa8a8', '#a5d8ff', '#b2f2bb', '#ffec99', '#d0bfff']))
            + shp('M150 0 V-50 H210 V0', '#c0874f') + shp('M162 -50 q0 -26 18 -26 q18 0 18 26z', '#fff', 3) + shp('M198 -66 q14 0 10 12 q-4 6 -10 4', 'none', 3) + '</g>')


def burrow_inside():
    return ('<rect width="800" height="500" fill="#d9a066"/><path d="M0 0 H800 V120 Q400 40 0 120z" fill="#b9763f"/>'
            + '<path d="M0 500 V430 Q400 400 800 430 V500z" fill="#c48a4f"/>'
            + ''.join(circ(x, y, 6, '#a0673a', 0) for x, y in ((90, 160), (700, 140), (180, 260), (620, 280), (420, 120), (520, 200))))


def pond(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + ell(0, 0, 120, 34, '#74c0fc') + ell(-30, -6, 40, 8, '#a5d8ff', 0) + ''.join(shp(f'M{dx} -6 q4 -40 8 -50', 'none', 4) for dx in (-110, -100, 100, 108)) + '</g>'


def wheelbarrow(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-70 -40 H50 L30 0 H-50z', '#e8590c') + circ(40, 10, 18, '#495057') + circ(40, 10, 6, '#ced4da', 2)
            + shp('M-70 -40 L-110 -60 M-50 0 L-60 30', 'none', 6) + '</g>')


def white_cat(x, y, s=1, flip=False):
    return cat(x, y, s, flip, 'sleep').replace('#aab3c6', '#f8f9fa').replace('#9aa3b5', '#e9ecef').replace('#7e879c', '#ced4da')
