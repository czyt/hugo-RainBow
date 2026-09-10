"""Regression checks for the published theme fixture (no private blog content)."""
import json
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
