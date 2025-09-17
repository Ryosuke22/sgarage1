export function calcFees(price: number) {
  // Simple example: buyer fee 5% capped at $5,000, tax 10%
  const buyerFee = Math.min(price * 0.05, 5000);
  const tax = (price + buyerFee) * 0.1;
  const shippingEstimate = null; // integrate with your shipping partner
  const total = price + buyerFee + tax + (shippingEstimate || 0);
  return { buyerFee, tax, shippingEstimate, total };
}
