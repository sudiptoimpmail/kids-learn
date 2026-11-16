#!/usr/bin/env python3
"""Builds banks/learn-play.geometry.json: the Shapes learning sequence in the kids-core question format.

One section (shape2), four steps. Each step mixes:
  a lesson       an animation of a solid shape turning into the flat shape you see from the side or from below
  match          join each solid to its flat shape with a line
  choice, multi  pick one answer, or every right answer
  activity       games the app draws: Shape Match, Build a Picture, Shape Puzzle

Run:  python3 scripts/make-geometry-bank.py   then   node core/../../kids-core/tools/check-bank.mjs banks/learn-play.geometry.json
"""
import json, os

INK = '#2b2140'
G = f'<g stroke="{INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">'

# ---- pictures: four solids, a pyramid, and the flat shapes (all self-drawn)
SOLIDS = {
    'cone': ('cone', G + '<path d="M60 12 L18 96 A42 13 0 0 0 102 96 Z" fill="#ffa94d"/><path d="M18 96 A42 13 0 0 1 102 96" fill="none" stroke-dasharray="5 6" opacity=".55"/>'
             '<path d="M60 12 L44 100" fill="none" stroke="#fff" stroke-width="5" opacity=".45"/></g>'),
    'cylinder': ('cylinder', G + '<path d="M22 28 V94 A38 13 0 0 0 98 94 V28 Z" fill="#74c0fc"/><ellipse cx="60" cy="28" rx="38" ry="13" fill="#a5d8ff"/>'
                 '<path d="M34 44 V98" fill="none" stroke="#fff" stroke-width="5" opacity=".5"/></g>'),
    'cube': ('cube', G + '<path d="M18 40 H82 V104 H18 Z" fill="#69db7c"/><path d="M18 40 L40 18 H104 L82 40 Z" fill="#b2f2bb"/><path d="M82 40 L104 18 V82 L82 104 Z" fill="#40c057"/></g>'),
    'sphere': ('ball', G + '<circle cx="60" cy="60" r="46" fill="#f783ac"/><path d="M14 60 A46 15 0 0 0 106 60" fill="none" opacity=".45"/>'
               '<path d="M36 34 A30 30 0 0 1 60 24" fill="none" stroke="#fff" stroke-width="6" opacity=".6"/></g>'),
    'pyramid': ('pyramid', G + '<path d="M56 12 L12 92 L70 108 Z" fill="#ffd43b"/><path d="M56 12 L70 108 L108 84 Z" fill="#fab005"/></g>'),
}
# one colour for every flat shape, so colour never gives a matching answer away
FLATS = {
    'triangle': G + '<path d="M60 14 L106 104 H14 Z" fill="#9775fa"/></g>',
    'circle': G + '<circle cx="60" cy="60" r="44" fill="#9775fa"/></g>',
    'rectangle': G + '<rect x="26" y="12" width="68" height="96" rx="3" fill="#9775fa"/></g>',
    'square': G + '<rect x="18" y="18" width="84" height="84" rx="3" fill="#9775fa"/></g>',
    'oval': G + '<ellipse cx="60" cy="60" rx="50" ry="32" fill="#9775fa"/></g>',
    'star': G + '<path d="M60 10 L73 44 L110 46 L81 69 L91 105 L60 84 L29 105 L39 69 L10 46 L47 44 Z" fill="#9775fa"/></g>',
    'hexagon': G + '<path d="M34 16 H86 L110 60 L86 104 H34 L10 60 Z" fill="#9775fa"/></g>',
    'diamond': G + '<path d="M60 8 L100 60 L60 112 L20 60 Z" fill="#9775fa"/></g>',
}
pictures = [{'id': f'solids/{k}', 'alt': alt, 'viewBox': '0 0 120 120', 'svg': svg, 'tags': []} for k, (alt, svg) in SOLIDS.items()]
pictures += [{'id': f'flats/{k}', 'alt': k, 'viewBox': '0 0 120 120', 'svg': svg, 'tags': []} for k, svg in FLATS.items()]

S = 'shape2'
questions, lessons = [], []
def q(id, step, grades, interaction, text, say=None, **more):
    questions.append({'id': f'geo.{id}', 'section': S, 'step': step, 'grades': grades, 'countries': ['*'], 'interaction': interaction,
                      'prompt': {'text': text, 'say': say or text.replace('**', '')}, **more, 'status': 'published', 'updated': '2026-11-16'})
