"""A small cartoon kit for the Grade 1-3 story pictures: thick friendly outlines, big shiny eyes, rosy cheeks,
soft gradients, layered hills and clouds.  Every function returns SVG text; positions are the middle of the
character's body, `s` scales it and `flip=True` turns it to face right."""

OL = '#3b2a3f'          # outline colour
W, H = 800, 500

def defs():
    return ('<defs>'
            '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0ff"/><stop offset="1" stop-color="#e6f7ff"/></linearGradient>'
            '<linearGradient id="skyW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8e0b6"/><stop offset="1" stop-color="#eaf8d8"/></linearGradient>'
            '<linearGradient id="skyE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb88c"/><stop offset="1" stop-color="#ffe9a8"/></linearGradient>'
            '<linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be36b"/><stop offset="1" stop-color="#5cbf4a"/></linearGradient>'
            '<linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd15a"/><stop offset="1" stop-color="#3fa84a"/></linearGradient>'
            '<linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9ecb0"/><stop offset="1" stop-color="#8fd69a"/></linearGradient>'
            '<radialGradient id="sunG"><stop offset="0" stop-color="#fff6b0"/><stop offset="1" stop-color="#ffd23f"/></radialGradient>'
            '<radialGradient id="shine" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
            '</defs>')

def page(body, sky='sky'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs()}<rect width="{W}" height="{H}" fill="url(#{sky})"/>{body}</svg>'

def shp(d, fill, w=4):
    return f'<path d="{d}" fill="{fill}" stroke="{OL}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
def ell(cx, cy, rx, ry, fill, w=4):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{OL}" stroke-width="{w}"/>'
def circ(cx, cy, r, fill, w=4):
    return ell(cx, cy, r, r, fill, w)
def shine(cx, cy, rx, ry):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#shine)"/>'

# ---------- scenery ----------
def sun(x=690, y=90, r=46):
    rays = ''.join(f'<path d="M{x} {y-r-18} v-16" stroke="#ffcf3a" stroke-width="7" stroke-linecap="round" transform="rotate({a} {x} {y})"/>' for a in range(0, 360, 30))
    return rays + f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#sunG)" stroke="#f5a623" stroke-width="4"/>'
def cloud(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="#fff" stroke="#bfe3f7" stroke-width="3"><circle cx="0" cy="0" r="26"/><circle cx="32" cy="-12" r="32"/>'
            '<circle cx="68" cy="2" r="26"/><rect x="-24" y="2" width="116" height="24" rx="12" stroke="none"/></g>')
def clouds(*pos): return ''.join(cloud(x, y, s) for x, y, s in pos)
def hills(far=True, y=330):
    s = ''
    if far: s += f'<path d="M0 {y-40} Q150 {y-120} 320 {y-50} T640 {y-70} T800 {y-30} V500 H0z" fill="url(#hillFar)"/>'
    s += f'<path d="M0 {y+10} Q220 {y-60} 450 {y+5} T800 {y-10} V500 H0z" fill="url(#hill2)" stroke="#2f8a3d" stroke-width="3"/>'
    s += f'<path d="M0 {y+80} Q260 {y+20} 520 {y+75} T800 {y+60} V500 H0z" fill="url(#hill1)" stroke="#3e9c3a" stroke-width="3"/>'
    return s
def flowers(*xs):
    out = ''
    cols = ['#ff6b9d', '#ffd23f', '#fff', '#b388ff']
    for i, (x, y) in enumerate(xs):
        c = cols[i % 4]
        out += f'<path d="M{x} {y} v22" stroke="#2f8a3d" stroke-width="4"/>' + ''.join(f'<circle cx="{x+dx}" cy="{y+dy}" r="6" fill="{c}" stroke="{OL}" stroke-width="2"/>' for dx, dy in ((-7, 0), (7, 0), (0, -7), (0, 7))) + f'<circle cx="{x}" cy="{y}" r="5" fill="#ffd23f" stroke="{OL}" stroke-width="2"/>'
    return out
