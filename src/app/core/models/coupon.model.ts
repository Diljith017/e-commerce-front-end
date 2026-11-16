export interface Coupon {
  id?: string;
  code: string;
  description: string;

  discountType: 'percentage' | 'fixed';
  discountValue: number;

  minOrderAmount: number;
  maxDiscount?: number;

  expiryDate: string;

  usageLimit: number;
  usedCount: number;

  isActive: boolean;
  createdAt: string;
}