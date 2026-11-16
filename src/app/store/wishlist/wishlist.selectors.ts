import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { WishlistState } from './wishlist.reducer';

export const selectWishlistState =
  createFeatureSelector<WishlistState>('wishlist');

// Get wishlist products
export const selectWishlistItems = createSelector(
  selectWishlistState,
  state => state.items
);

// Get wishlist count
export const selectWishlistCount = createSelector(
  selectWishlistItems,
  items => items.length
);

// Check whether a product is in wishlist
export const selectIsInWishlist = (productId: string) =>
  createSelector(
    selectWishlistItems,
    items =>
      items.some(
        item => String(item.id) === String(productId)
      )
  );