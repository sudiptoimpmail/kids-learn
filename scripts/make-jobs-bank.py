#!/usr/bin/env python3
"""Builds banks/learn-play.jobs.json, the Jobs question bank (kids-core/question-bank format, see kids-core QUESTION-FORMAT.md):
illustrated workers and the things they wear and use (self-authored SVG), their lessons and every Jobs question.

Each worker is one picture (viewBox -20 -20 240 300). Every named thing (helmet, fire hose, stethoscope ...) is its
own group: <g data-val="fire hose" data-row="4" class="hw-part">, so a child can tap it, a lesson can light it up,
and it can be shown alone as an answer picture (parts[].svg with its own viewBox).
Run:  python3 scripts/make-jobs-bank.py   then   node ../kids-core/tools/check-bank.mjs --grades prek,k,g1,g2,g3 banks/learn-play.jobs.json
"""
import json, os

INK = '#2b2140'
VB = '-20 -20 240 300'

def el(tag, fill=None, **a):
    if fill is not None: a['fill'] = fill
    return '<' + tag + ''.join(f' {k.replace("_", "-")}="{v}"' for k, v in a.items()) + '/>'
def path(d, fill='none', **a): return el('path', fill, d=d, **a)
def rect(x, y, w, h, fill, rx=0, **a): return el('rect', fill, x=x, y=y, width=w, height=h, **({'rx': rx} if rx else {}), **a)
def circ(cx, cy, r, fill, **a): return el('circle', fill, cx=cx, cy=cy, r=r, **a)
def ell(cx, cy, rx, ry, fill, **a): return el('ellipse', fill, cx=cx, cy=cy, rx=rx, ry=ry, **a)
def line(d, color=INK, w=2.5, **a): return path(d, 'none', stroke=color, stroke_width=w, **a)
NS = {'stroke': 'none'}

# ---- the shared body ----
def legs(c): return rect(70, 170, 27, 78, c, 8) + rect(103, 170, 27, 78, c, 8)
def shoes(c, tall=False):
    t = 220 if tall else 244
    return path(f'M68 {t}H98V266H58V258Q58 248 68 246Z', c) + path(f'M102 {t}H132V246Q142 248 142 258V266H102Z', c)
def torso(c, bottom=180): return path(f'M66 108Q66 96 80 96H120Q134 96 134 108V{bottom}H66Z', c)
def arms(c): return rect(44, 98, 24, 76, c, 12, transform='rotate(8 56 100)') + rect(132, 98, 24, 76, c, 12, transform='rotate(-8 144 100)')
def hands(c, r=10): return circ(46, 176, r, c) + circ(154, 176, r, c)
def head(skin):
    return (rect(92, 84, 16, 16, skin) + circ(70, 62, 5, skin) + circ(130, 62, 5, skin) + circ(100, 60, 30, skin))
def face():
    return (circ(89, 60, 3.2, INK, **NS) + circ(111, 60, 3.2, INK, **NS) + path('M90 72q10 8 20 0') +
            circ(81, 70, 4.5, '#ff8787', opacity='.45', **NS) + circ(119, 70, 4.5, '#ff8787', opacity='.45', **NS))
def hair_short(c): return path('M70 58Q68 28 100 28Q132 28 130 58Q120 42 100 44Q80 42 70 58Z', c)
def hair_long_back(c): return path('M68 54Q62 100 76 106H124Q138 100 132 54Z', c)

def part(name, row, body): return f'<g data-val="{name}" data-row="{row}" class="hw-part" role="button" tabindex="0" aria-label="{name}">{body}</g>'
def wrap(body): return f'<g stroke="{INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">{body}</g>'

class Worker:
    def __init__(self, wid, name, does, skin, hair, long_hair=False):
        self.id, self.name, self.does, self.skin, self.hair, self.long = wid, name, does, skin, hair, long_hair
        self.layers, self.parts = [], []          # layers: (z, svg); parts: dicts
    def add(self, z, svg): self.layers.append((z, svg)); return self
    def gear(self, z, name, use, ask, box, svg, also=None):
        """A named thing. svg is drawn at layer z; `also` = [(z, svg)] more pieces of the same thing at other layers."""
        row = len(self.parts) + 1
        pieces = [(z, svg)] + (also or [])
        for zz, s in pieces: self.layers.append((zz, part(name, row, s)))
        self.parts.append({'id': name, 'name': name, 'use': use, 'ask': ask, 'box': box, 'svg': wrap(''.join(s for _, s in sorted(pieces, key=lambda p: p[0])))})
        return self
    def build(self):
        base = [(5, hair_long_back(self.hair))] if self.long else []
        base += [(40, head(self.skin)), (42, hair_short(self.hair)), (44, face())]
        body = ''.join(s for _, s in sorted(self.layers + base, key=lambda p: p[0]))
        return {'id': self.id, 'name': self.name, 'article': 'an' if self.name[0] in 'aeiou' else 'a', 'does': self.does,
                'viewBox': VB, 'svg': wrap(body), 'parts': self.parts}

