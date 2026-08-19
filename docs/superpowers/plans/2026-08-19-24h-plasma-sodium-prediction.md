# 24-Hour Plasma Sodium Prediction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transparent, safety-gated 24-hour plasma sodium scenario estimator to the existing tube-feeding salt calculator and publish the verified result on GitHub Pages.

**Architecture:** Keep the site framework-free and split the current monolithic page into semantic HTML, a pure clinical calculation module, a thin DOM controller, and shared CSS. The clinical module owns every conversion, validation, balance calculation, sensitivity range, completeness grade, and safety flag so Node tests and the browser use the same implementation.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js built-in `node:test` and `assert`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-19-24h-plasma-sodium-prediction-design.md`

## Global Constraints

- Adult, non-dialysis inpatients only; hemodialysis, peritoneal dialysis, CRRT, anuria, and missing core inputs must block the point estimate.
- Use Watson TBW and the accepted Edelman/Rose 24-hour sodium, potassium, and water balance equations exactly as specified.
- Never infer sodium excretion from eGFR and never recommend a salt dose.
- Formula water must come from product free-water content, not total formula volume.
- Clinical fields start empty; no fictitious patient may generate a prediction on first load.
- Show a scenario range, not a statistical confidence interval.
- Keep all processing local to the browser with no persistence, analytics, backend, or patient identifiers.
- Preserve a static, dependency-free GitHub Pages deployment.

---

### Task 1: Clinical conversions and Watson total body water

**Files:**
- Create: `clinical-model.js`
- Create: `tests/clinical-model.test.js`

**Interfaces:**
- Produces: `saltGramsToSodiumMg(grams): number`, `saltGramsToSodiumMeq(grams): number`, `sodiumMgToMeq(mg): number`, `potassiumMgToMeq(mg): number`, and `watsonTBW({ sex, age, heightCm, weightKg }): number`.
- Export strategy: assign the frozen API to `globalThis.ClinicalSodiumModel` in browsers and `module.exports` in Node.

- [ ] **Step 1: Write failing conversion and Watson tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../clinical-model.js');
const round = (value, digits) => Number(value.toFixed(digits));

test('1 g NaCl contributes 393.4 mg sodium and about 17.11 mEq', () => {
  assert.equal(round(model.saltGramsToSodiumMg(1), 1), 393.4);
  assert.equal(round(model.saltGramsToSodiumMeq(1), 2), 17.11);
});

test('Watson male and female equations return hand-calculated TBW', () => {
  assert.equal(round(model.watsonTBW({ sex: 'male', age: 60, heightCm: 170, weightKg: 70 }), 2), 38.53);
  assert.equal(round(model.watsonTBW({ sex: 'female', age: 60, heightCm: 160, weightKg: 60 }), 2), 29.8);
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `/Users/YHTseng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/clinical-model.test.js`

Expected: FAIL because `../clinical-model.js` does not exist.

- [ ] **Step 3: Implement the conversion and Watson API**

```js
const SODIUM_ATOMIC_WEIGHT = 22.98976928;
const POTASSIUM_ATOMIC_WEIGHT = 39.0983;
const SODIUM_FRACTION_IN_NACL = SODIUM_ATOMIC_WEIGHT / 58.44277;

function finiteNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('輸入值必須是有限數字');
  return number;
}

function saltGramsToSodiumMg(grams) {
  return finiteNumber(grams) * 1000 * SODIUM_FRACTION_IN_NACL;
}

