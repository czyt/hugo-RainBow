import * as params from '@params';
import Utterances from 'mods/utterances/js';
import { initTreeToc } from './toc-tree.js';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const comments = new Utterances();
const commentTheme = () => root.dataset.theme === 'dark' ? 'github-dark' : 'github-light';
const syncComments = () => comments.setTheme(commentTheme());
new MutationObserver(syncComments).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
// Utterances inserts its iframe asynchronously; sync once the iframe is ready too.
const commentSection = document.querySelector('.rainbow-comments');
if (commentSection) {
    const bindCommentFrame = () => {
        const frame = commentSection.querySelector('.utterances-frame');
        if (!frame) return false;
        const endpoint = new URL(frame.src).origin;
        const onReady = event => {
            if (event.source !== frame.contentWindow || event.origin !== endpoint || event.data?.type !== 'resize') return;
            window.removeEventListener('message', onReady);
            syncComments();
        };
        window.addEventListener('message', onReady);
        frame.addEventListener('load', syncComments);
        syncComments();
        return true;
    };
    if (!bindCommentFrame()) {
        const observer = new MutationObserver(() => {
            if (bindCommentFrame()) observer.disconnect();
        });
        observer.observe(commentSection, { childList: true, subtree: true });
    }
}

const menu = document.getElementById('menu');
if (menu) {
    try { menu.scrollLeft = Number(localStorage.getItem('menu-scroll-position')) || 0; } catch {}
    menu.addEventListener('scroll', () => {
        try { localStorage.setItem('menu-scroll-position', menu.scrollLeft); } catch {}
    }, { passive: true });
}

const toggle = document.getElementById('theme-toggle');
toggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('pref-theme', root.dataset.theme); } catch {}
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
        let id;
        try { id = decodeURIComponent(anchor.hash.slice(1)); } catch { return; }
        const target = document.getElementById(id);
        if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        // Native fragment navigation keeps footnote :target and browser history in sync.
        if (anchor.matches('.footnote-ref, .footnote-backref')) {
            target.tabIndex = -1;
            target.focus({ preventScroll: true });
            return;
        }
        event.preventDefault();
        // Keyboard navigation and reduced-motion preferences get an immediate jump.
        target.scrollIntoView({ behavior: reducedMotion.matches || event.detail === 0 ? 'instant' : 'smooth' });
        history.pushState(null, '', anchor.hash);
        if (anchor.classList.contains('skip-link')) target.focus({ preventScroll: true });
    });
});

const topLink = document.getElementById('top-link');
const progressBar = document.querySelector('.reading-progress-bar');
const articleContent = document.querySelector('.post-content');
const readingControls = document.querySelector('.reading-controls');
if (readingControls && articleContent) {
    const sizes = ['small', 'default', 'large'];
    const setReadingSize = size => {
        const selected = sizes.includes(size) ? size : 'default';
        root.dataset.readingSize = selected;
        readingControls.querySelectorAll('button').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.readingSize === selected));
        });
        try { localStorage.setItem('rainbow-reading-size', selected); } catch {}
    };
    let savedSize;
    try { savedSize = localStorage.getItem('rainbow-reading-size'); } catch {}
    setReadingSize(savedSize);
    readingControls.hidden = false;
    readingControls.addEventListener('click', event => {
        const button = event.target.closest('button[data-reading-size]');
        if (button) setReadingSize(button.dataset.readingSize);
    });
}
const tocLinks = Array.from(document.querySelectorAll('.toc a[href^="#"]')).flatMap(link => {
    let heading;
    try { heading = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return []; }
    return heading ? [{ link, heading }] : [];
});
let activeLink;
let redrawTocRail;
let scrollScheduled = false;
function updateScroll() {
    scrollScheduled = false;
    root.classList.toggle('is-scrolled', window.scrollY > 16);
    topLink?.classList.toggle('hidden', window.scrollY < window.innerHeight);
    if (progressBar && articleContent) {
        const rect = articleContent.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight);
        const progress = Math.max(0, Math.min(1, -rect.top / distance));
        progressBar.style.transform = `scaleX(${progress})`;
    }
    let current = tocLinks[0];
    const headingOffset = tocLinks[0] ? parseFloat(getComputedStyle(tocLinks[0].heading).scrollMarginTop) || 100 : 100;
    for (const entry of tocLinks) {
        if (entry.heading.getBoundingClientRect().top <= headingOffset + 4) current = entry;
        else break;
    }
    if (current?.link !== activeLink) {
        activeLink?.removeAttribute('aria-current');
        activeLink = current?.link;
        activeLink?.setAttribute('aria-current', 'location');
        redrawTocRail?.();
        const inner = activeLink?.closest('.inner');
        if (inner && matchMedia('(min-width: 1280px)').matches && !inner.matches(':hover')) {
            const bounds = inner.getBoundingClientRect();
            const linkBounds = activeLink.getBoundingClientRect();
            if (linkBounds.top < bounds.top) inner.scrollTop -= bounds.top - linkBounds.top + 8;
            else if (linkBounds.bottom > bounds.bottom) inner.scrollTop += linkBounds.bottom - bounds.bottom + 8;
        }
    }
}
window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
        scrollScheduled = true;
        requestAnimationFrame(updateScroll);
    }
}, { passive: true });
updateScroll();
if (progressBar) window.addEventListener('resize', updateScroll, { passive: true });
if (progressBar && articleContent && 'ResizeObserver' in window) {
    new ResizeObserver(updateScroll).observe(articleContent);
}

