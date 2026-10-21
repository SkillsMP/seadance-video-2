# video

Landing-only overlay. Header/Footer still come from `default`; generator internals are untouched.

- `tokens.css` + `layouts/landing.tsx`: cinematic colors on `.video-shell` (admin/auth keep global `theme.css`)
- `blocks/hero.tsx`, `blocks/showcases.tsx` (`compact` → clip marquee), `blocks/use-case-cards.tsx` (category cards + keyword chips)
- Enable: `NEXT_PUBLIC_THEME=video`
