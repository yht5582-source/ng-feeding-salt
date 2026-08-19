# 管灌加鹽後 24 小時血漿鈉預估：設計規格

日期：2026-08-19  
狀態：待使用者最終審閱

## 1. 目的

在現有「管灌鈉量調整計算機」中增加成人非透析住院病人的 24 小時血漿鈉情境預估。工具需同時呈現中心值、合理範圍、與基準值的變化量、資料完整度，以及計算假設；不得把公式結果表達成確定值，也不得自動反推或推薦加鹽劑量。

原有的管灌配方鈉量、額外食鹽與每日總鈉攝取計算繼續保留，但原本以每日總鈉低於 1000 mg 直接提示低血鈉風險的規則必須移除。血漿鈉是可交換鈉與鉀相對於總體水的關係，不能只由每日鈉攝取量判斷。

## 2. 適用範圍

### 2.1 可使用族群

- 年滿 18 歲。
- 非透析住院病人。
- 有近期血漿／血清鈉與可供 24 小時情境估算的輸入、輸出資料。
- 工具用途為臨床決策輔助與情境比較，不取代抽血追蹤或醫師判斷。

### 2.2 不提供數值預測

符合任一條件時，仍可計算鈉攝取量，但不顯示 24 小時血鈉中心值：

- 未滿 18 歲。
- 血液透析、腹膜透析或連續性腎臟替代治療。
- 無尿。
- 缺少基準血鈉、估算 TBW 所需資料、配方自由水量、預估尿量、尿鈉或尿鉀。
- 計算後的總體水為零、負值或不具生理合理性。

### 2.3 降低可信度或緊急警示

- AKI、少尿、尿量快速變化、近期利尿劑或 desmopressin 調整。
- 明顯水腫、腹水、脫水、體液狀態不確定或 BMI 極端，使 Watson TBW 估算偏差增加。
- 基準血鈉採檢時間超過 24 小時。
- 高血糖且預期 24 小時內血糖明顯變化。
- 嚴重低鈉或高鈉、神經學症狀、或血鈉快速變化：顯示需立即臨床評估的醒目警示；工具不得提出自動加鹽建議。

## 3. 使用流程與介面

介面維持單頁、繁體中文、手機優先，分成四個可收合區塊。

### 3.1 病人與基準資料

必要欄位：

- 年齡（年）
- 計算用生理性別；需說明此欄只用於 Watson 公式的原始男女方程
- 身高（cm）
- 目前體重（kg）
- 最近血鈉（mmol/L）
- 採血日期時間（使用本地日期時間，不以 UTC 轉換）

建議或條件式欄位：

- 乾體重或平常體重（kg）
- 血糖（mg/dL）
- 血鉀（mmol/L）
- Creatinine（mg/dL）
- eGFR（mL/min/1.73 m²）
- AKI、少尿、無尿、透析／CRRT 狀態
- 體液狀態：不足、近正常、過多、不確定
- ODS 高風險因子：起始 Na ≤105 mmol/L、低血鉀、營養不良、酒精使用問題、晚期肝病
- 神經學或嚴重低鈉症狀旗標

eGFR 與 Creatinine 只參與適用性、警示與可信度判定，不直接換算排鈉量。

### 3.2 未來 24 小時輸入

- 管灌總熱量（kcal/day）
- 管灌配方總體積（mL/day）
- 配方自由水含量（mL/1000 mL）或產品標示的每日自由水量（mL/day）；此項為血鈉預測的必要資料
- 配方鈉（支援 mg/1000 kcal，並換算成每日 mEq）
- 配方鉀（支援 mg/1000 kcal，並換算成每日 mEq）
- 額外食鹽（g/day）
- 沖管水（mL/day）
- 其他口服／腸內自由水（mL/day）
- 靜脈輸液與藥物帶入的水、鈉、鉀
- 其他鈉與鉀補充（mEq/day）

NaCl 的底層換算使用分子量，不再以 1 g 食鹽固定等同 400 mg 鈉：

- 1 g NaCl 約含 393.4 mg sodium
- 1 g NaCl 約含 17.1 mEq sodium
- sodium mEq = sodium mg / 22.9898
- potassium mEq = potassium mg / 39.0983

### 3.3 未來 24 小時輸出

必要欄位：

- 預估尿量（mL/24 h）
- 尿鈉（mmol/L）
- 尿鉀（mmol/L）

可選欄位：

- 嘔吐、腹瀉、造口、引流或其他液體流失量（mL/day）
- 上述流失的鈉與鉀；若濃度未知，不得假裝為零，需標示模型未計入其電解質流失
- 不可見水分流失的中心值、下限與上限（mL/day）
- 發燒、呼吸急促等會增加不可見水分流失的狀態

### 3.4 結果

- 目前處方的總鈉攝取：mg/day 與 mEq/day
- 額外食鹽所提供的 sodium：mg/day 與 mEq/day
- 預估 24 小時血鈉中心值及合理範圍
- 相對於基準血鈉的 24 小時變化量
- 預估總體水、鈉＋鉀淨平衡與淨水分平衡
- 資料完整度：高／中／低；此標籤描述輸入完整度，不代表模型已獲高準確度驗證
- 可展開的公式、單位換算、範圍假設及未納入項目
- 「目前處方」與滑桿調整後處方的並列比較

