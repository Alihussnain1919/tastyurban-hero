# Birdie Birdie — Scroll Assembly & Burger Builder

A static React + TypeScript + Vite frontend concept for Birdie Birdie. It is designed around a cinematic food journey: a scroll-driven burger assembly, featured menu cards, brand story, live ingredient customizer, and order/location links.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To verify a production build:

```bash
npm run build
npm run preview
```

## What is included

- **Scroll assembly:** seven transparent food PNGs assemble sequentially in the order: bottom bun → cheddar → lettuce → crispy chicken → pickles → sauce → top bun. Future ingredients stay fully hidden until their own beat; an ingredient becomes fully opaque when it enters and remains assembled. In the last few percent of the section, the entire completed burger fades as one composition to avoid leaving a lone bun visible as the pinned scene exits.
- **Gradient transitions:** layered gradient backgrounds cross-fade between ingredient stages; old gradients fade away instead of accumulating.
- **Live customizer:** bun, chicken style, cheese, lettuce, pickles, sauce and quantity can be changed; the visible photo layers update immediately. The stack moves upward/downward as selected layers are removed or restored so the burger stays compact and the top bun closes the gap.
- **Pointer interaction and faux depth:** drag over the customizer preview to rotate the layered burger through a restrained perspective range. The layer planes have distinct Z offsets and a soft grounding shadow; the finished scroll scene gets a subtle hero turn and the builder has a very small idle orbit.
- **Responsive layout:** mobile and desktop breakpoints plus reduced-motion CSS preferences.
- **Static frontend:** no backend or database is required. The order buttons link to Birdie Birdie's public menu/site; the selected custom build is not submitted to an ordering API.

## Ingredient image paths

All cutouts are served locally from `public/images/birdie/`:

- `/images/birdie/bun-bottom.png`
- `/images/birdie/lettuce.png`
- `/images/birdie/cheddar.png`
- `/images/birdie/crispy-chicken.png`
- `/images/birdie/pickles.png`
- `/images/birdie/signature-sauce.png`
- `/images/birdie/bun-top.png`

Change the paths in `src/components/burger/BurgerExperience.tsx` if you host these images elsewhere.

## What changed in the scroll sequence

The assembly stage timings are aligned: bottom bun (0–10%), cheddar (10–20%), lettuce (20–30%), chicken (30–42%), pickles (42–53%), sauce (53–64%), top bun (64–80%), then a complete-burger hold (80–100%). The assembly always uses the default signature burger so a customer’s later customization does not unexpectedly remove ingredients from the brand animation.

## Where to tune the experience

- Ingredient timing, offsets and order: `PhotoBurgerScene` in `src/components/burger/BurgerExperience.tsx`.
- Assembly narration and gradient stage transitions: `assemblyStages` and `assemblyGradients` in the same file.
- Overall site styling, colors and breakpoints: `src/index.css`.
- Featured menu/story copy and section order: `src/App.tsx`.

## Important validation and visual notes

The TSX source was transpile-checked without syntax diagnostics, the CSS brace count is balanced, and all image paths were confirmed. A full production build was not completed because npm dependencies were not available from the package registry in this environment. Run `npm install` and `npm run build` locally to validate the installed dependency tree.

The assembly and configurator use transparent photographic layers (a **2.5D composition**), not a full rotatable 3D food scan. Dragging gives the layered stack a perspective tilt, parallax and mild idle rotation, not a true 360° view. The builder preview is scaled to fit its frame so the top and bottom buns remain visible. Bun/chicken/sauce variations are currently styled from the available base images; these are visual approximations, not separately photographed product variants. For exact variants or true 3D rotation, add dedicated transparent photos or a properly authored GLB/Blender model.

## Assets and external images

The assembly ingredients are local. A few featured menu/story photos are still loaded from third-party image URLs, so replace them with brand-approved local assets for a fully self-contained production deployment. Check that all food photography is licensed for your use.
