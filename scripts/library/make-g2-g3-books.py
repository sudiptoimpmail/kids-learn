#!/usr/bin/env python3
"""Writes the Grade 2 and Grade 3 free stories (original retellings of traditional public-domain tales)
and their flat, hand-built SVG pictures:  python3 scripts/library/make-g2-g3-books.py
  library/little-red-hen/  (Grade 2)    library/lion-and-mouse/  (Grade 3)"""
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'library')
W, H = 800, 500

def svg(body, sky='#d9f1ff'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="{sky}"/>{body}</svg>'

def ground(c='#a1ce7a', y=350):
    return f'<path d="M0 {y} Q400 {y-60} 800 {y} V500 H0" fill="{c}"/>'

SUN = '<circle cx="700" cy="80" r="44" fill="#ffd766"/>'
def hen(x, y, s=1, c='#c0392b'):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="48" ry="40" fill="{c}"/><circle cx="-34" cy="-40" r="22" fill="{c}"/>'
            '<path d="M-56 -40 l-18 8 l18 6z" fill="#f2a900"/><circle cx="-40" cy="-46" r="4" fill="#222"/><path d="M-36 -64 q6 -14 12 0 q6 -12 12 2" fill="#e03131"/>'
            f'<path d="M30 -6 q40 -30 34 10 q-14 -4 -34 8z" fill="#962d22"/><path d="M-10 38 v18 M10 38 v18" stroke="#f2a900" stroke-width="5"/></g>')
def dog(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="52" ry="30" fill="#b9854f"/><circle cx="-50" cy="-24" r="24" fill="#b9854f"/>'
            '<ellipse cx="-66" cy="-34" rx="10" ry="18" fill="#7a4e26"/><circle cx="-56" cy="-28" r="4" fill="#222"/><circle cx="-72" cy="-18" r="5" fill="#222"/>'
            '<path d="M48 -10 q30 -26 36 -4" stroke="#b9854f" stroke-width="10" fill="none"/><path d="M-30 26 v22 M30 26 v22" stroke="#7a4e26" stroke-width="9"/></g>')
def cat(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="42" ry="28" fill="#8e8e93"/><circle cx="-42" cy="-24" r="22" fill="#8e8e93"/>'
            '<path d="M-60 -40 l6 -22 l12 16z M-36 -42 l10 -20 l6 22z" fill="#8e8e93"/><circle cx="-48" cy="-26" r="3.5" fill="#222"/><circle cx="-34" cy="-26" r="3.5" fill="#222"/>'
            '<path d="M40 0 q50 -10 36 -50" stroke="#8e8e93" stroke-width="9" fill="none"/><path d="M-24 24 v20 M24 24 v20" stroke="#6d6d72" stroke-width="8"/></g>')
def wheat(x, y, h=90, c='#e0a826'):
    s = f'<g transform="translate({x} {y})"><path d="M0 0 V{-h}" stroke="#8a6d1b" stroke-width="4"/>'
    for i in range(5): s += f'<ellipse cx="-7" cy="{-h+i*13}" rx="6" ry="11" fill="{c}" transform="rotate(-25 -7 {-h+i*13})"/><ellipse cx="7" cy="{-h+i*13}" rx="6" ry="11" fill="{c}" transform="rotate(25 7 {-h+i*13})"/>'
    return s + '</g>'
def field(c='#e0a826', h=90):
    return ''.join(wheat(40 + i * 45, 410 + (i % 2) * 16, h, c) for i in range(17))
def bread(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="70" ry="40" fill="#d99a4e"/><ellipse cx="0" cy="-8" rx="62" ry="30" fill="#e8b36b"/><path d="M-30 -22 q8 12 0 24 M0 -28 q8 14 0 28 M30 -22 q8 12 0 24" stroke="#b4722f" stroke-width="5" fill="none"/></g>'
def steam(x, y): return ''.join(f'<path d="M{x+i*26} {y} q-10 -18 0 -32 q10 -14 0 -28" stroke="#fff" stroke-width="6" fill="none" opacity=".8"/>' for i in range(3))
def tree(x, y, s=1):
    return f'<g transform="translate({x} {y}) scale({s})"><rect x="-18" y="-120" width="36" height="150" fill="#7a4e26"/><circle cx="0" cy="-160" r="95" fill="#4f9d4f"/><circle cx="-60" cy="-120" r="55" fill="#5fb15f"/><circle cx="62" cy="-124" r="55" fill="#5fb15f"/></g>'
def lion(x, y, s=1, awake=True):
    eye = '<circle cx="-14" cy="-6" r="5" fill="#222"/><circle cx="14" cy="-6" r="5" fill="#222"/>' if awake else '<path d="M-20 -6 q6 6 12 0 M8 -6 q6 6 12 0" stroke="#222" stroke-width="4" fill="none"/>'
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="60" cy="50" rx="95" ry="48" fill="#e2a336"/><circle cx="-30" cy="0" r="68" fill="#a8641f"/><circle cx="-30" cy="0" r="48" fill="#f0b648"/>'
            f'<g transform="translate(-30 0)">{eye}<ellipse cx="0" cy="12" rx="8" ry="6" fill="#7a3b12"/><path d="M-12 24 q12 10 24 0" stroke="#7a3b12" stroke-width="4" fill="none"/></g>'
            '<path d="M150 50 q50 -4 54 -40" stroke="#e2a336" stroke-width="12" fill="none"/><ellipse cx="-70" cy="88" rx="26" ry="14" fill="#f0b648"/></g>')
