const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../clinical-model.js');

const round = (value, digits) => Number(value.toFixed(digits));

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
