import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/models/products.model';

// Add product to wishlist
export const addToWishlist = createAction(
  '[Wishlist] Add To Wishlist',
  props<{ product: Product }>()
);

// Remove product from wishlist
export const removeFromWishlist = createAction(
  '[Wishlist] Remove From Wishlist',
  props<{ productId: string }>()
);

// Clear wishlist
export const clearWishlist = createAction(
  '[Wishlist] Clear Wishlist'
);

// Load saved wishlist
export const loadWishlist = createAction(
  '[Wishlist] Load Wishlist'
);

// Restore wishlist from localStorage
export const loadWishlistSuccess = createAction(
  '[Wishlist] Load Wishlist Success',
  props<{ items: Product[] }>()
);

// Save wishlist to localStorage
export const saveWishlist = createAction(
  '[Wishlist] Save Wishlist'
);