def mouse(x, y, s=1):
    return (f'<g transform="translate({x} {y}) scale({s})"><ellipse cx="0" cy="0" rx="26" ry="18" fill="#b5b5bd"/><circle cx="-26" cy="-4" r="13" fill="#b5b5bd"/><circle cx="-30" cy="-22" r="9" fill="#e9a7b7"/>'
            '<circle cx="-30" cy="-6" r="2.5" fill="#222"/><circle cx="-39" cy="0" r="3" fill="#d6577a"/><path d="M26 0 q36 4 40 -26" stroke="#e9a7b7" stroke-width="3" fill="none"/></g>')
def net(x, y, w=300, h=220):
    s = f'<g transform="translate({x} {y})" stroke="#8a5a2b" stroke-width="5" fill="none">'
    for i in range(0, w + 1, 40): s += f'<path d="M{i} 0 V{h}"/>'
    for j in range(0, h + 1, 40): s += f'<path d="M0 {j} H{w}"/>'
    return s + '</g>'
def rope(x, y): return f'<path d="M{x} {y} q30 -40 60 0 t60 0 t60 0" stroke="#8a5a2b" stroke-width="12" fill="none" stroke-linecap="round"/>'
def hole(x, y): return f'<ellipse cx="{x}" cy="{y}" rx="70" ry="26" fill="#3b2a1d"/>'
def cage(x, y): return f'<g transform="translate({x} {y})" stroke="#555" stroke-width="7" fill="none"><rect width="220" height="170" rx="10"/>' + ''.join(f'<path d="M{i} 0 V170"/>' for i in range(40, 220, 40)) + '</g>'
def apple(x, y): return f'<circle cx="{x}" cy="{y}" r="60" fill="#e03131"/><path d="M{x} {y-60} q4 -26 22 -30" stroke="#5c3b1e" stroke-width="7" fill="none"/>'
def cake(x, y): return f'<rect x="{x-70}" y="{y-20}" width="140" height="70" rx="12" fill="#f2a6c4"/><rect x="{x-70}" y="{y-34}" width="140" height="24" rx="12" fill="#fff"/><circle cx="{x}" cy="{y-48}" r="10" fill="#e03131"/>'
def soup(x, y): return f'<path d="M{x-70} {y-20} h140 a70 60 0 0 1 -140 0z" fill="#c8c8d0"/><ellipse cx="{x}" cy="{y-20}" rx="70" ry="16" fill="#f0a35e"/>'
def stick(x, y): return f'<path d="M{x-80} {y+20} L{x+80} {y-20}" stroke="#7a4e26" stroke-width="16" stroke-linecap="round"/>'
def leaf(x, y): return f'<path d="M{x-60} {y} q60 -90 120 0 q-60 90 -120 0z" fill="#4f9d4f"/><path d="M{x-60} {y} h120" stroke="#2f6f2f" stroke-width="4"/>'
def bird(x, y): return f'<ellipse cx="{x}" cy="{y}" rx="48" ry="34" fill="#4dabf7"/><circle cx="{x-40}" cy="{y-20}" r="22" fill="#4dabf7"/><path d="M{x-62} {y-20} l-18 6 l18 6z" fill="#f2a900"/><circle cx="{x-46}" cy="{y-24}" r="4" fill="#222"/><path d="M{x+20} {y-10} q40 -30 36 12z" fill="#1c7ed6"/>'
def hunter(x, y): return f'<g transform="translate({x} {y})"><circle cx="0" cy="-70" r="24" fill="#f1c9a5"/><rect x="-26" y="-48" width="52" height="80" rx="14" fill="#2f9e44"/><path d="M-30 -86 h60 l-8 -20 h-44z" fill="#6b4423"/><path d="M-18 32 v40 M18 32 v40" stroke="#444" stroke-width="12"/></g>'
def chicks(x, y): return ''.join(f'<circle cx="{x+i*50}" cy="{y}" r="18" fill="#ffd43b"/><path d="M{x+i*50-18} {y} l-10 3 l10 3z" fill="#f2a900"/><circle cx="{x+i*50-8}" cy="{y-5}" r="2.5" fill="#222"/>' for i in range(3))
def barn(): return '<rect x="520" y="200" width="220" height="170" fill="#c0392b"/><path d="M505 205 L630 120 L755 205z" fill="#8e2a20"/><rect x="595" y="270" width="70" height="100" fill="#fff"/>'
def mill(): return '<path d="M560 380 L600 180 h60 L700 380z" fill="#e9d8b4"/><path d="M630 190 l-110 -90 M630 190 l110 -90 M630 190 l-90 100 M630 190 l90 100" stroke="#8a6d1b" stroke-width="10"/><circle cx="630" cy="190" r="12" fill="#8a6d1b"/>'
grass = ground