function watsonTBW({ sex, age, heightCm, weightKg }) {
  if (sex === 'male') return 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg;
  if (sex === 'female') return -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
  throw new RangeError('計算用生理性別必須為 male 或 female');
}
```

- [ ] **Step 4: Run the focused tests and confirm GREEN**

Run the same `node --test` command. Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Commit the independently working conversion layer**

```bash
git add clinical-model.js tests/clinical-model.test.js
git commit -m "Add sodium conversions and Watson TBW"
```

---

### Task 2: Validation, 24-hour balance, scenario range, and safety gates

**Files:**
- Modify: `clinical-model.js`
- Modify: `tests/clinical-model.test.js`

**Interfaces:**
- Produces: `validatePredictionInput(input): { blockers: string[], warnings: string[] }`.
- Produces: `calculateIntake(input): { formulaSodiumMg, saltSodiumMg, saltSodiumMeq, totalSodiumMg, totalSodiumMeq, sodiumInMeq, potassiumInMeq, waterInMl }`.
- Produces: `predictPlasmaSodium(input): PredictionResult` where the result includes `predictedNa`, `deltaNa`, `rangeLow`, `rangeHigh`, `tbw0`, `tbw24`, `netCationMeq`, `netWaterL`, `completeness`, `warnings`, `blockers`, `assumptions`, and `safetyFlags`.
- Produces: `correctedSodiumRange(measuredNa, glucoseMgDl): { low, high } | null`.
- Produces: `correctionSafetyLevel(deltaNa): 'normal' | 'caution' | 'danger'`.
- Input water fields are normalized to mL/day: `formulaFreeWaterMl`, `flushWaterMl`, `enteralWaterMl`, `ivWaterMl`. `calculateIntake` converts raw formula mg/1000 kcal, salt grams, and IV/other mEq fields into the aggregate sodium and potassium inputs used by the balance model.

- [ ] **Step 1: Write failing tests for the physiologic invariants**

```js
const completeInput = (patch = {}) => ({
  age: 60,
  sex: 'male',
  heightCm: 170,
  weightKg: 70,
  baselineNa: 130,
  baselineSampleLocal: '2026-08-19T08:00',
  nowLocal: '2026-08-19T10:00',
  dialysis: false,
  peritonealDialysis: false,
  crrt: false,
  anuria: false,
  formulaFreeWaterMl: 600,
  flushWaterMl: 400,
  enteralWaterMl: 0,
  ivWaterMl: 0,
  insensibleLossMl: 0,
  insensibleLossLowMl: 0,
  insensibleLossHighMl: 0,
  urineVolumeMl: 1000,
  urineSodium: 50,
  urinePotassium: 30,
  calories: 0,
  formulaSodiumMgPer1000Kcal: 0,
  formulaPotassiumMgPer1000Kcal: 0,
  extraSaltGrams: 0,
  ivSodiumMeq: 0,
  ivPotassiumMeq: 0,
  otherSodiumMeq: 50,
  otherPotassiumMeq: 30,
  otherOutputMl: 0,
  otherNaLossMeq: 0,
  otherKLossMeq: 0,
  unstableOutput: false,
  ...patch
});

test('zero net cation and water balance preserves baseline sodium', () => {
  const result = model.predictPlasmaSodium(completeInput({
    otherSodiumMeq: 80,
    otherPotassiumMeq: 40,
    urineVolumeMl: 1000,
    urineSodium: 50,
    urinePotassium: 70,
    formulaFreeWaterMl: 600,
    flushWaterMl: 400,
    insensibleLossMl: 0
  }));
  assert.equal(round(result.predictedNa, 6), 130);
});

test('additional electrolyte-free water lowers predicted sodium', () => {
  const baseline = model.predictPlasmaSodium(completeInput());
  const wetter = model.predictPlasmaSodium(completeInput({ flushWaterMl: 1500 }));
  assert.ok(wetter.predictedNa < baseline.predictedNa);
});

test('additional sodium raises predicted sodium', () => {
  const baseline = model.predictPlasmaSodium(completeInput());
  const salted = model.predictPlasmaSodium(completeInput({ extraSaltGrams: 2 }));
  assert.ok(salted.predictedNa > baseline.predictedNa);
});
```

- [ ] **Step 2: Run and confirm RED because `predictPlasmaSodium` is missing**

- [ ] **Step 3: Implement the central Edelman balance**

```js
const cationPool0 = tbw0 * (baselineNa + 25.6) / 1.11;
const urineNaLoss = urineVolumeL * input.urineSodium;
const urineKLoss = urineVolumeL * input.urinePotassium;
const netCationMeq = sodiumInMeq + potassiumInMeq - urineNaLoss - urineKLoss - otherNaLossMeq - otherKLossMeq;
const netWaterL = (waterInMl - waterOutMl) / 1000;
const tbw24 = tbw0 + netWaterL;
const predictedNa = 1.11 * ((cationPool0 + netCationMeq) / tbw24) - 25.6;
```

- [ ] **Step 4: Run and confirm GREEN for the physiologic invariants**

- [ ] **Step 5: Write failing blocker and warning tests**

```js
for (const patch of [
  { age: 17 }, { dialysis: true }, { crrt: true }, { anuria: true },
  { urineVolumeMl: null }, { urineSodium: null }, { urinePotassium: null },
  { formulaFreeWaterMl: null }
]) {
  test(`blocks point prediction for ${JSON.stringify(patch)}`, () => {
    assert.ok(model.predictPlasmaSodium(completeInput(patch)).blockers.length > 0);
  });
}

