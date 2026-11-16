import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';

import { Product } from '../../../../../core/models/products.model';
import { ProductService } from '../../../../../core/services/product.service';

import { addToCart } from '../../../../../store/cart/cart.actions';
import { selectCartItems } from '../../../../../store/cart/cart.selectors';

import {
  addToWishlist,
  removeFromWishlist
} from '../../../../../store/wishlist/wishlist.actions';

import {
  selectIsInWishlist
} from '../../../../../store/wishlist/wishlist.selectors';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetails implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private store = inject(Store);

  private destroy$ = new Subject<void>();

  product: Product | null = null;
  similarProducts: Product[] = [];

  loading = true;
  errorMessage = '';

  isInCart = false;
  isInWishlist = false;

  ngOnInit(): void {

    // Listen for product ID changes
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {

        const id = params.get('id');

        if (!id) {
          this.errorMessage = 'Product ID not found.';
          this.loading = false;
          return;
        }

        this.loadProduct(id);
      });

    // Monitor cart status
    this.store.select(selectCartItems)
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {

        this.isInCart = items.some(
          item =>
            String(item.product.id) === String(this.product?.id)
        );

      });

  }

  // Load selected product
  loadProduct(id: string): void {

    this.loading = true;
    this.errorMessage = '';
    this.similarProducts = [];
    this.product = null;
    this.isInCart = false;
    this.isInWishlist = false;

    this.productService.getProductById(id).subscribe({

      next: product => {

        this.product = product;
        this.loading = false;

        // Monitor wishlist status for selected product
        this.store.select(selectIsInWishlist(String(product.id)))
          .pipe(takeUntil(this.destroy$))
          .subscribe(isInWishlist => {
            this.isInWishlist = isInWishlist;
          });

        this.loadSimilarProducts(product);

      },

      error: error => {

        console.error('Failed to load product:', error);

        this.errorMessage = 'Unable to load product details.';
        this.loading = false;

      }

    });

  }

  // Load similar products based on category
  loadSimilarProducts(currentProduct: Product): void {

    this.productService.getProducts().subscribe({

      next: products => {

        this.similarProducts = products
          .filter(product =>
            String(product.id) !== String(currentProduct.id) &&
            product.category?.toLowerCase().trim() ===
            currentProduct.category?.toLowerCase().trim()
          )
          .slice(0, 4);

      },

      error: error => {

        console.error('Failed to load similar products:', error);

        this.similarProducts = [];

      }

    });

  }

  // Add to cart
  handleCartClick(): void {

    if (!this.product) {
      return;
    }

    if (this.isInCart) {
      this.router.navigate(['/cart']);
      return;
    }

    if (this.product.stock <= 0) {
      return;
    }

    this.store.dispatch(
      addToCart({ product: this.product })
    );

  }

  // Buy now
  buyNow(): void {

    if (!this.product || this.product.stock <= 0) {
      return;
    }

    if (!this.isInCart) {
      this.store.dispatch(
        addToCart({ product: this.product })
      );
    }

    this.router.navigate(['/checkout']);

  }

  // Toggle wishlist
  toggleWishlist(): void {

    if (!this.product) {
      return;
    }

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