def put(folder, name, body, sky='#d9f1ff'):
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    open(os.path.join(ROOT, folder, name), 'w').write(svg(body, sky))

# ---------- Grade 2: The Little Red Hen ----------
H2 = 'little-red-hen'
pages2 = [
    ('p01.svg', ['A little red hen found some seeds of wheat.', '"Who will help me plant them?" she asked.'], hen(250, 380, 1.3) + wheat(480, 430, 60) + wheat(520, 440, 60), SUN + grass(), 'The hen holds wheat seeds'),
    ('p02.svg', ['"Not I," said the dog.', '"Not I," said the cat.', 'So the little red hen planted the seeds herself.'], dog(180, 400) + cat(380, 410) + hen(620, 380), SUN + grass(), 'The dog and cat say no, the hen plants'),
    ('p03.svg', ['The sun shone and the rain fell.', 'Soon the wheat grew tall and golden.'], SUN + grass() + field(), None, 'Tall golden wheat'),
    ('p04.svg', ['"Who will help me cut the wheat?" asked the hen.', '"Not I," said the dog. "Not I," said the cat.', 'So she cut it herself.'], SUN + grass() + field('#e0a826', 70) + dog(130, 330, .7) + cat(260, 335, .7) + hen(560, 330, 1), None, 'The hen cuts the wheat'),
    ('p05.svg', ['The hen took the wheat to the mill to make flour.', 'Then she asked, "Who will help me bake the bread?"', '"Not I," said the dog and the cat.'], SUN + grass() + mill() + hen(250, 390, 1.1) + wheat(420, 420, 70), None, 'The hen at the mill'),
    ('p06.svg', ['So the little red hen baked the bread herself.', 'It smelled warm and sweet.'], barn() + grass() + bread(300, 400, 1.4) + steam(260, 340) + hen(130, 400, .9), None, 'Warm bread'),
    ('p07.svg', ['"Who will help me eat it?" asked the hen.', '"I will!" said the dog. "I will!" said the cat.', '"You did not help," said the hen. "My chicks and I will eat it."'], SUN + grass() + bread(250, 410, 1.1) + hen(480, 390, 1) + chicks(580, 440) + dog(110, 320, .6) + cat(200, 330, .6), None, 'The hen and chicks eat the bread'),
    ('p08.svg', ['The dog and the cat felt sorry.', 'Next time, they said, they would help right away.'], SUN + grass() + dog(220, 400) + cat(420, 405) + wheat(600, 430, 70), None, 'The dog and cat ready to help'),
]
q2 = [
    ('What did the hen find?', 'wheat', [('wheat', wheat(400, 380, 220)), ('apple', apple(400, 260)), ('cake', cake(400, 280))]),
    ('What did the hen make?', 'bread', [('bread', bread(400, 280, 2)), ('soup', soup(400, 280)), ('cake', cake(400, 280))]),
    ('Who said "Not I"?', 'dog', [('dog', dog(420, 300, 2)), ('hen', hen(400, 300, 1.8)), ('bird', bird(400, 280))]),
]

