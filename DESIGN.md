# RainBow design

The reading surface and interface controls have separate roles.

- Reading: paper-colored light mode, quiet dark mode, serif titles and article text, ink-blue links, generous paragraph rhythm. The code window retains its terminal header, colored dots, dark code surface and monospace type.
- Interface: system sans-serif navigation, metadata, tables of contents, search, tags and archive entries. Navigation and TOC use the same translucent surface, border, highlight, radius and shadow tokens. Unsupported blur and reduced-transparency preferences use opaque surfaces.
- Interaction: use `--ease-out` and short transitions for button feedback, TOC disclosure and image zoom. Do not animate reading text, keyboard actions or endlessly floating tags. Hover effects apply only to fine pointers. Respect reduced motion.
- Tags: stable per-label hues for both color modes, labels and counts always readable. Color does not communicate a taxonomy category.
- Responsive: the TOC sits beside articles from 1280px upwards, with independently scrolling contents. Narrow viewports use native inline disclosure. Navigation keeps touch targets and scrolls horizontally when necessary.

Before shipping visual changes, inspect home, article, search, archives and tags in light and dark mode at 375px and 1280px, plus 320px navigation. Test keyboard focus, code scrolling, copy feedback, TOC tracking and reduced motion. Use the example site for public screenshots; private blog content must not be copied into this repository.