工具不得顯示「建議加鹽 X g」或用目標血鈉反推治療劑量。

## 4. 核心計算

### 4.1 總體水

使用原始 Watson 成人方程，單位為 L：

- 男性：`TBW = 2.447 - 0.09516 × age + 0.1074 × height_cm + 0.3362 × weight_kg`
- 女性：`TBW = -2.097 + 0.1069 × height_cm + 0.2466 × weight_kg`

若有明顯體液過多、體液不足、BMI 極端或目前體重與乾體重差距大，顯示 TBW 估算限制並降低可信度；第一版不以未驗證的自訂係數靜默修正 TBW。

### 4.2 起始等效可交換陽離子池

以 Edelman 線性關係從基準血鈉與 TBW 回推：

`cation_pool_0 = TBW_0 × (PNa_0 + 25.6) / 1.11`

此數值是供情境平衡使用的等效池，不宣稱為直接量測的 total exchangeable Na + K。

### 4.3 24 小時鈉、鉀與水分平衡

所有電解質以 mEq、所有水量以 L 計算：

`urine_Na_loss = urine_volume_L × urine_Na_mmol_L`

`urine_K_loss = urine_volume_L × urine_K_mmol_L`

`net_cation = Na_in + K_in - Na_out - K_out`

`TBW_24 = TBW_0 + water_in - water_out`

`cation_pool_24 = cation_pool_0 + net_cation`

`PNa_24 = 1.11 × (cation_pool_24 / TBW_24) - 25.6`

若使用者未提供非尿液流失的電解質濃度，該部分只納入水量，並在結果中明確標記「未計入未知的腸胃道／引流鈉鉀流失」。

### 4.4 合理範圍

中心值使用輸入的預估值。上下界由相同公式重新計算，不以固定 `±N mmol/L` 裝飾：

- 病況相對穩定：尿量、尿鈉與尿鉀各以輸入值上下 15% 建立情境。
- AKI、利尿劑調整、尿量或輸出不穩：上述變項上下 30%。
- 不可見水分流失使用使用者輸入的下限與上限。
- 上下界採對血鈉較低與較高的組合情境；結果需列出使用的變動幅度。
- 若重要流失未量化或資料互相矛盾，範圍仍可顯示，但資料完整度不得為高。

第一版的範圍是敏感度情境，不是統計信賴區間，介面必須使用「情境範圍」而非「95% CI」。

## 5. 安全規則

- 原有「每日鈉攝取低於 1000 mg 即代表低血鈉風險」警示移除。
- 預估 24 小時上升超過 6 mmol/L：黃色警示。
- 預估 24 小時上升超過 8 mmol/L：紅色警示，提示可能過度矯正並需更早複驗。
- ODS 高風險因子存在時，持續顯示高風險旗標。
- 對嚴重或有症狀低血鈉，不提供本工具作為急救處置計算器；提示依急症流程處理與密集監測。
- 高血糖時可顯示校正血鈉參考範圍，但不得靜默以校正值取代模型基準；若血糖預期改變，降低可信度。
- 高血糖校正參考同時顯示 Katz 1.6 與 Hillier 2.4 mmol/L／每高於 100 mg/dL 的 100 mg/dL 所形成的範圍：`corrected_Na = measured_Na + factor × (glucose - 100) / 100`。血糖 ≤100 mg/dL 時不校正；血糖 >400 mg/dL 時提示線性校正的不確定性更高。
- 每次顯示預估值時均附上「需以實際血鈉追蹤驗證；尿量與尿電解質變化可使預估顯著偏離」文字。

## 6. 資料驗證與錯誤處理

- 不使用虛構病人預設值觸發臨床預測；臨床欄位預設為空。
- 管灌配方的水輸入必須使用產品標示的自由水量，不得把配方總體積直接視為自由水；缺少配方自由水資料時不顯示中心值。
- 每個欄位顯示單位，接受小數並拒絕非有限數值。
- 對超出生理常見範圍的數值先警告並要求確認，不直接截斷成另一個值。
- 使用本地時間處理採檢時間，避免 Asia/Taipei 午夜附近因 UTC 日期轉換而誤判。
- 必要欄位缺失時，逐項列出缺少項目。
- 若輸入導致負的水分量、負的 TBW、除以零或非有限結果，停止數值預測並顯示可理解的錯誤。
- 不收集姓名、病歷號等識別資料；不使用後端、cookie、localStorage 或分析追蹤。

## 7. 技術結構

維持無框架、無建置依賴的 GitHub Pages 靜態網站：