// Native details remain collapsible on smaller screens; wide side TOCs start open.
const sideToc = document.querySelector('details.toc.side');
if (sideToc && matchMedia('(min-width: 1280px)').matches) sideToc.open = true;

// Measure the rendered hierarchy so wrapped titles and either TOC renderer align.
const tocInner = document.querySelector('.toc .inner');
if (tocInner && tocLinks.length && tocInner.closest('details').dataset.tocStyle === 'tree') {
    redrawTocRail = initTreeToc(tocInner, tocLinks, () => activeLink);
} else if (tocInner && tocLinks.length) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    svg.classList.add('toc-rail');
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(path);
    tocInner.classList.add('toc-rail-root');
    tocInner.appendChild(svg);
    function drawRail() {
        if (!tocInner.clientWidth || !tocInner.closest('details').open) return;
        const bounds = tocInner.getBoundingClientRect();
        const rtl = getComputedStyle(tocInner).direction === 'rtl';
        const rows = tocLinks.map(({ link }) => {
            const rect = link.getBoundingClientRect();
            return {
                x: (rtl ? rect.right - 1 : rect.left + 1) - bounds.left + tocInner.scrollLeft,
                top: rect.top - bounds.top + tocInner.scrollTop,
                bottom: rect.bottom - bounds.top + tocInner.scrollTop
            };
        });
        let d = `M ${rows[0].x} ${rows[0].top + 3}`;
        rows.forEach((row, index) => {
            const next = rows[index + 1];
            if (next && next.x !== row.x) {
                const middle = (row.bottom + next.top) / 2;
                d += ` V ${middle - 4} Q ${row.x} ${middle} ${(row.x + next.x) / 2} ${middle}`;
                d += ` Q ${next.x} ${middle} ${next.x} ${middle + 4}`;
            } else d += ` V ${row.bottom - (next ? 0 : 3)}`;
        });
        svg.style.height = `${rows.at(-1).bottom + 4}px`;
        path.setAttribute('d', d);
    }
    redrawTocRail = drawRail;
    const railObserver = new ResizeObserver(drawRail);
    railObserver.observe(tocInner);
    Array.from(tocInner.children).filter(child => child !== svg).forEach(child => railObserver.observe(child));
    tocInner.closest('details').addEventListener('toggle', drawRail);
    document.fonts?.ready.then(drawRail);
    drawRail();
}

