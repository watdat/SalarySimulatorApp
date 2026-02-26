// ========================================
// 定数: 2025年度 大阪・協会けんぽ
// ========================================
const RATES = {
    healthInsurance: 0.0512,      // 健康保険 (大阪) 自己負担 5.12%
    nursingInsurance: 0.00795,    // 介護保険 (40歳以上のみ) 0.795%
    pension: 0.0915,              // 厚生年金 9.15%
    employmentInsurance: 0.0055,  // 雇用保険 0.55% (2025年改正後)
    residentTax: 0.10,            // 住民税 10%
    residentTaxFixed: 5300,       // 住民税 均等割 (大阪市)
    overtimeMultiplier: 1.25,     // 残業割増率 25%
    monthlyWorkHours: 160,        // 月の所定労働時間（概算）
};

// 標準報酬月額テーブル (簡易版、主要な等級のみ)
const STANDARD_REMUNERATION_GRADES = [
    { min: 0, max: 63000, grade: 58000 },
    { min: 63000, max: 73000, grade: 68000 },
    { min: 73000, max: 83000, grade: 78000 },
    { min: 83000, max: 93000, grade: 88000 },
    { min: 93000, max: 101000, grade: 98000 },
    { min: 101000, max: 107000, grade: 104000 },
    { min: 107000, max: 114000, grade: 110000 },
    { min: 114000, max: 122000, grade: 118000 },
    { min: 122000, max: 130000, grade: 126000 },
    { min: 130000, max: 138000, grade: 134000 },
    { min: 138000, max: 146000, grade: 142000 },
    { min: 146000, max: 155000, grade: 150000 },
    { min: 155000, max: 165000, grade: 160000 },
    { min: 165000, max: 175000, grade: 170000 },
    { min: 175000, max: 185000, grade: 180000 },
    { min: 185000, max: 195000, grade: 190000 },
    { min: 195000, max: 210000, grade: 200000 },
    { min: 210000, max: 230000, grade: 220000 },
    { min: 230000, max: 250000, grade: 240000 },
    { min: 250000, max: 270000, grade: 260000 },
    { min: 270000, max: 290000, grade: 280000 },
    { min: 290000, max: 310000, grade: 300000 },
    { min: 310000, max: 330000, grade: 320000 },
    { min: 330000, max: 350000, grade: 340000 },
    { min: 350000, max: 370000, grade: 360000 },
    { min: 370000, max: 395000, grade: 380000 },
    { min: 395000, max: 425000, grade: 410000 },
    { min: 425000, max: 455000, grade: 440000 },
    { min: 455000, max: 485000, grade: 470000 },
    { min: 485000, max: 515000, grade: 500000 },
    { min: 515000, max: 545000, grade: 530000 },
    { min: 545000, max: 575000, grade: 560000 },
    { min: 575000, max: 605000, grade: 590000 },
    { min: 605000, max: 635000, grade: 620000 },
    { min: 635000, max: 665000, grade: 650000 },
    { min: 665000, max: 695000, grade: 680000 },
    { min: 695000, max: 730000, grade: 710000 },
    { min: 730000, max: 770000, grade: 750000 },
    { min: 770000, max: 810000, grade: 790000 },
    { min: 810000, max: 855000, grade: 830000 },
    { min: 855000, max: 905000, grade: 880000 },
    { min: 905000, max: 955000, grade: 930000 },
    { min: 955000, max: 1005000, grade: 980000 },
    { min: 1005000, max: 1055000, grade: 1030000 },
    { min: 1055000, max: 1115000, grade: 1090000 },
    { min: 1115000, max: 1175000, grade: 1150000 },
    { min: 1175000, max: 1235000, grade: 1210000 },
    { min: 1235000, max: 1295000, grade: 1270000 },
    { min: 1295000, max: 1355000, grade: 1330000 },
    { min: 1355000, max: Infinity, grade: 1390000 },
];

