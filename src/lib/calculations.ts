export interface PaymentRoute {
  name: string;
  sendAmount: number;
  exchangeRate: number;
  providerFee: number;
  networkFee: number;
  payoutFee: number;
}

export interface PaymentResult {
  routeName: string;
  sendAmount: number;
  exchangeRate: number;
  providerFee: number;
  networkFee: number;
  payoutFee: number;
  convertedAmount: number;
  recipientReceives: number;
  totalCost: number;
}

export function calculatePayment(route: PaymentRoute): PaymentResult {
  const {
    name,
    sendAmount,
    exchangeRate,
    providerFee,
    networkFee,
    payoutFee,
  } = route;

  const values = [
    sendAmount,
    exchangeRate,
    providerFee,
    networkFee,
    payoutFee,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error("All payment values must be valid numbers.");
  }

  if (sendAmount <= 0 || exchangeRate <= 0) {
    throw new Error("Amount and exchange rate must be greater than zero.");
  }

  if (providerFee < 0 || networkFee < 0 || payoutFee < 0) {
    throw new Error("Fees cannot be negative.");
  }

  if (providerFee + networkFee >= sendAmount) {
    throw new Error("Sender fees cannot equal or exceed the amount sent.");
  }

  const convertedAmount =
    (sendAmount - providerFee - networkFee) * exchangeRate;

  const recipientReceives = convertedAmount - payoutFee;

  if (recipientReceives < 0) {
    throw new Error("Payout fee exceeds the converted amount.");
  }

  return {
    routeName: name,
    sendAmount,
    exchangeRate,
    providerFee,
    networkFee,
    payoutFee,
    convertedAmount,
    recipientReceives,
    totalCost: sendAmount * exchangeRate - recipientReceives,
  };
}

export function comparePayments(
  fiatRoute: PaymentRoute,
  stablecoinRoute: PaymentRoute
) {
  if (fiatRoute.sendAmount !== stablecoinRoute.sendAmount) {
    throw new Error("Both routes must use the same sending amount.");
  }

  const fiat = calculatePayment(fiatRoute);
  const stablecoin = calculatePayment(stablecoinRoute);

  const difference =
    stablecoin.recipientReceives - fiat.recipientReceives;

  return {
    fiat,
    stablecoin,
    difference: Math.abs(difference),
    cheaperRoute:
      difference > 0
        ? stablecoin.routeName
        : difference < 0
          ? fiat.routeName
          : "Both routes are equal",
    stablecoinIsCheaper: difference < 0,
  };
}