// A shared highlight follows pointer intent, then returns to the current route.
if (menu) {
    const links = Array.from(menu.querySelectorAll('a'));
    const current = links.find(link => link.querySelector('.active'));
    const bubble = document.createElement('li');
    bubble.className = 'nav-bubble';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.setAttribute('role', 'presentation');
    menu.prepend(bubble);
    menu.classList.add('has-bubble');
    let selected = current;
    function placeBubble(link, animate = false) {
        selected = link;
        bubble.classList.toggle('is-moving', animate && !reducedMotion.matches);
        bubble.hidden = !link;
        if (!link) return;
        const rect = link.getBoundingClientRect();
        const bounds = menu.getBoundingClientRect();
        bubble.style.width = `${rect.width}px`;
        bubble.style.height = `${rect.height - 4}px`;
        bubble.style.transform = `translate(${rect.left - bounds.left + menu.scrollLeft}px, ${rect.top - bounds.top + 2}px)`;
        bubble.style.opacity = '1';
    }
    links.forEach(link => {
        link.addEventListener('pointerenter', event => {
            if (event.pointerType === 'mouse') placeBubble(link, true);
        });
        link.addEventListener('focus', () => placeBubble(link));
    });
    menu.addEventListener('pointerleave', () => placeBubble(menu.contains(document.activeElement) ? document.activeElement.closest('a') : current, true));
    menu.addEventListener('focusout', event => { if (!menu.contains(event.relatedTarget)) placeBubble(current); });
    new ResizeObserver(() => placeBubble(selected)).observe(menu);
    document.fonts?.ready.then(() => placeBubble(selected));
    placeBubble(current);
}

const languageNames = {go:'Go',golang:'Go',bash:'Bash',sh:'Shell',shell:'Shell',rust:'Rust',js:'JavaScript',javascript:'JavaScript',ts:'TypeScript',typescript:'TypeScript',json:'JSON',yaml:'YAML',yml:'YAML',toml:'TOML',sql:'SQL',html:'HTML',css:'CSS',python:'Python',py:'Python',csharp:'C#',cs:'C#',cpp:'C++',text:'Text',plaintext:'Text'};
document.querySelectorAll('.post-content pre > code').forEach(code => {
    code.tabIndex = 0;
    const language = code.dataset.lang || Array.from(code.classList).find(name => name.startsWith('language-'))?.slice(9);
    const container = code.closest('.highlight') || code.parentElement;
    if (!language || language === 'fallback' || container.querySelector('.code-language')) return;
    const label = document.createElement('span');
    label.className = 'code-language';
    label.textContent = languageNames[language.toLowerCase()] || language;
    container.appendChild(label);
});

function copyIcon(state) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    for (const [name, value] of Object.entries({viewBox:'0 0 24 24',width:'16',height:'16',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(name, value);
    // Lucide copy, check and circle-x geometry.
    const shapes = state === 'success' ? [['path',{d:'m20 6-11 11-5-5'}]] : state === 'error' ?
        [['circle',{cx:'12',cy:'12',r:'10'}],['path',{d:'m15 9-6 6m0-6 6 6'}]] :
        [['rect',{x:'8',y:'8',width:'14',height:'14',rx:'2'}],['path',{d:'M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2'}]];
    for (const [tag, attrs] of shapes) {
        const shape = document.createElementNS(namespace, tag);
        Object.entries(attrs).forEach(([key, value]) => shape.setAttribute(key, value));
        svg.appendChild(shape);
    }
    return svg;
}

if (params.copy) {
    document.querySelectorAll('.post-content pre > code').forEach(code => {
        const pre = code.parentElement;
        // Chroma's table line-number column is not a code block to copy.
        if (pre.closest('.lntd') && !code.querySelector('.cl')) return;
        const container = pre.closest('.highlight') || pre;
        if (container.querySelector('.copy-code')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code';
        button.dataset.display = params.copyDisplay;
        const status = document.createElement('span');
        status.className = 'visually-hidden';
        status.setAttribute('aria-live', 'polite');
        button.append(copyIcon('copy'), status);
        const setState = (state, label) => {
            button.dataset.state = state;
            button.setAttribute('aria-label', label);
            button.title = label;
            button.querySelector('svg').replaceWith(copyIcon(state));
            status.textContent = state === 'copy' ? '' : label;
        };
        setState('copy', params.copyLabel);
        let resetTimer;
        button.addEventListener('click', async () => {
            let copied = false;
            try {
                await navigator.clipboard.writeText(code.textContent);
                copied = true;
            } catch {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(code);
                selection.removeAllRanges();
                selection.addRange(range);
                try { copied = document.execCommand('copy'); } catch {}
                if (copied) selection.removeAllRanges();
            }
            setState(copied ? 'success' : 'error', copied ? params.copiedLabel : params.copyError);
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => setState('copy', params.copyLabel), 2000);
        });
        container.appendChild(button);
    });
}

if (params.zoom && window.mediumZoom) {
    const images = document.querySelectorAll('.entry-cover img, .post-content img:not([no-zoom]):not(a img)');
    const zoom = mediumZoom(images, { background: getComputedStyle(root).getPropertyValue('--theme').trim(), margin: 24 });
    new MutationObserver(() => zoom.update({ background: getComputedStyle(root).getPropertyValue('--theme').trim() }))
        .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    images.forEach(img => {
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', img.alt || 'Zoom image');
        img.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                zoom.open({ target: img });
            }
        });
    });
}

