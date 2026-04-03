/**
 * Salary Simulator - Refactored Main Script
 * Version: 2026.1 (FY2026 / R8 Support)
 * Regions: Osaka, Tokyo, Hyogo, Kyoto
 */

// ========================================
// 1. Initial Configuration & Rates
// ========================================
const SALARY_CONFIG = {
    RATES: {
        nursingInsurance: 0.0081,    // Nursing care insurance (over 40)
        childSupport: 0.00115,       // Child-rearing support money (New in 2026)
        pension: 0.0915,             // Employees' pension insurance
        employmentInsurance: 0.005,  // Employment insurance (FY2026 rate)
        residentTax: 0.10,           // Income-based resident tax (10%)
        residentTaxFixed: 5300,      // Per-capita resident tax (Osaka city ref)
        overtimeMultiplier: 1.25,    // Standard overtime multiplier
        monthlyWorkHours: 160        // Presumed monthly work hours
    },

    // Kyokai Kenpo Health Insurance Rates by Prefecture (FY2026)
    REGION_RATES: {
        osaka: 0.05065,  // Total 10.13%
        tokyo: 0.04925,  // Total 9.85%
        hyogo: 0.05060,  // Total 10.12%
        kyoto: 0.04945   // Total 9.89%
    },

    // Standard Remuneration Grades (Monthly Salary Table)
    STANDARD_REMUNERATION_GRADES: [
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
        { min: 1355000, max: Infinity, grade: 1390000 }
    ],

    // Quick Tax Table (Including 2.1% reconstruction tax)
    INCOME_TAX_TABLE: [
        { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
        { min: 1950000, max: 3300000, rate: 0.10, deduction: 97500 },
        { min: 3300000, max: 6950000, rate: 0.20, deduction: 427500 },
        { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
        { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
        { min: 18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
        { min: 40000000, max: Infinity, rate: 0.45, deduction: 4796000 }
    ]
};

// ========================================
// 2. Formatting & Logic Utilities
// ========================================
const Utils = {
    /** Formats a number to JP Currency string. */
    formatCurrency: (num) => new Intl.NumberFormat('ja-JP').format(num || 0),

    /** Formats a number to "Million Yen" string. */
    formatManYen: (amt) => `${Math.round((amt || 0) / 10000)}万円`,
    
    /** Evaluates string expressions securely (e.g. "200000 + 10000"). */
    evaluateExpression: (str) => {
        if (!str) return 0;
        let normalized = str.toString()
            .replace(/＋/g, '+').replace(/－/g, '-').replace(/＊/g, '*').replace(/／/g, '/')
            .replace(/[^-0-9+*/.]/g, ''); 
        if (!normalized) return 0;
        try {
            const result = new Function(`return (${normalized})`)();
            return isFinite(result) ? Math.round(result) : 0;
        } catch (e) {
            return parseInt(normalized.replace(/[^0-9]/g, '')) || 0;
        }
    }
};

// ========================================
// 3. Calculation Engine Module
// ========================================
class SalaryCalculator {
    constructor(config) {
        this.config = config;
    }

    /** Finds the standard monthly remuneration grade. */
    getStandardRemuneration(monthlySalary) {
        const grades = this.config.STANDARD_REMUNERATION_GRADES;
        for (const grade of grades) {
            if (monthlySalary >= grade.min && monthlySalary < grade.max) return grade.grade;
        }
        return grades[grades.length - 1].grade;
    }

    /** Calculates income tax based on the taxable income brackets. */
    calculateIncomeTax(taxableIncome) {
        if (taxableIncome <= 0) return 0;
        for (const bracket of this.config.INCOME_TAX_TABLE) {
            if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
                const baseTax = taxableIncome * bracket.rate - bracket.deduction;
                return baseTax * 1.021; // Inc. reconstruction tax
            }
        }
        return 0;
    }

    /** Standard deduction table for salary income. */
    calculateSalaryDeduction(annualIncome) {
        if (annualIncome <= 1625000) return 550000;
        if (annualIncome <= 1800000) return annualIncome * 0.40 - 100000;
        if (annualIncome <= 3600000) return annualIncome * 0.30 + 80000;
        if (annualIncome <= 6600000) return annualIncome * 0.20 + 440000;
        if (annualIncome <= 8500000) return annualIncome * 0.10 + 1100000;
        return 1950000;
    }

    /** Calculates presumed monthly overtime pay. */
    calculateOvertimePay(baseSalary, dailyMinutes) {
        const monthlyHours = (dailyMinutes / 60) * 20; 
        const hourlyRate = baseSalary / this.config.RATES.monthlyWorkHours;
        return Math.round(hourlyRate * this.config.RATES.overtimeMultiplier * monthlyHours);
    }

    /** Calculates all social insurance deductions for a given month. */
    calculateSocialInsurance(grossForSI, ageGroup, region) {
        const stdRemun = this.getStandardRemuneration(grossForSI);
        const rates = this.config.RATES;
        const regionRate = this.config.REGION_RATES[region] || this.config.REGION_RATES.osaka;

        const health = Math.round(stdRemun * regionRate);
        const pension = Math.round(stdRemun * rates.pension);
        const nursing = (ageGroup === 'over40') ? Math.round(stdRemun * rates.nursingInsurance) : 0;
        const childSupport = Math.round(stdRemun * rates.childSupport);
        
        return { health, pension, nursing, childSupport, total: health + pension + nursing + childSupport };
    }

    /** Estimates "Furusato Nouzei" donation limits. */
    calculateFurusatoLimit(annualIncome, annualSI) {
        const salaryDed = this.calculateSalaryDeduction(annualIncome);
        const incomeAfterDed = annualIncome - salaryDed;
        const taxableResident = Math.max(0, incomeAfterDed - annualSI - 430000); // 430k basic ded for res tax
        const resTaxIncomePortion = taxableResident * 0.10;
        const taxableIT = Math.max(0, incomeAfterDed - annualSI - 480000); // 480k basic ded for income tax
        
        let itRate = 0.05;
        if (taxableIT > 1950000) itRate = 0.10;
        if (taxableIT > 3300000) itRate = 0.20;
        if (taxableIT > 6950000) itRate = 0.23;
        if (taxableIT > 9000000) itRate = 0.33;
        if (taxableIT > 18000000) itRate = 0.40;
        if (taxableIT > 40000000) itRate = 0.45;

        const denominator = 1 - 0.10 - (itRate * 1.021);
        const limit = (resTaxIncomePortion * 0.20 / denominator) + 2000;

        return {
            donationLimit: Math.floor(limit / 100) * 100,
            deductionAmount: Math.max(0, Math.floor(limit / 100) * 100 - 2000)
        };
    }
}

// ========================================
// 4. UI Manager Module
// ========================================
class UIManager {
    constructor() {
        this.elements = {};
        this.initElementCache();
    }

    /** Caches all interactive DOM elements. */
    initElementCache() {
        const ids = [
            'totalPayment', 'transportAllowance', 'overtimeHours', 'overtimePeriod',
            'bonusMonths', 'age', 'additionalPayment', 'additionalDeduction',
            'totalGross', 'healthInsurance', 'nursingInsurance', 'pension', 'childSupport', 'employmentInsurance',
            'incomeTax', 'residentTax', 'additionalPaymentRow', 'additionalPaymentDisplay',
            'additionalDeductionRow', 'additionalDeductionDisplay', 'netPay',
            'monthlyOvertimeHours', 'annualIncome', 'annualDeduction', 'annualNetPay',
            'furusatoAmount', 'adviceCard', 'adviceText', 'monthlyChart'
        ];
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
        this.regionSelect = document.getElementById('regionSelect');
    }

    /** Aggregates current user inputs into a structured object. */
    getInputs() {
        const getVal = (id) => Utils.evaluateExpression(this.elements[id].value);
        return {
            totalPayment: getVal('totalPayment'),
            transportAllowance: getVal('transportAllowance'),
            overtimeMinutes: parseInt(this.elements.overtimeHours.value) || 0,
            overtimePeriod: this.elements.overtimePeriod.value,
            bonusMonths: parseFloat(this.elements.bonusMonths.value) || 0,
            ageGroup: this.elements.age.value,
            additionalPayment: getVal('additionalPayment'),
            additionalDeduction: getVal('additionalDeduction')
        };
    }

    /** Updates the primary UI displays based on calculated results. */
    updateDisplay(results) {
        const el = this.elements;
        const cur = Utils.formatCurrency;

        el.totalGross.textContent = `${cur(results.monthly.totalGross)}円`;
        el.healthInsurance.textContent = `-${cur(results.monthly.si.health)}円`;
        el.nursingInsurance.textContent = `-${cur(results.monthly.si.nursing)}円`;
        el.pension.textContent = `-${cur(results.monthly.si.pension)}円`;
        el.childSupport.textContent = `-${cur(results.monthly.si.childSupport)}円`;
        el.employmentInsurance.textContent = `-${cur(results.monthly.si.employment)}円`;
        el.incomeTax.textContent = `-${cur(results.monthly.tax.income)}円`;
        el.residentTax.textContent = `-${cur(results.monthly.tax.resident)}円`;
        el.netPay.textContent = `${cur(results.monthly.netPay)}円`;
        
        // Show/Hide additional rows
        const addPay = results.inputs.additionalPayment;
        el.additionalPaymentDisplay.textContent = `+${cur(addPay)}円`;

        const addDed = results.inputs.additionalDeduction;
        el.additionalDeductionDisplay.textContent = `-${cur(addDed)}円`;

        const otHours = (results.inputs.overtimeMinutes / 60) * 20;
        el.monthlyOvertimeHours.textContent = `${otHours > 0 ? otHours.toFixed(1).replace(/\.0$/, '') : '0'}H/月`;

        // Annual Summary
        el.annualIncome.textContent = Utils.formatManYen(results.annual.income);
        el.annualDeduction.textContent = Utils.formatManYen(results.annual.deduction);
        el.annualNetPay.textContent = Utils.formatManYen(results.annual.netPay);

        el.furusatoAmount.innerHTML = `
            ${cur(results.furusato.deductionAmount)} <span style="font-size:0.9em">（寄付金上限額 : ${cur(results.furusato.donationLimit)}）</span>
        `;
    }

    /** Updates the advice card theme and text. */
    updateAdvice(advice) {
        const el = this.elements;
        el.adviceText.innerHTML = advice.text;
        el.adviceCard.style.borderColor = advice.borderColor || 'rgba(0, 217, 255, 0.3)';
        el.adviceCard.style.background = advice.background || 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(168, 85, 247, 0.1))';
    }
}

// ========================================
// 5. Core App Controller
// ========================================
class AppController {
    constructor() {
        this.calc = new SalaryCalculator(SALARY_CONFIG);
        this.ui = new UIManager();
        this.chart = null;
        this.activeRegion = 'osaka';
    }

    /** Initializes event listeners and performs first calculation. */
    init() {
        this.setupEventListeners();
        this.calculate();
    }

    /** Attaches listeners to all inputs and prefecture selection. */
    setupEventListeners() {
        const allInputs = document.querySelectorAll('input, select');
        allInputs.forEach(input => {
            input.addEventListener('input', () => this.calculate());
            input.addEventListener('change', () => this.calculate());

            // Auto-format expression inputs on blur
            if (['totalPayment', 'transportAllowance', 'additionalPayment', 'additionalDeduction'].includes(input.id)) {
                input.addEventListener('blur', (e) => {
                    const res = Utils.evaluateExpression(e.target.value);
                    if (res > 0) e.target.value = res;
                });
            }
        });

        // Region Switching
        this.ui.regionSelect.addEventListener('change', (e) => {
            this.activeRegion = e.target.value;
            this.calculate();
        });
    }

    /** Orchestrates the calculation and UI update flow. */
    calculate() {
        const inputs = this.ui.getInputs();
        const results = this.processCalculations(inputs);
        this.ui.updateDisplay(results);
        this.generateAdvice(inputs, results);
        this.updateChart(inputs, results);
    }

    /** Core business logic for a single month and the annual estimates. */
    processCalculations(inputs) {
        const rates = SALARY_CONFIG.RATES;
        const overtimePay = this.calc.calculateOvertimePay(inputs.totalPayment, inputs.overtimeMinutes);
        const monthlyTotalGross = inputs.totalPayment + inputs.transportAllowance + overtimePay + inputs.additionalPayment;
        
        // Social Insurance (Monthly)
        const si = this.calc.calculateSocialInsurance(monthlyTotalGross, inputs.ageGroup, this.activeRegion);
        si.employment = Math.round(monthlyTotalGross * rates.employmentInsurance);
        si.total += si.employment;

        // Annual Data
        const annualData = this.calculateAnnual(inputs, overtimePay);

        // Taxes (Prated derived from annual)
        const monthlyTax = {
            income: Math.round(annualData.incomeTax / 12),
            resident: Math.round(annualData.residentTax / 12)
        };

        const monthlyNetPay = monthlyTotalGross - (si.total + monthlyTax.income + monthlyTax.resident + inputs.additionalDeduction);

        return {
            inputs,
            monthly: {
                totalGross: monthlyTotalGross, overtimePay, si, tax: monthlyTax, netPay: monthlyNetPay
            },
            annual: {
                income: annualData.income, deduction: annualData.deduction, netPay: annualData.netPay, si: annualData.totalSI
            },
            furusato: this.calc.calculateFurusatoLimit(annualData.income, annualData.totalSI)
        };
    }

    /** Precise estimation for annual income, SI, and taxes. */
    calculateAnnual(inputs, overtimePay) {
        let annualOvertime = 0;
        if (inputs.overtimePeriod === 'all') annualOvertime = overtimePay * 12;
        else if (inputs.overtimePeriod !== 'none') annualOvertime = overtimePay * 3;

        const income = (inputs.totalPayment + inputs.transportAllowance + inputs.additionalPayment) * 12 
                       + annualOvertime + (inputs.totalPayment * inputs.bonusMonths);
        
        const siRatesCommon = SALARY_CONFIG.RATES.pension + SALARY_CONFIG.RATES.childSupport +
                       (inputs.ageGroup === 'over40' ? SALARY_CONFIG.RATES.nursingInsurance : 0);
        const totalSiRate = SALARY_CONFIG.REGION_RATES[this.activeRegion] + siRatesCommon;
        
        // SI is based on grades which may differ during OT periods
        const gradeWithOT = this.calc.getStandardRemuneration(inputs.totalPayment + inputs.transportAllowance + overtimePay + inputs.additionalPayment);
        const gradeBase = this.calc.getStandardRemuneration(inputs.totalPayment + inputs.transportAllowance + inputs.additionalPayment);
        
        let subtotalSI = 0;
        if (inputs.overtimePeriod === 'all') {
            subtotalSI = gradeWithOT * totalSiRate * 12;
        } else if (inputs.overtimePeriod !== 'none') {
            subtotalSI = (gradeWithOT * totalSiRate * 3) + (gradeBase * totalSiRate * 9);
        } else {
            subtotalSI = gradeBase * totalSiRate * 12;
        }
        const totalSI = Math.round(subtotalSI + income * SALARY_CONFIG.RATES.employmentInsurance);

        // Taxes
        const taxableIncome = Math.max(0, income - this.calc.calculateSalaryDeduction(income) - 480000 - totalSI);
        const incomeTax = this.calc.calculateIncomeTax(taxableIncome);
        const residentTax = Math.max(0, taxableIncome * 0.10) + SALARY_CONFIG.RATES.residentTaxFixed;

        const deduction = totalSI + incomeTax + residentTax + (inputs.additionalDeduction * 12);

        return { income, deduction, netPay: income - deduction, incomeTax, residentTax, totalSI };
    }

    /** Logic for dynamic insights/advice based on overtime timing. */
    generateAdvice(inputs, results) {
        const { totalPayment, additionalPayment, overtimeMinutes, overtimePeriod } = inputs;
        const otPay = results.monthly.overtimePay;
        const totalGross = results.monthly.totalGross;

        let advice = { text: '残業時間を入力すると、残業時期による社会保険料への影響をシミュレーションできます。' };

        if (otPay > 0) {
            const siRateFixed = SALARY_CONFIG.RATES.pension + SALARY_CONFIG.RATES.childSupport;
            const regionRate = SALARY_CONFIG.REGION_RATES[this.activeRegion];
            const totalSiRate = siRateFixed + regionRate;
            
            const diff = (this.calc.getStandardRemuneration(totalGross) - this.calc.getStandardRemuneration(totalPayment + additionalPayment)) * totalSiRate;
            
            if (['all', 'q2'].includes(overtimePeriod) && diff > 0) {
                const hours = (overtimeMinutes / 60) * 20;
                const hText = `${Math.floor(hours)}時間${hours % 1 > 0 ? Math.round((hours % 1) * 60) + '分' : ''}`;
                advice.text = `4〜6月に残業が <strong>${hText}</strong> 以上続くと、9月以降の保険料が <strong>月額${Utils.formatCurrency(Math.round(diff))}</strong> 増加し、年間で <strong>${Utils.formatCurrency(Math.round(diff * 12))}</strong> の負担増となります。`;
                advice.borderColor = 'rgba(255, 107, 107, 0.5)';
                advice.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(168, 85, 247, 0.1))';
            } else if (overtimePeriod !== 'none' && overtimePeriod !== 'all') {
                advice.text = `残業を4〜6月以外に集中させているため、社会保険料の等級上昇を回避できています。もし4〜6月に行った場合、年間約 <strong>${Utils.formatCurrency(Math.round(diff * 12))}</strong> 負担が増えていました。`;
                advice.borderColor = 'rgba(0, 217, 255, 0.5)';
            }
        }
        this.ui.updateAdvice(advice);
    }

    /** Renders and syncs the monthly cashflow bar chart. */
    updateChart(inputs, results) {
        const canvas = this.ui.elements.monthlyChart;
        if (!canvas || typeof Chart === 'undefined') return;

        const labels = [], netPayData = [], deductionData = [];
        const bonusPerTerm = (inputs.totalPayment * inputs.bonusMonths) / 2;
        const resTax = results.monthly.tax.resident;

        for (let m = 1; m <= 12; m++) {
            labels.push(`${m}月`);
            
            let curOT = 0;
            if (inputs.overtimePeriod === 'all' || 
               (inputs.overtimePeriod === 'q1' && m <= 3) || (inputs.overtimePeriod === 'q2' && m >= 4 && m <= 6) ||
               (inputs.overtimePeriod === 'q3' && m >= 7 && m <= 9) || (inputs.overtimePeriod === 'q4' && m >= 10)) {
                curOT = results.monthly.overtimePay;
            }

            const curBonus = (inputs.bonusMonths > 0 && (m === 6 || m === 12)) ? bonusPerTerm : 0;
            const curGross = inputs.totalPayment + inputs.transportAllowance + curOT + inputs.additionalPayment + curBonus;
            
            const si = this.calc.calculateSocialInsurance(curGross, inputs.ageGroup, this.activeRegion);
            const empSI = Math.round(curGross * SALARY_CONFIG.RATES.employmentInsurance);
            const it = this.calc.calculateIncomeTax(Math.max(0, curGross - inputs.transportAllowance - si.total - empSI - 40000));
            
            const totalDed = si.total + empSI + it + resTax + inputs.additionalDeduction;
            netPayData.push(curGross - totalDed);
            deductionData.push(totalDed);
        }

        if (this.chart) {
            this.chart.data.datasets[0].data = netPayData;
            this.chart.data.datasets[1].data = deductionData;
            this.chart.update();
        } else {
            this.chart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: '手取り', data: netPayData, backgroundColor: 'rgba(0, 217, 255, 0.6)', borderColor: 'rgba(0, 217, 255, 1)', borderWidth: 1 },
                        { label: '控除', data: deductionData, backgroundColor: 'rgba(168, 85, 247, 0.6)', borderColor: 'rgba(168, 85, 247, 1)', borderWidth: 1 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { 
                        x: { stacked: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } }, 
                        y: { stacked: true, ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.1)' } } 
                    },
                    plugins: { 
                        legend: { labels: { color: 'rgba(255,255,255,0.9)' } }, 
                        tooltip: { mode: 'index', intersect: false, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Utils.formatCurrency(ctx.parsed.y)}円` } } 
                    }
                }
            });
        }
    }
}

// ========================================
// 6. Application Entry Point
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();
});
