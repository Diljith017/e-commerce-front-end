import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/models/products.model';
import { CartItem } from '../../core/models/cart-item.model';

// Add a product to the cart
export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ product: Product }>()
);

// Increase product quantity
export const increaseQuantity = createAction(
  '[Cart] Increase Quantity',
  props<{ productId: string }>()
);

// Decrease product quantity
export const decreaseQuantity = createAction(
  '[Cart] Decrease Quantity',
  props<{ productId: string }>()
);

// Remove a product completely
export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: string }>()
);

// Clear the entire cart
export const clearCart = createAction(
  '[Cart] Clear Cart'
);

// Load previously saved cart data
export const loadCart = createAction(
  '[Cart] Load Cart'
);

// Restore cart data from localStorage
export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
props<{ items: CartItem[] }>()
);

// Save the cart to localStorage
export const saveCart = createAction(
  '[Cart] Save Cart'
);