// Progressive enhancement: the complete intro remains visible without JavaScript.
if (params.typewriter && !reducedMotion.matches) {
    const paragraph = document.querySelector('.home-info .entry-content p');
    if (paragraph && paragraph.children.length === 0) {
        const text = paragraph.textContent;
        {
            const accessible = document.createElement('span');
            accessible.className = 'visually-hidden';
            accessible.textContent = text;
            const visual = document.createElement('span');
            visual.setAttribute('aria-hidden', 'true');
            const graphemes = typeof Intl.Segmenter === 'function'
                ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), part => part.segment)
                : Array.from(text);
            const chars = graphemes.map(char => {
                const span = document.createElement('span');
                span.className = 'typewriter-char';
                span.style.visibility = 'hidden';
                span.textContent = char;
                visual.appendChild(span);
                return span;
            });
            paragraph.replaceChildren(accessible, visual);
            let index = 0;
            let timer;
            const finish = () => {
                clearTimeout(timer);
                chars.forEach(char => { char.style.visibility = ''; char.classList.remove('typing'); });
                reducedMotion.removeEventListener('change', finish);
            };
            const tick = () => {
                chars[index - 1]?.classList.remove('typing');
                if (index >= chars.length) { finish(); return; }
                chars[index].style.visibility = '';
                chars[index].classList.add('typing');
                index += 1;
                timer = setTimeout(tick, 95);
            };
            reducedMotion.addEventListener('change', finish);
            timer = setTimeout(tick, 250);
        }
    }
}