def choices(*items):   # (id, picture ref or None, text or None, label)
    out = []
    for cid, pic, text, label in items:
        c = {'id': cid, 'label': label}
        if pic: c['picture'] = pic
        if text: c['text'] = text
        out.append(c)
    return out
flat = lambda cid, name: (cid, f'flats/{name}', None, name)
solid = lambda cid, name: (cid, f'solids/{name}', None, SOLIDS[name][0])

GRADES = {1: ['prek', 'k'], 2: ['k', 'g1'], 3: ['g1', 'g2'], 4: ['g2', 'g3']}
BUILD_HINT = {'say': 'Look at the outline. Which shape fits?'}
TURN_HINT = {'say': 'Tap a shape to turn it. Then drag it into place.'}
A = lambda name: 'an' if name[0] in 'aeiou' else 'a'

# ---- games (activity): Shape Match, Build a Picture, Shape Puzzle
MATCH_SETS = {1: [['circle', 'square', 'triangle', 'rectangle'], ['circle', 'triangle', 'star', 'heart']],
              2: [['oval', 'diamond', 'star', 'heart', 'rectangle'], ['semicircle', 'triangle', 'square', 'oval', 'diamond']],
              3: [['hexagon', 'pentagon', 'trapezoid', 'semicircle', 'diamond']],
              4: [['hexagon', 'pentagon', 'trapezoid', 'rtriangle', 'oval']]}
for step, sets in MATCH_SETS.items():
    for i, shapes in enumerate(sets):
        q(f'match-game.s{step}.{i + 1}', step, GRADES[step], 'activity', 'Drag each shape onto its **outline**!', activity={'kind': 'shape-match', 'shapes': shapes},
          hint={'say': 'Look at the outline. Which shape fits?'})
BUILD = {1: ['tree', 'house', 'boat'], 2: ['house', 'car', 'train', 'boat'], 3: ['rocket', 'robot', 'train', 'castle'], 4: ['butterfly', 'castle', 'robot']}
for step, names in BUILD.items():
    for name in names:
        # younger children see an outline for every piece; older ones only the shape of the whole picture
        q(f'build.{name}.s{step}', step, GRADES[step], 'activity', f'Build {A(name)} **{name}** with shapes!',
          activity={'kind': 'shape-build', 'picture': name, 'guide': 'parts' if step <= 2 else 'whole'}, hint=BUILD_HINT)
PUZZLE = {3: ['house', 'boat', 'rocket'], 4: ['robot', 'castle', 'butterfly', 'car']}
for step, names in PUZZLE.items():
    for name in names:
        q(f'puzzle.{name}.s{step}', step, GRADES[step], 'activity', f'Turn the shapes to fill the **{name}**!',
          activity={'kind': 'shape-puzzle', 'picture': name, 'guide': 'parts' if step == 3 else 'whole'}, hint=TURN_HINT)

# ---- match with lines: each solid and the flat shape it shows
pair = lambda s, f: {'left': {'picture': f'solids/{s}', 'label': SOLIDS[s][0]}, 'right': {'picture': f'flats/{f}', 'label': f}}
q('lines.side.s2', 2, GRADES[2], 'match', 'Match each solid shape to the flat shape you see from the **side**!', pairs=[pair('cone', 'triangle'), pair('cylinder', 'rectangle'), pair('sphere', 'circle')],
  hint={'say': 'Look at each solid shape from the side.'})
q('lines.side.s3', 3, GRADES[3], 'match', 'Match each solid shape to the flat shape you see from the **side**!', pairs=[pair('cone', 'triangle'), pair('cylinder', 'rectangle'), pair('sphere', 'circle'), pair('cube', 'square')],
  hint={'say': 'Look at each solid shape from the side.'})
name_pair = lambda s: {'left': {'picture': f'solids/{s}', 'label': SOLIDS[s][0]}, 'right': {'text': 'sphere' if s == 'sphere' else SOLIDS[s][0], 'label': s}}
q('lines.names.s3', 3, GRADES[3], 'match', 'Match each solid shape to its **name**!', pairs=[name_pair(s) for s in ['cone', 'cylinder', 'cube', 'sphere', 'pyramid']], show=4,
  hint={'say': 'A cone has a point. A cube has square faces.'})
q('lines.names.s4', 4, GRADES[4], 'match', 'Match each solid shape to its **name**!', pairs=[name_pair(s) for s in ['cone', 'cylinder', 'cube', 'sphere', 'pyramid']], show=5,
  hint={'say': 'A cone has a point. A cube has square faces.'})

