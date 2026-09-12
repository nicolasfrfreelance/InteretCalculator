/**
 * Calcule l'évolution du capital année par année avec intérêts composés et retraits.
 * 
 * @param {Object} params
 * @param {number} params.initialCapital - Capital initial (€)
 * @param {number} params.monthlyDeposit - Versement mensuel (€)
 * @param {number} params.annualReturnRate - Rendement annuel (%)
 * @param {number} params.annualWithdrawalRate - Taux de retrait annuel (%)
 * @param {number} params.durationYears - Durée du placement (années)
 * @returns {Array<Object>} Données annuelles détaillées
 */
/**
 * Calcule l'évolution du capital avec intérêts composés, multi-versements et retraits.
 */
function calculateCompoundInterest({
  initialCapital,
  simulationDuration,
  annualReturnRate,
  deposits,
  withdrawalType,
  annualWithdrawalRate,
  annualWithdrawalAmount,
  withdrawalStartYear,
  applyTax
}) {
  const returnRate = annualReturnRate / 100;
  const schedule = [];
  
  let currentCapital = initialCapital;
  let cumulativeInvested = initialCapital;
  let cumulativeInterest = 0;
  let totalTaxPaid = 0;

  for (let year = 1; year <= simulationDuration; year++) {
    const startCapital = currentCapital;
    
    let regularDepositsThisYear = 0;
    let extraDepositsThisYear = 0;

    // Calcul de la somme de tous les versements pour l'année en cours
    for (const dep of deposits) {
      if (year >= dep.start && year <= dep.end) {
        if (dep.frequency === 'monthly') {
          regularDepositsThisYear += (dep.amount * 12);
        } else if (dep.frequency === 'annual') {
          regularDepositsThisYear += dep.amount;
        } else if (dep.frequency === 'once' && year === dep.start) {
          // Un versement unique ne compte que l'année de son démarrage
          extraDepositsThisYear += dep.amount;
        }
      }
    }

    const yearlyDeposits = regularDepositsThisYear + extraDepositsThisYear;
    cumulativeInvested += yearlyDeposits;

    const capitalBeforeInterest = startCapital + yearlyDeposits;
    const interestEarned = capitalBeforeInterest * returnRate;
    const capitalBeforeWithdrawal = capitalBeforeInterest + interestEarned;

    // --- Phase de Retrait ---
    let withdrawals = 0;
    if (year >= withdrawalStartYear) {
      if (withdrawalType === 'fixed') {
        withdrawals = Math.min(capitalBeforeWithdrawal, annualWithdrawalAmount);
      } else {
        withdrawals = capitalBeforeWithdrawal * (annualWithdrawalRate / 100);
      }
    }

    let taxOnWithdrawal = 0;
    let netWithdrawal = withdrawals;

    // --- Fiscalité et Prélèvement ---
    if (withdrawals > 0 && capitalBeforeWithdrawal > 0) {
      const totalGains = Math.max(0, capitalBeforeWithdrawal - cumulativeInvested);
      const gainRatio = Math.min(1, Math.max(0, totalGains / capitalBeforeWithdrawal));
      const taxableGain = withdrawals * gainRatio;

      taxOnWithdrawal = applyTax ? taxableGain * 0.30 : 0;
      netWithdrawal = withdrawals - taxOnWithdrawal;

      // On déduit la part de capital retirée du "Total Investi"
      const principalWithdrawn = withdrawals * (1 - gainRatio);
      cumulativeInvested = Math.max(0, cumulativeInvested - principalWithdrawn);
    }

    totalTaxPaid += taxOnWithdrawal;
    const endCapital = Math.max(0, capitalBeforeWithdrawal - withdrawals);
    cumulativeInterest += interestEarned;

    schedule.push({
      year,
      startCapital,
      yearlyDeposits,
      extraDeposit: extraDepositsThisYear,
      interestEarned,
      withdrawals,
      taxOnWithdrawal,
      netWithdrawal,
      endCapital,
      cumulativeInvested,
      cumulativeInterest,
      totalTaxPaid
    });

    currentCapital = endCapital;
  }

  // On renvoie juste schedule (calculatedMonthlyDeposit a été supprimé)
  return { schedule };
}