def blotches(spots, c1, c2):
    return ''.join(ell(x, y, rx, ry, c1 if i % 2 else c2, transform=f'rotate({(i * 37) % 60 - 30} {x} {y})', **NS) for i, (x, y, rx, ry) in enumerate(spots))

# ------------------------------------------------------------------ firefighter
def firefighter():
    w = Worker('firefighter', 'firefighter', 'puts out fires', '#f1c27d', '#5c3b1e')
    w.add(10, legs('#343a40'))
    stripe = '#fff3bf'
    jacket = (arms('#e8a33d') + torso('#e8a33d', 184) + rect(66, 150, 68, 9, stripe) + rect(66, 166, 68, 9, stripe) +
              rect(44, 150, 24, 8, stripe, transform='rotate(8 56 100)') + rect(132, 150, 24, 8, stripe, transform='rotate(-8 144 100)') + line('M100 98V184'))
    w.gear(46, 'helmet', 'keeps the head safe', 'Which one keeps the head safe?', [50, 8, 100, 58],
           path('M66 46Q66 12 100 12Q134 12 134 46Z', '#e03131') + path('M56 45H144Q148 52 138 54H62Q52 52 56 45Z', '#e03131') + path('M100 20l10 5v9q0 7-10 10q-10-3-10-10v-9z', '#fcc419'))
    w.gear(20, 'jacket', 'keeps the body safe from heat', 'Which one keeps the body safe from heat?', [34, 90, 132, 100], jacket)
    w.gear(12, 'boots', 'keep the feet safe and dry', 'Which ones keep the feet safe and dry?', [50, 214, 100, 58],
           shoes('#212529', True) + rect(58, 258, 40, 8, '#fcc419') + rect(102, 258, 40, 8, '#fcc419'))
    hose = (path('M152 182Q176 214 150 238Q134 254 166 262H206', 'none', stroke=INK, stroke_width=14) +
            path('M152 182Q176 214 150 238Q134 254 166 262H206', 'none', stroke='#f59f00', stroke_width=9) +
            path('M146 170L182 150L190 164L154 184Z', '#adb5bd') + path('M180 148L192 142L200 158L188 164Z', '#868e96') +
            circ(206, 138, 4, '#4dabf7') + circ(214, 148, 3.5, '#4dabf7') + circ(212, 128, 3, '#4dabf7'))
    w.gear(60, 'fire hose', 'sprays water on the fire', 'Which one sprays water on the fire?', [128, 118, 92, 154], hose)
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ doctor
def doctor():
    w = Worker('doctor', 'doctor', 'helps sick people get better', '#c68642', '#2b2140', long_hair=True)
    w.add(10, legs('#38d9a9')).add(12, shoes('#f1f3f5'))
    coat = (arms('#ffffff') + torso('#ffffff', 206) + path('M86 96L100 126L114 96Z', '#a5d8ff') + line('M86 96L100 126L114 96') + line('M100 126V206') +
            rect(108, 150, 18, 18, '#ffffff', 2) + circ(94, 150, 2, INK, **NS) + circ(94, 170, 2, INK, **NS))
    w.gear(20, 'white coat', 'keeps the doctor clean', 'Which one keeps the doctor clean?', [34, 90, 132, 122], coat)
    steth = (path('M84 100Q80 138 100 142Q120 138 116 100', 'none', stroke=INK, stroke_width=8) + path('M84 100Q80 138 100 142Q120 138 116 100', 'none', stroke='#74c0fc', stroke_width=4) +
             path('M100 142V158', 'none', stroke=INK, stroke_width=8) + path('M100 142V158', 'none', stroke='#74c0fc', stroke_width=4) +
             circ(100, 166, 10, '#ced4da') + circ(100, 166, 4, '#868e96') + circ(84, 98, 4, '#495057') + circ(116, 98, 4, '#495057'))
    w.gear(52, 'stethoscope', 'lets the doctor hear your heart', 'Which one lets the doctor hear your heart?', [70, 88, 60, 94], steth)
    bag = (path('M32 190q14 -20 28 0', 'none', stroke=INK, stroke_width=8) + path('M32 190q14 -20 28 0', 'none', stroke='#8d5a2b', stroke_width=4) +
           rect(16, 188, 60, 44, '#a0522d', 8) + circ(46, 210, 13, '#ffffff') + path('M46 201v18M37 210h18', 'none', stroke='#e03131', stroke_width=6))
    w.gear(56, "doctor's bag", "holds the doctor's tools", "Which one holds the doctor's tools?", [8, 166, 76, 72], bag)
    thermo = f'<g transform="rotate(24 154 176)">{rect(148, 118, 12, 58, "#ffffff", 6)}{path("M154 128V160", "none", stroke="#e03131", stroke_width=4)}{circ(154, 122, 8, "#e03131")}{line("M160 138h-4M160 146h-4M160 154h-4", w=1.6)}</g>'
    w.gear(48, 'thermometer', 'shows if you have a fever', 'Which one shows if you have a fever?', [150, 100, 60, 84], thermo)
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ police officer
def police():
    w = Worker('police officer', 'police officer', 'keeps people safe', '#ffdbac', '#8d5a2b')
    navy = '#27408b'
    w.add(10, legs('#1f3270')).add(12, shoes('#212529')).add(20, arms(navy) + torso(navy) + line('M100 98V166') + path('M86 96L100 112L114 96', 'none'))
    w.add(22, rect(66, 166, 68, 13, '#212529') + rect(92, 164, 16, 17, '#fcc419', 2))
    cap = (path('M66 40Q66 12 100 10Q134 12 134 40Z', navy) + rect(66, 34, 68, 10, '#1f3270') + path('M66 44H134Q142 54 100 54Q58 54 66 44Z', '#212529') + circ(100, 24, 7, '#fcc419'))
    w.gear(46, 'police cap', "keeps the sun out of the officer's eyes", "Which one keeps the sun out of the officer's eyes?", [52, 8, 96, 60], cap)
    w.gear(30, 'badge', "shows the officer's name and number", "Which one shows the officer's name and number?", [100, 100, 36, 40],
           path('M118 106l11 5v9q0 9-11 13q-11-4-11-13v-9z', '#fcc419') + circ(118, 119, 3.5, '#f08c00', **NS))
    radio = (line('M78 108V90', w=3) + rect(72, 106, 16, 26, '#343a40', 3) + line('M76 114h8M76 119h8', '#adb5bd', 1.8) + circ(80, 126, 2.4, '#e03131', **NS))
    w.gear(32, 'radio', 'lets the officer call for help', 'Which one lets the officer call for help?', [58, 82, 44, 58], radio)
    torch = f'<g transform="rotate(-24 154 176)">{path("M190 166L212 154V198L190 186Z", "#ffe066", stroke="none", opacity=".85")}{rect(148, 169, 32, 14, "#495057", 4)}{path("M180 166H190V186H180Z", "#868e96")}{circ(160, 176, 2.6, "#fcc419", **NS)}</g>'
    w.gear(60, 'flashlight', 'helps the officer see in the dark', 'Which one helps the officer see in the dark?', [140, 110, 80, 80], torch)
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ soldier
def soldier():
    w = Worker('soldier', 'soldier', 'keeps the country safe', '#e0ac69', '#2b2140')
    g, d, l = '#7a8b45', '#4b5d23', '#b3bd7a'
    camo = (legs(g) + arms(g) + torso(g) + line('M100 98V180') + rect(110, 112, 18, 14, g, 2) +
            blotches([(78, 116, 8, 5), (96, 140, 9, 5), (120, 150, 8, 5), (84, 164, 9, 5), (118, 134, 6, 4), (52, 126, 5, 8), (50, 154, 5, 7), (148, 124, 5, 8), (150, 152, 5, 7),
                      (82, 196, 7, 9), (86, 226, 6, 8), (116, 190, 7, 8), (118, 222, 6, 9)], d, l))
    w.gear(20, 'camouflage', 'helps a soldier hide', 'Which one helps a soldier hide?', [34, 90, 132, 162], camo)
    helmet = (path('M70 54Q76 94 100 96Q124 94 130 54', 'none', stroke=INK, stroke_width=7) + path('M70 54Q76 94 100 96Q124 94 130 54', 'none', stroke='#5c4a2a', stroke_width=3.5))
    shell = (path('M62 47Q60 10 100 10Q140 10 138 47Q138 54 130 54H70Q62 54 62 47Z', '#5f7332') + blotches([(82, 30, 9, 5), (108, 22, 8, 5), (122, 40, 8, 4), (94, 44, 7, 4)], d, l))
    w.gear(46, 'helmet', 'keeps the head safe', 'Which one keeps the head safe?', [50, 6, 100, 96], shell, also=[(45, helmet)])
    boots = shoes('#a67c52', True) + line('M70 230h20M70 238h20M110 230h20M110 238h20', '#5c3b1e', 2) + rect(58, 259, 40, 7, '#5c3b1e') + rect(102, 259, 40, 7, '#5c3b1e')
    w.gear(12, 'boots', 'keep the feet safe on long walks', 'Which ones keep the feet safe on long walks?', [50, 214, 100, 58], boots)
    pack = (rect(-12, 196, 56, 68, '#5f7332', 12) + rect(-6, 184, 44, 18, '#8a7a4f', 9) + rect(0, 222, 32, 24, '#4b5d23', 4) +
            line('M-2 196v20M34 196v20', '#3b4a1c', 5) + rect(10, 230, 12, 6, '#b3bd7a', 2))
    w.gear(60, 'backpack', 'carries food, water and tools', 'Which one carries food, water and tools?', [-18, 176, 68, 94], pack)
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ builder
def builder():
    w = Worker('builder', 'builder', 'builds houses', '#8d5524', '#2b2140')
    w.add(10, legs('#3b5bdb')).add(12, shoes('#8d5a2b', True)).add(20, arms('#74c0fc') + torso('#74c0fc'))
    vest = (path('M70 96H88L100 116L112 96H130Q134 100 134 108V172H66V108Q66 100 70 96Z', '#fd7e14') + rect(74, 100, 9, 72, '#fff3bf') + rect(117, 100, 9, 72, '#fff3bf') +
            rect(66, 146, 68, 9, '#fff3bf') + line('M100 116V172'))
    w.gear(24, 'safety vest', 'helps drivers see the builder', 'Which one helps drivers see the builder?', [58, 90, 84, 88], vest)
    hat = (path('M68 44Q68 12 100 12Q132 12 132 44Z', '#fcc419') + path('M93 12h14v32h-14z', '#f59f00') + path('M58 43H142V48Q142 54 136 54H64Q58 54 58 48Z', '#fcc419'))
    w.gear(46, 'hard hat', 'keeps the head safe', 'Which one keeps the head safe?', [50, 8, 100, 58], hat)
    hammer = f'<g transform="rotate(18 154 176)">{rect(150, 112, 9, 70, "#b9774a", 3)}{path("M136 100H170Q178 100 178 108V116H166V112H148V118H136Z", "#868e96")}</g>'
    w.gear(48, 'hammer', 'hits nails into wood', 'Which one hits nails into wood?', [140, 90, 74, 100], hammer)
    belt = (rect(62, 170, 76, 13, '#8d5a2b') + rect(93, 168, 14, 17, '#fcc419', 2) + rect(68, 180, 22, 26, '#a9713d', 4) + rect(112, 180, 20, 24, '#a9713d', 4) +
            rect(74, 166, 5, 18, '#e03131', 2) + rect(82, 168, 4, 16, '#adb5bd', 2) + path('M118 180v-12h8v12', '#ced4da'))
    w.gear(30, 'tool belt', 'holds the tools', 'Which one holds the tools?', [54, 158, 92, 56], belt)
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ chef
def chef():
    w = Worker('chef', 'chef', 'cooks yummy food', '#ffdbac', '#b9774a', long_hair=True)
    w.add(10, legs('#343a40')).add(12, shoes('#212529'))
    w.add(20, arms('#f8f9fa') + torso('#f8f9fa') + line('M100 98V150') + ''.join(circ(x, y, 2.4, INK, **NS) for x in (90, 110) for y in (112, 128, 144)) + path('M86 96L100 110L114 96', 'none'))
    hat = (path('M70 34Q48 26 60 6Q70 -10 90 0Q100 -12 112 0Q132 -8 140 8Q150 26 130 34Z', '#ffffff') + rect(72, 30, 56, 16, '#ffffff') + line('M86 12v14M100 8v18M114 12v14', '#ced4da', 2))
    w.gear(46, 'chef hat', 'keeps hair out of the food', 'Which one keeps hair out of the food?', [44, -16, 112, 68], hat)
    apron = (path('M68 152H132V228Q100 236 68 228Z', '#74c0fc') + rect(64, 148, 72, 9, '#4dabf7') + path('M64 152Q54 158 50 168M136 152Q146 158 150 168', 'none') + rect(86, 176, 28, 22, '#a5d8ff', 4))
    w.gear(26, 'apron', 'keeps the clothes clean', 'Which one keeps the clothes clean?', [44, 140, 112, 100], apron)
    ladle = f'<g transform="rotate(16 154 176)">{rect(151, 108, 7, 70, "#adb5bd", 3)}{path("M138 94Q138 116 154 116Q170 116 170 94Z", "#ced4da")}{path("M140 96Q154 104 168 96", "none")}</g>'
    w.gear(48, 'ladle', 'scoops the soup', 'Which one scoops the soup?', [136, 78, 70, 106], ladle)
    pot = (line('M26 170q-6 -10 2 -18M44 168q-6 -10 2 -18', '#adb5bd', 3) + rect(12, 186, 62, 40, '#868e96', 6) + rect(6, 178, 74, 11, '#adb5bd', 5) + rect(0, 196, 14, 8, '#495057', 3) + rect(72, 196, 14, 8, '#495057', 3))
    w.gear(56, 'pot', 'cooks the soup', 'Which one cooks the soup?', [-6, 146, 98, 88], pot)
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ farmer
def farmer():
    w = Worker('farmer', 'farmer', 'grows food and feeds animals', '#f1c27d', '#e8590c')
    shirt = '#e03131'
    w.add(20, arms(shirt) + torso(shirt) + line('M52 118l10 2M50 140l10 2M48 160l10 2M138 120l10 -2M140 142l10 -2M142 162l10 -2', '#ffa8a8', 2))
    overalls = (legs('#3b5bdb') + rect(66, 150, 68, 32, '#3b5bdb') + rect(80, 118, 40, 40, '#3b5bdb', 4) + path('M84 120L78 96M116 120L122 96', 'none', stroke=INK, stroke_width=11) +
                path('M84 120L78 96M116 120L122 96', 'none', stroke='#3b5bdb', stroke_width=6.5) + circ(85, 124, 3.5, '#fcc419') + circ(115, 124, 3.5, '#fcc419') + rect(90, 132, 20, 14, '#5c7cfa', 2))
    w.gear(24, 'overalls', 'keep the clothes clean on the farm', 'Which ones keep the clothes clean on the farm?', [56, 90, 88, 162], overalls)
    hat = (path('M74 40Q72 8 100 8Q128 8 126 40Z', '#f0c27b') + path('M74 30h52v9H74z', '#c92a2a') + ell(100, 43, 54, 10, '#f0c27b') + line('M60 43q40 7 80 0', '#d9a441', 2))
    w.gear(46, 'straw hat', 'keeps the sun off the face', 'Which one keeps the sun off the face?', [40, 4, 120, 58], hat)
    fork = (rect(151, 58, 7, 206, '#b9774a', 3) + path('M138 62V30M154.5 62V22M171 62V30', 'none', stroke=INK, stroke_width=8) + path('M138 62V30M154.5 62V22M171 62V30', 'none', stroke='#adb5bd', stroke_width=4) + rect(134, 58, 41, 9, '#868e96', 3))
    w.gear(48, 'pitchfork', 'lifts the hay', 'Which one lifts the hay?', [124, 14, 62, 256], fork)
    w.gear(26, 'boots', 'keep the feet dry in the mud', 'Which ones keep the feet dry in the mud?', [50, 214, 100, 58], shoes('#2f9e44', True) + rect(66, 220, 34, 8, '#40c057') + rect(100, 220, 34, 8, '#40c057'))
    w.add(50, hands(w.skin))
    return w.build()

