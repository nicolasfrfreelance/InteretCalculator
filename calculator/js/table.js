function renderTable(schedule, applyTax = false) {
  const tbody = document.getElementById('schedule-table-body');
  const thead = document.querySelector('#table-container thead tr');
  
  thead.innerHTML = `
    <th class="py-2 px-3">Année</th>
    <th class="py-2 px-3">Début</th>
    <th class="py-2 px-3">Versements</th>
    <th class="py-2 px-3">Intérêts</th>
    <th class="py-2 px-3">Retrait Brut</th>
    ${applyTax ? '<th class="py-2 px-3 text-rose-600">Impôt (30 %)</th><th class="py-2 px-3 text-emerald-700">Retrait Net</th>' : ''}
    <th class="py-2 px-3">Capital Fin</th>
  `;

  tbody.innerHTML = '';

  schedule.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 border-b border-slate-100 text-xs';

    const depositCell = row.extraDeposit > 0 
      ? `${formatCurrency(row.yearlyDeposits - row.extraDeposit)} <span class="ml-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">+${formatCurrency(row.extraDeposit)}</span>`
      : formatCurrency(row.yearlyDeposits);

    tr.innerHTML = `
      <td class="py-2 px-3 font-medium">${row.year}</td>
      <td class="py-2 px-3">${formatCurrency(row.startCapital)}</td>
      <td class="py-2 px-3">${depositCell}</td>
      <td class="py-2 px-3 text-emerald-600 font-medium">+${formatCurrency(row.interestEarned)}</td>
      <td class="py-2 px-3 text-rose-500">${row.withdrawals > 0 ? '-' + formatCurrency(row.withdrawals) : '0 €'}</td>
      ${applyTax ? `
        <td class="py-2 px-3 text-rose-600">${row.taxOnWithdrawal > 0 ? '-' + formatCurrency(row.taxOnWithdrawal) : '0 €'}</td>
        <td class="py-2 px-3 font-semibold text-emerald-700">${row.netWithdrawal > 0 ? formatCurrency(row.netWithdrawal) : '0 €'}</td>
      ` : ''}
      <td class="py-2 px-3 font-semibold">${formatCurrency(row.endCapital)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportToCsv(schedule, applyTax = false) {
  const headers = ['Annee', 'Capital Debut', 'Versements', 'Apport Exceptionnel', 'Interets Gagnes', 'Retrait Brut'];
  if (applyTax) {
    headers.push('Impot PFU 30%', 'Retrait Net');
  }
  headers.push('Capital Fin');

  const rows = schedule.map(r => {
    const row = [
      r.year,
      r.startCapital.toFixed(2),
      (r.yearlyDeposits - r.extraDeposit).toFixed(2),
      r.extraDeposit.toFixed(2),
      r.interestEarned.toFixed(2),
      r.withdrawals.toFixed(2)
    ];
    if (applyTax) {
      row.push(r.taxOnWithdrawal.toFixed(2), r.netWithdrawal.toFixed(2));
    }
    row.push(r.endCapital.toFixed(2));
    return row;
  });

  const csvContent = 'data:text/csv;charset=utf-8,' 
    + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'projection_interets_composes.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}