const types = new Set(['plain', 'comment', 'string', 'number', 'keyword', 'type', 'function', 'constant', 'operator']);

// GPU output is untrusted display metadata. It must never change the source text.
export function tokenRuns(source, spans) {
    if (!Array.isArray(spans) || spans.length > source.length + 1) throw new Error('Invalid GPU spans');
    const result = [];
    let offset = 0;
    const splitsSurrogate = index => index > 0 && index < source.length &&
        /[\uD800-\uDBFF]/.test(source[index - 1]) && /[\uDC00-\uDFFF]/.test(source[index]);
    for (const span of spans) {
        if (!span || !types.has(span.type) || !Number.isInteger(span.start) || !Number.isInteger(span.end) ||
            span.start < offset || span.end <= span.start || span.end > source.length || splitsSurrogate(span.start) || splitsSurrogate(span.end)) {
            throw new Error('Invalid GPU span');
        }
        if (span.start > offset) result.push({ type: 'plain', text: source.slice(offset, span.start) });
        result.push({ type: span.type, text: source.slice(span.start, span.end) });
        offset = span.end;
    }
    if (offset < source.length) result.push({ type: 'plain', text: source.slice(offset) });
    return result;
}