# ------------------------------------------------------------------ astronaut
def astronaut():
    w = Worker('astronaut', 'astronaut', 'goes into space', '#c68642', '#2b2140')
    white, grey = '#f8f9fa', '#ced4da'
    suit = (legs(white) + arms(white) + torso(white) + rect(66, 164, 68, 10, grey) + rect(82, 114, 36, 28, '#dee2e6', 5) + circ(92, 124, 4, '#e03131') + circ(104, 124, 4, '#40c057') + rect(88, 132, 24, 5, '#4dabf7', 2) +
            rect(70, 204, 27, 8, grey) + rect(103, 204, 27, 8, grey) + rect(44, 136, 24, 8, grey, transform='rotate(8 56 100)') + rect(132, 136, 24, 8, grey, transform='rotate(-8 144 100)'))
    w.gear(20, 'space suit', 'keeps the body safe in space', 'Which one keeps the body safe in space?', [34, 90, 132, 162], suit)
    shell = circ(100, 60, 44, white) + rect(74, 96, 52, 12, grey, 6)
    glass = ell(100, 60, 34, 32, '#a5d8ff', fill_opacity='.22') + path('M78 44Q86 32 100 30', 'none', stroke='#ffffff', stroke_width=4)
    w.gear(8, 'space helmet', 'gives the astronaut air', 'Which one gives the astronaut air?', [50, 10, 100, 102], shell, also=[(47, glass)])
    w.gear(50, 'gloves', 'keep the hands safe and warm', 'Which ones keep the hands safe and warm?', [22, 152, 50, 46],
           circ(46, 178, 15, '#adb5bd') + circ(154, 178, 15, '#adb5bd') + rect(34, 160, 26, 9, '#868e96', 3, transform='rotate(8 46 164)') + rect(140, 160, 26, 9, '#868e96', 3, transform='rotate(-8 154 164)'))
    w.gear(12, 'moon boots', 'grip the ground on the moon', 'Which ones grip the ground on the moon?', [46, 214, 108, 60],
           path('M66 222H98V268H54V256Q54 246 66 244Z', '#adb5bd') + path('M102 222H134V244Q146 246 146 256V268H102Z', '#adb5bd') + rect(54, 260, 44, 8, '#495057') + rect(102, 260, 44, 8, '#495057'))
    return w.build()

