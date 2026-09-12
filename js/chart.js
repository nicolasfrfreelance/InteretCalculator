let chartInstance = null;

function renderChart(schedule, chartType = 'bar') {
  const ctx = document.getElementById('compound-chart').getContext('2d');
  
  const labels = schedule.map(item => `Année ${item.year}`);
  
  const investedData = [];
  const previousInterestData = [];
  const currentYearInterestData = [];
  const withdrawalData = [];

  schedule.forEach(item => {
    const endCap = item.endCapital;
    const totalInvested = item.cumulativeInvested;
    const yearInterest = item.interestEarned;

    const netInvested = Math.min(endCap, totalInvested);
    const netTotalInterest = Math.max(0, endCap - netInvested);
    const netCurrentInterest = Math.min(yearInterest, netTotalInterest);
    const netPreviousInterest = netTotalInterest - netCurrentInterest;

    investedData.push(netInvested);
    previousInterestData.push(netPreviousInterest);
    currentYearInterestData.push(netCurrentInterest);
    withdrawalData.push(-item.withdrawals);
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  const isLine = chartType === 'line';

  chartInstance = new Chart(ctx, {
    type: isLine ? 'line' : 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Capital Investi',
          data: investedData,
          backgroundColor: isLine ? 'rgba(100, 116, 139, 0.45)' : '#64748b',
          borderColor: '#64748b',
          borderWidth: isLine ? 2 : 1,
          fill: isLine,
          tension: 0.3,
          pointRadius: isLine ? 2 : 0,
        },
        {
          label: "Intérêts de l'Année",
          data: currentYearInterestData,
          backgroundColor: isLine ? 'rgba(5, 150, 105, 0.45)' : '#059669',
          borderColor: '#059669',
          borderWidth: isLine ? 2 : 1,
          fill: isLine,
          tension: 0.3,
          pointRadius: isLine ? 2 : 0,
        },
        {
          label: 'Intérêts Accumulés',
          data: previousInterestData,
          backgroundColor: isLine ? 'rgba(110, 231, 183, 0.45)' : '#6ee7b7',
          borderColor: '#6ee7b7',
          borderWidth: isLine ? 2 : 1,
          fill: isLine,
          tension: 0.3,
          pointRadius: isLine ? 2 : 0,
        },
        {
          label: 'Retraits',
          data: withdrawalData,
          backgroundColor: isLine ? 'rgba(239, 68, 68, 0.45)' : '#ef4444',
          borderColor: '#ef4444',
          borderWidth: isLine ? 2 : 1,
          fill: isLine,
          tension: 0.3,
          pointRadius: isLine ? 2 : 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      },
      plugins: {
        tooltip: {
          filter: (tooltipItem) => tooltipItem.raw !== 0,
          callbacks: {
            label: (context) => {
              const val = context.raw;
              if (context.dataset.label === 'Retraits') {
                return ` ${context.dataset.label} Brut : -${formatCurrency(Math.abs(val))}`;
              }
              return ` ${context.dataset.label} : ${formatCurrency(val)}`;
            },
            afterBody: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              const row = schedule[index];
              if (row.taxOnWithdrawal > 0) {
                return [
                  `   ├─ Impôt PFU (30%) : -${formatCurrency(row.taxOnWithdrawal)}`,
                  `   └─ Retrait Net perçu : ${formatCurrency(row.netWithdrawal)}`
                ];
              }
              return [];
            },
            footer: (tooltipItems) => {
              const totalCapital = tooltipItems
                .filter(item => item.raw > 0)
                .reduce((sum, item) => sum + item.raw, 0);

              return `\nCapital Final : ${formatCurrency(totalCapital)}`;
            }
          }
        }
      }
    }
  });
}