test('flags projected rises above 6 and 8 mmol/L at distinct levels', () => {
  assert.equal(model.correctionSafetyLevel(6.1), 'caution');
  assert.equal(model.correctionSafetyLevel(8.1), 'danger');
});
```

- [ ] **Step 6: Implement blockers, ODS flags, stale local sampling time, and warning thresholds**

Use literal field-specific messages, return no point estimate when blockers exist, and keep eGFR outside the excretion calculation.

- [ ] **Step 7: Write failing scenario-range and corrected-sodium tests**

```js
test('unstable output creates a wider scenario range than stable output', () => {
  const stable = model.predictPlasmaSodium(completeInput({ unstableOutput: false }));
  const unstable = model.predictPlasmaSodium(completeInput({ unstableOutput: true }));
  assert.ok(unstable.rangeHigh - unstable.rangeLow > stable.rangeHigh - stable.rangeLow);
});

test('glucose 300 displays Katz and Hillier corrected-sodium references', () => {
  assert.deepEqual(model.correctedSodiumRange(130, 300), { low: 133.2, high: 134.8 });
});
```

- [ ] **Step 8: Implement ±15%/±30% sensitivity scenarios and glucose reference range**

Calculate each extreme by calling the same central balance helper with changed urine volume, urine sodium, urine potassium, and insensible-loss bounds. Label the output `情境範圍`, never `CI`.

- [ ] **Step 9: Run the full model test suite and confirm GREEN**

Expected: all conversion, TBW, invariant, blocker, range, glucose, completeness, and safety tests pass.

- [ ] **Step 10: Commit the tested clinical model**

```bash
git add clinical-model.js tests/clinical-model.test.js
git commit -m "Add 24-hour sodium balance model"
```

---

### Task 3: Semantic clinical workflow and responsive visual system

**Files:**
- Modify: `index.html`
- Create: `styles.css`

**Interfaces:**
- `index.html` exposes form id `sodium-form`, salt control `extra-salt`, summary ids `salt-sodium-mg`, `salt-sodium-meq`, `total-sodium-mg`, and prediction ids `predicted-na`, `predicted-range`, `delta-na`, `data-completeness`, `prediction-messages`.
- Every clinical input uses its agreed name as its id so `app.js` can read it without duplicated selectors.
- Loads `clinical-model.js` before `app.js` with `defer`.

- [ ] **Step 1: Write a failing static contract test in `tests/static-contract.test.js`**

```js
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

test('page exposes the required workflow and external scripts', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  for (const marker of ['id="sodium-form"', 'id="baseline-na"', 'id="formula-free-water"', 'id="urine-sodium"', 'id="urine-potassium"', 'id="predicted-na"']) {
    assert.ok(html.includes(marker), `missing ${marker}`);
  }
  assert.match(html, /<script src="clinical-model\.js" defer><\/script>/);
  assert.match(html, /<script src="app\.js" defer><\/script>/);
});
```

- [ ] **Step 2: Run the static test and confirm RED on the first missing marker**

- [ ] **Step 3: Build the four-section semantic form and result area**

Use `<fieldset>`/`<legend>`, explicit `<label for>`, `inputmode="decimal"`, unit suffixes, an `aria-live="polite"` result region, and `<details>` for assumptions. All clinical fields are empty; only non-clinical calculation defaults such as slider min/max may be preset.

- [ ] **Step 4: Add the approved restrained design tokens and responsive layout**

```css
:root {
  --bg: #f4f7f6;
  --surface: #ffffff;
  --ink: #1f2933;
  --muted: #607080;
  --line: #d7e0e4;
  --accent: #0f6b78;
  --caution: #9a6700;
  --danger: #b42318;
  --radius: 12px;
}
```

Keep a white surface on the existing cool gray background, one primary result panel, open field groups rather than nested card grids, deliberate control typography, visible keyboard focus, desktop two-column flow, single-column mobile flow, and print styles that hide controls while retaining inputs, results, warnings, assumptions, and timestamp.

- [ ] **Step 5: Run static tests and `git diff --check`; confirm GREEN**

- [ ] **Step 6: Commit the semantic and visual shell**

```bash
git add index.html styles.css tests/static-contract.test.js
git commit -m "Build sodium prediction clinical workflow"
```

---

### Task 4: Browser controller and live scenario comparison

**Files:**
- Create: `app.js`
- Modify: `tests/static-contract.test.js`

**Interfaces:**
- Consumes `globalThis.ClinicalSodiumModel`.
- `readForm()` returns the normalized input accepted by `predictPlasmaSodium`.
- `renderIntakeSummary(input)` always works when the prediction is blocked.
- `renderPrediction(result)` clears stale values before showing blockers, then renders point/range/delta only when available.
- All `input` and `change` events trigger one `update()` path.

- [ ] **Step 1: Extend the static contract test to fail until `app.js` exists and all referenced ids exist**

Parse literal calls to `byId('...')` from `app.js` and assert every id exists in `index.html`; this catches selector drift without duplicating a hand-maintained id list.

- [ ] **Step 2: Run and confirm RED because `app.js` is missing**

- [ ] **Step 3: Implement minimal form normalization and intake summary**

```js
const numberOrNull = (id) => {
  const value = byId(id).value.trim();
  return value === '' ? null : Number(value);
};