WORKERS = [firefighter(), doctor(), police(), soldier(), builder(), chef(), farmer(), astronaut()]

# every job a child meets in "who helps us?" and "all the jobs": name, picture, what they do, their tools
JOBS = [["firefighter", "🧑‍🚒", "puts out fires", "🔥🚒"], ["doctor", "🧑‍⚕️", "helps sick people get better", "🩺💊"], ["teacher", "🧑‍🏫", "teaches children at school", "📚✏️"],
        ["chef", "🧑‍🍳", "cooks yummy food", "🍲🥘"], ["farmer", "🧑‍🌾", "grows food and feeds animals", "🌽🐄"], ["police officer", "👮", "keeps people safe", "🚓🚨"],
        ["pilot", "🧑‍✈️", "flies airplanes", "✈️☁️"], ["astronaut", "🧑‍🚀", "goes into space", "🚀🌙"], ["mechanic", "🧑‍🔧", "fixes cars", "🚗🔧"],
        ["artist", "🧑‍🎨", "paints pictures", "🎨🖌️"], ["scientist", "🧑‍🔬", "does experiments", "🧪🔬"], ["builder", "👷", "builds houses", "🏗️🧱"],
        ["singer", "🧑‍🎤", "sings songs", "🎤🎵"], ["judge", "🧑‍⚖️", "decides what is fair in court", "⚖️🏛️"], ["coder", "🧑‍💻", "writes programs for computers", "💻⌨️"],
        ["dentist", "🦷", "takes care of our teeth", "🪥😁"], ["mail carrier", "📬", "brings letters to our homes", "✉️📦"], ["baker", "🧁", "bakes bread and cakes", "🍞🎂"],
        ["vet", "🐾", "takes care of sick animals", "🐶🐱"], ["bus driver", "🚌", "drives kids to school", "🚏🧒"], ["soldier", "🪖", "keeps the country safe", "🎖️🥾"],
        ["librarian", "📚", "helps us find books", "📖🔎"], ["garbage collector", "🚛", "takes away the trash", "🗑️♻️"], ["lifeguard", "🏊", "keeps swimmers safe", "🛟🏖️"]]

