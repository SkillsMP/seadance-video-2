# VideoFly Theme Pack for ShipAny Two

This theme pack is directly migrated and adapted from `videofly-template` (specialized in production-grade AI Video SaaS: Sora 2, Seedance 2.0, Wan 2.6).

## Highlights & Design Philosophy

1. **Video-First Dark Mode**:
   - OLED black background with subtle radial glow.
   - Clean elimination of the old slanted mechanical grid.
2. **Cinematic 16:9 Showcase Cards**:
   - Direct integration of `BorderBeam` on featured cards.
   - Video autoplay, loop, muted, playsInline with smooth hover scale.
   - Play button with glassmorphism ring and ping animation.
   - Supports both full grid mode and compact marquee stream mode.
3. **Bento Grid Features (`features.tsx`)**:
   - Built on `MagicCard` and `BlurFade`.
   - Mouse-following interactive radial border light.
4. **Step Pipeline (`features-step.tsx`)**:
   - Step-by-step numbered cards with gradient highlights.
5. **High-Conversion CTA (`cta.tsx`)**:
   - Radiant `BorderBeam` container with checklist and simulated render status.
6. **Dark Accordion FAQ (`faq.tsx`)**:
   - Numbered badges and glassmorphic card borders.
7. **Use Case Cards (`use-case-cards.tsx`)**:
   - Category cards with keyword chips (same JSON as `video` theme); MagicCard shell, vertical layout, no default-theme fallback.

## How to Enable

Set in your `.env.development` or `.env.production`:

```env
NEXT_PUBLIC_THEME="videofly"
NEXT_PUBLIC_APPEARANCE="dark"
```

Any blocks not explicitly defined in `src/themes/videofly/blocks/` automatically fall back to `src/themes/default/blocks/` with zero breaking changes.
