import { createReducer, on } from '@ngrx/store';

import {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  loadWishlistSuccess
} from './wishlist.actions';

import { Product } from '../../core/models/products.model';

export interface WishlistState {
  items: Product[];
}

export const initialWishlistState: WishlistState = {
  items: []
};

export const wishlistReducer = createReducer(
  initialWishlistState,

  // Add product
  on(addToWishlist, (state, { product }) => {

    const alreadyExists = state.items.some(
      item => String(item.id) === String(product.id)
    );

    if (alreadyExists) {
      return state;
    }

    return {
      ...state,
      items: [...state.items, product]
    };
  }),

  // Remove product
  on(removeFromWishlist, (state, { productId }) => ({
    ...state,
    items: state.items.filter(
      item => String(item.id) !== String(productId)
    )
  })),

  // Clear wishlist
  on(clearWishlist, () => initialWishlistState),

  // Restore wishlist
  on(loadWishlistSuccess, (state, { items }) => ({
    ...state,
    items
  }))
);