(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.ClinicalSodiumModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const SODIUM_ATOMIC_WEIGHT = 22.98976928;
    const POTASSIUM_ATOMIC_WEIGHT = 39.0983;
    const NACL_MOLECULAR_WEIGHT = 58.44277;
    const SODIUM_FRACTION_IN_NACL = SODIUM_ATOMIC_WEIGHT / NACL_MOLECULAR_WEIGHT;

    function finiteNumber(value, fieldName = '輸入值') {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            throw new TypeError(`${fieldName}必須是有限數字`);
        }
        return number;
    }

    function saltGramsToSodiumMg(grams) {
        return finiteNumber(grams, '食鹽量') * 1000 * SODIUM_FRACTION_IN_NACL;
    }

    function sodiumMgToMeq(mg) {
        return finiteNumber(mg, '鈉毫克數') / SODIUM_ATOMIC_WEIGHT;
    }

    function potassiumMgToMeq(mg) {
        return finiteNumber(mg, '鉀毫克數') / POTASSIUM_ATOMIC_WEIGHT;
    }

    function saltGramsToSodiumMeq(grams) {
        return sodiumMgToMeq(saltGramsToSodiumMg(grams));
    }

    function watsonTBW({ sex, age, heightCm, weightKg }) {
        const numericAge = finiteNumber(age, '年齡');
        const numericHeight = finiteNumber(heightCm, '身高');
        const numericWeight = finiteNumber(weightKg, '體重');

        if (sex === 'male') {
            return 2.447 - 0.09516 * numericAge + 0.1074 * numericHeight + 0.3362 * numericWeight;
        }
        if (sex === 'female') {
            return -2.097 + 0.1069 * numericHeight + 0.2466 * numericWeight;
        }
        throw new RangeError('計算用生理性別必須為 male 或 female');
    }

    return Object.freeze({
        saltGramsToSodiumMg,
        saltGramsToSodiumMeq,
        sodiumMgToMeq,
        potassiumMgToMeq,
        watsonTBW
    });
});
