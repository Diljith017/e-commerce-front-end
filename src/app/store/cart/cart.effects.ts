import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  loadCart,
  loadCartSuccess,
  saveCart
} from './cart.actions';

import { selectCartItems } from './cart.selectors';
import { selectCurrentUser } from '../auth/auth.selectors';

import { CartItem } from '../../core/models/cart-item.model';
import { ToastService } from '../../core/services/toast.service';

import * as AuthActions from '../auth/auth.actions';

@Injectable()
export class CartEffects {

  private actions$ = inject(Actions);
  private store = inject(Store);
  private toast = inject(ToastService);

  // Get user-specific storage key
  private getCartKey(user: any): string {
    return user?.id
      ? `supplement-cart-${user.id}`
      : 'supplement-cart-guest';
  }

  // Load cart after login, logout or initial restoration
  loadCartOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.logout),
      map(() => loadCart())
    )
  );

  // Restore saved cart
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCart),
      withLatestFrom(this.store.select(selectCurrentUser)),
      map(([, user]) => {
        try {
          const key = this.getCartKey(user);
          const savedCart = localStorage.getItem(key);

          const items: CartItem[] = savedCart
            ? JSON.parse(savedCart)
            : [];

          return loadCartSuccess({ items });

        } catch (error) {
          console.error('Unable to load saved cart:', error);
          return loadCartSuccess({ items: [] });
        }
      })
    )
  );

  // Save updated cart
  saveCart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          addToCart,
          increaseQuantity,
          decreaseQuantity,
          removeFromCart,
          clearCart
        ),
        withLatestFrom(
          this.store.select(selectCartItems),
          this.store.select(selectCurrentUser)
        ),
        tap(([, items, user]) => {
          try {
            const key = this.getCartKey(user);

            localStorage.setItem(
              key,
              JSON.stringify(items)
            );

          } catch (error) {
            console.error('Unable to save cart:', error);
          }
        })
      ),
    { dispatch: false }
  );

  // Add product notification
  addToCartToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(addToCart),
        withLatestFrom(this.store.select(selectCartItems)),
        tap(([{ product }, items]) => {

          const existingItem = items.find(
            item => String(item.product.id) === String(product.id)
          );

          if (!existingItem && items.length >= 10) {
            this.toast.show(
              'Cart limit reached! Maximum 10 different products allowed.',
              'warning'
            );
            return;
          }

          if (existingItem && existingItem.quantity >= 5) {
            this.toast.show(
              'Maximum quantity of 5 reached!',
              'warning'
            );
            return;
          }

          if (existingItem && existingItem.quantity >= product.stock) {
            this.toast.show(
              'Available stock limit reached!',
              'warning'
            );
            return;
          }

          this.toast.show(
            `${product.name} added to cart!`,
            'success'
          );

        })
      ),
    { dispatch: false }
  );

  // Remove notification
  removeFromCartToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(removeFromCart),
        tap(() => {
          this.toast.show('Product removed from cart!', 'success');
        })
      ),
    { dispatch: false }
  );

  // Increase notification
  increaseQuantityToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(increaseQuantity),
        tap(() => {
          this.toast.show('Quantity updated!', 'success');
        })
      ),
    { dispatch: false }
  );

  // Decrease notification
  decreaseQuantityToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(decreaseQuantity),
        tap(() => {
          this.toast.show('Quantity updated!', 'success');
        })
      ),
    { dispatch: false }
  );

  // Clear notification
  clearCartToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearCart),
        tap(() => {
          this.toast.show('Cart cleared successfully!', 'success');
        })
      ),
    { dispatch: false }
  );

  // Manual persistence
  persistCart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(saveCart),
        withLatestFrom(
          this.store.select(selectCartItems),
          this.store.select(selectCurrentUser)
        ),
        tap(([, items, user]) => {
          const key = this.getCartKey(user);

          localStorage.setItem(key, JSON.stringify(items));
        })
      ),
    { dispatch: false }
  );

}