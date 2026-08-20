const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');

test('page exposes the required four-part clinical workflow', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    const markers = [
        'id="sodium-form"',
        'id="patient-section"',
        'id="intake-section"',
        'id="output-section"',
        'id="result-section"',
        'id="baseline-na"',
        'id="formula-free-water"',
        'id="urine-volume"',
        'id="urine-sodium"',
        'id="urine-potassium"',
        'id="urine-sample-local"',
        'id="predicted-na"',
        'id="predicted-range"',
        'id="delta-na"',
        'id="data-completeness"',
        'id="prediction-messages"'
    ];

    for (const marker of markers) {
        assert.ok(html.includes(marker), `missing ${marker}`);
    }
    assert.match(html, /預估未來 24 小時尿量/);
    assert.match(html, /最近一次尿鈉/);
    assert.match(html, /最近一次尿鉀/);
    assert.match(html, /代理未來 24 小時的平均尿液組成/);
});

test('page loads the shared stylesheet and clinical scripts in order', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');

    assert.match(html, /<link rel="stylesheet" href="styles\.css">/);
    assert.match(html, /<script src="clinical-model\.js" defer><\/script>/);
    assert.match(html, /<script src="app\.js" defer><\/script>/);
    assert.ok(html.indexOf('clinical-model.js') < html.indexOf('app.js'));
});

test('clinical result announces live updates and the page avoids inline event handlers', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');

    assert.match(html, /id="result-section"[^>]*aria-live="polite"/);
    assert.doesNotMatch(html, /\son(?:input|change|click)=/i);
});

test('browser controller exists and every referenced element id is present', () => {
    const appPath = join(root, 'app.js');
    assert.ok(existsSync(appPath), 'missing app.js');

    const app = readFileSync(appPath, 'utf8');
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    const referencedIds = [...app.matchAll(/byId\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);

    assert.ok(referencedIds.length > 20, 'expected the controller to reference the clinical workflow');
    for (const id of referencedIds) {
        assert.ok(html.includes(`id="${id}"`), `app.js references missing #${id}`);
    }
    assert.match(app, /addEventListener\(['"]input['"],\s*update\)/);
    assert.match(app, /addEventListener\(['"]change['"],\s*update\)/);
});