# ------------------------------------------------------------------ the bank (kids-core/question-bank, schema 2)
import random, re
TODAY = '2026-11-12'
slug = lambda t: re.sub(r'[^a-z0-9]+', '-', t.lower().replace("'", '')).strip('-')
cap = lambda t: t[0].upper() + t[1:]
kind = lambda n: n.split(' ')[-1]                      # boots and moon boots are the same kind of thing
plural = lambda n: n.endswith('s') and not re.search(r'(camouflage|radio)$', n)
tell = lambda p: f"The {p['name']} {p['use']}."
pic = lambda w: 'helpers/' + slug(w['id'])
letters = 'abcdef'
def picks(rng, pool, n, ok=lambda x: True):
    pool = [x for x in pool if ok(x)]; rng.shuffle(pool); return pool[:n]
def choice_q(qid, step, grades, text, say, right, wrong, rng, picture=None, hint=None, explain=None):
    opts = [right] + wrong; rng.shuffle(opts)
    q = {'id': qid, 'section': 'jobs', 'step': step, 'grades': grades, 'countries': ['*'], 'interaction': 'choice', 'prompt': {'text': text, 'say': say}}
    if picture: q['picture'] = picture
    q['choices'] = [dict(id=letters[i], **o) for i, o in enumerate(opts)]
    q['answer'] = [letters[opts.index(right)]]
    if hint: q['hint'] = hint
    if explain: q['explain'] = explain
    q['status'] = 'published'; q['updated'] = TODAY
    return q