# ---- one answer (A, B, C, D)
def view(id, step, text, right, wrong, hint, explain):
    q(id, step, GRADES[step], 'choice', text, choices=choices(flat('a', right), *[flat(c, w) for c, w in zip('bcd', wrong)]), answer=['a'], hint={'say': hint}, explain=explain)
view('view.cone-side', 2, 'Look at a cone from the **side**. Which flat shape do you see?', 'triangle', ['circle', 'square'], 'A cone has a point at the top.', 'From the side, a cone looks like a triangle.')
view('view.cone-below', 2, 'Look at a cone from **below**. Which flat shape do you see?', 'circle', ['triangle', 'square'], 'The bottom of a cone is round.', 'From below, a cone looks like a circle.')
view('view.cylinder-side', 2, 'Look at a cylinder from the **side**. Which flat shape do you see?', 'rectangle', ['circle', 'triangle'], 'The side of a cylinder is straight up and down.', 'From the side, a cylinder looks like a rectangle.')
view('view.cylinder-top', 2, 'Look at a cylinder from the **top**. Which flat shape do you see?', 'circle', ['rectangle', 'triangle'], 'The top of a cylinder is round.', 'From the top, a cylinder looks like a circle.')
view('view.cube-face', 3, 'Which flat shape is every face of a cube?', 'square', ['circle', 'triangle', 'oval'], 'A cube is like a box with equal sides.', 'Every face of a cube is a square.')
view('view.sphere', 3, 'Look at a ball from any side. Which flat shape do you see?', 'circle', ['square', 'triangle', 'oval'], 'A ball is round all over.', 'From every side, a ball looks like a circle.')
view('view.pyramid-side', 3, 'Look at a pyramid from the **side**. Which flat shape do you see?', 'triangle', ['circle', 'square', 'hexagon'], 'A pyramid has a point at the top.', 'From the side, a pyramid looks like a triangle.')
view('view.pyramid-below', 4, 'Look at this pyramid from **below**. Which flat shape do you see?', 'square', ['triangle', 'circle', 'hexagon'], 'This pyramid sits on four equal sides.', 'This pyramid sits on a square.')
def which_solid(id, step, text, right, wrong, hint, explain):
    q(id, step, GRADES[step], 'choice', text, choices=choices(solid('a', right), *[solid(c, w) for c, w in zip('bcd', wrong)]), answer=['a'], hint={'say': hint}, explain=explain)
which_solid('solid.rolls', 2, 'Which solid shape can **roll** like a ball?', 'sphere', ['cube', 'pyramid'], 'A ball is round all over.', 'A ball is a sphere. It rolls every way.')
which_solid('solid.triangle-side', 3, 'Which solid shape looks like a **triangle** from the side and a **circle** from below?', 'cone', ['cylinder', 'cube', 'sphere'], 'It has a point at the top and a round bottom.', 'A cone looks like a triangle from the side and a circle from below.')
which_solid('solid.two-circles', 4, 'Which solid shape has **two** flat circles?', 'cylinder', ['cone', 'sphere', 'cube'], 'Think of a can of soup.', 'A cylinder has a flat circle on the top and on the bottom.')
which_solid('solid.six-squares', 4, 'Which solid shape has **six** square faces?', 'cube', ['pyramid', 'cylinder', 'cone'], 'It looks like a box.', 'A cube has six square faces.')

# ---- every right answer
def tap_all(id, step, text, items, right, hint):
    q(id, step, GRADES[step], 'multi', text, choices=choices(*items), answer=right, hint={'say': hint})
