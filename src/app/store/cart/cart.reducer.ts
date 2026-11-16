import { createReducer, on } from '@ngrx/store';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  loadCartSuccess
} from './cart.actions';

import { CartItem } from '../../core/models/cart-item.model';

export const MAX_PRODUCT_QUANTITY = 5;
export const MAX_CART_PRODUCTS = 10;

export interface CartState {
  items: CartItem[];
}

export const initialCartState: CartState = {
  items: []
};

export const cartReducer = createReducer(
  initialCartState,

  // Add a product
  on(addToCart, (state, { product }) => {
    const existingItem = state.items.find(
      item => String(item.product.id) === String(product.id)
    );

    // Product already exists
    if (existingItem) {
      if (
        existingItem.quantity >= MAX_PRODUCT_QUANTITY ||
        existingItem.quantity >= product.stock
      ) {
        return state;
      }

      return {
        ...state,
        items: state.items.map(item =>
          String(item.product.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }

    // Maximum 10 different products
    if (state.items.length >= MAX_CART_PRODUCTS) {
      return state;
    }

    if (product.stock <= 0) {
      return state;
    }

    return {
      ...state,
      items: [
        ...state.items,
        { product, quantity: 1 }
      ]
    };
  }),

  // Increase quantity
  on(increaseQuantity, (state, { productId }) => ({
    ...state,
    items: state.items.map(item =>
      String(item.product.id) === String(productId) &&
      item.quantity < MAX_PRODUCT_QUANTITY &&
      item.quantity < item.product.stock
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
  })),

  // Decrease quantity
  on(decreaseQuantity, (state, { productId }) => ({
    ...state,
    items: state.items
      .map(item =>
        String(item.product.id) === String(productId)
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter(item => item.quantity > 0)
  })),

  // Remove product
  on(removeFromCart, (state, { productId }) => ({
    ...state,
    items: state.items.filter(
      item => String(item.product.id) !== String(productId)
    )
  })),

  // Clear cart
  on(clearCart, () => initialCartState),

  // Restore saved cart with limits
  on(loadCartSuccess, (state, { items }) => ({
    ...state,
    items: items
      .filter(item => item.product.stock > 0)
      .slice(0, MAX_CART_PRODUCTS)
      .map(item => ({
        ...item,
        quantity: Math.min(
          Math.max(1, item.quantity),
          MAX_PRODUCT_QUANTITY,
          item.product.stock
        )
      }))
  }))
);