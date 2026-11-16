import { createReducer, on } from '@ngrx/store';
import { Product } from '../../core/models/products.model';

import {
  loadProducts,
  loadProductsSuccess,
  loadProductsFailure
} from './products.actions';

export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export const initialProductsState: ProductsState = {
  products: [],
  loading: false,
  error: null
};

export const productsReducer = createReducer(
  initialProductsState,

  on(loadProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),

  on(loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);