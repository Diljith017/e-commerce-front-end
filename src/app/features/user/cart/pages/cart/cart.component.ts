import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { CartItem } from '../../../../../core/models/cart-item.model';
import { Coupon } from '../../../../../core/models/coupon.model';
import { CouponService } from '../../../../../core/services/coupon.service';

import {
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart
} from '../../../../../store/cart/cart.actions';

import {
  selectCartItems,
  selectCartItemCount,
  selectCartTotalPrice
} from '../../../../../store/cart/cart.selectors';

import { selectIsAuthenticated } from '../../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);
  private couponService = inject(CouponService);

  // CART OBSERVABLES

  cartItems$: Observable<CartItem[]> =
    this.store.select(selectCartItems);

  totalItems$: Observable<number> =
    this.store.select(selectCartItemCount);

  totalPrice$: Observable<number> =
    this.store.select(selectCartTotalPrice);

  isLoggedIn$ = this.store.select(selectIsAuthenticated);


  // COUPON DATA

  availableCoupons: Coupon[] = [];

  ngOnInit(): void {
    this.loadActiveCoupons();
  }

loadActiveCoupons(): void {

  console.log('Loading active coupons...');

  this.couponService.getActiveCoupons().subscribe({

    next: (coupons) => {

      console.log('Coupons received from API:', coupons);

      this.availableCoupons = coupons;

      console.log('Available coupons:', this.availableCoupons);

    },

    error: (error) => {

      console.error('Coupon API error:', error);

      this.availableCoupons = [];

    }

  });

}


  // CART ACTIONS

  increaseQuantity(productId: string): void {
    this.store.dispatch(increaseQuantity({ productId }));
  }

  decreaseQuantity(productId: string): void {
    this.store.dispatch(decreaseQuantity({ productId }));
  }


  // REMOVE ITEM MODAL

  showRemoveModal = false;
  selectedItemId: string | null = null;

  openRemoveModal(itemId: string): void {
    this.selectedItemId = itemId;
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.selectedItemId = null;
  }

  confirmRemove(): void {
    if (!this.selectedItemId) return;

    this.store.dispatch(
      removeFromCart({
        productId: this.selectedItemId
      })
    );

    this.closeRemoveModal();
  }


  // CLEAR CART MODAL

  showClearCartModal = false;

  openClearCartModal(): void {
    this.showClearCartModal = true;
  }

  closeClearCartModal(): void {
    this.showClearCartModal = false;
  }

  confirmClearCart(): void {
    this.store.dispatch(clearCart());
    this.removeCoupon();
    this.showClearCartModal = false;
  }


  // CHECKOUT NAVIGATION

  handleCheckout(): void {
  this.router.navigate(['/checkout'], {
    state: {
      couponCode: this.appliedCoupon,
      couponDiscount: this.couponDiscount
    }
  });
}

  handleLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/checkout' }
    });
  }


  // ORDER SUMMARY

  deliveryFee = 10;
  NFDiscount = 220;

  getDiscount(subtotal: number): number {
    return Math.min(this.NFDiscount, subtotal);
  }


  // COUPON SYSTEM

  couponCode = '';
  appliedCoupon = '';
  couponMessage = '';
  couponError = false;
  couponDiscount = 0;

  applyCoupon(subtotal: number): void {

    const code = this.couponCode.trim().toUpperCase();

    if (!code) {
      this.couponMessage = 'Please enter a coupon code.';
      this.couponError = true;
      return;
    }

    if (this.appliedCoupon) {
      this.couponMessage = 'Please remove the current coupon first.';
      this.couponError = true;
      return;
    }

    const coupon = this.availableCoupons.find(
      c => c.code.toUpperCase() === code
    );

    // Check coupon existence

    if (!coupon) {
      this.couponMessage = 'Invalid coupon code.';
      this.couponError = true;
      return;
    }

    // Check active status

    if (!coupon.isActive) {
      this.couponMessage = 'This coupon is currently inactive.';
      this.couponError = true;
      return;
    }

    // Check expiry date

    const today = new Date();

    const todayString =
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const expiryDate = coupon.expiryDate.substring(0, 10);

    if (expiryDate < todayString) {
      this.couponMessage = 'Sorry, this coupon has expired.';
      this.couponError = true;
      return;
    }

    // Check usage limit

    if (coupon.usedCount >= coupon.usageLimit) {
      this.couponMessage = 'This coupon usage limit has been reached.';
      this.couponError = true;
      return;
    }

    // Check minimum order amount

    if (subtotal < coupon.minOrderAmount) {
      this.couponMessage =
        `Minimum purchase of ₹${coupon.minOrderAmount} required.`;

      this.couponError = true;
      return;
    }

    // Calculate discount

    let discount = 0;

    if (coupon.discountType === 'percentage') {

      discount = subtotal * coupon.discountValue / 100;

      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discount = Math.min(discount, coupon.maxDiscount);
      }

    } else {

      discount = coupon.discountValue;

    }

    // Prevent discount exceeding subtotal

    this.couponDiscount = Math.min(discount, subtotal);

    this.appliedCoupon = coupon.code;

    this.couponMessage =
      `🎉 Coupon ${coupon.code} applied successfully! You saved ₹${this.couponDiscount.toFixed(2)}.`;

    this.couponError = false;
  }


  // REMOVE COUPON

  removeCoupon(): void {

    this.appliedCoupon = '';
    this.couponDiscount = 0;
    this.couponCode = '';

    this.couponMessage = 'Coupon removed.';
    this.couponError = false;

  }


  // FINAL PAYABLE AMOUNT

  calculatePayable(subtotal: number): number {

    return Math.max(
      0,
      subtotal +
      this.deliveryFee -
      this.getDiscount(subtotal) -
      this.couponDiscount
    );

  }

}