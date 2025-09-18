// 手数料計算ユーティリティ
export interface FeeCalculation {
  buyersPremium: number;
  documentationFee: number;
  totalFees: number;
  totalWithFees: number;
}

export function calculateFees(bidAmount: number): FeeCalculation {
  // 買い手手数料（階段方式）
  let buyersPremium = 0;
  
  if (bidAmount <= 250000) {
    // 25万円以下：10%
    buyersPremium = bidAmount * 0.10;
  } else if (bidAmount <= 1000000) {
    // 25万円超100万円以下：25万円までは10% + 超過分は5%
    buyersPremium = 250000 * 0.10 + (bidAmount - 250000) * 0.05;
  } else {
    // 100万円超：25万円まで10% + 75万円まで5% + 超過分は2%
    buyersPremium = 250000 * 0.10 + 750000 * 0.05 + (bidAmount - 1000000) * 0.02;
  }
  
  // 書類手数料（固定）
  const documentationFee = 5000;
  
  const totalFees = buyersPremium + documentationFee;
  const totalWithFees = bidAmount + totalFees;
  
  return {
    buyersPremium,
    documentationFee,
    totalFees,
    totalWithFees
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount);
}