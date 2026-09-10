import * as params from '@params';
import { tokenRuns } from './gpu-spans.mjs';

(async () => {
    if (!window.isSecureContext || !navigator.gpu || !window.IntersectionObserver) return;
    const blocks = Array.from(document.querySelectorAll('.post-content pre > code')).filter(code => {
        // Keep Chroma's explicit line numbers and emphasized lines intact.
        return !code.closest('.lntable') && !code.querySelector('.ln, .lnt, .hl') && code.textContent.length <= 100000;
    });
    if (!blocks.length) return;
    const pending = [];
    let running = false;
    let failed = false;
    let parser;
    const deadline = (promise, milliseconds) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('GPU highlighting timed out')), milliseconds);
        promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
    async function drain() {
        if (running || failed) return;
        running = true;
        try {
            parser ||= deadline(import(params.lexerURL).then(module => {
                if (typeof module.parse !== 'function') throw new Error('Unsupported GPU lexer API');
                return module.parse;
            }), 8000);
            const parse = await parser;
            while (pending.length && !failed) {
                const code = pending.shift();
                if (!code.isConnected) continue;
                const source = code.textContent;
                const spans = await deadline(parse(source), 8000);
                const runs = tokenRuns(source, spans);
                const fragment = document.createDocumentFragment();
                for (const run of runs) {
                    if (run.type === 'plain') fragment.appendChild(document.createTextNode(run.text));
                    else {
                        const span = document.createElement('span');
                        span.className = `gpu-token-${run.type}`;
                        span.textContent = run.text;
                        fragment.appendChild(span);
                    }
                }
                if (fragment.textContent !== source || code.textContent !== source) throw new Error('Code changed during GPU highlighting');
                code.replaceChildren(fragment);
                code.dataset.highlighter = 'gpu-lexer';
            }
        } catch {
            // Original Hugo markup is untouched unless an entire result succeeded.
            failed = true;
            pending.length = 0;
            observer.disconnect();
        } finally {
            running = false;
        }
    }
    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            pending.push(entry.target);
        }
        void drain();
    }, { rootMargin: '200px' });
    blocks.forEach(code => observer.observe(code));
})();
