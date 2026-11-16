import { ApplicationConfig, isDevMode } from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import { provideHttpClient } from '@angular/common/http';

import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';

import { cartReducer } from './store/cart/cart.reducer';
import { CartEffects } from './store/cart/cart.effects';


import { wishlistReducer } from './store/wishlist/wishlist.reducer';
import { WishlistEffects } from './store/wishlist/wishlist.effects';

import { productsReducer } from './store/products/products.reducer';
import { ProductsEffects } from './store/products/products.effects';

import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';

export const appConfig: ApplicationConfig = {
  providers: [

    // Router with scroll restoration
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),

    provideHttpClient(),

    // Register NgRx Store
    provideStore({
      cart: cartReducer,
      products: productsReducer,
      auth: authReducer,
      wishlist: wishlistReducer,
    }),

    // Register NgRx Effects
    provideEffects([CartEffects, ProductsEffects,AuthEffects,WishlistEffects,]),

    // Enable Redux DevTools during development
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    })
  ]
};