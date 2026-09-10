#!/usr/bin/env python3
"""Update only gpu-lexer's browser distribution; never run npm lifecycle scripts."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile

root = Path(__file__).resolve().parents[1]
metadata = root / 'data/rainbow/gpu-lexer.json'
current = json.loads(metadata.read_text())
version = subprocess.check_output(['npm', 'view', 'gpu-lexer', 'version'], text=True).strip()
if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?', version):
    raise SystemExit('Unexpected npm version')
if current['version'] == version:
    print(f'gpu-lexer {version} is current')
    raise SystemExit(0)
with tempfile.TemporaryDirectory(prefix='rainbow-gpu-') as temporary:
    result = subprocess.check_output(['npm', 'pack', f'gpu-lexer@{version}', '--ignore-scripts', '--json', '--pack-destination', temporary], text=True)
    package = json.loads(result)[0]
    archive = Path(temporary) / Path(package['filename']).name
    with tarfile.open(archive, 'r:gz') as bundle:
        info = json.load(bundle.extractfile('package/package.json'))
        if info.get('name') != 'gpu-lexer' or info.get('version') != version or info.get('license') != 'MIT':
            raise SystemExit('Package identity or license changed; review manually')
        entry = bundle.getmember('package/dist/index.js')
        if not entry.isfile() or entry.size > 1_000_000:
            raise SystemExit('Unexpected browser bundle')
        source = bundle.extractfile(entry).read()
    text = source.decode('utf-8')
    if not re.search(r'export\s*(?:\{[^}]*\bparse\b|(?:async\s+)?function\s+parse\b)', text):
        raise SystemExit('parse export changed; review manually')
    # Parse syntax without executing the downloaded module inside the CI process.
    subprocess.run(['node', '--input-type=module', '--check'], input=source, check=True)
    (root / 'assets/js/vendor/gpu-lexer.js').write_bytes(source)
    metadata.write_text(json.dumps({'version': version, 'sha256': hashlib.sha256(source).hexdigest()}, indent=2) + '\n')
    print(f'Updated gpu-lexer {current["version"]} -> {version}')