def tree(x, y, s=1, fruit=False):
    t = (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-20 30 L-14 -110 H14 L20 30z', '#b9763f') + '<path d="M-6 -90 v90" stroke="#8d5428" stroke-width="4" opacity=".6"/>'
         + circ(-52, -118, 52, '#58b947') + circ(54, -118, 52, '#58b947') + circ(0, -170, 70, '#6fcb55') + circ(0, -120, 56, '#6fcb55')
         + shine(-20, -190, 38, 26))
    if fruit: t += circ(-30, -130, 9, '#ff5252', 3) + circ(35, -160, 9, '#ff5252', 3)
    return t + '</g>'
def barn(x=600, y=370, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-110 0 V-120 L0 -190 L110 -120 V0z', '#e5533d') + shp('M-125 -112 L0 -200 L125 -112 L110 -100 L0 -178 L-110 -100z', '#a93425')
            + shp('M-34 0 V-70 H34 V0z', '#fff4dc') + '<path d="M-34 -70 L34 0 M34 -70 L-34 0" stroke="#e5533d" stroke-width="5"/>' + circ(0, -130, 16, '#fff4dc') + '</g>')
def fence(x0=0, x1=800, y=395):
    posts = ''.join(shp(f'M{x} {y} v-62 l8 -10 l8 10 v62z', '#fff6e0', 3) for x in range(x0, x1, 62))
    return posts + f'<path d="M{x0} {y-40} H{x1} M{x0} {y-16} H{x1}" stroke="{OL}" stroke-width="10"/><path d="M{x0} {y-40} H{x1} M{x0} {y-16} H{x1}" stroke="#fff6e0" stroke-width="5"/>'
def wheat(x, y, h=100, c='#f2b632'):
    s = f'<g transform="translate({x} {y})"><path d="M0 0 V{-h}" stroke="#a97a1d" stroke-width="5" stroke-linecap="round"/>'
    for i in range(5):
        yy = -h + i * 15
        s += f'<ellipse cx="-9" cy="{yy}" rx="7" ry="13" fill="{c}" stroke="{OL}" stroke-width="2.5" transform="rotate(-28 -9 {yy})"/><ellipse cx="9" cy="{yy}" rx="7" ry="13" fill="{c}" stroke="{OL}" stroke-width="2.5" transform="rotate(28 9 {yy})"/>'
    return s + f'<ellipse cx="0" cy="{-h-14}" rx="7" ry="14" fill="{c}" stroke="{OL}" stroke-width="2.5"/></g>'
def field(h=100, c='#f2b632', y0=430):
    return ''.join(wheat(25 + i * 42, y0 + (i % 3) * 14, h - (i % 2) * 12, c) for i in range(20))
def mill(x=620, y=400, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-55 0 L-35 -170 H35 L55 0z', '#f1dfb8') + shp('M-42 -170 L0 -215 L42 -170z', '#b8553b')
            + shp('M-16 0 V-50 a16 16 0 0 1 32 0 V0z', '#7a4e26')
            + '<g transform="translate(0 -150)">' + ''.join(f'<g transform="rotate({a})">{shp("M-5 0 H5 V-95 H-5z", "#8b5a2b", 3)}{shp("M5 -92 H42 V-48 H5z", "#fff4dc", 3)}</g>' for a in (20, 110, 200, 290)) + circ(0, 0, 11, '#8b5a2b') + '</g></g>')
def net(x, y, w=300, h=220):
    s = f'<g transform="translate({x} {y})" fill="none" stroke="{OL}" stroke-width="6" opacity=".78">'
    for i in range(0, w + 1, 52): s += f'<path d="M{i} 0 V{h}"/>'
    for j in range(0, h + 1, 52): s += f'<path d="M0 {j} H{w}"/>'
    s += '</g>' + f'<g transform="translate({x} {y})" fill="none" stroke="#e3b17a" stroke-width="4">'
    for i in range(0, w + 1, 52): s += f'<path d="M{i} 0 V{h}"/>'
    for j in range(0, h + 1, 52): s += f'<path d="M0 {j} H{w}"/>'
    return s + '</g>'
