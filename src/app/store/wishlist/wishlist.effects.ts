import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';

import {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  loadWishlist,
  loadWishlistSuccess,
  saveWishlist
} from './wishlist.actions';

import { selectWishlistItems } from './wishlist.selectors';
import { selectCurrentUser } from '../auth/auth.selectors';

import { Product } from '../../core/models/products.model';
import { ToastService } from '../../core/services/toast.service';

import * as AuthActions from '../auth/auth.actions';

@Injectable()
export class WishlistEffects {

  private actions$ = inject(Actions);
  private store = inject(Store);
  private toast = inject(ToastService);

  // Get user-specific storage key
  private getWishlistKey(user: any): string {
    return user?.id
      ? `supplement-wishlist-${user.id}`
      : 'supplement-wishlist-guest';
  }

  // Load wishlist after login, logout or initial restoration
  loadWishlistOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.logout),
      map(() => loadWishlist())
    )
  );

  // Restore saved wishlist
  loadWishlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWishlist),
      withLatestFrom(this.store.select(selectCurrentUser)),
      map(([, user]) => {
        try {
          const key = this.getWishlistKey(user);
          const savedWishlist = localStorage.getItem(key);

          const items: Product[] = savedWishlist
            ? JSON.parse(savedWishlist)
            : [];

          return loadWishlistSuccess({ items });

        } catch (error) {
          console.error('Unable to load saved wishlist:', error);
          return loadWishlistSuccess({ items: [] });
        }
      })
    )
  );

  // Save updated wishlist
  saveWishlist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          addToWishlist,
          removeFromWishlist,
          clearWishlist
        ),
        withLatestFrom(
          this.store.select(selectWishlistItems),
          this.store.select(selectCurrentUser)
        ),
        tap(([, items, user]) => {
          const key = this.getWishlistKey(user);

          localStorage.setItem(
            key,
            JSON.stringify(items)
          );
        })
      ),
    { dispatch: false }
  );

  // Add notification
  addToWishlistToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(addToWishlist),
        tap(({ product }) => {
          this.toast.show(
            `${product.name} added to wishlist!`,
            'success'
          );
        })
      ),
    { dispatch: false }
  );

  // Remove notification
  removeFromWishlistToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(removeFromWishlist),
        tap(() => {
          this.toast.show(
            'Product removed from wishlist!',
            'success'
          );
        })
      ),
    { dispatch: false }
  );

  // Clear notification
  clearWishlistToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearWishlist),
        tap(() => {
          this.toast.show(
            'Wishlist cleared successfully!',
            'success'
          );
        })
      ),
    { dispatch: false }
  );

  // Manual persistence
  persistWishlist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(saveWishlist),
        withLatestFrom(
          this.store.select(selectWishlistItems),
          this.store.select(selectCurrentUser)
        ),
        tap(([, items, user]) => {
          const key = this.getWishlistKey(user);

          localStorage.setItem(
            key,
            JSON.stringify(items)
          );
        })
      ),
    { dispatch: false }
  );

}