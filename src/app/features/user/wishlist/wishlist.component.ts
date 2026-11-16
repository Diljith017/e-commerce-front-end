import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { selectWishlistItems } from '../../../store/wishlist/wishlist.selectors';

import { removeFromWishlist } from '../../../store/wishlist/wishlist.actions';

import { addToCart } from '../../../store/cart/cart.actions';

import { Product } from '../../../core/models/products.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {

  private store = inject(Store);

  wishlistItems$ = this.store.select(selectWishlistItems);

  removeProduct(productId: string): void {
    this.store.dispatch(
      removeFromWishlist({ productId })
    );
  }

  addProductToCart(product: Product): void {
    if (product.stock <= 0) return;

    this.store.dispatch(
      addToCart({ product })
    );
  }

  getProductId(id: string | number): string {
  return String(id);
}
}