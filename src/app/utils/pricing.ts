interface IPricingResult {
  originalAmount: number;
  discountPercent: number;
  discountAmount: number;
  payableAmount: number;
  commission: number;
}

// ─── Calculate Final Payable Amount (Student Discount সহ) ────────────────────
export const calculatePricing = (
  rentAmount: number,
  discountPercent: number = 0,
): IPricingResult => {
  const discountAmount = parseFloat(((rentAmount * discountPercent) / 100).toFixed(2));
  const payableAmount = parseFloat((rentAmount - discountAmount).toFixed(2));
  const commission = parseFloat((payableAmount * 0.1).toFixed(2)); // 10% commission payable amount এর উপর

  return {
    originalAmount: rentAmount,
    discountPercent,
    discountAmount,
    payableAmount,
    commission,
  };
};

// ─── Split Into Half-Monthly Installments (Commission সহ) ─────────────────────
export const calculateInstallments = (payableAmount: number, totalCommission: number = 0) => {
  const half = parseFloat((payableAmount / 2).toFixed(2));
  const secondHalf = parseFloat((payableAmount - half).toFixed(2));

  const commissionHalf = parseFloat((totalCommission / 2).toFixed(2));
  const commissionSecondHalf = parseFloat((totalCommission - commissionHalf).toFixed(2));

  const now = new Date();
  const secondDueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  return [
    { installmentNo: 1, amount: half, commission: commissionHalf, dueDate: now },
    { installmentNo: 2, amount: secondHalf, commission: commissionSecondHalf, dueDate: secondDueDate },
  ];
};

// ─── Gender Match Check ────────────────────────────────────────────────────────
export const isGenderAllowed = (
  genderPreference: 'BOYS' | 'GIRLS' | 'ANYONE',
  userGender: 'MALE' | 'FEMALE' | 'OTHER' | null | undefined,
): boolean => {
  if (genderPreference === 'ANYONE') return true;
  if (!userGender) return false; // gender set করা না থাকলে restricted listing এ booking দিতে পারবে না

  if (genderPreference === 'BOYS') return userGender === 'MALE';
  if (genderPreference === 'GIRLS') return userGender === 'FEMALE';

  return false;
};