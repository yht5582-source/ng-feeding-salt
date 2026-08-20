# 管灌加鹽與 24 小時血漿鈉情境預估

這是一個供成人非透析住院病人使用的瀏覽器端臨床決策輔助工具。除了計算管灌配方與額外食鹽帶入的每日鈉量，也依目前血鈉、估算總體水，以及未來 24 小時鈉、鉀與水分收支，顯示血漿鈉中心值與敏感度情境範圍。

**公開網站：** https://yht5582-source.github.io/ng-feeding-salt/

## 工具能做什麼

- 依配方熱量、配方鈉／鉀與額外 NaCl 計算每日鈉、鉀攝取。
- 使用精確分子量換算：1 g NaCl 約含 393.4 mg sodium，約 17.1 mEq sodium。
- 使用 Watson 成人方程估算 total body water（TBW）。
- 將管灌配方自由水、沖管水、其他腸內水、靜脈水分、尿量、尿鈉、尿鉀、其他流失與不可見水分流失納入 24 小時平衡。
- 顯示 24 小時血鈉中心值、相對變化量及敏感度情境範圍。
- 依資料完整性顯示高／中／低分級；此分級不是模型準確度分級。
- 對透析、CRRT、無尿、未成年及必要資料缺漏停止顯示中心值。
- 標示 AKI、輸出不穩、高血糖、ODS 高風險與可能過度矯正等情境。
- 支援手機、桌面與列印摘要。

工具不會依目標血鈉反推或推薦食鹽、濃鹽水、自由水或 desmopressin 劑量。

## 必要資料

要產生 24 小時中心值，至少需要：

- 年齡、計算用生理性別、身高、目前體重。
- 最近血鈉及本地採血日期時間。
- 產品標示的每日配方自由水量；配方總體積不能直接視為自由水。
- 預估未來 24 小時尿量，以及最近一次實測尿鈉、尿鉀與尿液採樣時間。

Creatinine 與 eGFR 只用於臨床風險判讀，不會直接換算成排鈉量。

## 計算模型

### Watson TBW

- 男性：`TBW = 2.447 - 0.09516 × age + 0.1074 × height_cm + 0.3362 × weight_kg`
- 女性：`TBW = -2.097 + 0.1069 × height_cm + 0.2466 × weight_kg`

### 24 小時鈉、鉀與水分平衡

工具由目前血鈉與 TBW 回推情境用等效陽離子池：

```text
cation_pool_0 = TBW_0 × (PNa_0 + 25.6) / 1.11
```

再加入 24 小時的淨鈉、淨鉀與淨水分：

```text
urine_Na_loss = urine_volume_L × urine_Na_mmol_L
urine_K_loss = urine_volume_L × urine_K_mmol_L
net_cation = Na_in + K_in - Na_out - K_out
TBW_24 = TBW_0 + water_in - water_out
PNa_24 = 1.11 × [(cation_pool_0 + net_cation) / TBW_24] - 25.6
```

其中尿量代表接下來 24 小時的預估總尿量；尿鈉與尿鉀則是最近一次實測濃度。模型將最近實測值作為未來 24 小時平均尿液組成的代理，不是要求輸入 24 小時後的預測濃度。

這個等效陽離子池不是直接量測的 total exchangeable Na + K。

### 情境範圍

- 病況相對穩定時，尿量、尿鈉與尿鉀分別以輸入值上下 15% 重新計算。
- AKI、近期調整利尿劑或輸出不穩時，變動放寬至上下 30%。
- 不可見水分流失使用畫面中的下限與上限。
- 顯示的上下界是敏感度情境，不是 95% CI，也無法涵蓋所有生理不確定性。

### 高血糖參考

若血糖高於 100 mg/dL，工具另列 Katz 1.6 與 Hillier 2.4 mmol/L／每增加 100 mg/dL 的校正血鈉參考範圍。此範圍不會取代實測血鈉作為模型起點；血糖高於 400 mg/dL 或預期快速變化時會降低可信度。

