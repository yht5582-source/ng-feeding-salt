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

    function optionalNumber(value, fallback = 0) {
        return value === null || value === undefined || value === ''
            ? fallback
            : finiteNumber(value);
    }

    function isMissing(value) {
        return value === null || value === undefined || value === '';
    }

    function parseLocalDateTime(value) {
        if (typeof value !== 'string') return null;
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!match) return null;
        const [, year, month, day, hour, minute] = match.map(Number);
        const date = new Date(year, month - 1, day, hour, minute, 0, 0);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
            || date.getHours() !== hour || date.getMinutes() !== minute) return null;
        return date;
    }

    function sampleAgeHours(sampleLocal, nowLocal) {
        const sample = parseLocalDateTime(sampleLocal);
        const now = parseLocalDateTime(nowLocal) || new Date();
        if (!sample || !Number.isFinite(now.getTime())) return null;
        return (now.getTime() - sample.getTime()) / 3600000;
    }

    function validatePredictionInput(input) {
        const blockers = [];
        const warnings = [];
        const requiredFields = [
            ['age', '請輸入年齡'],
            ['sex', '請選擇計算用生理性別'],
            ['heightCm', '請輸入身高'],
            ['weightKg', '請輸入目前體重'],
            ['baselineNa', '請輸入最近血鈉'],
            ['baselineSampleLocal', '請輸入最近血鈉採血時間'],
            ['formulaFreeWaterMl', '請輸入配方自由水量'],
            ['urineVolumeMl', '請輸入預估 24 小時尿量'],
            ['urineSodium', '請輸入尿鈉濃度'],
            ['urinePotassium', '請輸入尿鉀濃度']
        ];

        for (const [field, message] of requiredFields) {
            if (isMissing(input[field])) blockers.push(message);
        }
        const positiveFields = [
            ['age', '年齡'], ['heightCm', '身高'], ['weightKg', '目前體重'], ['baselineNa', '最近血鈉'],
            ['urineVolumeMl', '預估尿量'], ['dryWeightKg', '乾體重'], ['serumPotassium', '血鉀']
        ];
        const nonnegativeFields = [
            ['formulaFreeWaterMl', '配方自由水量'], ['urineSodium', '尿鈉'], ['urinePotassium', '尿鉀'],
            ['calories', '管灌總熱量'], ['formulaSodiumMgPer1000Kcal', '配方鈉含量'],
            ['formulaPotassiumMgPer1000Kcal', '配方鉀含量'], ['extraSaltGrams', '額外食鹽量'],
            ['flushWaterMl', '沖管水'], ['enteralWaterMl', '其他腸內水'], ['ivWaterMl', '靜脈輸入水'],
            ['ivSodiumMeq', '靜脈鈉'], ['ivPotassiumMeq', '靜脈鉀'],
            ['otherSodiumMeq', '其他鈉'], ['otherPotassiumMeq', '其他鉀'],
            ['otherOutputMl', '其他液體流失'], ['otherNaLossMeq', '其他鈉流失'],
            ['otherKLossMeq', '其他鉀流失'], ['insensibleLossMl', '不可見水分流失'],
            ['insensibleLossLowMl', '不可見水分流失下限'], ['insensibleLossHighMl', '不可見水分流失上限'],
            ['glucoseMgDl', '血糖'], ['creatinine', 'Creatinine'], ['egfr', 'eGFR'],
            ['formulaVolumeMl', '管灌配方總體積']
        ];
        for (const [field, label] of positiveFields) {
            if (!isMissing(input[field]) && (!Number.isFinite(Number(input[field])) || Number(input[field]) <= 0)) {
                blockers.push(`${label}必須是大於 0 的有限數字`);
            }
        }
        for (const [field, label] of nonnegativeFields) {
            if (!isMissing(input[field]) && (!Number.isFinite(Number(input[field])) || Number(input[field]) < 0)) {
                blockers.push(`${label}必須是大於或等於 0 的有限數字`);
            }
        }
        if (!isMissing(input.age) && Number(input.age) < 18) blockers.push('本工具僅適用於年滿 18 歲成人');
        if (input.dialysis) blockers.push('血液透析病人不適用此預測模型');
        if (input.peritonealDialysis) blockers.push('腹膜透析病人不適用此預測模型');
        if (input.crrt) blockers.push('CRRT 病人不適用此預測模型');
        if (input.anuria) blockers.push('無尿病人不適用此預測模型');
        if (!isMissing(input.urineVolumeMl) && Number(input.urineVolumeMl) <= 0) {
            blockers.push('預估尿量必須大於 0 mL/24 h');
        }
        if (!isMissing(input.sex) && !['male', 'female'].includes(input.sex)) {
            blockers.push('計算用生理性別必須為男性或女性方程');
        }
        if (!isMissing(input.baselineSampleLocal) && !parseLocalDateTime(input.baselineSampleLocal)) {
            blockers.push('最近血鈉採血時間格式不正確');
        }
        if (![input.insensibleLossLowMl, input.insensibleLossMl, input.insensibleLossHighMl].some(isMissing)) {
            const low = Number(input.insensibleLossLowMl);
            const center = Number(input.insensibleLossMl);
            const high = Number(input.insensibleLossHighMl);
            if (Number.isFinite(low) && Number.isFinite(center) && Number.isFinite(high)
                && !(low <= center && center <= high)) {
                blockers.push('不可見水分流失需符合下限 ≤ 中心值 ≤ 上限');
            }
        }

        const commonRanges = [
            ['age', '年齡', 18, 120], ['heightCm', '身高', 100, 230], ['weightKg', '目前體重', 20, 300],
            ['baselineNa', '最近血鈉', 90, 190], ['urineVolumeMl', '預估尿量', 1, 10000],
            ['urineSodium', '尿鈉', 0, 300], ['urinePotassium', '尿鉀', 0, 300]
        ];
        const unusualLabels = commonRanges
            .filter(([field, , min, max]) => !isMissing(input[field]) && Number.isFinite(Number(input[field]))
                && (Number(input[field]) < min || Number(input[field]) > max))
            .map(([, label]) => label);
        if (unusualLabels.length > 0 && !input.confirmUnusualValues) {
            blockers.push(`${unusualLabels.join('、')}超出常見範圍，請確認輸入值後勾選人工確認`);
        }
        if (unusualLabels.length > 0 && input.confirmUnusualValues) {
            warnings.push(`${unusualLabels.join('、')}超出常見範圍，已人工確認`);
        }

        if (blockers.length === 0) {
            try {
                const tbw = watsonTBW(input);
                if (!Number.isFinite(tbw) || tbw <= 0) blockers.push('Watson 總體水估算不具生理合理性');
            } catch (error) {
                blockers.push(error.message);
            }
        }

        const ageHours = sampleAgeHours(input.baselineSampleLocal, input.nowLocal);
        if (ageHours !== null && ageHours > 24) warnings.push('基準血鈉採血時間已超過 24 小時');
        if (ageHours !== null && ageHours < 0) warnings.push('基準血鈉採血時間晚於目前時間');
        if (input.aki) warnings.push('AKI 可能使未來尿量與尿電解質快速改變');
        if (input.oliguria) warnings.push('少尿會降低 24 小時預測可靠度');
        if (input.unstableOutput) warnings.push('尿量或輸出不穩定，情境範圍已放寬');
        if (input.recentDiureticChange) warnings.push('近期利尿劑調整可能改變尿量與尿電解質');
        if (input.recentDesmopressinChange) warnings.push('近期 desmopressin 調整可能快速改變自由水排出');
        if (input.volumeStatus && input.volumeStatus !== 'normal') warnings.push('體液狀態可能使 Watson TBW 估算偏離實際值');
        const glucose = Number(input.glucoseMgDl);
        if (!isMissing(input.glucoseMgDl) && Number.isFinite(glucose) && glucose > 200) warnings.push('高血糖會影響實測血鈉與 24 小時預測');
        if (!isMissing(input.glucoseMgDl) && Number.isFinite(glucose) && glucose > 400) warnings.push('血糖 >400 mg/dL 時線性校正血鈉的不確定性更高');
        if (input.glucoseExpectedToChange) warnings.push('預期血糖明顯變化，校正血鈉僅供參考');
        if (optionalNumber(input.otherOutputMl) > 0 && input.otherLossElectrolytesKnown === false) {
            warnings.push('已計入額外液體流失，但未計入未知的腸胃道／引流鈉鉀流失');
        }
        if (!isMissing(input.heightCm) && !isMissing(input.weightKg)) {
            const bmi = Number(input.weightKg) / ((Number(input.heightCm) / 100) ** 2);
            if (Number.isFinite(bmi) && (bmi < 18.5 || bmi >= 35)) warnings.push('BMI 極端可能降低 Watson TBW 估算準確度');
        }
        if (!isMissing(input.dryWeightKg) && !isMissing(input.weightKg)) {
            const difference = Math.abs(Number(input.weightKg) - Number(input.dryWeightKg));
            if (difference / Number(input.weightKg) >= 0.05) warnings.push('目前體重與乾體重差距較大，TBW 估算可能受體液偏移影響');
        }
        if (!isMissing(input.formulaVolumeMl) && !isMissing(input.formulaFreeWaterMl)
            && Number.isFinite(Number(input.formulaVolumeMl)) && Number.isFinite(Number(input.formulaFreeWaterMl))
            && Number(input.formulaVolumeMl) > 0 && Number(input.formulaFreeWaterMl) > Number(input.formulaVolumeMl)) {
            warnings.push('配方自由水量大於配方總體積，請再次核對產品標示');
        }

        return { blockers: [...new Set(blockers)], warnings };
    }

    function correctionSafetyLevel(deltaNa) {
        const delta = finiteNumber(deltaNa, '血鈉變化量');
        if (delta > 8) return 'danger';
        if (delta > 6) return 'caution';
        return 'normal';
    }

    function correctedSodiumRange(measuredNa, glucoseMgDl) {
        const sodium = finiteNumber(measuredNa, '實測血鈉');
        const glucose = finiteNumber(glucoseMgDl, '血糖');
        if (glucose <= 100) return null;
        const glucoseUnits = (glucose - 100) / 100;
        return {
            low: Number((sodium + 1.6 * glucoseUnits).toFixed(1)),
            high: Number((sodium + 2.4 * glucoseUnits).toFixed(1))
        };
    }

    function calculateIntake(input) {
        const calories = optionalNumber(input.calories);
        const formulaSodiumMg = calories / 1000 * optionalNumber(input.formulaSodiumMgPer1000Kcal);
        const formulaPotassiumMg = calories / 1000 * optionalNumber(input.formulaPotassiumMgPer1000Kcal);
        const saltSodiumMg = saltGramsToSodiumMg(optionalNumber(input.extraSaltGrams));
        const saltSodiumMeq = sodiumMgToMeq(saltSodiumMg);
        const sodiumInMeq = sodiumMgToMeq(formulaSodiumMg) + saltSodiumMeq
            + optionalNumber(input.ivSodiumMeq) + optionalNumber(input.otherSodiumMeq);
        const potassiumInMeq = potassiumMgToMeq(formulaPotassiumMg)
            + optionalNumber(input.ivPotassiumMeq) + optionalNumber(input.otherPotassiumMeq);
        const waterInMl = optionalNumber(input.formulaFreeWaterMl)
            + optionalNumber(input.flushWaterMl)
            + optionalNumber(input.enteralWaterMl)
            + optionalNumber(input.ivWaterMl);

        return {
            formulaSodiumMg,
            formulaPotassiumMg,
            saltSodiumMg,
            saltSodiumMeq,
            totalSodiumMg: sodiumInMeq * SODIUM_ATOMIC_WEIGHT,
            totalSodiumMeq: sodiumInMeq,
            totalPotassiumMeq: potassiumInMeq,
            sodiumInMeq,
            potassiumInMeq,
            waterInMl
        };
    }

    function centralBalance(input) {
        const intake = calculateIntake(input);
        const tbw0 = watsonTBW(input);
        const baselineNa = finiteNumber(input.baselineNa, '基準血鈉');
        const urineVolumeL = finiteNumber(input.urineVolumeMl, '預估尿量') / 1000;
        const urineNaLoss = urineVolumeL * finiteNumber(input.urineSodium, '尿鈉');
        const urineKLoss = urineVolumeL * finiteNumber(input.urinePotassium, '尿鉀');
        const netCationMeq = intake.sodiumInMeq + intake.potassiumInMeq
            - urineNaLoss - urineKLoss
            - optionalNumber(input.otherNaLossMeq) - optionalNumber(input.otherKLossMeq);
        const waterOutMl = finiteNumber(input.urineVolumeMl, '預估尿量')
            + optionalNumber(input.otherOutputMl) + optionalNumber(input.insensibleLossMl);
        const netWaterL = (intake.waterInMl - waterOutMl) / 1000;
        const tbw24 = tbw0 + netWaterL;
        const cationPool0 = tbw0 * (baselineNa + 25.6) / 1.11;
        const predictedNa = 1.11 * ((cationPool0 + netCationMeq) / tbw24) - 25.6;

        return {
            ...intake,
            predictedNa,
            deltaNa: predictedNa - baselineNa,
            tbw0,
            tbw24,
            netCationMeq,
            netWaterL,
            urineNaLoss,
            urineKLoss
        };
    }

    function scenarioRange(input, centralResult) {
        const uncertainty = input.unstableOutput || input.aki || input.recentDiureticChange ? 0.30 : 0.15;
        const factors = [1 - uncertainty, 1 + uncertainty];
        const centralInsensible = optionalNumber(input.insensibleLossMl);
        const insensibleValues = [
            optionalNumber(input.insensibleLossLowMl, centralInsensible),
            optionalNumber(input.insensibleLossHighMl, centralInsensible)
        ];
        const values = [centralResult.predictedNa];

        for (const urineVolumeFactor of factors) {
            for (const urineSodiumFactor of factors) {
                for (const urinePotassiumFactor of factors) {
                    for (const insensibleLossMl of insensibleValues) {
                        const scenario = centralBalance({
                            ...input,
                            urineVolumeMl: Number(input.urineVolumeMl) * urineVolumeFactor,
                            urineSodium: Number(input.urineSodium) * urineSodiumFactor,
                            urinePotassium: Number(input.urinePotassium) * urinePotassiumFactor,
                            insensibleLossMl
                        });
                        if (Number.isFinite(scenario.predictedNa) && scenario.tbw24 > 0) values.push(scenario.predictedNa);
                    }
                }
            }
        }

        return {
            low: Math.min(...values),
            high: Math.max(...values),
            uncertaintyPercent: uncertainty * 100
        };
    }

    function buildSafetyFlags(input, result) {
        const flags = [];
        const correctionLevel = correctionSafetyLevel(result.deltaNa);
        if (correctionLevel === 'caution') {
            flags.push({ code: 'correction-caution', level: 'caution', message: '預估 24 小時血鈉上升超過 6 mmol/L' });
        }
        if (correctionLevel === 'danger') {
            flags.push({ code: 'correction-danger', level: 'danger', message: '預估 24 小時血鈉上升超過 8 mmol/L，可能過度矯正' });
        }

        const odsReasons = [];
        if (Number(input.baselineNa) <= 105) odsReasons.push('起始 Na ≤105');
        if (input.hypokalemia || (!isMissing(input.serumPotassium) && Number(input.serumPotassium) < 3)) odsReasons.push('低血鉀');
        if (input.malnutrition) odsReasons.push('營養不良');
        if (input.alcoholUse) odsReasons.push('酒精使用問題');
        if (input.advancedLiverDisease) odsReasons.push('晚期肝病');
        if (odsReasons.length > 0) {
            flags.push({ code: 'ods-risk', level: 'danger', message: `高 ODS 風險：${odsReasons.join('、')}` });
        }
        if (input.neurologicSymptoms || Number(input.baselineNa) < 120 || Number(input.baselineNa) > 160) {
            flags.push({ code: 'urgent-assessment', level: 'danger', message: '嚴重或有症狀的鈉異常需立即依急症流程評估，不應依本工具自行處置' });
        }
        return flags;
    }

    function completenessFrom(validation) {
        if (validation.blockers.length > 0) return 'low';
        if (validation.warnings.length === 0) return 'high';
        return validation.warnings.length <= 2 ? 'medium' : 'low';
    }

    function predictPlasmaSodium(input) {
        const validation = validatePredictionInput(input);
        const intake = calculateIntake(input);
        if (validation.blockers.length > 0) {
            return {
                ...intake,
                predictedNa: null,
                deltaNa: null,
                rangeLow: null,
                rangeHigh: null,
                tbw0: null,
                tbw24: null,
                netCationMeq: null,
                netWaterL: null,
                urineNaLoss: null,
                urineKLoss: null,
                completeness: 'low',
                blockers: validation.blockers,
                warnings: validation.warnings,
                assumptions: [],
                safetyFlags: []
            };
        }

        const result = centralBalance(input);
        if (!Number.isFinite(result.tbw24) || result.tbw24 <= 0 || !Number.isFinite(result.predictedNa)) {
            return {
                ...result,
                predictedNa: null,
                deltaNa: null,
                rangeLow: null,
                rangeHigh: null,
                completeness: 'low',
                blockers: ['24 小時後總體水估算不具生理合理性'],
                warnings: validation.warnings,
                assumptions: [],
                safetyFlags: []
            };
        }

        const range = scenarioRange(input, result);
        const glucose = isMissing(input.glucoseMgDl) ? null : correctedSodiumRange(input.baselineNa, input.glucoseMgDl);

        return {
            ...result,
            rangeLow: range.low,
            rangeHigh: range.high,
            blockers: [],
            warnings: validation.warnings,
            assumptions: [
                `尿量、尿鈉與尿鉀以 ±${range.uncertaintyPercent}% 建立敏感度情境`,
                '情境範圍不是統計信賴區間',
                '需以實際血鈉追蹤驗證'
            ],
            safetyFlags: buildSafetyFlags(input, result),
            completeness: completenessFrom(validation),
            correctedNaRange: glucose
        };
    }

    return Object.freeze({
        saltGramsToSodiumMg,
        saltGramsToSodiumMeq,
        sodiumMgToMeq,
        potassiumMgToMeq,
        watsonTBW,
        calculateIntake,
        validatePredictionInput,
        correctionSafetyLevel,
        correctedSodiumRange,
        predictPlasmaSodium
    });
});
