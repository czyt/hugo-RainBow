# RainBow

[简体中文](README.md) · **English**

A Hugo theme for long-form reading. Paper tones, serif reading typography and clear heading hierarchy frame the content; navigation, the table of contents and controls use lightly frosted surfaces. Supports light mode, dark mode and mobile screens.

Includes terminal-style code blocks, a side table of contents, image zoom and GitHub Issues comments. Tags receive stable colors derived from their names, and motion respects the system's reduced-motion preference. See the provenance and license notes below.

## Local preview

**Hugo extended 0.165.0** is recommended. CI verifies 0.165.0 and 0.166.0; the minimum supported version is 0.158.0.

```sh
hugo server --source exampleSite --themesDir ../.. --theme hugo-RainBow
```

The example articles are original test fixtures. Replace `example/comments` with your own comments repository.

```sh
bash scripts/verify.sh
```

Verification requires Python 3 and Node.js 20+. It builds the example site in a temporary directory and checks pages, the search index, comment mapping, assets, diagrams, formulas and feature flags. It does not modify an existing blog.

## Add to an existing blog

```sh
git submodule add https://github.com/czyt/hugo-RainBow.git themes/RainBow
ln -s themes/RainBow/_vendor _vendor
```

Create the `_vendor` symlink only if your blog does not already have one. Blogs with existing Hugo Module dependencies should manage those dependencies together rather than overwrite their vendor directory. The symlink lets a conventional theme installation use the pinned HugoMods without installing Go or downloading modules during a Cloudflare build.

```toml
theme = ["RainBow"]
locale = "en-US"
defaultContentLanguage = "en"

[params]
ShowCodeCopyButtons = true
ShowToc = true
TocSide = "right" # left / right; omit for an inline table of contents
EnableImageZoom = true
comments = true

[params.utterances]
repo = "YOUR_NAME/YOUR_COMMENTS_REPO"
mapping = "pathname"
label = ""
theme = "preferred-color-scheme"

[markup.highlight]
noClasses = false

[outputs]
home = ["HTML", "RSS", "JSON"]
```

For an existing comment history, preserve the original `repo`, `mapping` and article URLs. RainBow uses the HugoMods `setTheme()` interface to keep comments in sync with light and dark mode. The legacy `params.utteranc` configuration remains supported.

Math supports the `katex` shortcode and fenced code blocks. Set `math: true` in an article's front matter to recognize delimiters such as `$...$`. Mermaid supports both the original `mermaid` shortcode and fenced code blocks. Assets load only on pages that use them.

`ShowCodeCopyButtons`, `EnableImageZoom` and `comments` can each be disabled in article front matter. Omit `homeInfoParams.Title` to display the introduction without repeating the site name. Set `params.homeInfoParams.Typewriter = true` to play the introduction's typing effect once per home-page visit; it respects reduced motion.

## Table of contents and copy buttons

A thin stepped rail follows the heading hierarchy and marks the current section with the theme accent. The top navigation uses a shared highlight bubble that follows the pointer and returns to the current route on leave; keyboard and reduced-motion navigation position it immediately.

```toml
[params]
TocOpen = true
CodeCopyDisplay = "hover" # always / hover
```

The table of contents opens by default. Its floating toggle appears on hover or keyboard focus and stays visible on touch devices. In `hover` mode, the code-copy button appears on code-block hover or keyboard focus and remains visible on touch devices.

## Code highlighting

```toml
[params]
CodeHighlighter = "gpu-lexer" # chroma / gpu-lexer
```

This is a site-level setting. The default, `chroma`, uses Hugo's build-time highlighting. `gpu-lexer` attempts experimental highlighting in secure browser contexts that support WebGPU. HTML always includes the Chroma fallback; a module or GPU initialization failure, timeout or invalid result leaves it intact. Code is processed locally in the visitor's browser and is not sent to an external service.

The GPU module loads only as code blocks approach the viewport. Blocks with line numbers, highlighted lines or more than 100,000 characters continue to use Chroma. Code text and copy buttons stay intact. The experimental lexical classifier can misclassify tokens and should not be used for syntax validation.

The browser distribution version and checksum are recorded in `data/rainbow/gpu-lexer.json`. Every Monday, **Update GPU lexer** checks npm for a new version without running npm lifecycle scripts. It commits an update only after export and syntax checks, renderer regression tests and the Hugo build pass. Upstream license or export changes stop the update for manual review. The workflow can also run manually in Actions.

```sh
python3 scripts/update-gpu-lexer.py
bash scripts/verify.sh
```

## Reading fonts

Maple Mono is preferred, with LXGW WenKai 1.7.0 for Chinese. Code blocks also prefer Maple Mono, then fall back to LXGW WenKai Mono and system monospace fonts. No additional Song-style font is loaded.

```toml
[params.rainbow]
monoFontCSS = "https://cdn.jsdelivr.net/npm/@fontsource/maple-mono@5.3.0/index.min.css"
readingFontCSS = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.min.css"
```

You can point these settings to your own CSS providing the same font families, or set them to empty strings to use local font fallbacks.

## Tags

```toml
[params]
TagLayout = "cloud" # cloud / labels
TagEffects = true # Enable tag-cloud ambience
```

These settings determine the initial view. Visitors can use the small bear switch in the upper-right corner to alternate between the 3D tag sphere and the complete tag list; the browser remembers their choice. The sphere displays up to 60 popular tags and supports dragging and keyboard selection. Rotation stops on hover, keyboard focus or switching to the list. Reduced motion defaults to the list. There are no bottom controls or helper text; `TagEffects` configures the ambience. Both views use stable colors derived from tag names. The complete list and article header share compact labels with counts inside. Index counts are always visible; hover adds only subtle background feedback.