pictures, lessons, questions = [], [], []
steps = [{'section': 'jobs', 'step': 1, 'title': 'Who helps us?'}]
for n, w in enumerate(WORKERS):
    step = n + 2
    steps.append({'section': 'jobs', 'step': step, 'title': cap(w['name'])})
    pictures.append({'id': pic(w), 'alt': w['name'], 'viewBox': w['viewBox'], 'svg': w['svg'],
                     'tags': [{'id': slug(p['name']), 'label': p['name'], 'area': {'group': p['name']}, 'box': p['box']} for p in w['parts']]})
steps.append({'section': 'jobs', 'step': len(WORKERS) + 2, 'title': 'All the jobs'})
LAST = len(WORKERS) + 2

for n, w in enumerate(WORKERS):
    step, ws = n + 2, slug(w['id'])
    rng = random.Random('find' + ws)
    # step 1: find the worker among three pictures (Pre-K meets the first six)
    pool = WORKERS[:6] if n < 6 else WORKERS
    questions.append(choice_q(f'jobs.find.{ws}', 1, ['prek', 'k'] if n < 6 else ['k'], f"Find the **{w['name']}**!", ['Find the', f"{w['name']}!"],
                              {'label': w['name'], 'picture': pic(w)}, [{'label': x['name'], 'picture': pic(x)} for x in picks(rng, pool, 2, lambda x: x is not w)], rng,
                              hint={'picture': pic(w), 'say': f"This person {w['does']}."}))
    # the lesson: the worker, then each thing by name and what it is for
    lessons.append({'id': f'jobs.{ws}.lesson', 'section': 'jobs', 'step': step, 'grades': ['k', 'g1'], 'title': cap(w['name']), 'picture': pic(w),
                    'lines': [{'say': f"This is {w['article']} {w['name']}."}, {'say': f"{cap(w['article'])} {w['name']} {w['does']}."}] +
                             [line for p in w['parts'] for line in ({'say': p['name'], 'light': slug(p['name'])}, {'say': tell(p), 'light': slug(p['name'])})],
                    'together': f"jobs.{ws}.pick.{slug(w['parts'][0]['name'])}"})
    others = [(x, p) for x in WORKERS if x is not w for p in x['parts']]
    for p in w['parts']:
        ps = slug(p['name']); rng = random.Random(ws + ps)
        lit = {'picture': f'{pic(w)}?light={ps}'}
        part = lambda x, q: {'label': q['name'], 'picture': f"{pic(x)}#{slug(q['name'])}"}
        questions.append({'id': f'jobs.{ws}.tap.{ps}', 'section': 'jobs', 'step': step, 'grades': ['k', 'g1'], 'countries': ['*'], 'interaction': 'tap',
                          'prompt': {'text': f"Tap the **{p['name']}**!", 'say': ['Tap the', f"{p['name']}!"]}, 'picture': pic(w), 'answer': [ps],
                          'hint': dict(lit, say='Look for the part that is glowing!'), 'status': 'published', 'updated': TODAY})
        own = picks(rng, w['parts'], 2, lambda q: kind(q['name']) != kind(p['name']))
        taken = {kind(p['name'])} | {kind(q['name']) for q in own}
        far = picks(rng, others, 1, lambda xq: kind(xq[1]['name']) not in taken)
        ask = f"Which ones are the **{p['name']}**?" if plural(p['name']) else f"Which one is the **{p['name']}**?"
        questions.append(choice_q(f'jobs.{ws}.pick.{ps}', step, ['k', 'g1'], ask, ['Which ones are the' if plural(p['name']) else 'Which one is the', f"{p['name']}?"],
                                  part(w, p), [part(w, q) for q in own] + [part(x, q) for x, q in far], rng, hint=dict(lit, say=tell(p)), explain=tell(p)))
        questions.append(choice_q(f'jobs.{ws}.whose.{ps}', step, ['k', 'g1'], 'Who uses this?', 'Who uses this?', {'label': w['name'], 'picture': pic(w)},
                                  [{'label': x['name'], 'picture': pic(x)} for x in picks(rng, WORKERS, 2, lambda x: x is not w and all(q['name'] != p['name'] for q in x['parts']))], rng,
                                  picture=f'{pic(w)}#{ps}', hint=dict(lit, say=f"This person {w['does']}.")))
        # 1st grade: what is it for? asked among this worker's own things, so only one answer can be right
        questions.append(choice_q(f'jobs.{ws}.use.{ps}', step, ['g1'], p['ask'], p['ask'], part(w, p), [part(w, q) for q in w['parts'] if q is not p], rng,
                                  hint=dict(lit, say=tell(p)), explain=tell(p)))