tap_all('all.solids.s2', 2, 'Tap **all** the solid shapes!', [solid('a', 'cone'), flat('b', 'circle'), solid('c', 'cube'), flat('d', 'square'), solid('e', 'sphere'), flat('f', 'triangle')], ['a', 'c', 'e'], 'A solid shape is not flat. You can hold it.')
tap_all('all.flats.s2', 2, 'Tap **all** the flat shapes!', [flat('a', 'triangle'), solid('b', 'cylinder'), flat('c', 'rectangle'), solid('d', 'cone'), flat('e', 'circle'), solid('f', 'cube')], ['a', 'c', 'e'], 'A flat shape can be drawn on paper.')
tap_all('all.round.s3', 3, 'Tap **all** the shapes with no corners!', [flat('a', 'circle'), flat('b', 'square'), flat('c', 'oval'), flat('d', 'triangle'), flat('e', 'star'), flat('f', 'hexagon')], ['a', 'c'], 'A corner is a sharp point.')
tap_all('all.roll.s3', 3, 'Tap **all** the solid shapes that can roll!', [solid('a', 'sphere'), solid('b', 'cube'), solid('c', 'cylinder'), solid('d', 'pyramid'), solid('e', 'cone')], ['a', 'c', 'e'], 'A shape with a round side can roll.')
tap_all('all.four-sides.s4', 4, 'Tap **all** the shapes with four sides!', [flat('a', 'square'), flat('b', 'triangle'), flat('c', 'rectangle'), flat('d', 'hexagon'), flat('e', 'diamond'), flat('f', 'circle')], ['a', 'c', 'e'], 'Count the sides of each shape.')
tap_all('all.circle-face.s4', 4, 'Tap **all** the solid shapes with a flat circle!', [solid('a', 'cone'), solid('b', 'cube'), solid('c', 'cylinder'), solid('d', 'pyramid'), solid('e', 'sphere')], ['a', 'c'], 'Look for a round, flat face.')

# ---- lessons: an animation, read out line by line
lessons.append({'id': 'geo.lesson.cone-cylinder', 'section': S, 'step': 2, 'grades': GRADES[2], 'countries': ['*'], 'title': 'Solid shapes and flat shapes',
    'animation': {'kind': 'solid-to-flat', 'solids': ['cone', 'cylinder']},
    'article': 'A cone and a cylinder are solid shapes. Look at them from the side or from below, and you see flat shapes.',
    'lines': [
        {'say': 'This is a cone.', 'show': 'cone'},
        {'say': 'A cone is a solid shape. You can hold it.', 'show': 'cone'},
        {'say': 'Look at the cone from the side. You see a triangle!', 'show': 'cone-side'},
        {'say': 'Look at the cone from below. You see a circle!', 'show': 'cone-below'},
        {'say': 'This is a cylinder.', 'show': 'cylinder'},
        {'say': 'Look at the cylinder from the side. You see a rectangle!', 'show': 'cylinder-side'},
        {'say': 'Look at the cylinder from the top. You see a circle!', 'show': 'cylinder-top'},
        {'say': 'Solid shapes have flat shapes hiding inside!', 'show': 'all'},
    ], 'together': 'geo.view.cone-side'})
lessons.append({'id': 'geo.lesson.cube-ball-pyramid', 'section': S, 'step': 3, 'grades': GRADES[3], 'countries': ['*'], 'title': 'More solid shapes',
    'animation': {'kind': 'solid-to-flat', 'solids': ['cube', 'sphere', 'pyramid']},
    'article': 'A cube, a ball and a pyramid are solid shapes. Each one shows a flat shape when you look at it from one side.',
    'lines': [
        {'say': 'This is a cube.', 'show': 'cube'},
        {'say': 'Look at the cube from the side. You see a square!', 'show': 'cube-side'},
        {'say': 'This is a ball. It is also called a sphere.', 'show': 'sphere'},
        {'say': 'Look at the ball from any side. You see a circle!', 'show': 'sphere-side'},
        {'say': 'This is a pyramid.', 'show': 'pyramid'},
        {'say': 'Look at the pyramid from the side. You see a triangle!', 'show': 'pyramid-side'},
        {'say': 'Look at the pyramid from below. You see a square!', 'show': 'pyramid-below'},
        {'say': 'Solid shapes have flat shapes hiding inside!', 'show': 'all'},
    ], 'together': 'geo.view.cube-face'})

bank = {'format': 'kids-core/question-bank', 'schema': 2, 'id': 'learn-play.geometry', 'title': 'Shapes', 'version': 1, 'language': 'en-US', 'entitlement': 'free',
        'steps': [{'section': S, 'step': 1, 'title': 'Flat shapes'}, {'section': S, 'step': 2, 'title': 'Cone and cylinder'}, {'section': S, 'step': 3, 'title': 'Cube, ball and pyramid'}, {'section': S, 'step': 4, 'title': 'Shape detective'}],
        'lessons': lessons, 'questions': questions, 'pictures': pictures}
out = os.path.join(os.path.dirname(__file__), '..', 'banks', 'learn-play.geometry.json')
json.dump(bank, open(out, 'w'), ensure_ascii=False, indent=1)
kinds = {}
for x in questions: kinds[x['interaction']] = kinds.get(x['interaction'], 0) + 1
print(f'{len(questions)} questions {kinds}, {len(lessons)} lessons, {len(pictures)} pictures -> {os.path.relpath(out)}')
