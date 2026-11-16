import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/models/products.model';

// Load products
export const loadProducts = createAction(
  '[Products] Load Products'
);

// Load products successfully
export const loadProductsSuccess = createAction(
  '[Products] Load Products Success',
  props<{ products: Product[] }>()
);

// Load products failed
export const loadProductsFailure = createAction(
  '[Products] Load Products Failure',
  props<{ error: string }>()
);