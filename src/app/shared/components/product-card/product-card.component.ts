import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';

import { Product } from '../../../core/models/products.model';

// Cart
import { addToCart } from '../../../store/cart/cart.actions';
import { selectCartItems } from '../../../store/cart/cart.selectors';

// Wishlist
import {
  addToWishlist,
  removeFromWishlist
} from '../../../store/wishlist/wishlist.actions';

import {
  selectIsInWishlist
} from '../../../store/wishlist/wishlist.selectors';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCard implements OnInit, OnDestroy {

  @Input({ required: true }) product!: Product;

  isInCart = false;
  isInWishlist = false;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Check whether product is in Cart
    this.store.select(selectCartItems)
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.isInCart = items.some(
          item => String(item.product.id) === String(this.product.id)
        );
      });

    // Check whether product is in Wishlist
    this.store.select(selectIsInWishlist(String(this.product.id)))
      .pipe(takeUntil(this.destroy$))
      .subscribe(isInWishlist => {
        this.isInWishlist = isInWishlist;
      });

  }

  // Cart button
  handleCartClick(): void {
    if (this.isInCart) {
      this.router.navigate(['/cart']);
    } else {
      this.store.dispatch(addToCart({ product: this.product }));
    }
  }

  // Buy Now
  buyNow(): void {
    if (this.product.stock <= 0) return;

    if (!this.isInCart) {
      this.store.dispatch(addToCart({ product: this.product }));
    }

    this.router.navigate(['/checkout']);
  }

  // Wishlist button
  toggleWishlist(): void {

    if (this.isInWishlist) {
      this.store.dispatch(
        removeFromWishlist({
          productId: String(this.product.id)
        })
      );
    } else {
      this.store.dispatch(
        addToWishlist({
          product: this.product
        })
      );
    }

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}