// Archive filtering keeps normal links usable when JavaScript is unavailable.
const archiveFilter = document.querySelector('.archive-filter');
if (archiveFilter) {
    const select = archiveFilter.querySelector('select');
    const status = archiveFilter.querySelector('.archive-filter-status');
    const empty = document.querySelector('.archive-empty');
    const years = Array.from(document.querySelectorAll('.archive-year'));
    const entries = Array.from(document.querySelectorAll('.archive-entry')).map(element => {
        let tags = [];
        try { tags = JSON.parse(element.dataset.archiveTags); } catch {}
        return { element, tags: Array.isArray(tags) ? tags : [] };
    });
    // Draw a bounded set of background orbits; the focused row gets the bright track.
    const canvas = document.querySelector('.archive-orbits');
    const context = canvas?.getContext('2d');
    let active = null;
    let orbitFrame = 0, orbitPaint = 0;
    const orbitMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let orbitStart = 0;
    const drawOrbits = (time = 0) => {
        orbitFrame = 0;
        if (!orbitMotion.matches && !document.hidden) scheduleOrbits();
        if (time && time - orbitPaint < 40) return;
        orbitPaint = time;
        if (!orbitStart) orbitStart = time;
        if (!context) return;
        const width = window.innerWidth, height = window.innerHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const style = getComputedStyle(root);
        const accent = style.getPropertyValue('--rainbow-accent').trim();
        const ink = style.getPropertyValue('--secondary').trim();
        const visible = entries.filter(entry => !entry.element.hidden);
        const activeIndex = visible.findIndex(entry => entry.element === active);
        // One arc per post, distributed across the full viewport like a long exposure.
        const count = Math.min(visible.length, 220);
        const indices = new Set(Array.from({ length: count }, (_, index) => index));
        if (activeIndex >= 0) indices.add(activeIndex);
        const exposure = orbitMotion.matches ? 1 : Math.min(1, Math.max(0, (time - orbitStart) / 1800));
        const growth = 1 - Math.pow(1 - exposure, 3);
        const extent = Math.max(width, height);
        const cx = width * (width < 700 ? .82 : .73), cy = height * .36;
        for (const index of indices) {
            const highlighted = index === activeIndex;
            const spread = ((index * 89) % Math.max(visible.length, 1)) / Math.max(visible.length - 1, 1);
            const radius = extent * (.08 + spread * 1.05);
            const start = ((index * 2.399963) % (Math.PI * 2)) + (orbitMotion.matches ? 0 : time * .000045 * (index % 2 ? 1 : -1));
            const length = (.3 + (index * 17 % 85) / 100) * growth;
            context.beginPath();
            context.ellipse(cx, cy, radius * 1.06, radius * .82, -.12, start, start + length);
            context.strokeStyle = highlighted ? accent : ink;
            context.globalAlpha = highlighted ? .95 : .18 + (index % 4) * .045;
            context.lineWidth = highlighted ? 1.6 : .8;
            context.stroke();
            if (index % 3 === 0 || highlighted || growth < 1) {
                const a = start + length;
                const rx = radius * 1.06, ry = radius * .82;
                const dx = Math.cos(a) * rx, dy = Math.sin(a) * ry;
                context.beginPath();
                context.arc(cx + dx * Math.cos(-.12) - dy * Math.sin(-.12), cy + dx * Math.sin(-.12) + dy * Math.cos(-.12), highlighted ? 2.2 : 1, 0, Math.PI * 2);
                context.fillStyle = highlighted ? accent : ink;
                context.globalAlpha = highlighted ? .85 : .34;
                context.fill();
            }
        }
        context.globalAlpha = 1;
    };
    const scheduleOrbits = () => { if (!orbitFrame) orbitFrame = requestAnimationFrame(drawOrbits); };
    if (context) {
        entries.forEach(({ element }) => {
            element.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { active = element; scheduleOrbits(); } });
            element.addEventListener('pointerleave', () => { active = null; scheduleOrbits(); });
            element.addEventListener('focusin', () => { active = element; scheduleOrbits(); });
            element.addEventListener('focusout', () => { active = null; scheduleOrbits(); });
        });
        window.addEventListener('resize', scheduleOrbits, { passive: true });
        document.addEventListener('visibilitychange', scheduleOrbits);
        orbitMotion.addEventListener('change', scheduleOrbits);
        new MutationObserver(scheduleOrbits).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }
    const applyFilter = tag => {
        let count = 0;
        entries.forEach(({ element, tags }) => {
            const shown = !tag || tags.includes(tag);
            element.hidden = !shown;
            if (shown) count++;
        });
        years.forEach(year => {
            year.querySelectorAll('.archive-month').forEach(month => {
                month.hidden = !month.querySelector('.archive-entry:not([hidden])');
            });
            year.hidden = !year.querySelector('.archive-entry:not([hidden])');
        });
        empty.hidden = count !== 0;
        status.textContent = status.dataset.template.replace('{count}', String(count));
        scheduleOrbits();
    };
    const readLocation = () => {
        const tag = new URL(location.href).searchParams.get('tag') || '';
        const missing = select.querySelector('[data-missing]');
        missing?.remove();
        if (tag && !Array.from(select.options).some(option => option.value === tag)) {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            option.dataset.missing = '';
            select.appendChild(option);
        }
        select.value = tag;
        applyFilter(tag);
    };
    select.addEventListener('change', () => {
        const url = new URL(location.href);
        if (select.value) url.searchParams.set('tag', select.value);
        else url.searchParams.delete('tag');
        history.pushState(null, '', url);
        applyFilter(select.value);
    });
    window.addEventListener('popstate', readLocation);
    archiveFilter.hidden = false;
    readLocation();
}
