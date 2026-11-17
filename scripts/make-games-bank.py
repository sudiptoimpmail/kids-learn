#!/usr/bin/env python3
"""Builds banks/learn-play.games.json: adventure games that run inside rounds as cards (kids-core question format, "activity").

  treasure-map   follow spoken clues across a map to the treasure (Pre-K: in Patterns; K-3rd: in World Map)
  shop           fill the basket from a shopping list (in Adding); from 1st grade the next card is paying the shopkeeper

A level holds only settings; the route and the shopping list are made fresh each time it is played.
Run:  python3 scripts/make-games-bank.py
"""
import json, os
questions = []
def game(id, section, step, grades, text, activity, hint):
    questions.append({'id': f'games.{id}', 'section': section, 'step': step, 'grades': grades, 'countries': ['*'], 'interaction': 'activity',
                      'prompt': {'text': text, 'say': text.replace('**', '')}, 'activity': activity, 'hint': {'say': hint}, 'status': 'published', 'updated': '2026-11-17'})
MAPS = ['park', 'island', 'farm']
CLUE = 'Listen to the clue. Where should you go?'
def treasure(section, step, grades, steps, clues):
    for m in MAPS:
        game(f'treasure.{m}.{section}{step}.{"-".join(grades)}', section, step, grades, 'Follow the clues to the **treasure**!', {'kind': 'treasure-map', 'map': m, 'steps': steps, 'clues': clues}, CLUE)
treasure('pattern', 1, ['prek'], 2, 'places')           # go to the tree, then the pond
treasure('maps', 1, ['k'], 3, 'places')
treasure('maps', 2, ['g1'], 3, 'compass')                # go north, go east
treasure('maps', 2, ['g2'], 4, 'compass')
treasure('maps', 3, ['g2', 'g3'], 5, 'compass')
LIST = 'Count each thing on the list.'
def shop(step, grades, kinds, most, pay):
    game(f'shop.add{step}.{"-".join(grades)}', 'add', step, grades, 'Fill the basket from the **shopping list**!', {'kind': 'shop', 'kinds': kinds, 'max': most, 'pay': pay}, LIST)
shop(1, ['prek'], 2, 2, False)
shop(1, ['k'], 2, 3, False)
shop(2, ['k'], 3, 3, False)
for step in (3, 4): shop(step, ['g1'], 2, 3, True)
for step in (4, 5, 6, 7): shop(step, ['g2'], 3, 3, True)
for step in (6, 7, 8): shop(step, ['g3'], 3, 4, True)
bank = {'format': 'kids-core/question-bank', 'schema': 2, 'id': 'learn-play.games', 'title': 'Adventure games', 'version': 1, 'language': 'en-US', 'entitlement': 'free',
        'lessons': [], 'questions': questions, 'pictures': []}
out = os.path.join(os.path.dirname(__file__), '..', 'banks', 'learn-play.games.json')
json.dump(bank, open(out, 'w'), ensure_ascii=False, indent=1)
print(f'{len(questions)} game levels -> {os.path.relpath(out)}')