## Footer customization

The default footer shows only “Powered by RainBow”. Configure Hugo's top-level `copyright`, `params.footer.text` (Markdown supported) and `params.footer.showThemeCredit` as needed:

```toml
copyright = "© {year} Your Name"

[params.footer]
text = "[About](/about/)"
showThemeCredit = true
```

`{year}` is replaced with the current year at build time.

Set `showThemeCredit = false` to hide the theme link, or `hideFooter = true` to hide the entire footer. No default copyright line is generated when the blog provides neither copyright nor custom text.

## HugoMods and maintenance

The theme pins these modules:

| Module | Version | Purpose |
| --- | --- | --- |
| hugomods/utterances | 0.1.0 | GitHub Issues comments and theme interface |
| hugomods/mermaid | 0.1.4 | Mermaid shortcodes and render hooks |
| hugomods/katex | 0.3.6 | Math and local font assets |

Transitive dependencies are recorded in `go.mod`, `go.sum` and `_vendor/modules.txt`. Browser-side Mermaid is pinned to 11.12.0 and uses strict security mode. All vendored dependency licenses remain in `licenses/`; `scripts/vendor.sh` restores them when regenerating dependencies and removes upstream build-tool npm development manifests.

RainBow originates from [PaperMod](https://github.com/adityatelange/hugo-PaperMod). Its original MIT license and author notices remain in `LICENSE`, asset license headers and the `[original]` section of `theme.toml`. The initial synchronization used commit `d3768854d00ad003b0a8dbdba254ce9224377a01`. RainBow is maintained independently and no longer merges upstream automatically or periodically. The `upstream` remote and original Git history are retained for provenance.

When updating modules, run the following in the theme repository and commit the lock files and `_vendor` changes:

```sh
hugo mod get github.com/hugomods/utterances@v0.1.0
bash scripts/vendor.sh
bash scripts/verify.sh
```

Update a blog that uses the theme:

```sh
git submodule update --init --recursive
git submodule update --remote themes/RainBow
hugo --gc --minify
```

Commit the updated submodule revision in the blog so Cloudflare Pages' Git integration receives a new commit and redeploys. Set Cloudflare's `HUGO_VERSION` explicitly to `0.165.0`; use `hugo --gc --minify` as the build command and `public` as the output directory.

## Maintenance boundaries

RainBow's layouts and base assets are maintained in this repository. Most customization lives in `assets/css/extended/`, `assets/js/rainbow.js` and `layouts/_partials/rainbow/`. Comments, the footer, the table of contents and the home introduction also have template adjustments; check those locations when making changes.

The old duplicate copy-button initialization, unused visit counter, obsolete MathJax injection and unused iQiyi shortcode containing hardcoded credentials have been removed. Existing Bilibili embeds and the compatibility shortcode for Gist, which newer Hugo versions removed, remain supported.

## Markdown reading styles

Body links use a thin underline and the theme accent, with a small direction mark for external links. Navigation, tags, the table of contents and the footer do not use these body-link styles.

Clickable tags appear below the article title and date. Each link opens the article list for that tag; tags are not repeated at the end. Neutral article tags show their counts inside the same fixed-size box. On desktop hover, counts fade in over 160ms and the background fills with a slight slide over 180ms. Keyboard focus reveals them immediately; touch keeps counts visible. Reduced motion is respected. Articles without tags do not render an empty tag area.

Blockquotes use indentation and muted text. The `blockquote` shortcode supports multiple paragraphs and source attribution. Lists retain native numbering and authored start values, with dots, circles or letters distinguishing nested levels; no number badges are added. Footnotes use bracketed references, a separator and target highlighting. Native fragment navigation supports browser history and keyboard focus. See `exampleSite/content/posts/typography.md` for examples.

## Status pages

The 404 page is generated automatically with home and search links. The search link appears only when the site has a page with `layout: search`. The page follows the site's language and color scheme. A bear illustration accompanies a character-scramble reveal that resolves to the status code in about 640ms. Hovering or focusing the home link restores the bear’s expression. Reduced motion displays the code immediately. The explanation and navigation remain stable.

The 404 page includes Snake and Tetris, selected using two icon buttons below the game. Switching pauses the current game and preserves each round. Snake supports arrow keys / WASD, Space to pause, touch swipes and direction buttons, with wrapping edges and increasing speed. Tetris uses an LCD palette, seven pieces, rotation, line scoring and increasing gravity: arrow keys move/rotate/fall, Space drops, and P pauses; touch buttons provide the same actions. Both games start on request and can restart after game over. Switching browser tabs, blurring the window or moving focus outside a game pauses it. Arcade assets load only on the 404 page; error details and navigation remain available without JavaScript. The switch uses Lucide icons; see `licenses/lucide.LICENSE`.

To add 500 or 503 pages, copy `exampleSite/content/500.md` and `exampleSite/content/503.md` into your blog's `content/` directory. Hugo generates `/500.html` and `/503.html` using the shared `layout: status`. These pages stay out of article lists, search, RSS and sitemaps, and are marked noindex. For multilingual sites, place them in the appropriate language content directories and set their URLs for your deployment paths.

These files provide page content only. Configure the server or CDN to serve them for actual HTTP 500/503 responses while preserving the error status code; a direct request for a static file usually returns 200. Cloudflare Pages uses a root `404.html` for missing paths, but the presence of `500.html` does not automatically replace platform-generated 5xx pages. Do not simulate server errors with a 200 rewrite rule.