- `index.html`：語意結構、表單與結果區。
- `clinical-model.js`：單位換算、Watson TBW、平衡模型、情境範圍、資料完整度與安全旗標；可同時供瀏覽器與 Node 測試載入。
- `app.js`：DOM 讀取、輸入驗證、即時更新、可收合區塊與列印摘要。
- `styles.css`：手機優先、桌面版與列印樣式。
- `tests/clinical-model.test.js`：使用 Node 內建測試／assert，不新增第三方依賴。
- `README.md`：依實際功能說明公式、限制、使用方式、隱私與來源。

所有臨床計算需放在純函式中；DOM 層不得另行複製公式。

## 8. 測試與驗收

### 8.1 自動化計算測試

至少涵蓋：

- NaCl g、sodium mg 與 mEq 換算。
- 男性與女性 Watson TBW 基準案例。
- 零淨鈉鉀及零淨水分變化時，24 小時血鈉等於基準值。
- 增加自由水時血鈉下降。
- 增加鈉或鉀時血鈉上升。
- 尿量乘尿鈉／尿鉀的排出計算與單位。
- 穩定與不穩定情境的上下界。
- 必要資料缺失、未成年、透析、CRRT、無尿與不合理 TBW 的阻擋。
- 6 與 8 mmol/L 的預估上升警示門檻。
- ODS 高風險旗標及資料完整度。
- 高血糖、過期採檢時間與本地日期判定。

### 8.2 靜態與瀏覽器驗證

- JavaScript 語法與所有 DOM id 參照完整。
- `git diff --check` 無空白錯誤。
- 桌面與手機 viewport 無遮擋、截斷、水平捲動或不可讀內容。
- 實際操作「填入必要資料 → 調整食鹽滑桿 → 中心值、範圍、總鈉與警示同步更新」。
- 驗證缺少資料、無尿、透析、過度矯正與列印摘要狀態。
- 頁面載入無應用程式相關 console error/warning。

## 9. 發布與完成條件

- 實作完成並通過上述測試後，將功能合併至 `main`。
- 以 `main` 根目錄啟用 GitHub Pages。
- 等候 Pages 部署工作成功且 Pages API 狀態為 `built`。
- 公開網址需回應成功並包含新版的獨特標題、24 小時預估欄位及安全提示。
- 在公開網站實際執行主要互動流程，確認部署版本可計算、可阻擋不適用案例，且無相關 console error。
- 比對公開資產與部署 commit；僅有 push 成功或 HTTP 200 不算完成部署。

預期公開網址：`https://yht5582-source.github.io/ng-feeding-salt/`

## 10. 醫學依據與已知限制

主要依據：

1. Edelman IS, Leibman J, O'Meara MP, Birkenfeld LW. *Interrelations Between Serum Sodium Concentration, Serum Osmolarity and Total Exchangeable Sodium, Total Exchangeable Potassium and Total Body Water*. J Clin Invest. 1958. https://pmc.ncbi.nlm.nih.gov/articles/PMC1062793/
2. Watson PE, Watson ID, Batt RD. *Total body water volumes for adult males and females estimated from simple anthropometric measurements*. Am J Clin Nutr. 1980. https://pubmed.ncbi.nlm.nih.gov/6986753/
3. Tzamaloukas AH, et al. *Edelman Revisited: Concepts, Achievements, and Challenges*. Front Med. 2022. https://pmc.ncbi.nlm.nih.gov/articles/PMC8784663/
4. Sterns RH. *Treatment Guidelines for Hyponatremia: Stay the Course*. Kidney360. 2024. https://pmc.ncbi.nlm.nih.gov/articles/PMC10843202/
5. Spasovski G. *Hyponatraemia—treatment standard 2024*. Nephrol Dial Transplant. 2024; correction published 2026. https://academic.oup.com/ndt/article/39/10/1583/7713921 and https://academic.oup.com/ndt/advance-article/doi/10.1093/ndt/gfag149/8725240
6. Hillier TA, Abbott RD, Barrett EJ. *Hyponatremia: evaluating the correction factor for hyperglycemia*. Am J Med. 1999. https://pubmed.ncbi.nlm.nih.gov/10225241/

已知限制：

- Watson TBW 是族群方程，不是個別病人的直接體水測量，在肥胖、消瘦、水腫、腹水、AKI 與體液快速變化時可能不準。
- Edelman 關係描述群體層級的血鈉、可交換鈉鉀與 TBW 關係；組織非滲透性鈉儲存、未量測流失及體水估算誤差都可能造成預測偏差。
- 尿鈉與尿鉀的單次濃度可能無法代表未來完整 24 小時，特別是在利尿劑、ADH 變化、補液或 AKI 期間。
- 情境範圍只反映明列的輸入變動，無法包住所有生理不確定性。
- 本工具未經前瞻性臨床驗證，不得用於自主處方或取代連續血鈉監測。

## 11. 第一版不納入

- 兒科模型。
- 血液透析、腹膜透析或 CRRT 的鈉與水移除模型。
- 以目標血鈉自動推薦食鹽、濃鹽水、自由水或 desmopressin 劑量。
- 以 eGFR 自動推算排鈉量。
- 病人資料儲存、雲端同步、登入、EMR 串接或分析追蹤。
- 機器學習模型或宣稱已驗證的統計信賴區間。
