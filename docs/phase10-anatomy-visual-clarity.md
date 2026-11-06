# Inside My Body — illustration clarity, not a medical atlas

The current Inside My Body experience uses a single original offline SVG organ diagram with transparent interactive hotspots. A historical 3D anatomy-model build script and attribution document exist, but the actual `vendor/body.glb` model is not committed or loaded by the application. Consequently the game does **not** show realistic 3D anatomical organs or photographs.

This change improves the existing organ drawing (brain folds, lung branches, heart vessels, spinal detail and intestinal coils), clarifies its accessible description, adds a visible highlighted-organ label, and checks that eight organ hotspot categories and the offline asset remain present.

**Remaining gap:** a clinically reviewed, age-appropriate anatomical illustration/atlas (or optimized, rights-cleared 3D model) should replace this simplified drawing. A medical photograph is not appropriate as a default for young children; anatomical illustrations with accurate shapes and labels are preferable. The current SVG must not be advertised as a real anatomy photo or a 3D model. The feature remains parent-opt-in. Physical iPad touch and VoiceOver verification are still outstanding.
