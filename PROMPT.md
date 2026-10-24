# The brief

This repository was built against the following brief. It is recorded here because
the interesting part of a code-rendered film is not the renderer — it is the
constraints the renderer was asked to satisfy.

## Form

- One file: `index.html`. 1920 × 1080, Canvas 2D.
- Every frame a **pure function of song time** `t`: no cross-frame state, no
  `Math.random`, no `Date.now`. The same `t` must give the same pixels.
- 19 segments across 212.5 s, cut to a beat lattice measured from the song
  (130 BPM, first downbeat at 0.222 s).
- The left third is a terminal / harness; the right two thirds are the world.
  Later that rule is broken on purpose.

## Rules the film is held to

1. **No monotony.** Five segments must each be a different picture *language*,
   not the same picture recoloured: terminal, engineering drawing, cascade of
   windows, kinetic typography, and a structure that physically crushes the left
   column.
2. **A camera.** Macro zooms, a dolly-zoom, orbit; a punch on every kick.
3. **Concrete things.** A tangent web with normals and an osculating circle; real
   chemistry with six-membered rings and a balanced equation; superquadrics with
   cross-sections; an Ophanim whose eyes track the viewer.
4. **Impact frames.** Two to three frames of full-field invert, white or red
   silhouette at the hit points.

## Later, after the first cut

- The renderer itself was judged too thin: line art + linear `sin(t)` reads as
  cheap. So the brief was extended to require four systems underneath everything:
  - spring and bezier easing instead of `lerp`;
  - an off-screen post pipeline (bloom, chromatic jitter, grain);
  - a Swiss grid layout engine (24 columns, hairlines, tags, tracking);
  - generative geometry with 500–2000 vertices per structure.
- Then: stop repeating. Every stretch of 15 seconds must not be one rotating
  object. Any two segments that share a *visual species* get one of them rebuilt
  in another medium (flat chemistry instead of 3D, an exploded diagram instead of
  a spinning box, a contact sheet instead of a morphing surface).
- No interaction. It is an animation, not a toy.

## What is not included

The song. Bring your own copy as `song.mp3`; nothing in this repository
redistributes it.
