/**
 * Formate un nombre en devise Euros (ex: 12500 -> 12 500 €)
 */
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
});

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}