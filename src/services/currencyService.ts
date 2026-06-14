// Static mock exchange rates against a base currency (e.g., USD or directly against TRY)
// For simplicity in Phase 1, we will mock direct conversion rates to TRY.
// E.g., 1 USD = 32.50 TRY, 1 EUR = 35.10 TRY, 1 GBP = 41.20 TRY

export const MOCK_RATES_TO_TRY: Record<string, number> = {
  USD: 32.50,
  EUR: 35.10,
  GBP: 41.20,
  TRY: 1.0,
};

class CurrencyService {
  private rates: Record<string, number> = MOCK_RATES_TO_TRY;

  /**
   * Converts an amount from one currency to another (currently hardcoded target 'TRY')
   */
  public convert(amount: number, fromCurrency: string, toCurrency: string = 'TRY'): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rateFrom = this.rates[fromCurrency] || 1.0;
    const rateTo = this.rates[toCurrency] || 1.0;

    // 1. Convert source to base (TRY)
    const amountInTRY = amount * rateFrom;

    // 2. Convert base (TRY) to target
    const finalAmount = amountInTRY / rateTo;

    return finalAmount;
  }

  /**
   * Refreshes the rates from an external API (to be implemented in future phases)
   */
  public async fetchRates(): Promise<void> {
    // Placeholder for API call
    // Currency rates fetched successfully
  }
}

export const currencyService = new CurrencyService();
