# Phase 18 — media correctness and release gate

**Result:** 19 of 37 landmark candidates rejected on sight; 18 remain as plausible candidates for human review. No photo was enabled. The release gate now needs recorded human sign-offs.

## Rejected candidates (`docs/landmark-rejections.json`)

| Landmark | Why |
| --- | --- |
| Christ the Redeemer | Mantegna painting, not the Rio statue |
| Sagrada Família | Murillo painting, not the basilica |
| Tower Bridge | Sacramento Tower Bridge (USA) |
| Mount Fuji | Hokusai print |
| Colosseum | Piranesi engraving |
| Great Sphinx | David Roberts illustration |
| Niagara Falls | Benches at Oakes Garden Theatre |
| Chichén Itzá | Atlante sculpture, not El Castillo |
| Hagia Sophia | Cross-section drawing |
| Forbidden City | 1920s film poster "The Forbidden City" |
| Grand Canyon | Man on a rope in a crevice |
| Table Mountain | Lion's Head, not Table Mountain |
| Canals of Venice | St Mark's Square, no canal |
| Amazon Rainforest | Satellite image |
| Great Barrier Reef | Satellite image |
| Great Pyramid of Giza | Grainy aerial photo |
| Iguazu Falls | Close-up of water, could be any waterfall |
| CN Tower | Shot straight up from the base |
| Balloons of Cappadocia | Tiny balloons on grey sky |

A rejected source URL or file hash can never be staged again (both staging scripts skip it) or imported (`import-landmark-photo.cjs` refuses it).

## Plausible candidates still waiting for a person

Big Ben, Borobudur, Brandenburg Gate, Golden Gate Bridge, Great Wall, Himeji Castle, Machu Picchu, Milford Sound*, Neuschwanstein*, Sydney Opera House, Parthenon, Pisa, Maasai Mara*, Saint Basil's, Stonehenge, Taj Mahal, Tokyo Tower*, Uluru. (* has a note on the review board.)

A visual look by Claude is a filter, not an approval: each still needs a person to confirm identity, source, license, attribution and alt text before import.

## Release gate

`scripts/release-readiness.cjs` used to report `readyForFinalSignoff: true` once every photo and the 3D body model existed, even with both manual checks false. It now also requires `docs/release-signoff.json` to record `verified: true`, a name and an ISO date for both the media review and the physical-device acceptance, and lists every blocker.

## Tests

- `tests/landmark-rejections-test.cjs` (new): rejected sources are not candidates, not enabled, not cached, and the importer throws for each.
- `tests/release-readiness-test.cjs`: the gate stays closed without both sign-offs, without a name, or without a date.