def job_questions(step, grades, pool, n_wrong, kinds, tag):
    for j in pool:
        name, e, does, clue = j; js = slug(name); rng = random.Random(tag + js)
        article = 'an' if name[0] in 'aeiou' else 'a'
        wrong = picks(rng, pool, n_wrong, lambda x: x is not j)
        clues = {'picture': f'emoji/{clue}'}
        if 'who' in kinds:
            questions.append(choice_q(f'jobs.who.{js}.{tag}', step, grades, f'Who {does}?', f'Who {does}?', {'text': name, 'picture': f'emoji/{e}'},
                                      [{'text': x[0], 'picture': f'emoji/{x[1]}'} for x in wrong], rng, picture='emoji/❓', hint=dict(clues, say=f'This person {does}.')))
        if 'name' in kinds:
            questions.append(choice_q(f'jobs.name.{js}.{tag}', step, grades, 'Who is this?', 'Who is this?', {'text': name}, [{'text': x[0]} for x in wrong], rng,
                                      picture=f'emoji/{e}', hint=dict(clues, say=f'This person {does}.')))
        if 'does' in kinds:
            questions.append(choice_q(f'jobs.does.{js}.{tag}', step, grades, f'What does {article} {name} do?', f'What does {article} {name} do?', {'text': does},
                                      [{'text': x[2]} for x in wrong], rng, picture=f'emoji/{e}', hint=dict(clues, say='Look at the clues!')))
    questions.append({'id': f'jobs.match.tools.{tag}', 'section': 'jobs', 'step': step, 'grades': grades, 'countries': ['*'], 'interaction': 'match',
                      'prompt': {'text': 'Match each helper to their tools!', 'say': 'Match each helper to their tools!'},
                      'pairs': [{'left': {'picture': f'emoji/{j[1]}', 'label': j[0]}, 'right': {'picture': f'emoji/{j[3]}', 'label': f'{j[0]} tools'}} for j in pool],
                      'show': n_wrong + 1, 'hint': {'say': 'Look carefully, and try again!'}, 'status': 'published', 'updated': TODAY})
job_questions(1, ['prek', 'k'], JOBS[:12], 2, ['who'], 's1')
job_questions(LAST, ['g1'], JOBS, 3, ['who', 'name', 'does'], 'all')

BANK = {
    'format': 'kids-core/question-bank', 'schema': 2, 'id': 'learn-play.jobs', 'title': 'Jobs', 'version': 1, 'language': 'en-US', 'entitlement': 'free',
    'steps': steps, 'lessons': lessons, 'questions': questions, 'pictures': pictures,
}
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(here, '..', 'banks'), exist_ok=True)
with open(os.path.join(here, '..', 'banks', 'learn-play.jobs.json'), 'w') as f:
    json.dump(BANK, f, ensure_ascii=False, indent=1); f.write('\n')
print(len(pictures), 'pictures,', len(lessons), 'lessons,', len(questions), 'questions')