// 所得税速算表 (復興特別所得税 2.1% 含む)
const INCOME_TAX_TABLE = [
    { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
    { min: 1950000, max: 3300000, rate: 0.10, deduction: 97500 },
    { min: 3300000, max: 6950000, rate: 0.20, deduction: 427500 },
    { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
    { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
    { min: 18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
    { min: 40000000, max: Infinity, rate: 0.45, deduction: 4796000 },
];

// ========================================
// ユーティリティ関数
// ========================================
function formatCurrency(amount, showSign = false) {
    const absAmount = Math.abs(Math.round(amount));
    const formatted = absAmount.toLocaleString('ja-JP');
    if (showSign && amount < 0) {
        return `-${formatted}円`;
    }
    return `${formatted}円`;
}

function formatManYen(amount) {
    const manYen = Math.round(amount / 10000);
    return `${manYen}万円`;
}

function formatManYenDecimal(amount) {
    const manYen = amount / 10000;
    return `約${manYen.toFixed(1)}万円`;
}

/**
 * 文字列を受け取り、数値計算結果を返すヘルパー
 * 「+」「-」「*」「/」に対応
 */
function evaluateExpression(str) {
    if (!str) return 0;
    // 全角記号を半角に変換、不要な文字を除去
    let normalized = str.toString()
        .replace(/＋/g, '+')
        .replace(/－/g, '-')
        .replace(/＊/g, '*')
        .replace(/／/g, '/')
        .replace(/[^-0-9+*/.]/g, ''); // 数字と記号以外を除去

    if (!normalized) return 0;

    try {
        // 安全に計算するために Function を使用
        // 直接 eval するよりは限定的
        const result = new Function(`return (${normalized})`)();
        return isFinite(result) ? Math.round(result) : 0;
    } catch (e) {
        // 計算エラー時は数値のみを抽出して返す（フォールバック）
        const fallback = parseInt(normalized.replace(/[^0-9]/g, '')) || 0;
        return fallback;
    }
}

function getStandardRemuneration(monthlySalary) {
    for (const grade of STANDARD_REMUNERATION_GRADES) {
        if (monthlySalary >= grade.min && monthlySalary < grade.max) {
            return grade.grade;
        }
    }
    return STANDARD_REMUNERATION_GRADES[STANDARD_REMUNERATION_GRADES.length - 1].grade;
}

function getGradeIndex(monthlySalary) {
    for (let i = 0; i < STANDARD_REMUNERATION_GRADES.length; i++) {
        const grade = STANDARD_REMUNERATION_GRADES[i];
        if (monthlySalary >= grade.min && monthlySalary < grade.max) {
            return i;
        }
    }
    return STANDARD_REMUNERATION_GRADES.length - 1;
}

// 時間文字列（HH:MM）を時間数（小数）に変換
function parseOvertimeHours(timeStr) {
    if (!timeStr || timeStr === '0:00') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours + (minutes / 60);
}

// 残業代を計算（時間から）
function calculateOvertimePay(baseSalaryExcludingTransport, overtimeHours) {
    if (overtimeHours <= 0) return 0;
    const hourlyRate = baseSalaryExcludingTransport / RATES.monthlyWorkHours;
    const overtimeRate = hourlyRate * RATES.overtimeMultiplier;
    return Math.round(overtimeRate * overtimeHours);
}

// 給与所得控除を計算
function calculateSalaryDeduction(annualIncome) {
    if (annualIncome <= 1625000) return 550000;
    if (annualIncome <= 1800000) return annualIncome * 0.40 - 100000;
    if (annualIncome <= 3600000) return annualIncome * 0.30 + 80000;
    if (annualIncome <= 6600000) return annualIncome * 0.20 + 440000;
    if (annualIncome <= 8500000) return annualIncome * 0.10 + 1100000;
    return 1950000;
}

// 所得税を計算
function calculateIncomeTax(taxableIncome) {
    if (taxableIncome <= 0) return 0;
    for (const bracket of INCOME_TAX_TABLE) {
        if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
            const baseTax = taxableIncome * bracket.rate - bracket.deduction;
            return baseTax * 1.021; // 復興特別所得税 2.1%
        }
    }
    return 0;
}

// ふるさと納税の控除上限額を計算（修正版）
function calculateFurusatoLimit(annualIncome, annualSocialInsurance) {
    // 給与所得控除後の金額
    const salaryDeduction = calculateSalaryDeduction(annualIncome);
    const incomeAfterSalaryDeduction = annualIncome - salaryDeduction;

    // 所得控除の合計（社会保険料控除 + 基礎控除）
    // 住民税の基礎控除は43万円
    const basicDeductionForResident = 430000;
    const totalDeductions = annualSocialInsurance + basicDeductionForResident;

    // 課税所得（住民税計算用）
    const taxableIncomeForResident = Math.max(0, incomeAfterSalaryDeduction - totalDeductions);

    // 住民税所得割額（10%）
    const residentTaxIncomePortion = taxableIncomeForResident * 0.10;

    // 所得税の課税所得（所得税の基礎控除は48万円）
    const basicDeductionForIncome = 480000;
    const taxableIncomeForIncomeTax = Math.max(0, incomeAfterSalaryDeduction - annualSocialInsurance - basicDeductionForIncome);

    // 所得税率を判定
    let incomeTaxRate = 0.05;
    if (taxableIncomeForIncomeTax > 1950000) incomeTaxRate = 0.10;
    if (taxableIncomeForIncomeTax > 3300000) incomeTaxRate = 0.20;
    if (taxableIncomeForIncomeTax > 6950000) incomeTaxRate = 0.23;
    if (taxableIncomeForIncomeTax > 9000000) incomeTaxRate = 0.33;
    if (taxableIncomeForIncomeTax > 18000000) incomeTaxRate = 0.40;
    if (taxableIncomeForIncomeTax > 40000000) incomeTaxRate = 0.45;

    // ふるさと納税上限額の計算式
    // 上限額 = (住民税所得割額 × 20%) / (100% - 住民税率10% - 所得税率 × 復興税率1.021) + 2,000円
    const denominator = 1 - 0.10 - (incomeTaxRate * 1.021);
    const specialDeductionLimit = residentTaxIncomePortion * 0.20;
    const donationLimit = (specialDeductionLimit / denominator) + 2000;

    // 返礼品購入可能額 = 上限額の約30%
    const returnGiftValue = donationLimit * 0.30;

    return {
        donationLimit: Math.floor(donationLimit / 100) * 100, // 100円単位で切り捨て
        returnGiftValue: Math.floor(returnGiftValue / 100) * 100
    };
}

// 4-6月に該当するかチェック
function isAprilToJunePeriod(period) {
    if (period === 'first-half') return true;
    const month = parseInt(period);
    return month >= 4 && month <= 6;
}

// 社会保険料の計算（簡易版）
function calculateSocialInsurance(monthlyGross, age) {
    const standardRemuneration = getStandardRemuneration(monthlyGross);
    const health = Math.round(standardRemuneration * RATES.healthInsurance);
    const pension = Math.round(standardRemuneration * RATES.pension);
    const employment = Math.round(monthlyGross * RATES.employmentInsurance);
    const nursing = (age >= 40) ? Math.round(standardRemuneration * RATES.nursingInsurance) : 0;
    return health + pension + employment + nursing;
}

// 住民税の計算（簡易版）
function calculateResidentTax(annualTaxableIncome) {
    const salaryDeduction = calculateSalaryDeduction(annualTaxableIncome);
    const basicDeduction = 430000; // 住民税の基礎控除
    const taxableIncome = Math.max(0, annualTaxableIncome - salaryDeduction - basicDeduction);
    return Math.round(taxableIncome * RATES.residentTax) + RATES.residentTaxFixed;
}

// ========================================
// メイン計算ロジック
// ========================================
function calculate() {
    // 入力値を取得（計算式に対応）
    const totalPayment = evaluateExpression(document.getElementById('totalPayment').value);
    const transportAllowance = evaluateExpression(document.getElementById('transportAllowance').value);
    const overtimeHoursStr = document.getElementById('overtimeHours').value || '0:00';
    const overtimePeriod = document.getElementById('overtimePeriod').value;
    const bonusMonths = parseFloat(document.getElementById('bonusMonths').value) || 0;
    const ageGroup = document.getElementById('age').value;
    const additionalPayment = parseInt(document.getElementById('additionalPayment').value) || 0;
    const additionalDeduction = parseInt(document.getElementById('additionalDeduction').value) || 0;

    // 残業時間を解析
    const overtimeHours = parseOvertimeHours(overtimeHoursStr);

    // 基本給（交通費除く）＝ 支払総額入力値
    const baseSalaryExcludingTransport = totalPayment;

    // 残業代を計算
    const overtimePay = calculateOvertimePay(baseSalaryExcludingTransport, overtimeHours);

    // 月額総支給額（支払総額 + 交通費 + 残業代）
    const totalGross = totalPayment + transportAllowance + overtimePay;

    // 標準報酬月額 (社会保険料計算用) - その他支給は含めない
    const standardRemuneration = getStandardRemuneration(totalGross);

    // ---------------------------
    // 社会保険料 (月額)
    // ---------------------------
    const healthInsurance = Math.round(standardRemuneration * RATES.healthInsurance);
    const nursingInsurance = ageGroup === 'over40'
        ? Math.round(standardRemuneration * RATES.nursingInsurance)
        : 0;
    const pension = Math.round(standardRemuneration * RATES.pension);
    const employmentInsurance = Math.round(totalGross * RATES.employmentInsurance);

    const totalSocialInsurance = healthInsurance + nursingInsurance + pension + employmentInsurance;

    // ---------------------------
    // 税金 (月額概算)
    // ---------------------------
    // 課税対象額 = 総支給額 - 交通費
    const taxableGross = totalGross - transportAllowance;

    // 年収ベースで計算
    const annualTaxableGross = taxableGross * 12 + (baseSalaryExcludingTransport * bonusMonths);
    const salaryDeduction = calculateSalaryDeduction(annualTaxableGross);
    const basicDeduction = 480000;

    const annualSocialInsurance = totalSocialInsurance * 12 +
        (standardRemuneration * (RATES.healthInsurance + RATES.pension + (ageGroup === 'over40' ? RATES.nursingInsurance : 0)) * bonusMonths);

    const taxableIncome = Math.max(0, annualTaxableGross - salaryDeduction - basicDeduction - annualSocialInsurance);

    const annualIncomeTax = calculateIncomeTax(taxableIncome);
    const monthlyIncomeTax = Math.round(annualIncomeTax / 12);

    const annualResidentTax = Math.max(0, taxableIncome * RATES.residentTax) + RATES.residentTaxFixed;
    const monthlyResidentTax = Math.round(annualResidentTax / 12);

    // ---------------------------
    // 月額手取り（その他支給・控除を含む）
    // ---------------------------
    const totalDeduction = totalSocialInsurance + monthlyIncomeTax + monthlyResidentTax + additionalDeduction;
    const netPay = totalGross + additionalPayment - totalDeduction;

    // ---------------------------
    // 年間計算（その他支給・控除は月額×12として概算）
    // ---------------------------
    const annualIncome = totalGross * 12 + (baseSalaryExcludingTransport * bonusMonths) + (additionalPayment * 12);
    const annualDeduction = (totalSocialInsurance + monthlyIncomeTax + monthlyResidentTax) * 12 +
        ((healthInsurance + nursingInsurance + pension) * bonusMonths) +
        (baseSalaryExcludingTransport * bonusMonths * RATES.employmentInsurance) +
        (additionalDeduction * 12);
    const annualNetPay = annualIncome - annualDeduction;

    // ふるさと納税上限額（その他支給・控除は考慮しない）
    const furusatoAnnualIncome = totalGross * 12 + (baseSalaryExcludingTransport * bonusMonths);
    const furusato = calculateFurusatoLimit(furusatoAnnualIncome, annualSocialInsurance);
    const deductionAmount = Math.max(0, furusato.donationLimit - 2000);

    // ---------------------------
    // 表示更新
    // ---------------------------
    document.getElementById('totalGross').textContent = formatCurrency(totalGross + additionalPayment);
    document.getElementById('healthInsurance').textContent = formatCurrency(-healthInsurance);
    document.getElementById('nursingInsurance').textContent = formatCurrency(-nursingInsurance);
    document.getElementById('pension').textContent = formatCurrency(-pension);
    document.getElementById('employmentInsurance').textContent = formatCurrency(-employmentInsurance);
    document.getElementById('incomeTax').textContent = formatCurrency(-monthlyIncomeTax);
    document.getElementById('residentTax').textContent = formatCurrency(-monthlyResidentTax);

    // その他支給・控除の表示
    const additionalPaymentRow = document.getElementById('additionalPaymentRow');
    const additionalDeductionRow = document.getElementById('additionalDeductionRow');

    if (additionalPayment > 0) {
        additionalPaymentRow.style.display = 'flex';
        document.getElementById('additionalPaymentDisplay').textContent = '+' + formatCurrency(additionalPayment);
    } else {
        additionalPaymentRow.style.display = 'none';
    }

    if (additionalDeduction > 0) {
        additionalDeductionRow.style.display = 'flex';
        document.getElementById('additionalDeductionDisplay').textContent = formatCurrency(-additionalDeduction);
    } else {
        additionalDeductionRow.style.display = 'none';
    }

    document.getElementById('netPay').textContent = formatCurrency(netPay);

    // 年間予想額の表示更新（円マーク削除: formatManYenが '万' を返すようになったためそのまま適用）
    document.getElementById('annualIncome').textContent = formatManYen(annualIncome);
    document.getElementById('annualDeduction').textContent = formatManYen(annualDeduction);
    document.getElementById('annualNetPay').textContent = formatManYen(annualNetPay);

    // ふるさと納税（コンパクト表示）
    const furusatoDisplay = document.getElementById('furusatoAmount');
    if (furusatoDisplay) {
        // 返礼品購入可能額（円なし） + 上限額（円なし）
        furusatoDisplay.innerHTML = `
            ${formatCurrency(deductionAmount)} <span style="font-size:0.9em">（寄付金上限額 : ${formatCurrency(furusato.donationLimit)}）</span>
        `;
    }

    // ---------------------------
    // アドバイス生成
    // ---------------------------
    // ---------------------------
    generateAdvice(totalPayment, overtimePay, overtimeHours, overtimePeriod, totalGross);

    // ---------------------------
    // グラフ描画更新
    // ---------------------------
    updateChart(totalPayment, transportAllowance, overtimePay, overtimePeriod, bonusMonths, additionalPayment, additionalDeduction);
}

// ---------------------------
// 数値のフォーマット（カンマ区切り）
function formatCurrency(number) {
    return new Intl.NumberFormat('ja-JP').format(number);
}

// 万円単位での表示（円なし）
function formatManYen(number) {
    const manYen = Math.round(number / 10000);
    return new Intl.NumberFormat('ja-JP').format(manYen) + '万';
}

// -----------------------------------------------------
// イベントリスナー
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Input event listeners
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    // Initial calculation
    calculate();
});

// -----------------------------------------------------
// グラフ関連ロジック (Chart.js)
// -----------------------------------------------------
let monthlyChart = null;

function updateChart(basePayment, transportAllowance, overtimePay, overtimePeriod, bonusMonths, addPayment, addDeduction) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return; // 要素がない場合はスキップ

    // 月ごとのデータを計算
    const labels = [];
    const netPayData = [];
    const TaxData = [];

    // ボーナス月を設定（仮に6月と12月に分割支給とする）
    const bonusMonth1 = 6;
    const bonusMonth2 = 12;
    const bonusAmountPerTime = (basePayment * bonusMonths) / 2;

    for (let month = 1; month <= 12; month++) {
        labels.push(`${month}月`);

        // その月の残業代を判定
        let currentOvertimePay = 0;
        if (overtimePeriod === 'none') {
            currentOvertimePay = 0;
        } else if (overtimePeriod === 'first-half') {
            if (month >= 1 && month <= 6) currentOvertimePay = overtimePay;
        } else if (overtimePeriod === 'second-half') {
            if (month >= 7 && month <= 12) currentOvertimePay = overtimePay;
        } else {
            // 特定月のみ
            if (month == overtimePeriod) currentOvertimePay = overtimePay;
        }

        // ボーナス加算
        let currentBonus = 0;
        if (bonusMonths > 0) {
            if (month === bonusMonth1 || month === bonusMonth2) {
                currentBonus = bonusAmountPerTime;
            }
        }

        // 月総支給（基本 + 交通費 + 残業 + その他 + ボーナス）
        const currentTotalGross = basePayment + transportAllowance + currentOvertimePay + addPayment + currentBonus;

        // 社会保険・税金の簡易計算（ボーナス時は保険料も増えるが、ここでは近似計算とする）
        // ※正確には賞与の社会保険料計算が必要だが、簡易的に「総支給に対する比率」で近似
        //  月額計算の結果を利用して比率を出す
        const baseGross = basePayment + overtimePay + addPayment; // 基準となる月
        const baseDeduction = calculateSocialInsurance(baseGross, 40) + calculateIncomeTax(baseGross - calculateSocialInsurance(baseGross, 40), 0) + calculateResidentTax(baseGross * 12);

        // ざっくり控除率 (ボーナス月は高くなる傾向があるが、ここでは平準化してシミュレーション)
        // より正確には calculate() のロジックを月ごとに回すべきだが、パフォーマンス考慮し簡易化
        // ただし手取り感を見せる目的なので、月次の計算ロジックを再利用するのがベスト

        // --- 各月の正確な計算 ---
        // 標準報酬月額の決定ロジックなどは複雑なため、
        // 「その月の総支給額」に基づいて控除額を単独計算する
        const si = calculateSocialInsurance(currentTotalGross, 40); // 年齢は一旦40歳未満固定扱い（簡易）
        const it = calculateIncomeTax(currentTotalGross - transportAllowance - si, 0); // 扶養0 住民税は別途
        // 住民税は前年所得ベースだが、ここでは「月割額」として一定とする（ボーナスからは引かれないのが通例だが、年収ベースの負担感として表示）
        const residentTaxText = document.getElementById('residentTax').textContent;
        // 数字以外を除去（マイナス、カンマ、円など全て除去して絶対値を取得）
        const taxVal = parseInt(residentTaxText.replace(/[^0-9]/g, '')) || 0;

        // 住民税は表示上マイナスがついているが、ここでは控除額として正の値で扱う
        // しかし textContent には '-' が含まれている可能性があるため、上記regexで数字だけ抜き出し、正の値として使用する

        const currentDeduction = si + it + taxVal + addDeduction;
        const currentNet = currentTotalGross - currentDeduction;

        netPayData.push(currentNet);
        TaxData.push(currentDeduction);
    }

    // チャート描画または更新
    console.log("Updating chart...", labels.length, netPayData, TaxData); // Debug log

    if (monthlyChart) {
        monthlyChart.data.datasets[0].data = netPayData;
        monthlyChart.data.datasets[1].data = TaxData;
        monthlyChart.update();
    } else {
        if (typeof Chart === 'undefined') {
            console.error("Chart.js is not loaded!");
            return;
        }
        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '手取り',
                        data: netPayData,
                        backgroundColor: 'rgba(0, 217, 255, 0.6)',
                        borderColor: 'rgba(0, 217, 255, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '控除（税・保険）',
                        data: TaxData,
                        backgroundColor: 'rgba(168, 85, 247, 0.6)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        stacked: true,
                        ticks: { color: 'rgba(255,255,255,0.7)' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'rgba(255,255,255,0.9)' }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ========================================
// アドバイス生成
// ========================================
function generateAdvice(totalPayment, overtimePay, overtimeHours, overtimePeriod, totalGrossWithOvertime) {
    const adviceCard = document.getElementById('adviceCard');
    const adviceText = document.getElementById('adviceText');

    // 残業なしの場合の等級
    const baseGrade = getStandardRemuneration(totalPayment);
    const baseGradeIndex = getGradeIndex(totalPayment);

    // 残業ありの場合の等級
    const withOvertimeGrade = getStandardRemuneration(totalGrossWithOvertime);
    const withOvertimeGradeIndex = getGradeIndex(totalGrossWithOvertime);

    const gradeIncrease = withOvertimeGradeIndex - baseGradeIndex;

    if (overtimeHours > 0 && overtimePay > 0) {
        const monthlySocialInsuranceDiff =
            (withOvertimeGrade - baseGrade) * (RATES.healthInsurance + RATES.pension);
        const annualIncrease = Math.round(monthlySocialInsuranceDiff * 12);

        if (isAprilToJunePeriod(overtimePeriod) && gradeIncrease > 0) {
            const hoursDisplay = Math.floor(overtimeHours) + '時間' +
                (overtimeHours % 1 > 0 ? Math.round((overtimeHours % 1) * 60) + '分' : '');

            adviceText.innerHTML = `
                 4〜6月に残業が <strong>${hoursDisplay}</strong> 以上続くと、
                9月〜翌年8月の社会保険料が <strong>月額${formatCurrency(Math.round(monthlySocialInsuranceDiff))}</strong> 
                増加し、年間で <strong>${formatCurrency(annualIncrease)}</strong> の負担増となります。
            `;
            adviceCard.style.borderColor = 'rgba(255, 107, 107, 0.5)';
            adviceCard.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(168, 85, 247, 0.1))';
        } else if (!isAprilToJunePeriod(overtimePeriod) && overtimePeriod !== 'none') {
            adviceText.innerHTML = `
                 残業を4〜6月以外に集中させているため、社会保険料の等級上昇を回避できています。
                もし同じ残業を4〜6月に行った場合、年間約 <strong>${formatCurrency(annualIncrease)}</strong> 
                社会保険料が増加していました。
            `;
            adviceCard.style.borderColor = 'rgba(0, 217, 255, 0.5)';
            adviceCard.style.background = 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(168, 85, 247, 0.1))';
        } else {
            adviceText.innerHTML = `
                残業時期を選択すると、社会保険料への影響を詳しくシミュレーションできます。
                4〜6月の残業は9月以降の社会保険料に影響します。
            `;
            adviceCard.style.borderColor = 'rgba(0, 217, 255, 0.3)';
            adviceCard.style.background = 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(168, 85, 247, 0.1))';
        }
    } else {
        adviceText.innerHTML = `
             残業時間を入力すると、残業時期による社会保険料への影響をシミュレーションできます。
            4〜6月の残業は「標準報酬月額」を押し上げ、9月〜翌年8月の保険料が上がります。
        `;
        adviceCard.style.borderColor = 'rgba(0, 217, 255, 0.3)';
        adviceCard.style.background = 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(168, 85, 247, 0.1))';
    }
}

// ========================================
// イベントリスナー
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    calculate();

    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
        input.addEventListener('change', calculate);

        // 特定の入力欄でフォーカスが外れた時に計算結果に置き換える
        if (input.id === 'totalPayment' || input.id === 'transportAllowance') {
            input.addEventListener('blur', (e) => {
                const result = evaluateExpression(e.target.value);
                if (result > 0) {
                    e.target.value = result;
                }
            });
        }
    });
});