def rope(x, y, w=190):
    return (f'<path d="M{x} {y} q30 -44 60 0 t60 0 t60 0" fill="none" stroke="{OL}" stroke-width="18" stroke-linecap="round"/>'
            f'<path d="M{x} {y} q30 -44 60 0 t60 0 t60 0" fill="none" stroke="#e3b17a" stroke-width="10" stroke-linecap="round"/>'
            f'<path d="M{x+6} {y-4} l8 -8 M{x+66} {y-4} l8 -8 M{x+126} {y-4} l8 -8" stroke="#a9763a" stroke-width="3"/>')
def bread(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-78 10 q-6 -52 78 -52 q84 0 78 52 q-4 30 -78 30 q-74 0 -78 -30z', '#e49b4a') + shine(-20, -26, 54, 20)
            + '<path d="M-40 -30 q10 16 0 34 M0 -34 q10 18 0 38 M40 -30 q10 16 0 34" stroke="#b9702a" stroke-width="6" fill="none" stroke-linecap="round"/></g>')
def steam(x, y):
    return ''.join(f'<path d="M{x+i*28} {y} q-12 -20 0 -34 q12 -16 0 -32" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".9"/>' for i in range(3))
def apple(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M0 -40 q-60 -30 -62 30 q0 62 62 54 q62 8 62 -54 q-2 -60 -62 -30z', '#f0443a') + shine(-20, -20, 30, 24) + shp('M0 -40 q4 -28 24 -34', 'none', 5) + shp('M6 -52 q30 -30 50 -6 q-24 16 -50 6z', '#58b947', 3) + '</g>'
def cake(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-74 40 V-6 H74 V40 q-74 24 -148 0z', '#ffb3cf') + shp('M-78 -6 q4 -34 38 -22 q16 -20 40 -6 q24 -14 40 6 q34 -12 38 22 q-78 22 -156 0z', '#fff')
            + shp('M0 -30 v-26', 'none', 5) + circ(0, -62, 11, '#ff5252', 3) + '</g>')
def soup(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})">' + shp('M-80 -14 H80 q0 78 -80 78 q-80 0 -80 -78z', '#cfd8ff') + ell(0, -14, 80, 20, '#f6a54a', 4)
            + circ(-30, -16, 8, '#8bd96a', 2.5) + circ(22, -12, 8, '#8bd96a', 2.5) + '<path d="M-20 -60 q-10 -14 0 -24 M10 -64 q-10 -14 0 -24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></g>')
