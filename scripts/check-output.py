"""Regression checks for the published theme fixture (no private blog content)."""
import json
import hashlib
import sys
from html.parser import HTMLParser
from pathlib import Path

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.elements = []
        self.feed(path.read_text())
    def find(self, tag, **attrs):
        return [a for t, a in self.elements if t == tag and all(a.get(k) == v for k, v in attrs.items())]
    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

root = Path(sys.argv[1])
for name in ['index.html', 'posts/reading/index.html', 'posts/without-copy/index.html', 'search/index.html', 'archives/index.html', 'tags/index.html', '404.html', 'index.xml']:
    assert (root / name).is_file(), f'Missing output: {name}'
reading = Page(root / 'posts/reading/index.html')
comments = reading.find('script', repo='example/comments')
assert len(comments) == 1 and comments[0]['issue-term'] == 'pathname', 'Issue mapping changed'
assert reading.find('main', id='main'), 'Skip-link target missing'
assert reading.find('details', **{'class': 'toc side right'}), 'Side TOC lost'
assert any('medium-zoom' in a.get('src', '') for a in reading.find('script')), 'Zoom asset missing'
assert any('katex' in a.get('src', '') for a in reading.find('script')), 'Formula assets missing'
text = (root / 'posts/reading/index.html').read_text()
assert 'mermaid@11.12.0' in text and 'securityLevel' in text, 'Mermaid integration missing'
assert 'class=mermaid' in text or 'class="mermaid"' in text, 'Mermaid render hook missing'
without = Page(root / 'posts/without-copy/index.html')
assert not without.find('script', repo='example/comments'), 'comments:false ignored'
assert any('medium-zoom' in a.get('src', '') for a in without.find('script')), 'Zoom depends on copy buttons'
assert not any('katex' in a.get('src', '') for a in without.find('script')), 'Unused math assets loaded'
index = json.loads((root / 'index.json').read_text())
assert any('/posts/reading/' in p['permalink'] for p in index), 'Search index lost the article'
# Every local stylesheet and script emitted by the fixture must exist.
for path in root.rglob('*.html'):
    for tag, attrs in Page(path).elements:
        url = attrs.get('src') if tag == 'script' else attrs.get('href') if tag == 'link' and attrs.get('rel') in ('stylesheet', 'preload stylesheet') else None
        if url and url.startswith('/') and not url.startswith('//'):
            assert (root / url.lstrip('/').split('?')[0]).exists(), f'{path}: missing {url}'
print('PASS: page routes, comments mapping, independent feature flags, diagrams, math, search and local assets')

# The game must stay exclusive to 404, including its CSS and bundled engine.
not_found = Page(root / '404.html')
assert any('data-snake-game' in a for a in not_found.find('section')), '404: Snake game missing'
assert any('data-snake-board' in a for a in not_found.find('div', tabindex='0')), '404: keyboard game target missing'
assert len(not_found.find('button', **{'data-snake-direction': 'up'})) == 1, '404: touch controls missing'
assert any('arcade-404' in a.get('src', '') for a in not_found.find('script')), '404: game script missing'
assert any('arcade-404' in a.get('href', '') for a in not_found.find('link')), '404: game styles missing'
for path in root.rglob('*.html'):
    if path.name != '404.html':
        assert 'arcade-404' not in path.read_text(), f'{path}: unused game assets loaded'
assert len(not_found.find('button', role='tab')) == 2, '404: game switch missing'
assert any('data-tetris-game' in a for a in not_found.find('section')), '404: Tetris missing'
print('PASS: 404-only arcade assets, game switch, keyboard target and touch controls')

repo = Path(__file__).resolve().parents[1]
package = json.loads((repo / 'data/rainbow/gpu-lexer.json').read_text())
assert hashlib.sha256((repo / 'assets/js/vendor/gpu-lexer.js').read_bytes()).hexdigest() == package['sha256'], 'GPU bundle checksum mismatch'
assert any('gpu-highlight' in a.get('src', '') for a in reading.find('script')), 'GPU site option ignored'
print('PASS: pinned GPU distribution and experimental-mode assets')

# Status documents must remain reachable without becoming articles or search results.
for code in (404, 500, 503):
    page = Page(root / f'{code}.html')
    assert page.find('h1', id='status-title'), f'{code}: missing error heading'
    assert page.find('meta', name='robots', content='noindex, nofollow'), f'{code}: indexable error page'
    assert page.find('a', **{'class': 'status-home', 'href': '/'}), f'{code}: missing recovery route'
    assert not page.find('script', repo='example/comments'), f'{code}: unexpected comments'
    if code != 404:
        assert not any(f'/{code}.html' in p['permalink'] for p in index), f'{code}: included in search'
        for name in ('index.html', 'index.xml', 'sitemap.xml', 'archives/index.html'):
            assert f'/{code}.html' not in (root / name).read_text(), f'{code}: included in {name}'

typography = Page(root / 'posts/typography/index.html')
assert typography.find('ol', start='8'), 'Authored list start was lost'
ids = {a['id'] for _, a in typography.elements if 'id' in a}
refs = typography.find('a', **{'class': 'footnote-ref'})
backs = typography.find('a', **{'class': 'footnote-backref'})
assert len(refs) == 3 and len(backs) == 3, 'Repeated footnote references lost'
assert all(a['href'][1:] in ids for a in refs + backs), 'Broken footnote target'
print('PASS: status recovery, noindex, article exclusion, list numbering and footnote links')

tags = Page(root / 'tags/index.html')
assert tags.find('input', id='tag-view-toggle', type='checkbox', role='switch'), 'Native tag view switch missing'
assert tags.find('div', id='tag-cloud') and tags.find('ul', id='tag-labels'), 'Tag view targets missing'
assert not any(a.get('class') in ('sphere-pause', 'sphere-effects', 'tag-sphere-controls', 'tag-sphere-limit') for _, a in tags.elements), 'Removed bottom tag controls returned'
not_found = Page(root / '404.html')
assert any('status-404' in a.get('src', '') for a in not_found.find('script')), '404 reveal missing'
assert not any('status-404' in a.get('src', '') for a in reading.find('script')), '404 animation leaked into articles'
print('PASS: native tag switch, removed bottom controls and page-scoped 404 script')

assert reading.find('ul', **{'class': 'post-tags post-header-tags rainbow-label-tags'}), 'Header tag links missing'
assert not reading.find('ul', **{'class': 'post-tags'}), 'Duplicate footer tags returned'
assert any('/tags/' in a.get('href', '') for a in reading.find('a')), 'No tag archive destinations'
assert reading.find('span', **{'class': 'tag-count'}), 'Article tag count structure missing'
print('PASS: header-only article tags and label count structure')

external = typography.find('a', href='https://gohugo.io/')
assert external and external[0].get('class') == 'prose-external', 'External prose link not classified'
internal = typography.find('a', href='/posts/reading/')
assert internal and internal[0].get('class') != 'prose-external', 'Internal prose link misclassified'
assert typography.find('span', **{'class': 'prose-external-mark', 'aria-hidden': 'true'}), 'External marker missing'
assert '↗' not in (root / 'posts/typography/index.html').read_text(), 'Decorative arrow can leak into plain-text summaries'
print('PASS: prose link classification and text-only summary isolation')
