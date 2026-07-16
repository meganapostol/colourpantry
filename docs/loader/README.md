# Crayon melt loader: assets and pipeline

Everything the implementation model needs to port workstream C3. Live mockup:
https://claude.ai/code/artifact/12fb6446-6bf1-448a-b7b1-13218fbfc97e

## The idea

In real melted crayon art **the crayons never move**. They are glued to the canvas and only the wax runs. So there is no melt sequence to render and no frames to generate. This is:

- **One photo** of the finished melt (`crayons.webp`)
- The crayons drawn always, at full opacity
- Each drip **revealed downward by a mask**, on its own stagger, driven by real load progress

Photoreal crayons, photoreal wax, exact progress tracking, one asset. A frame sequence would have been megabytes, and a loading screen that needs a loading screen is not a loading screen.

## Files

| File | What it is |
|---|---|
| `crayons.webp` | 1600x907, 154 KB. The artwork. Generated with Gemini, watermark cropped, downscaled, q80 webp. |
| `drips.json` | `{ boundary, cols }`. `boundary` = 0.28445, the fraction of image height where the crayon tips end. `cols` = 35 `[start, end]` x-fractions, one per detected drip, found by scanning a row 45px below the tips for non-white runs. |
| `loader_template.html` | The mockup source. `__IMG_B64__` and `__DRIPS_JSON__` are injected at build. |
| `build_loader.py` | Inlines the asset as a data URI and writes the standalone mockup. |

Rebuild the mockup: `python build_loader.py` (expects `crayons_q80.webp` and `drips.json` alongside it).

## Asset provenance, and a trap

The first generation came back as **Crayola** crayons: wrapper text, the wave, the whole trade dress. The model ignored "no text, no lettering". That is a trademark problem on a commercial product, not a taste problem. The shipped asset was regenerated with explicitly blank wrappers and checked at full resolution.

**If anyone regenerates this asset, check the wrappers at 100% before shipping it.** The default behaviour of every image model here is to draw Crayola, because that is what a crayon looks like in the training data.

Also cropped: 3.5% off the right edge to remove the Gemini sparkle watermark, 2% off the bottom.

## Porting notes

- **Canvas, not SVG.** The `gotchas` page: prefer canvas over SVG manipulation. Doubly so here, because a loader unmounts the instant loading finishes, which is exactly the SVGFollower/Chromatica crash shape.
- **Three offscreen layers**, rebuilt only on resize: `dripLayer` (the artwork, cover-fitted), `maskLayer` (per-drip columns, rebuilt per frame), `workLayer` (drip layer with `destination-in` mask applied). Then: draw crayons, draw masked drips.
- **Melt curve `progress ^ 2.2`. Exponent must be above 1**, or it decelerates. Verified by pixel sampling: at 70% progress the wax has reached 61% down. The mockup ships a slider so the final number is Megan's call.
- **Soft leading edge.** Each mask column fades over the last ~2.2% of height so the drip end reads wet rather than cut.
- **Per-drip stagger and rate** come from a hash of the drip index, so they are deterministic and stable across runs. Not random noise, hand-tuned character.
- **Paint once synchronously before the first `requestAnimationFrame`.** rAF does not fire in a hidden tab, so a loader that only paints inside rAF flashes an empty canvas. Also resync the clock on `visibilitychange`.
- **Progress is `registerBootTask(promise)`**, settled over total. Never a timer. `shown` lerps toward `target` frame-rate-independently (`k = 1 - 0.0045^(dt/1000)`, dt clamped to 64ms) so steps ease instead of snapping and a stalled fetch visibly stalls the wax.
- The drip columns widen 2x around their centre in the mask so soft edges and splatter are not clipped.

## Open question

**Dark mode.** The artwork is a white canvas, so on a dark theme this is a bright rectangle. The mockup commits to the light artwork in both themes rather than guess at an invert that would wreck the wax colours. Needs a human look before it ships.
