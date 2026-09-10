#!/usr/bin/env bash
set -euo pipefail
rainbow_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$rainbow_root"
hugo mod vendor
python3 - <<'PY'
from pathlib import Path
import shutil
vendor = Path('_vendor')
# These are upstream npm development manifests, not dependencies of the theme build.
for name in ['package.json', 'package-lock.json', 'babel.config.js']:
    for path in vendor.rglob(name):
        path.unlink()
for module in ['github.com/KaTeX/KaTeX', 'github.com/hugomods/hugopress', 'github.com/hugomods/katex', 'github.com/hugomods/mermaid', 'github.com/hugomods/utterances']:
    source = Path('licenses') / (module.replace('/', '-') + '.LICENSE')
    shutil.copyfile(source, vendor / module / 'LICENSE')
PY
