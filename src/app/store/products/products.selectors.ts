import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { ProductsState } from './products.reducer';

// Select the complete products state
export const selectProductsState =
  createFeatureSelector<ProductsState>('products');

// Select products
export const selectAllProducts = createSelector(
  selectProductsState,
  state => state.products
);

// Select loading status
export const selectProductsLoading = createSelector(
  selectProductsState,
  state => state.loading
);

// Select error message
export const selectProductsError = createSelector(
  selectProductsState,
  state => state.error
);