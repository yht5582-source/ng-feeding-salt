const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../clinical-model.js');

const round = (value, digits) => Number(value.toFixed(digits));

const completeInput = (patch = {}) => ({
    age: 60,
    sex: 'male',
    heightCm: 170,
    weightKg: 70,
    baselineNa: 130,
    baselineSampleLocal: '2026-08-19T08:00',
    urineSampleLocal: '2026-08-19T08:30',
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

test('1 g NaCl contributes 393.4 mg sodium and about 17.11 mEq', () => {
    assert.equal(round(model.saltGramsToSodiumMg(1), 1), 393.4);
    assert.equal(round(model.saltGramsToSodiumMeq(1), 2), 17.11);
});

test('sodium and potassium milligrams convert to mEq by atomic weight', () => {
    assert.equal(round(model.sodiumMgToMeq(229.8976928), 4), 10);
    assert.equal(round(model.potassiumMgToMeq(390.983), 4), 10);
});

test('Watson male and female equations return hand-calculated TBW', () => {
    assert.equal(round(model.watsonTBW({ sex: 'male', age: 60, heightCm: 170, weightKg: 70 }), 2), 38.53);
    assert.equal(round(model.watsonTBW({ sex: 'female', age: 60, heightCm: 160, weightKg: 60 }), 2), 29.8);
});

test('intake combines formula sodium and precise NaCl sodium', () => {
    const intake = model.calculateIntake(completeInput({
        calories: 1500,
        formulaSodiumMgPer1000Kcal: 800,
        extraSaltGrams: 2,
        otherSodiumMeq: 0,
        otherPotassiumMeq: 0
    }));

    assert.equal(round(intake.formulaSodiumMg, 1), 1200);
    assert.equal(round(intake.saltSodiumMg, 1), 786.7);
    assert.equal(round(intake.totalSodiumMg, 1), 1986.7);
});

test('zero net cation and water balance preserves baseline sodium', () => {
    const result = model.predictPlasmaSodium(completeInput({
        otherSodiumMeq: 80,
        otherPotassiumMeq: 40,
        urineVolumeMl: 1000,
        urineSodium: 50,
        urinePotassium: 70
    }));

    assert.equal(round(result.predictedNa, 6), 130);
});

test('additional electrolyte-free water lowers predicted sodium', () => {
    const baseline = model.predictPlasmaSodium(completeInput());
    const wetter = model.predictPlasmaSodium(completeInput({ flushWaterMl: 1400 }));

    assert.ok(wetter.predictedNa < baseline.predictedNa);
});

test('additional sodium raises predicted sodium', () => {
    const baseline = model.predictPlasmaSodium(completeInput());
    const salted = model.predictPlasmaSodium(completeInput({ extraSaltGrams: 2 }));

    assert.ok(salted.predictedNa > baseline.predictedNa);
});

test('additional potassium raises predicted sodium through the shared cation pool', () => {
    const baseline = model.predictPlasmaSodium(completeInput());
    const supplemented = model.predictPlasmaSodium(completeInput({ otherPotassiumMeq: 50 }));

    assert.ok(supplemented.predictedNa > baseline.predictedNa);
});

const blockedCases = [
    ['未成年', { age: 17 }],
    ['血液透析', { dialysis: true }],
    ['腹膜透析', { peritonealDialysis: true }],
    ['CRRT', { crrt: true }],
    ['無尿', { anuria: true, urineVolumeMl: 0 }],
    ['基準血鈉', { baselineNa: null }],
    ['基準採血時間', { baselineSampleLocal: '' }],
    ['配方自由水', { formulaFreeWaterMl: null }],
    ['預估尿量', { urineVolumeMl: null }],
    ['尿鈉', { urineSodium: null }],
    ['尿鉀', { urinePotassium: null }],
    ['尿液採樣時間', { urineSampleLocal: null }]
];

for (const [label, patch] of blockedCases) {
    test(`${label}不適用或缺漏時阻擋血鈉中心值`, () => {
        const result = model.predictPlasmaSodium(completeInput(patch));

        assert.equal(result.predictedNa, null);
        assert.ok(result.blockers.length > 0);
    });
}

test('correction thresholds distinguish caution and danger', () => {
    assert.equal(model.correctionSafetyLevel(6), 'normal');
    assert.equal(model.correctionSafetyLevel(6.1), 'caution');
    assert.equal(model.correctionSafetyLevel(8), 'caution');
    assert.equal(model.correctionSafetyLevel(8.1), 'danger');
});

test('unstable output produces a wider sensitivity scenario range', () => {
    const stable = model.predictPlasmaSodium(completeInput());
    const unstable = model.predictPlasmaSodium(completeInput({ unstableOutput: true }));

    assert.ok(stable.rangeLow <= stable.predictedNa);
    assert.ok(stable.rangeHigh >= stable.predictedNa);
    assert.ok(unstable.rangeHigh - unstable.rangeLow > stable.rangeHigh - stable.rangeLow);
});

test('insensible loss bounds contribute to the scenario range', () => {
    const narrow = model.predictPlasmaSodium(completeInput({
        insensibleLossMl: 800,
        insensibleLossLowMl: 800,
        insensibleLossHighMl: 800
    }));
    const broad = model.predictPlasmaSodium(completeInput({
        insensibleLossMl: 800,
        insensibleLossLowMl: 400,
        insensibleLossHighMl: 1400
    }));

    assert.ok(broad.rangeHigh - broad.rangeLow > narrow.rangeHigh - narrow.rangeLow);
});

test('glucose 300 displays Katz and Hillier corrected-sodium references', () => {
    assert.deepEqual(model.correctedSodiumRange(130, 300), { low: 133.2, high: 134.8 });
    assert.equal(model.correctedSodiumRange(130, 100), null);
});

test('eGFR changes warnings but never directly changes sodium excretion', () => {
    const preserved = model.predictPlasmaSodium(completeInput({ egfr: 80 }));
    const reduced = model.predictPlasmaSodium(completeInput({ egfr: 10 }));

    assert.equal(round(preserved.predictedNa, 8), round(reduced.predictedNa, 8));
});

test('stale local sampling time lowers completeness and adds a warning', () => {
    const result = model.predictPlasmaSodium(completeInput({
        baselineSampleLocal: '2026-08-18T08:00',
        nowLocal: '2026-08-19T10:01'
    }));

    assert.equal(result.completeness, 'medium');
    assert.ok(result.warnings.some((message) => message.includes('超過 24 小時')));
});

test('recent urine sodium and potassium require a valid sampling time', () => {
    const missing = model.predictPlasmaSodium(completeInput({ urineSampleLocal: null }));
    const malformed = model.predictPlasmaSodium(completeInput({ urineSampleLocal: '2026-02-30T10:00' }));

    assert.equal(missing.predictedNa, null);
    assert.ok(missing.blockers.some((message) => message.includes('尿液採樣時間')));
    assert.equal(malformed.predictedNa, null);
    assert.ok(malformed.blockers.some((message) => message.includes('格式不正確')));
});

test('stale or future urine sampling time lowers confidence explicitly', () => {
    const stale = model.predictPlasmaSodium(completeInput({
        urineSampleLocal: '2026-08-18T08:00',
        nowLocal: '2026-08-19T10:01'
    }));
    const future = model.predictPlasmaSodium(completeInput({
        urineSampleLocal: '2026-08-19T10:01',
        nowLocal: '2026-08-19T10:00'
    }));

    assert.equal(stale.completeness, 'medium');
    assert.ok(stale.warnings.some((message) => message.includes('尿液檢體') && message.includes('超過 24 小時')));
    assert.ok(future.warnings.some((message) => message.includes('尿液採樣時間') && message.includes('晚於目前時間')));
});

test('desmopressin change widens urine sensitivity scenarios', () => {
    const stable = model.predictPlasmaSodium(completeInput());
    const changed = model.predictPlasmaSodium(completeInput({ recentDesmopressinChange: true }));

    assert.ok(changed.rangeHigh - changed.rangeLow > stable.rangeHigh - stable.rangeLow);
    assert.ok(changed.assumptions.some((message) => message.includes('最近尿鈉與尿鉀') && message.includes('代理')));
});

test('ODS risk factors are reported as a persistent safety flag', () => {
    const result = model.predictPlasmaSodium(completeInput({
        baselineNa: 104,
        hypokalemia: true,
        malnutrition: true
    }));

    assert.ok(result.safetyFlags.some((flag) => flag.code === 'ods-risk'));
});

test('unmeasured gastrointestinal electrolyte loss prevents high completeness', () => {
    const result = model.predictPlasmaSodium(completeInput({
        otherOutputMl: 800,
        otherLossElectrolytesKnown: false
    }));

    assert.notEqual(result.completeness, 'high');
    assert.ok(result.warnings.some((message) => message.includes('未計入未知')));
});

test('malformed or negative core inputs return blockers instead of throwing', () => {
    for (const patch of [{ baselineNa: 'abc' }, { urineSodium: -1 }, { weightKg: 0 }]) {
        assert.doesNotThrow(() => model.predictPlasmaSodium(completeInput(patch)));
        const result = model.predictPlasmaSodium(completeInput(patch));
        assert.equal(result.predictedNa, null);
        assert.ok(result.blockers.length > 0);
    }
});

test('nonphysiologic Watson or 24-hour water volume blocks prediction', () => {
    const invalidWatson = model.predictPlasmaSodium(completeInput({
        age: 200,
        heightCm: 50,
        weightKg: 1
    }));
    const negativeWater = model.predictPlasmaSodium(completeInput({ otherOutputMl: 50000 }));

    assert.equal(invalidWatson.predictedNa, null);
    assert.equal(negativeWater.predictedNa, null);
});

test('future sampling time and extreme hyperglycemia add explicit warnings', () => {
    const result = model.predictPlasmaSodium(completeInput({
        baselineSampleLocal: '2026-08-19T11:00',
        nowLocal: '2026-08-19T10:00',
        glucoseMgDl: 500
    }));

    assert.ok(result.warnings.some((message) => message.includes('晚於目前時間')));
    assert.ok(result.warnings.some((message) => message.includes('>400')));
});

test('malformed optional clinical values are blocked rather than treated as zero', () => {
    for (const patch of [{ glucoseMgDl: 'abc' }, { egfr: -1 }, { dryWeightKg: 0 }]) {
        assert.doesNotThrow(() => model.predictPlasmaSodium(completeInput(patch)));
        assert.equal(model.predictPlasmaSodium(completeInput(patch)).predictedNa, null);
    }
});

test('unusual values require an explicit confirmation before prediction', () => {
    const unconfirmed = model.predictPlasmaSodium(completeInput({ baselineNa: 195 }));
    const confirmed = model.predictPlasmaSodium(completeInput({ baselineNa: 195, confirmUnusualValues: true }));

    assert.equal(unconfirmed.predictedNa, null);
    assert.ok(unconfirmed.blockers.some((message) => message.includes('超出常見範圍')));
    assert.notEqual(confirmed.predictedNa, null);
    assert.ok(confirmed.warnings.some((message) => message.includes('已人工確認')));
});

test('inconsistent water assumptions are blocked or warned explicitly', () => {
    const reversedBounds = model.predictPlasmaSodium(completeInput({
        insensibleLossLowMl: 1200,
        insensibleLossMl: 800,
        insensibleLossHighMl: 500
    }));
    const excessFormulaWater = model.predictPlasmaSodium(completeInput({
        formulaVolumeMl: 800,
        formulaFreeWaterMl: 1000
    }));

    assert.equal(reversedBounds.predictedNa, null);
    assert.ok(excessFormulaWater.warnings.some((message) => message.includes('大於配方總體積')));
});
