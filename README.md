# 管灌鈉量調整計算機 (Tube Feeding Sodium Calculator)

這是一個專為臨床營養照護設計的輕量化互動網頁工具，旨在協助營養團隊與醫療人員快速計算並調整管灌病人的每日總鈉攝取量。透過視覺化的參數調整，能有效評估低血鈉（Hyponatremia）風險，提供更精準的臨床營養介入。

## ✨ 核心功能 (Features)

* **即時數據連動**：無縫計算「商業配方鈉量」與「額外加鹽量」的加總結果。
* **臨床單位換算**：自動將總攝取鈉量 (mg) 轉換為醫療常規使用的電解質當量 (mEq)。
* **自動化風險示警**：當每日總攝取鈉量低於 1000 mg 時，系統會自動觸發視覺化警示，提醒評估低血鈉風險。
* **行動裝置友善 (RWD)**：專為手機與平板等行動裝置優化，方便在病房查房時單手滑動操作。
* **零依賴 (Zero Dependencies)**：純 HTML / CSS / Vanilla JavaScript 撰寫，無需安裝任何框架，載入速度極快。

## 🚀 部署與使用方式 (Deployment & Usage)

本專案為靜態網頁，支援直接透過 GitHub Pages 進行免費部署與託管。

1. 將本專案 Fork 或 Clone 至您的本地端。
2. 確認根目錄下包含 `index.html` 檔案。
3. 進入 GitHub 儲存庫的 **Settings** > **Pages**。
4. 將 Source 設定為 `Deploy from a branch`，並選擇 `main` 即可自動生成線上連結。

**Live Demo:** `[請在此處貼上您的 GitHub Pages 連結]`

## 🛠 操作說明 (How to Use)

1. **每日處方總熱量 (kcal)**：輸入營養處方設定的總大卡數。
2. **配方鈉含量 (mg / 1000 kcal)**：依據所選用的商業配方，輸入其每 1000 大卡提供的鈉毫克數。
3. **額外加鹽量 (g)**：拖曳滑桿調整每日預計額外添加的高級食鹽克數（系統已內建 1g 食鹽 ≈ 400mg 鈉之換算）。
4. 下方卡片將即時顯示計算結果與是否觸發低鈉警示。

## ⚠️ 臨床免責聲明 (Clinical Disclaimer)

本工具僅作為 **臨床決策輔助 (Clinical Decision Support)** 用途，計算結果僅供參考，**不能替代專業醫師與營養師之臨床判斷**。
* 實際處置應綜合評估病患的抽血生化數據、體液容積狀態 (fluid status)、各項引流流失量及用藥史。
* 若病患合併嚴重心衰竭 (CHF)、晚期慢性腎臟病 (CKD) 或高血鈉等特殊狀況，應遵循個別化的限水限鈉醫囑。

## 📄 授權條款 (License)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
