(function () {
    'use strict';

    const model = globalThis.ClinicalSodiumModel;
    const byId = (id) => document.getElementById(id);
    const form = byId('sodium-form');
    const elements = {
        age: byId('age'), sex: byId('sex'), heightCm: byId('height-cm'), weightKg: byId('weight-kg'),
        dryWeightKg: byId('dry-weight-kg'), volumeStatus: byId('volume-status'), baselineNa: byId('baseline-na'),
        baselineSampleLocal: byId('baseline-sample-local'), glucoseMgDl: byId('glucose-mg-dl'),
        serumPotassium: byId('serum-potassium'), creatinine: byId('creatinine'), egfr: byId('egfr'),
        aki: byId('aki'), oliguria: byId('oliguria'), anuria: byId('anuria'), unstableOutput: byId('unstable-output'),
        recentDiureticChange: byId('recent-diuretic-change'), recentDesmopressinChange: byId('recent-desmopressin-change'),
        dialysis: byId('dialysis'), peritonealDialysis: byId('peritoneal-dialysis'), crrt: byId('crrt'),
        hypokalemia: byId('hypokalemia'), malnutrition: byId('malnutrition'), alcoholUse: byId('alcohol-use'),
        advancedLiverDisease: byId('advanced-liver-disease'), neurologicSymptoms: byId('neurologic-symptoms'),
        glucoseExpectedToChange: byId('glucose-expected-to-change'), confirmUnusualValues: byId('confirm-unusual-values'),
        calories: byId('calories'),
        formulaVolumeMl: byId('formula-volume-ml'), formulaFreeWaterMl: byId('formula-free-water'),
        formulaSodium: byId('formula-sodium'), formulaPotassium: byId('formula-potassium'), extraSalt: byId('extra-salt'),
        flushWater: byId('flush-water'), enteralWater: byId('enteral-water'), ivWater: byId('iv-water'),
        ivSodium: byId('iv-sodium'), ivPotassium: byId('iv-potassium'), otherSodium: byId('other-sodium'),
        otherPotassium: byId('other-potassium'), urineVolume: byId('urine-volume'), urineSodium: byId('urine-sodium'),
        urinePotassium: byId('urine-potassium'), otherOutput: byId('other-output'), otherNaLoss: byId('other-na-loss'),
        otherKLoss: byId('other-k-loss'), otherLossKnown: byId('other-loss-electrolytes-known'),
        insensibleLow: byId('insensible-loss-low'), insensible: byId('insensible-loss'),
        insensibleHigh: byId('insensible-loss-high'), saltValue: byId('salt-value'),
        formulaSodiumMg: byId('formula-sodium-mg'), saltSodiumMg: byId('salt-sodium-mg'),
        saltSodiumMeq: byId('salt-sodium-meq'), totalSodiumMg: byId('total-sodium-mg'),
        totalSodiumMeq: byId('total-sodium-meq'), predictedNa: byId('predicted-na'),
        predictedRange: byId('predicted-range'), deltaNa: byId('delta-na'), completeness: byId('data-completeness'),
        messages: byId('prediction-messages'), correctedNa: byId('corrected-na-reference'), tbw: byId('tbw-result'),
        netCation: byId('net-cation-result'), netWater: byId('net-water-result'), assumptions: byId('assumption-list'),
        calculationTime: byId('calculation-time'), printButton: byId('print-button')
    };

    function numberOrNull(element) {
        const value = element.value.trim();
        return value === '' ? null : Number(value);
    }

    function localDateTimeString(date = new Date()) {
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function readForm() {
        return {
            age: numberOrNull(elements.age), sex: elements.sex.value, heightCm: numberOrNull(elements.heightCm),
            weightKg: numberOrNull(elements.weightKg), dryWeightKg: numberOrNull(elements.dryWeightKg),
            volumeStatus: elements.volumeStatus.value, baselineNa: numberOrNull(elements.baselineNa),
            baselineSampleLocal: elements.baselineSampleLocal.value, nowLocal: localDateTimeString(),
            glucoseMgDl: numberOrNull(elements.glucoseMgDl), serumPotassium: numberOrNull(elements.serumPotassium),
            creatinine: numberOrNull(elements.creatinine), egfr: numberOrNull(elements.egfr), aki: elements.aki.checked,
            oliguria: elements.oliguria.checked, anuria: elements.anuria.checked, unstableOutput: elements.unstableOutput.checked,
            recentDiureticChange: elements.recentDiureticChange.checked,
            recentDesmopressinChange: elements.recentDesmopressinChange.checked, dialysis: elements.dialysis.checked,
            peritonealDialysis: elements.peritonealDialysis.checked, crrt: elements.crrt.checked,
            hypokalemia: elements.hypokalemia.checked, malnutrition: elements.malnutrition.checked,
            alcoholUse: elements.alcoholUse.checked, advancedLiverDisease: elements.advancedLiverDisease.checked,
            neurologicSymptoms: elements.neurologicSymptoms.checked,
            glucoseExpectedToChange: elements.glucoseExpectedToChange.checked, calories: numberOrNull(elements.calories),
            confirmUnusualValues: elements.confirmUnusualValues.checked,
            formulaVolumeMl: numberOrNull(elements.formulaVolumeMl), formulaFreeWaterMl: numberOrNull(elements.formulaFreeWaterMl),
            formulaSodiumMgPer1000Kcal: numberOrNull(elements.formulaSodium),
            formulaPotassiumMgPer1000Kcal: numberOrNull(elements.formulaPotassium),
            extraSaltGrams: numberOrNull(elements.extraSalt), flushWaterMl: numberOrNull(elements.flushWater),
            enteralWaterMl: numberOrNull(elements.enteralWater), ivWaterMl: numberOrNull(elements.ivWater),
            ivSodiumMeq: numberOrNull(elements.ivSodium), ivPotassiumMeq: numberOrNull(elements.ivPotassium),
            otherSodiumMeq: numberOrNull(elements.otherSodium), otherPotassiumMeq: numberOrNull(elements.otherPotassium),
            urineVolumeMl: numberOrNull(elements.urineVolume), urineSodium: numberOrNull(elements.urineSodium),
            urinePotassium: numberOrNull(elements.urinePotassium), otherOutputMl: numberOrNull(elements.otherOutput),
            otherNaLossMeq: numberOrNull(elements.otherNaLoss), otherKLossMeq: numberOrNull(elements.otherKLoss),
            otherLossElectrolytesKnown: elements.otherLossKnown.checked,
            insensibleLossLowMl: numberOrNull(elements.insensibleLow), insensibleLossMl: numberOrNull(elements.insensible),
            insensibleLossHighMl: numberOrNull(elements.insensibleHigh)
        };
    }

    const format = (value, digits = 1) => Number(value).toLocaleString('zh-TW', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });

    function renderIntake(result, saltGrams) {
        elements.saltValue.textContent = `${format(saltGrams || 0, 1)} g/day`;
        elements.formulaSodiumMg.textContent = `${format(result.formulaSodiumMg, 0)} mg`;
        elements.saltSodiumMg.textContent = `${format(result.saltSodiumMg, 0)} mg`;
        elements.saltSodiumMeq.textContent = `${format(result.saltSodiumMeq, 1)} mEq`;
        elements.totalSodiumMg.textContent = `${format(result.totalSodiumMg, 0)} mg`;
        elements.totalSodiumMeq.textContent = `${format(result.totalSodiumMeq, 1)} mEq`;
    }

    function addMessage(text, type) {
        const message = document.createElement('p');
        message.className = `message ${type}`;
        message.textContent = text;
        elements.messages.append(message);
    }

    function renderMessages(result) {
        elements.messages.replaceChildren();
        result.blockers.forEach((message) => addMessage(message, 'blocker'));
        result.safetyFlags.forEach((flag) => addMessage(flag.message, flag.level));
        result.warnings.forEach((message) => addMessage(message, 'caution'));
        if (result.blockers.length === 0 && result.safetyFlags.length === 0 && result.warnings.length === 0) {
            addMessage('必要資料已完成；仍需以實際血鈉追蹤驗證。', 'info');
        }
    }

    function renderPrediction(result) {
        elements.completeness.className = `completeness ${result.completeness}`;
        const completenessText = { high: '高', medium: '中', low: '低' }[result.completeness];
        elements.completeness.textContent = `資料完整度：${completenessText}`;
        renderMessages(result);

        if (result.predictedNa === null) {
            elements.predictedNa.textContent = '—';
            elements.predictedRange.textContent = '—';
            elements.deltaNa.textContent = '—';
            elements.tbw.textContent = '—';
            elements.netCation.textContent = '—';
            elements.netWater.textContent = '—';
        } else {
            elements.predictedNa.textContent = format(result.predictedNa, 1);
            elements.predictedRange.textContent = `${format(result.rangeLow, 1)}–${format(result.rangeHigh, 1)} mmol/L`;
            elements.deltaNa.textContent = `${result.deltaNa >= 0 ? '+' : ''}${format(result.deltaNa, 1)} mmol/L`;
            elements.tbw.textContent = `${format(result.tbw0, 1)} L`;
            elements.netCation.textContent = `${result.netCationMeq >= 0 ? '+' : ''}${format(result.netCationMeq, 1)} mEq`;
            elements.netWater.textContent = `${result.netWaterL >= 0 ? '+' : ''}${format(result.netWaterL, 2)} L`;
        }

        if (result.correctedNaRange) {
            elements.correctedNa.hidden = false;
            elements.correctedNa.textContent = `高血糖校正血鈉參考：${format(result.correctedNaRange.low, 1)}–${format(result.correctedNaRange.high, 1)} mmol/L（不取代模型基準）`;
        } else {
            elements.correctedNa.hidden = true;
            elements.correctedNa.textContent = '';
        }

        elements.assumptions.replaceChildren();
        const assumptions = result.assumptions.length > 0 ? result.assumptions : ['完成必要資料後顯示計算假設。'];
        assumptions.forEach((text) => {
            const item = document.createElement('li');
            item.textContent = text;
            elements.assumptions.append(item);
        });
        elements.calculationTime.textContent = `本次計算：${new Date().toLocaleString('zh-TW', { hour12: false })}`;
    }

    function update() {
        try {
            const input = readForm();
            const result = model.predictPlasmaSodium(input);
            renderIntake(result, input.extraSaltGrams);
            renderPrediction(result);
        } catch (error) {
            elements.messages.replaceChildren();
            addMessage(`無法計算：${error.message}`, 'blocker');
            elements.predictedNa.textContent = '—';
        }
    }

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    elements.printButton.addEventListener('click', () => window.print());
    update();
})();
