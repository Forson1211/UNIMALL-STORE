# Homepage product cutouts

Created with the built-in imagegen tool. Original photographs are preserved.

- Gaming: `frontend/public/assets/hero-gaming-cutout.png` (transparent PNG).
- Laptop/audio: `frontend/public/assets/hero-tech-cutout.png` (transparent PNG).
- Consuming component: `frontend/src/components/home/HeroSection.tsx`.

Gaming edit prompt: Remove the pale blue studio background, floor and detached floor shadows. Preserve the two white and black Xbox controllers, their poses, spacing, perspective, button details, colors and lighting. Keep both controllers fully in frame, with precise edges. Output a transparent PNG with alpha, no solid backdrop or baked checkerboard. Crop closely around the pair with a small transparent margin. No new objects, text or redesign.

Laptop/audio edit prompt: Remove only the pale blue studio background, tabletop/floor and detached floor shadows. Keep the open silver laptop and black over-ear headphones in their original relative positions, with the same perspective, proportions, screen, keyboard, colors and lighting. Output a transparent PNG with alpha and no solid backdrop or baked checkerboard. Crop around the products with a small transparent margin. No new objects or text.

The homepage uses the same 1280px content alignment as the navigation and product sections. On wide screens the arrows sit at the outer banner edges; on narrower screens they sit below the content. The banner has additional vertical space and the cutouts are capped at 480px wide and 320px high on desktop.
