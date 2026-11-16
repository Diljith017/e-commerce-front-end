import { CartItem } from './cart-item.model';

export interface Customer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}


export interface Order {
  id?: string;
  userId: string;
  orderNumber?: number;
  customer: Customer;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  cancellationReason?: string;
  cancellationComment?: string;
  cancelledAt?: string;
  couponCode?: string;
couponDiscount?: number;
}