# ---------- Grade 3: The Lion and the Mouse ----------
H3 = 'lion-and-mouse'
FOREST = tree(120, 390, .9) + tree(700, 395, 1)
pages3 = [
    ('p01.svg', ['A mighty lion was sleeping under a big tree.', 'A tiny mouse ran across his paw by mistake.'], SUN + grass('#a1ce7a', 360) + tree(560, 400, 1.3) + lion(260, 380, 1, False) + mouse(150, 460, .8), None, 'The mouse runs over the sleeping lion'),
    ('p02.svg', ['The lion woke with a roar and caught the mouse.', '"Please let me go!" squeaked the mouse.', '"Someday I will help you."'], SUN + grass('#a1ce7a', 360) + tree(600, 400, 1.2) + lion(260, 370, 1.1) + mouse(130, 470, .9), None, 'The lion holds the mouse'),
    ('p03.svg', ['The lion laughed.', '"How could a mouse ever help a lion?" he said.', 'But he lifted his paw and let her go.'], SUN + grass('#a1ce7a', 360) + tree(620, 400, 1.2) + lion(300, 370, 1.1) + mouse(130, 470, .9), None, 'The lion lets the mouse go'),
    ('p04.svg', ['A few days later, hunters set a strong rope net in the forest.', 'The lion walked right into it.'], grass('#8fc46a', 340) + FOREST + hunter(690, 330) + net(180, 220, 320, 200) + lion(330, 400, .8), '#c9e6c2', 'The lion is caught in a net'),
    ('p05.svg', ['The lion roared and pulled, but the ropes held tight.', 'All the animals in the forest heard him.'], grass('#8fc46a', 340) + FOREST + net(180, 220, 320, 200) + lion(330, 400, .8) + bird(120, 120) + '<path d="M270 190 q-20 -30 0 -60 M330 180 q-26 -40 0 -80" stroke="#e03131" stroke-width="7" fill="none"/>', '#c9e6c2', 'The lion roars'),
    ('p06.svg', ['The little mouse heard him too.', 'She ran as fast as she could to find the lion.'], grass('#8fc46a', 340) + FOREST + net(450, 230, 280, 180) + lion(560, 400, .7) + mouse(240, 440, 1.1) + '<path d="M120 460 h40 M80 440 h40" stroke="#fff" stroke-width="5" opacity=".7"/>', '#c9e6c2', 'The mouse runs'),
    ('p07.svg', ['"Hold still," said the mouse.', 'She chewed the ropes with her sharp little teeth, one by one.'], grass('#8fc46a', 340) + FOREST + net(220, 200, 340, 220) + lion(380, 400, .9) + mouse(260, 420, 1.2) + rope(520, 250), '#c9e6c2', 'The mouse chews the ropes'),
    ('p08.svg', ['Soon the lion was free.', '"You were kind to me, so I am glad I could help you," said the mouse.', 'From then on, the two were friends.'], SUN + grass('#a1ce7a', 360) + tree(640, 400, 1.2) + lion(280, 380, 1.1) + mouse(470, 450, 1.1), None, 'The lion and the mouse are friends'),
]
q3 = [
    ('What trapped the lion?', 'net', [('net', net(300, 160, 200, 150)), ('cage', cage(290, 150)), ('hole', hole(400, 280))]),
    ('What did the mouse chew?', 'rope', [('rope', rope(260, 280) + rope(260, 340)), ('stick', stick(400, 280)), ('leaf', leaf(400, 280))]),
    ('Who helped the lion?', 'mouse', [('mouse', mouse(420, 300, 4)), ('bird', bird(420, 290)), ('hunter', hunter(420, 300))]),
]

def build(folder, bid, title, grade, pages, qs):
    for name, text, body, extra, sky_or_none, _ in [(p[0], p[1], p[2], None, p[4] if False else None, p[4]) for p in pages]:
        pass
    book = {'id': bid, 'title': title, 'grades': [grade], 'cover': 'p01.svg', 'pages': [], 'questions': []}
    for name, text, body, sky_extra, alt in [(p[0], p[1], p[2], p[3], p[4]) for p in pages]:
        # p[3] is either extra scene (str, starts with '<') or a sky colour
        if isinstance(sky_extra, str) and sky_extra.startswith('<'):
            put(folder, name, sky_extra + body)
        else:
            put(folder, name, body, sky_extra or '#d9f1ff')
        book['pages'].append({'art': name, 'text': text, 'alt': alt})
    for ask, answer, opts in qs:
        for w, art in opts:
            put(folder, w + '.svg', art, '#fff7e0')
        book['questions'].append({'ask': ask, 'answer': answer, 'options': [[w, w + '.svg'] for w, _ in opts]})
    json.dump(book, open(os.path.join(ROOT, folder, 'book.json'), 'w'), indent=2, ensure_ascii=False)
    open(os.path.join(ROOT, folder, 'book.json'), 'a').write('\n')

# page tuples are (file, text, body, extra-or-sky, alt); scenes passed as `extra` are drawn first (background)
def fix(pages):
    out = []
    for name, text, body, extra, alt in pages:
        out.append((name, text, body, extra, alt))
    return out

if __name__ == '__main__':
    build(H2, H2, 'The Little Red Hen', 'g2', [(a, b, c, d, e) for a, b, c, d, e in pages2], q2)
    build(H3, H3, 'The Lion and the Mouse', 'g3', [(a, b, c, d, e) for a, b, c, d, e in pages3], q3)
    print('wrote', H2, H3)