## 安全閘門

下列情況仍可查看鈉攝取量，但不提供 24 小時血鈉中心值：

- 未滿 18 歲。
- 血液透析、腹膜透析或 CRRT。
- 無尿或預估尿量為零。
- 缺少基準血鈉、採血時間、TBW 所需資料、配方自由水、未來 24 小時尿量、最近尿鈉／尿鉀或尿液採樣時間。
- 輸入不是有限數字，或估算 TBW／24 小時後體水不具生理合理性。
- 輸入超出常見範圍但尚未人工核對確認。

預估血鈉上升超過 6 mmol/L 顯示注意警示，超過 8 mmol/L 顯示高風險警示。起始 Na ≤105 mmol/L、低血鉀、營養不良、酒精使用問題或晚期肝病會顯示 ODS 高風險旗標。嚴重或有症狀的鈉異常應依急症流程處理，不應依此工具自行處置。

## 隱私

- 不輸入姓名、病歷號或其他病人識別資料。
- 所有運算只在瀏覽器內進行。
- 沒有後端、登入、cookie、`localStorage`、分析追蹤或資料上傳。

## 本機執行

本專案是無框架、無建置步驟的靜態網站。可直接開啟 `index.html`，或在專案根目錄啟動任一靜態檔案伺服器。

## 測試

需要 Node.js 內建測試執行器：

```bash
node --test tests/*.test.js
node --check clinical-model.js
node --check app.js
```

測試涵蓋 NaCl／mg／mEq 換算、Watson TBW、鈉鉀水分平衡、生理不變量、情境範圍、缺漏／異常輸入、透析／無尿阻擋、高血糖、ODS 與過度矯正警示，以及 HTML 與控制器欄位契約。

## 醫學依據

1. Edelman IS, Leibman J, O'Meara MP, Birkenfeld LW. [Interrelations Between Serum Sodium Concentration, Serum Osmolarity and Total Exchangeable Sodium, Total Exchangeable Potassium and Total Body Water](https://pmc.ncbi.nlm.nih.gov/articles/PMC1062793/). J Clin Invest. 1958.
2. Watson PE, Watson ID, Batt RD. [Total body water volumes for adult males and females estimated from simple anthropometric measurements](https://pubmed.ncbi.nlm.nih.gov/6986753/). Am J Clin Nutr. 1980.
3. Tzamaloukas AH, et al. [Edelman Revisited: Concepts, Achievements, and Challenges](https://pmc.ncbi.nlm.nih.gov/articles/PMC8784663/). Front Med. 2022.
4. Sterns RH. [Treatment Guidelines for Hyponatremia: Stay the Course](https://pmc.ncbi.nlm.nih.gov/articles/PMC10843202/). Kidney360. 2024.
5. Spasovski G. [Hyponatraemia—treatment standard 2024](https://academic.oup.com/ndt/article/39/10/1583/7713921). Nephrol Dial Transplant. 2024; [2026 correction](https://academic.oup.com/ndt/advance-article/doi/10.1093/ndt/gfag149/8725240).
6. Hillier TA, Abbott RD, Barrett EJ. [Hyponatremia: evaluating the correction factor for hyperglycemia](https://pubmed.ncbi.nlm.nih.gov/10225241/). Am J Med. 1999.

## 重要限制

- Watson TBW 是族群方程，在肥胖、消瘦、水腫、腹水、AKI 或體液快速改變時可能不準。
- 組織非滲透性鈉儲存、未量測流失及體水估算誤差都可能使實際血鈉偏離公式。
- 單次最近尿鈉與尿鉀只是未來平均濃度的代理值，尤其在利尿劑、ADH 變化、補液或 AKI 期間可能迅速失真。
- 若腸胃道或引流液的鈉鉀濃度未知，工具只能明示未納入，不能假設其為零。
- 本工具尚未完成前瞻性臨床驗證，不得用於自主處方，也不能取代重複抽血與臨床判斷。
