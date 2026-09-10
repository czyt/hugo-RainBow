#!/usr/bin/env bash
set -euo pipefail
rainbow_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
rainbow_output=$(mktemp -d)
trap 'rm -rf "$rainbow_output"' EXIT
"${HUGO_BIN:-hugo}" --source "$rainbow_root/exampleSite" \
  --themesDir "$(dirname "$rainbow_root")" --theme "$(basename "$rainbow_root")" \
  --destination "$rainbow_output" --cacheDir "$rainbow_output/cache" --gc --minify --panicOnWarning
python3 "$rainbow_root/scripts/check-output.py" "$rainbow_output"
# Verify configurable footer and label-view defaults rather than only the demo defaults.
cat > "$rainbow_output/overrides.toml" <<'CONFIG'
copyright = "© {year} Example Owner"
[params]
TagLayout = "labels"
[params.footer]
text = "[About](/about/)"
showThemeCredit = false
CONFIG
"${HUGO_BIN:-hugo}" --source "$rainbow_root/exampleSite" \
  --config "$rainbow_root/exampleSite/hugo.toml,$rainbow_output/overrides.toml" \
  --themesDir "$(dirname "$rainbow_root")" --theme "$(basename "$rainbow_root")" \
  --destination "$rainbow_output/alternate" --cacheDir "$rainbow_output/cache" --minify --panicOnWarning
python3 - "$rainbow_output/alternate" <<'PY'
from pathlib import Path
import re, sys
root = Path(sys.argv[1])
text = (root / 'index.html').read_text()
footer = re.search(r'<footer class=footer>(.*?)</footer>', text).group(1)
assert 'Example Owner' in footer and '{year}' not in footer
assert 'About' in footer and 'github.com/czyt/hugo-RainBow' not in footer
assert 'data-default-view=labels' in (root / 'tags/index.html').read_text()
print('PASS: configurable copyright, year replacement, custom footer, hidden credit and initial tag view')
PY
