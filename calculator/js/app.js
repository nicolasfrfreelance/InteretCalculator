document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculator-form');
  
  const enableWithdrawal = document.getElementById('enableWithdrawal');
  const withdrawalBody = document.getElementById('withdrawalBody');
  const withdrawalType = document.getElementById('withdrawalType');
  const withdrawalRateGroup = document.getElementById('withdrawalRateGroup');
  const withdrawalAmountGroup = document.getElementById('withdrawalAmountGroup');
  const applyTaxCheckbox = document.getElementById('applyTax');

  const btnViewHistogram = document.getElementById('btn-view-histogram');
  const btnViewLine = document.getElementById('btn-view-line');
  const btnViewTable = document.getElementById('btn-view-table');

  const chartContainer = document.getElementById('chart-container');
  const tableContainer = document.getElementById('table-container');
  const btnExportCsv = document.getElementById('btn-export-csv');

  // Gestion dynamique des versements
  const depositsContainer = document.getElementById('deposits-container');
  const btnAddDeposit = document.getElementById('btn-add-deposit');

  let currentSchedule = [];
  let currentChartType = 'bar';
  let activeTab = 'histogram';

  // --- Affichage des retraits ---
  enableWithdrawal.addEventListener('change', () => {
    if (enableWithdrawal.checked) {
      withdrawalBody.classList.remove('hidden');
    } else {
      withdrawalBody.classList.add('hidden');
    }
    updateAll();
  });

  withdrawalType.addEventListener('change', () => {
    if (withdrawalType.value === 'fixed') {
      withdrawalAmountGroup.classList.remove('hidden');
      withdrawalRateGroup.classList.add('hidden');
    } else {
      withdrawalRateGroup.classList.remove('hidden');
      withdrawalAmountGroup.classList.add('hidden');
    }
    updateAll();
  });

  // --- Logique d'ajout/suppression des lignes de versement ---
  function updateDeleteButtons() {
    const lines = depositsContainer.querySelectorAll('.deposit-line');
    lines.forEach((line) => {
      const btn = line.querySelector('.btn-remove-deposit');
      if (lines.length > 1) {
        btn.classList.remove('hidden');
      } else {
        btn.classList.add('hidden');
      }
    });
  }

  btnAddDeposit.addEventListener('click', () => {
    const firstLine = depositsContainer.querySelector('.deposit-line');
    const newLine = firstLine.cloneNode(true);
    
    // Réinitialise légèrement la nouvelle ligne
    newLine.querySelector('.deposit-amount').value = 0;
    
    depositsContainer.appendChild(newLine);
    updateDeleteButtons();
    updateAll();
  });

  // Utilisation de la délégation d'événements pour les boutons de suppression
  depositsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-deposit')) {
      e.target.closest('.deposit-line').remove();
      updateDeleteButtons();
      updateAll();
    }
  });

  // Écoute des changements dans les inputs générés dynamiquement
  depositsContainer.addEventListener('input', updateAll);
  depositsContainer.addEventListener('change', updateAll);

  // --- Récupération des données ---
  function getFormValues() {
    const isWithdrawalActive = enableWithdrawal.checked;

    // Récupération de toutes les lignes de versements
    const depositLines = depositsContainer.querySelectorAll('.deposit-line');
    const deposits = Array.from(depositLines).map(line => {
      return {
        amount: parseFloat(line.querySelector('.deposit-amount').value) || 0,
        frequency: line.querySelector('.deposit-frequency').value,
        start: parseInt(line.querySelector('.deposit-start').value, 10) || 1,
        end: parseInt(line.querySelector('.deposit-end').value, 10) || 1
      };
    });

    return {
      initialCapital: parseFloat(document.getElementById('initialCapital').value) || 0,
      simulationDuration: parseInt(document.getElementById('simulationDuration').value, 10) || 1,
      annualReturnRate: parseFloat(document.getElementById('annualReturnRate').value) || 0,
      deposits: deposits,
      withdrawalType: withdrawalType.value,
      annualWithdrawalRate: isWithdrawalActive ? (parseFloat(document.getElementById('annualWithdrawalRate').value) || 0) : 0,
      annualWithdrawalAmount: isWithdrawalActive ? (parseFloat(document.getElementById('annualWithdrawalAmount').value) || 0) : 0,
      withdrawalStartYear: parseInt(document.getElementById('withdrawalStartYear').value, 10) || 1,
      applyTax: applyTaxCheckbox.checked
    };
  }

  function updateKpis(schedule) {
    if (!schedule.length) return;
    const lastRow = schedule[schedule.length - 1];
    
    document.getElementById('kpi-final-capital').textContent = formatCurrency(lastRow.endCapital);
    document.getElementById('kpi-total-invested').textContent = formatCurrency(lastRow.cumulativeInvested);
    document.getElementById('kpi-total-interest').textContent = formatCurrency(lastRow.cumulativeInterest);
  }

  function updateAll() {
    const params = getFormValues();
    const result = calculateCompoundInterest(params);
    
    currentSchedule = result.schedule;

    updateKpis(currentSchedule);
    renderChart(currentSchedule, currentChartType);
    renderTable(currentSchedule, params.applyTax);
  }

  // --- Gestion des onglets (Vues) ---
  function setActiveTab(tab) {
    activeTab = tab;
    const activeClass = 'px-3 py-1.5 rounded-lg bg-white shadow-sm text-teal-900 transition-all';
    const inactiveClass = 'px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 transition-all';

    btnViewHistogram.className = tab === 'histogram' ? activeClass : inactiveClass;
    btnViewLine.className = tab === 'line' ? activeClass : inactiveClass;
    btnViewTable.className = tab === 'table' ? activeClass : inactiveClass;

    if (tab === 'table') {
      chartContainer.classList.add('hidden');
      tableContainer.classList.remove('hidden');
      btnExportCsv.classList.remove('hidden');
    } else {
      tableContainer.classList.add('hidden');
      chartContainer.classList.remove('hidden');
      btnExportCsv.classList.add('hidden');
      
      currentChartType = (tab === 'line') ? 'line' : 'bar';
      renderChart(currentSchedule, currentChartType);
    }
  }

  btnViewHistogram.addEventListener('click', () => setActiveTab('histogram'));
  btnViewLine.addEventListener('click', () => setActiveTab('line'));
  btnViewTable.addEventListener('click', () => setActiveTab('table'));

  form.addEventListener('input', (e) => {
    // Évite de déclencher deux fois si l'input est dans depositsContainer (déjà écouté)
    if (!depositsContainer.contains(e.target)) updateAll();
  });
  form.addEventListener('change', (e) => {
    if (!depositsContainer.contains(e.target)) updateAll();
  });
  btnExportCsv.addEventListener('click', () => exportToCsv(currentSchedule, applyTaxCheckbox.checked));

  // Init
  updateDeleteButtons();
  updateAll();
});