def stick(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-90 26 L88 -22 q10 -4 12 8 q2 10 -10 14 L-82 50 q-12 4 -14 -8 q-2 -8 6 -16z', '#b9763f') + '</g>'
def leaf(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-80 10 q80 -120 160 0 q-80 100 -160 0z', '#58b947') + '<path d="M-80 10 q80 -14 160 0" stroke="#2f8a3d" stroke-width="5" fill="none"/>' + shine(-10, -20, 40, 22) + '</g>'
def hole(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + ell(0, 0, 90, 34, '#7a4e26', 5) + ell(0, 4, 74, 24, '#2c1d24', 0) + '</g>'
def cage(x, y, s=1):
    bars = ''.join(f'<path d="M{i} 0 V150" stroke="{OL}" stroke-width="10"/><path d="M{i} 0 V150" stroke="#b0b7c3" stroke-width="5"/>' for i in range(30, 190, 40))
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M0 0 H190 V150 H0z', 'none', 10) + bars + shp('M-6 -6 H196 V10 H-6z', '#8c93a1', 4) + '</g>'

# ---------- faces ----------
def face(cx, cy, s=1, mood='smile', look=0):
    e = ''
    for dx in (-15, 15):
        if mood == 'sleep':
            e += f'<path d="M{cx+dx*s-8*s} {cy} q{8*s} {8*s} {16*s} 0" stroke="{OL}" stroke-width="{3.5*s}" fill="none" stroke-linecap="round"/>'
        else:
            e += (f'<ellipse cx="{cx+dx*s}" cy="{cy}" rx="{10*s}" ry="{12*s}" fill="#fff" stroke="{OL}" stroke-width="{2.5*s}"/>'
                  f'<circle cx="{cx+dx*s+look*3*s}" cy="{cy+1*s}" r="{6*s}" fill="{OL}"/><circle cx="{cx+dx*s+look*3*s+2*s}" cy="{cy-2*s}" r="{2.3*s}" fill="#fff"/>')
    blush = f'<ellipse cx="{cx-27*s}" cy="{cy+13*s}" rx="{6*s}" ry="{4*s}" fill="#ff8fa3" opacity=".6"/><ellipse cx="{cx+27*s}" cy="{cy+13*s}" rx="{6*s}" ry="{4*s}" fill="#ff8fa3" opacity=".6"/>'
    my = cy + 18 * s
    m = {'smile': f'<path d="M{cx-9*s} {my} q{9*s} {10*s} {18*s} 0" stroke="{OL}" stroke-width="{3.2*s}" fill="none" stroke-linecap="round"/>',
         'sleep': f'<path d="M{cx-6*s} {my} q{6*s} {5*s} {12*s} 0" stroke="{OL}" stroke-width="{3*s}" fill="none" stroke-linecap="round"/>',
         'open': f'<path d="M{cx-14*s} {my-2*s} q{14*s} {26*s} {28*s} 0z" fill="#8c2f39" stroke="{OL}" stroke-width="{3*s}" stroke-linejoin="round"/><ellipse cx="{cx}" cy="{my+8*s}" rx="{7*s}" ry="{4*s}" fill="#ff8fa3"/>',
         'oh': f'<ellipse cx="{cx}" cy="{my+3*s}" rx="{5*s}" ry="{7*s}" fill="#8c2f39" stroke="{OL}" stroke-width="{2.5*s}"/>',
         'sad': f'<path d="M{cx-9*s} {my+6*s} q{9*s} {-10*s} {18*s} 0" stroke="{OL}" stroke-width="{3.2*s}" fill="none" stroke-linecap="round"/>'}[mood]
    brows = ''
    if mood in ('sad', 'oh'):
        brows = f'<path d="M{cx-26*s} {cy-20*s} l{14*s} {-4*s} M{cx+26*s} {cy-20*s} l{-14*s} {-4*s}" stroke="{OL}" stroke-width="{3*s}" stroke-linecap="round"/>'
    return e + blush + m + brows

def g(x, y, s, flip, inner):
    fl = f' scale(-1 1)' if flip else ''
    return f'<g transform="translate({x} {y-26*s}) scale({s}){fl}">{inner}</g>'

# ---------- characters (they face left unless flip=True) ----------
def hen(x, y, s=1, flip=False, mood='smile'):
    body = (shp('M-62 6 q0 -58 58 -58 q64 0 70 56 q4 46 -62 48 q-66 0 -66 -46z', '#ec5b3f') + shine(-20, -22, 38, 24)
            + shp('M-30 8 q36 30 76 -8 q6 40 -34 46 q-34 0 -42 -38z', '#ffd9a0', 3)
            + shp('M26 -14 q56 -20 52 26 q-26 22 -52 -4 q10 -10 0 -22z', '#c43f2b') + '<path d="M40 -4 q14 4 22 14" stroke="#9a2c1c" stroke-width="3" fill="none"/>'
            + shp('M-52 -34 q-14 -62 32 -58 q42 -6 34 48 q-30 26 -66 10z', '#ec5b3f')
            + shp('M-36 -86 q-4 -28 14 -22 q4 -22 24 -8 q14 -14 20 8 q-4 22 -28 28 q-20 6 -30 -6z', '#e0222d', 3)
            + shp('M-54 -48 l-34 12 l34 12z', '#ffb524', 3) + shp('M-50 -22 q-8 22 8 22 q10 -6 4 -22z', '#e0222d', 3)
            + face(-18, -50, .85, mood) + shp('M-26 56 v26 M-30 82 l-14 4 M-26 82 l-2 8 M-26 82 l12 6 M18 56 v26 M14 82 l-14 4 M18 82 l-2 8 M18 82 l12 6', 'none', 5))
    return g(x, y, s, flip, body)
def dog(x, y, s=1, flip=False, mood='smile'):
    body = (shp('M60 -4 q44 -38 56 -6 q-30 0 -36 22z', '#c48a4f') + shp('M-64 0 q0 -48 64 -48 q64 0 64 48 q0 40 -64 40 q-64 0 -64 -40z', '#d9a066') + shine(-10, -26, 44, 22)
            + shp('M-26 4 q26 22 56 0 q4 34 -28 36 q-30 -2 -28 -36z', '#fff0d8', 3)
            + shp('M-30 -24 q-48 -4 -52 -50 q-4 -44 44 -40 q52 -2 54 44 q-2 44 -46 46z', '#d9a066')
            + shp('M-74 -90 q-34 6 -32 50 q2 30 22 22 q16 -26 10 -72z', '#8d5428') + shp('M-8 -96 q26 4 30 30 q-4 28 -26 20z', '#8d5428')
            + ell(-30, -32, 24, 17, '#fff0d8', 3) + shp('M-44 -42 q14 -8 26 0 q-2 10 -14 10 q-12 0 -12 -10z', '#3b2a3f', 2)
            + face(-34, -62, .8, mood) + shp('M-50 36 v18 M-4 36 v18 M30 36 v18', 'none', 9))
    return g(x, y, s, flip, body)
def cat(x, y, s=1, flip=False, mood='smile'):
    body = (shp('M54 -2 q60 -30 52 -74 q-6 -8 -12 0 q4 36 -44 54z', '#9aa3b5') + shp('M-56 0 q0 -44 56 -44 q56 0 56 44 q0 36 -56 36 q-56 0 -56 -36z', '#aab3c6') + shine(-10, -22, 40, 20)
            + '<path d="M10 -40 v16 M30 -36 v16 M50 -28 v14" stroke="#7e879c" stroke-width="6" stroke-linecap="round"/>'
            + shp('M-34 -22 q-34 -6 -40 -40 q-4 -36 42 -34 q44 -2 42 34 q-8 34 -44 40z', '#aab3c6')
            + shp('M-70 -86 l-4 -36 l30 20z', '#aab3c6') + shp('M-8 -92 l8 -34 l22 28z', '#aab3c6') + shp('M-66 -92 l-2 -20 l16 12z', '#ffb3c6', 2) + shp('M-2 -98 l6 -20 l12 16z', '#ffb3c6', 2)
            + '<path d="M-30 -62 v10 M-38 -62 v8 M-22 -62 v8" stroke="#7e879c" stroke-width="4" stroke-linecap="round"/>'
            + face(-34, -56, .8, mood) + shp('M-36 -38 l-3 5 l6 0z', '#ff8fa3', 2)
            + '<path d="M-58 -42 h-24 M-58 -36 l-22 6 M10 -42 h22 M10 -36 l20 6" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>'
            + shp('M-40 34 v16 M0 34 v16 M30 34 v16', 'none', 9))
    return g(x, y, s, flip, body)
def lion(x, y, s=1, flip=False, mood='smile'):
    mane = ''.join(circ(-40 + 74 * __import__('math').cos(a * 0.5236), -40 + 74 * __import__('math').sin(a * 0.5236), 30, '#d27a1f', 4) for a in range(12))
    body = (shp('M60 -2 q70 -10 74 -56 q-4 -16 -16 -4 q-6 36 -62 40z', '#e8a035') + circ(134, -60, 18, '#a8501a', 4)
            + shp('M-58 20 q-10 -60 70 -66 q90 6 80 66 q-4 40 -76 40 q-72 0 -74 -40z', '#f0b24a') + shine(20, -20, 60, 28)
            + shp('M-34 40 v28 M30 40 v28 M70 36 v32', 'none', 12)
            + mane + circ(-40, -40, 56, '#f6c25f', 4)
            + circ(-84, -92, 14, '#f6c25f', 4) + circ(4, -92, 14, '#f6c25f', 4) + circ(-84, -92, 7, '#ffb3c6', 0) + circ(4, -92, 7, '#ffb3c6', 0)
            + face(-40, -46, 1.0, mood) + shp('M-48 -20 q8 -9 16 0 q-8 9 -16 0z', '#7a3b12', 3) + '<path d="M-72 -26 h-28 M-72 -18 l-26 8 M-8 -26 h28 M-8 -18 l26 8" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>')
    return g(x, y, s, flip, body)
def mouse(x, y, s=1, flip=False, mood='smile'):
    body = (f'<path d="M44 6 q60 4 62 -44 q0 -22 -16 -22" fill="none" stroke="{OL}" stroke-width="9" stroke-linecap="round"/><path d="M44 6 q60 4 62 -44 q0 -22 -16 -22" fill="none" stroke="#ffb3c6" stroke-width="4" stroke-linecap="round"/>'
            + shp('M-44 8 q0 -40 44 -40 q46 0 46 40 q0 24 -46 24 q-44 0 -44 -24z', '#c6ccdc') + shine(-6, -14, 28, 14)
            + shp('M-40 -10 q-34 -4 -40 -26 q-4 -24 30 -22 q40 2 38 24 q-4 20 -28 24z', '#c6ccdc')
            + circ(-58, -62, 22, '#c6ccdc') + circ(-58, -62, 12, '#ffb3c6', 0) + circ(-14, -66, 22, '#c6ccdc') + circ(-14, -66, 12, '#ffb3c6', 0)
            + face(-44, -26, .7, mood) + circ(-76, -12, 6, '#ff6f91', 2)
            + '<path d="M-74 -14 h-22 M-74 -8 l-20 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' + shp('M-20 30 v10 M14 30 v10', 'none', 7))
    return g(x, y, s, flip, body)
def chick(x, y, s=1, flip=False):
    return g(x, y, s, flip, circ(0, 0, 24, '#ffe14d') + shine(-6, -8, 14, 10) + shp('M-24 -2 l-14 5 l14 5z', '#ffb524', 3) + circ(-10, -6, 4, OL, 0) + circ(-9, -7.5, 1.4, '#fff', 0) + '<path d="M-6 24 v10 M6 24 v10" stroke="#ffb524" stroke-width="4"/>'
             + shp('M10 -4 q18 -4 14 10 q-10 6 -18 -2z', '#ffc81f', 2.5))
def bird(x, y, s=1, flip=False):
    return g(x, y, s, flip, shp('M-40 4 q0 -34 40 -34 q42 0 44 34 q-4 28 -44 28 q-40 0 -40 -28z', '#47a8ff') + shine(-6, -16, 26, 14)
             + shp('M-38 -2 l-24 6 l24 8z', '#ffb524', 3) + face(-14, -10, .55, 'smile') + shp('M14 -4 q30 -20 38 6 q-20 14 -38 6z', '#2f86d9', 3) + shp('M-10 32 v14 M10 32 v14', 'none', 5))
def hunter(x, y, s=1, flip=False):
    return g(x, y, s, flip, shp('M-30 -40 H30 V40 q-30 12 -60 0z', '#3f9f56') + shp('M-30 40 H-6 V86 H-30z', '#4a5a8a') + shp('M6 40 H30 V86 H6z', '#4a5a8a')
             + circ(0, -62, 28, '#f6c9a0') + shp('M-34 -72 q34 -30 68 0 l8 8 h-84z', '#7a4e26') + face(0, -62, .55, 'sad', -1) + shp('M-16 -34 q16 14 32 0', '#fff', 0))

# ---------- picture-question pictures ----------
def card(inner, bgc='#fff7e0'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs()}<rect width="{W}" height="{H}" fill="{bgc}"/><circle cx="400" cy="250" r="190" fill="#fff" stroke="#ffe0a3" stroke-width="10"/>{inner}</svg>'

def kid(x, y, s=1, flip=False, mood='smile', arms_up=False):
    arm = (shp('M-26 -18 q-34 -30 -26 -62', 'none', 11) if arms_up else shp('M-28 -10 q-22 30 -6 46', 'none', 11))
    body = (shp('M-30 -30 H30 V50 q-30 10 -60 0z', '#ff7a59') + shine(-8, -8, 22, 30) + arm + shp('M-30 50 H-6 V96 H-30z', '#4a6fd6') + shp('M6 50 H30 V96 H6z', '#4a6fd6')
            + shp('M-34 94 h30 v10 h-34z', '#3b2a3f', 3) + shp('M4 94 h30 v10 h-30z', '#3b2a3f', 3)
            + circ(0, -62, 34, '#ffd6b0') + shp('M-36 -66 q4 -44 38 -40 q36 -2 34 40 q-14 -20 -34 -18 q-24 0 -38 18z', '#6b3f1d') + face(0, -58, .72, mood))
    return g(x, y, s, flip, body)
def kite(x, y, s=1, rot=0, c1='#ff3b3b', c2='#c71f1f'):
    return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">' + shp('M0 -60 L44 0 L0 70 L-44 0z', c1) + shp('M0 -60 L44 0 L0 70z', c2, 4) + '<path d="M0 -60 V70 M-44 0 H44" stroke="#3b2a3f" stroke-width="3" opacity=".6"/>'
            + shp('M0 70 q-14 24 6 44 q14 22 -6 40', 'none', 3) + shp('M-8 100 l-12 -8 l-2 14z M8 128 l12 -8 l2 14z', '#ffd23f', 2.5) + '</g>')
def seed(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M0 -22 q22 8 14 28 q-10 18 -14 18 q-4 0 -14 -18 q-8 -20 14 -28z', '#8d5428') + shine(-4, -6, 10, 10) + '</g>'
def sprout(x, y, s=1, grow=1):
    return f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0 V{-60*grow}" stroke="{OL}" stroke-width="12" stroke-linecap="round"/><path d="M0 0 V{-60*grow}" stroke="#58b947" stroke-width="6" stroke-linecap="round"/>' + shp(f'M0 {-40*grow} q-46 -20 -50 {-4*grow-6} q36 22 50 {4}z', '#6fcb55', 3) + shp(f'M0 {-50*grow} q46 -24 52 {-8*grow-4} q-38 26 -52 {6}z', '#7fdc62', 3) + '</g>'
def flower_big(x, y, s=1, c='#ff6b9d'):
    pet = ''.join(f'<ellipse cx="0" cy="-34" rx="17" ry="26" fill="{c}" stroke="{OL}" stroke-width="4" transform="rotate({a})"/>' for a in range(0, 360, 60))
    return f'<g transform="translate({x} {y}) scale({s})"><path d="M0 0 V110" stroke="{OL}" stroke-width="12"/><path d="M0 0 V110" stroke="#58b947" stroke-width="6"/>' + shp('M0 80 q-40 -26 -52 -2 q30 20 52 2z', '#6fcb55', 3) + pet + circ(0, 0, 20, '#ffd23f', 4) + shine(-6, -6, 10, 8) + '</g>'
def carrot(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-24 -50 q24 -30 48 0 q-6 60 -24 120 q-18 -60 -24 -120z', '#ff8c2b') + shine(-8, -30, 12, 26) + '<path d="M-14 -20 h14 M-6 10 h14 M-4 40 h8" stroke="#d96a12" stroke-width="4" stroke-linecap="round"/>' + shp('M-12 -50 q-16 -30 -6 -46 q14 14 12 46z M0 -52 q-4 -36 8 -50 q10 20 0 52z M12 -50 q10 -28 26 -34 q2 20 -16 36z', '#58b947', 3) + '</g>'
def small_tree(x, y, s=1): return tree(x, y, s)
def school(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-130 0 V-110 H130 V0z', '#ffb347') + shp('M-142 -108 L0 -190 L142 -108z', '#c0392b') + shp('M-28 0 V-62 H28 V0z', '#7a4e26') + circ(0, -140, 18, '#fff4dc', 4) + ''.join(shp(f'M{dx-20} -92 h40 v32 h-40z', '#9fd8ff', 3) for dx in (-85, 85)) + '</g>'
def beach(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-200 40 Q0 -60 200 40 V120 H-200z', '#ffe08a') + shp('M-200 40 Q0 -20 200 40 V70 Q0 20 -200 70z', '#4dc3ff', 4) + shp('M-20 -10 v-110', 'none', 8) + shp('M-20 -120 q-80 0 -100 50 H80 q-10 -50 -100 -50z', '#ff6b6b') + '</g>'
def park_swing(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})">' + shp('M-90 90 L-50 -90 L-10 90 M10 90 L50 -90 L90 90 M-50 -90 H50', 'none', 9) + shp('M-26 -86 V40 M26 -86 V40', 'none', 4) + shp('M-44 40 H44 V56 H-44z', '#ffd23f', 4) + '</g>'