function update() {
  const input = readForm();
  renderIntakeSummary(model.calculateIntake(input));
  renderPrediction(model.predictPlasmaSodium(input));
}
```

- [ ] **Step 4: Implement blocker, warning, point, range, delta, completeness, assumptions, and salt-slider rendering**

Use `textContent` rather than HTML injection. Ensure changing salt immediately updates sodium mg/mEq, total intake, predicted sodium, range, delta, and correction warnings.

- [ ] **Step 5: Run all Node tests and syntax checks; confirm GREEN**

Run:

```bash
/Users/YHTseng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.js
/Users/YHTseng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check clinical-model.js
/Users/YHTseng/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check app.js
git diff --check
```

- [ ] **Step 6: Commit the interactive application**

```bash
git add app.js tests/static-contract.test.js
git commit -m "Connect live sodium prediction interface"
```

---

### Task 5: Documentation and browser QA

**Files:**
- Modify: `README.md`
- Modify as defects require: `index.html`, `styles.css`, `app.js`, `clinical-model.js`, and tests
- Temporary only, outside repository: screenshots and browser QA scripts

**Interfaces:**
- README documents only behavior verified in source and tests.
- Target flow: local site loads → enter a complete adult non-dialysis case → adjust extra salt → intake and 24-hour point/range/delta update → set dialysis/anuria → point estimate is removed and blocker appears.

- [ ] **Step 1: Rewrite README from actual implemented evidence**

Include purpose, live URL, inputs, exact formulas, sodium conversion, scenario-range meaning, blockers, ODS warnings, privacy, test command, sources, and limitations. Remove the placeholder live-demo text and the unsupported low-intake-equals-hyponatremia claim.

- [ ] **Step 2: Read and invoke the Browser skill, start a local static server, and capture the existing/accepted and implemented screenshots**

Use Browser/IAB first. Check page identity, nonblank DOM, no framework overlay, console health, desktop screenshot, mobile screenshot, and the complete target flow. Use `view_image` on the accepted baseline and latest implementation screenshot in the same QA pass.

- [ ] **Step 3: Keep a fidelity and defect ledger and fix every material issue via RED/GREEN**

Inspect at least: approved copy/section order, first-viewport hierarchy, existing cool-gray/white/blue-green palette, label/control typography, open section/container model, warning colors, result legibility, responsive collapse, focus states, and print output. Any functional defect receives a failing regression test before the fix.

- [ ] **Step 4: Run full fresh verification**

Run all Node tests, both syntax checks, DOM-reference check, `git diff --check`, and browser desktop/mobile workflows with zero relevant console errors.

- [ ] **Step 5: Commit verified documentation and QA fixes**

```bash
git add README.md index.html styles.css app.js clinical-model.js tests
git commit -m "Document and verify sodium prediction tool"
```

---

### Task 6: Publish and verify GitHub Pages

**Files:**
- No new production files expected.

**Interfaces:**
- Repository: `yht5582-source/ng-feeding-salt`.
- Pages source: `main` branch, `/` path.
- Public URL: `https://yht5582-source.github.io/ng-feeding-salt/`.

- [ ] **Step 1: Run completion verification before publishing**

Confirm the branch contains only intended files, all tests and syntax checks pass, browser QA passes, and `git diff --check` is clean.

- [ ] **Step 2: Push the feature branch and integrate the verified commit into `main`**

Push `agent/add-24h-sodium-prediction`, fast-forward or merge it into `main` without rewriting unrelated history, then push `main`.

- [ ] **Step 3: Enable Pages from the main-branch root**

```bash
gh api repos/yht5582-source/ng-feeding-salt/pages --method POST -F 'source[branch]=main' -F 'source[path]=/'
```

If Pages already exists, inspect its source and update only when it differs.

- [ ] **Step 4: Poll deployment to terminal success**

Require the Pages deployment workflow conclusion `success` and Pages API status `built`; `queued`, `building`, a successful push, or HTTP 200 alone is insufficient.

- [ ] **Step 5: Verify the public build and live interaction**

Check HTTP success, fresh expected markers (`24 小時血漿鈉情境預估`, `配方自由水`, and `情境範圍`), asset responses, deployed commit consistency, no relevant console errors, and the same salt-adjustment plus dialysis/anuria blocker workflow on the public URL.

- [ ] **Step 6: Report the exact public URL, commit, test totals, browser evidence, and remaining clinical limitations**

Do not claim deployment complete until every preceding gate is satisfied.
