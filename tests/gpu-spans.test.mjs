import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenRuns } from '../assets/js/gpu-spans.mjs';

test('preserves gaps, whitespace, markup-looking text and Unicode exactly', () => {
    const source = 'const 名字 = "😀<script>";\n';
    const runs = tokenRuns(source, [{type:'keyword',start:0,end:5}]);
    assert.equal(runs.map(run => run.text).join(''), source);
    assert.deepEqual(runs[0], {type:'keyword',text:'const'});
});
test('rejects overlapping, reversed, out-of-range and non-integer offsets', () => {
    for (const spans of [
        [{type:'plain',start:1,end:3},{type:'keyword',start:2,end:4}],
        [{type:'plain',start:2,end:1}], [{type:'plain',start:0,end:50}],
        [{type:'plain',start:.5,end:2}], [{type:'plain',start:-1,end:2}],
    ]) assert.throws(() => tokenRuns('code', spans));
});
test('rejects injected class names, malformed results and split surrogate pairs', () => {
    assert.throws(() => tokenRuns('code', [{type:'x" onclick="alert(1)',start:0,end:4}]));
    assert.throws(() => tokenRuns('code', null));
    assert.throws(() => tokenRuns('😀', [{type:'plain',start:0,end:1}]));
});
test('allows omitted plain spans and empty source', () => {
    assert.deepEqual(tokenRuns('unchanged', []), [{type:'plain',text:'unchanged'}]);
    assert.deepEqual(tokenRuns('', []), []);
});
