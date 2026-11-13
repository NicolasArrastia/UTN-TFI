export const PAYMENT_METHODS = ["cash", "transfer", "card", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SaleItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleInput {
  paymentMethod: PaymentMethod;
  items: SaleItemInput[];
}

export interface SaleItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface SaleResponse {
  id: number;
  number: number;
  userId: number;
  paymentMethod: PaymentMethod;
  total: string;
  status: "completed";
  createdAt: string;
  items: SaleItemResponse[];
}
