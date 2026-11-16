import {
  Component,
  inject,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Store } from '@ngrx/store';

import {
  Observable,
  take
} from 'rxjs';

import { Actions, ofType } from '@ngrx/effects';

import { CartItem } from '../../../core/models/cart-item.model';

import { SavedAddress } from '../../../core/models/user.model';

import { clearCart } from '../../../store/cart/cart.actions';

import {
  selectCartItems,
  selectCartTotalPrice,
  selectCartItemCount
} from '../../../store/cart/cart.selectors';

import { OrderService } from '../../../core/services/order.service';

import { Order } from '../../../core/models/order.model';

import { selectCurrentUser } from '../../../store/auth/auth.selectors';

import * as AuthActions from '../../../store/auth/auth.actions';

import { Coupon } from '../../../core/models/coupon.model';

import { CouponService } from '../../../core/services/coupon.service';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {

  private store = inject(Store);

  private orderService = inject(OrderService);

  private couponService = inject(CouponService);

  private router = inject(Router);

  private actions$ = inject(Actions);


  @ViewChild('checkoutForm')
  checkoutForm!: NgForm;


  // ==========================================
  // CART DATA
  // ==========================================

  cartItems$: Observable<CartItem[]> =
    this.store.select(selectCartItems);

  totalPrice$: Observable<number> =
    this.store.select(selectCartTotalPrice);

  totalItems$: Observable<number> =
    this.store.select(selectCartItemCount);


  // ==========================================
  // COUPON DETAILS
  // ==========================================

  appliedCoupon = '';

  couponDiscount = 0;

  private validatedCoupon: Coupon | null = null;

  private validatingCoupon = false;


  // ==========================================
  // PRICE DETAILS
  // ==========================================

  deliveryFee = 10;

  NFDiscount = 220;


  getDiscount(subtotal: number): number {
    return Math.min(this.NFDiscount, subtotal);
  }


  calculatePayable(subtotal: number): number {

    return Math.max(
      0,
      subtotal +
      this.deliveryFee -
      this.getDiscount(subtotal) -
      this.couponDiscount
    );

  }


  // ==========================================
  // COUPON VALIDATION
  // ==========================================

  validateAppliedCoupon(
    subtotal: number,
    items: CartItem[]
  ): void {

    this.validatedCoupon = null;

    this.couponDiscount = 0;

    if (!this.appliedCoupon.trim()) {

      this.continuePlaceOrder(subtotal, items);

      return;

    }

    this.validatingCoupon = true;

    this.couponService.getCoupons()
      .pipe(take(1))
      .subscribe({

        next: coupons => {

          this.validatingCoupon = false;

          const code = this.appliedCoupon.trim().toUpperCase();

          const coupon = coupons.find(
            c => c.code.toUpperCase() === code
          );


          if (!coupon) {

            this.errorMessage = 'Coupon is no longer available.';

            return;

          }


          if (!coupon.isActive) {

            this.errorMessage = 'This coupon is inactive.';

            return;

          }


          // CHECK COUPON EXPIRY

          const now = new Date();

          const today =
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          if (coupon.expiryDate.slice(0, 10) < today) {

            this.errorMessage = 'This coupon has expired.';

            return;

          }


          // CHECK USAGE LIMIT

          if (coupon.usedCount >= coupon.usageLimit) {

            this.errorMessage =
              'Coupon usage limit has been reached.';

            return;

          }


          // CHECK MINIMUM ORDER AMOUNT

          if (subtotal < coupon.minOrderAmount) {

            this.errorMessage =
              `Minimum order amount is ₹${coupon.minOrderAmount}.`;

            return;

          }


          // CALCULATE DISCOUNT

          let discount =
            coupon.discountType === 'percentage'
              ? subtotal * coupon.discountValue / 100
              : coupon.discountValue;


          // APPLY MAXIMUM DISCOUNT

          if (
            coupon.discountType === 'percentage' &&
            coupon.maxDiscount !== undefined &&
            coupon.maxDiscount > 0
          ) {

            discount = Math.min(
              discount,
              coupon.maxDiscount
            );

          }


          // FINAL DISCOUNT

          this.couponDiscount = Math.max(
            0,
            Math.min(discount, subtotal)
          );

          this.appliedCoupon = coupon.code;

          this.validatedCoupon = coupon;


          // CONTINUE ORDER

          this.continuePlaceOrder(subtotal, items);

        },


        error: () => {

          this.validatingCoupon = false;

          this.errorMessage =
            'Unable to validate coupon. Please try again.';

        }

      });

  }


  // ==========================================
  // CUSTOMER DETAILS
  // ==========================================

  customer = {

    fullName: '',

    email: '',

    phone: '',

    address: '',

    city: '',

    state: 'Kerala',

    pincode: ''

  };


  // ==========================================
  // PAYMENT DETAILS
  // ==========================================

  onlinePaymentMethod: string = 'upi';

  paymentMethod: string = 'cod';


  // ==========================================
  // ORDER STATUS
  // ==========================================

  submitting = false;

  errorMessage = '';


  // ==========================================
  // ADDRESS MANAGEMENT
  // ==========================================

  addresses: SavedAddress[] = [];

  selectedAddressId = '';

  addressMode: 'view' | 'select' | 'add' = 'view';

  newAddressLabel: 'HOME' | 'WORK' | 'OTHER' = 'HOME';

  addressSaving = false;

  addressError = '';

  addressSuccess = '';


  // ==========================================
  // TOAST NOTIFICATION
  // ==========================================

  toastMessage = '';

  toastType: 'success' | 'error' = 'success';

  private toastTimer: ReturnType<typeof setTimeout> | undefined;


  showToast(
    message: string,
    type: 'success' | 'error' = 'success'
  ): void {

    this.toastMessage = message;

    this.toastType = type;

    if (this.toastTimer) {

      clearTimeout(this.toastTimer);

    }

    this.toastTimer = setTimeout(() => {

      this.toastMessage = '';

    }, 3000);

  }


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {

    this.appliedCoupon = history.state?.couponCode || '';

    this.couponDiscount = history.state?.couponDiscount || 0;

    this.loadSavedAddress();

  }


  // ==========================================
  // LOAD SAVED ADDRESSES
  // ==========================================

  loadSavedAddress(): void {

    this.store.select(selectCurrentUser)
      .pipe(take(1))
      .subscribe(user => {

        if (!user) {

          return;

        }

        this.addresses = user.addresses ?? [];


        // --------------------------------------
        // MIGRATE OLD SINGLE ADDRESS
        // --------------------------------------

        if (
          this.addresses.length === 0 &&
          user.address &&
          user.phone &&
          user.city &&
          user.pincode
        ) {

          const oldAddress: SavedAddress = {

            id: Date.now().toString(),

            label: 'HOME',

            fullName: user.name,

            email: user.email,

            phone: user.phone ?? '',

            address: user.address ?? '',

            city: user.city ?? '',

            state: user.state ?? 'Kerala',

            pincode: user.pincode ?? '',

            isDefault: true

          };

          this.addresses = [oldAddress];

        }


        // --------------------------------------
        // SELECT DEFAULT ADDRESS
        // --------------------------------------

        if (this.addresses.length > 0) {

          const defaultAddress =
            this.addresses.find(address => address.isDefault)
            ?? this.addresses[0];

          this.selectAddress(defaultAddress);

        } else {

          this.addressMode = 'add';

          this.customer.fullName = user.name ?? '';

          this.customer.email = user.email ?? '';

          this.customer.phone = user.phone ?? '';

        }

      });

  }


  // ==========================================
  // SELECT ADDRESS
  // ==========================================

  selectAddress(
    address: SavedAddress,
    showNotification = false
  ): void {

    this.selectedAddressId = address.id;

    this.customer = {

      fullName: address.fullName,

      email: address.email,

      phone: address.phone,

      address: address.address,

      city: address.city,

      state: address.state,

      pincode: address.pincode

    };

    this.addressMode = 'view';

    this.addressError = '';

    this.addressSuccess = '';

    if (showNotification) {

      this.showToast(
        'Delivery address changed successfully!',
        'success'
      );

    }

  }


  // ==========================================
  // CHANGE ADDRESS
  // ==========================================

  changeAddress(): void {

    this.addressMode = 'select';

    this.addressError = '';

    this.addressSuccess = '';

  }


  // ==========================================
  // ADD NEW ADDRESS
  // ==========================================

  addNewAddress(): void {

    this.newAddressLabel = 'HOME';

    this.customer = {

      fullName: '',

      email: '',

      phone: '',

      address: '',

      city: '',

      state: 'Kerala',

      pincode: ''

    };

    this.selectedAddressId = '';

    this.addressMode = 'add';

    this.addressError = '';

    this.addressSuccess = '';

  }


  // ==========================================
  // SAVE NEW ADDRESS TO PROFILE
  // ==========================================

  saveNewAddress(): void {

    if (!this.checkoutForm || this.checkoutForm.invalid) {

      this.checkoutForm?.control.markAllAsTouched();

      return;

    }

    if (this.addressSaving) {

      return;

    }

    this.store.select(selectCurrentUser)
      .pipe(take(1))
      .subscribe(user => {

        if (!user?.id) {

          this.addressError =
            'Please log in to save your address.';

          return;

        }


        // --------------------------------------
        // CREATE NEW ADDRESS
        // --------------------------------------

        const newAddress: SavedAddress = {

          id: 'addr_' + Date.now(),

          label: this.newAddressLabel,

          fullName: this.customer.fullName.trim(),

          email: this.customer.email.trim().toLowerCase(),

          phone: this.customer.phone.trim(),

          address: this.customer.address.trim(),

          city: this.customer.city.trim(),

          state: this.customer.state.trim(),

          pincode: this.customer.pincode.trim(),

          // First address becomes default.
          // If no default exists, new address becomes default.

          isDefault: !this.addresses.some(
            address => address.isDefault
          )

        };


        const updatedAddresses = [

          ...this.addresses,

          newAddress

        ];


        this.addressSaving = true;

        this.addressError = '';

        this.addressSuccess = '';


        // --------------------------------------
        // LISTEN FOR PROFILE UPDATE RESULT
        // --------------------------------------

        this.actions$
          .pipe(
            ofType(
              AuthActions.updateProfileSuccess,
              AuthActions.updateProfileFailure
            ),
            take(1)
          )
          .subscribe(result => {

            this.addressSaving = false;

            if (
              result.type === AuthActions.updateProfileSuccess.type
            ) {

              this.addresses = updatedAddresses;

              this.selectAddress(newAddress);

              this.addressSuccess =
                'Address saved successfully!';

              this.showToast(
                'Address saved successfully!',
                'success'
              );

            } else {

              this.addressError =
                'Unable to save address. Please try again.';

              this.showToast(
                'Unable to save address. Please try again.',
                'error'
              );

            }

          });


        // --------------------------------------
        // DISPATCH PROFILE UPDATE
        // --------------------------------------

        this.store.dispatch(

          AuthActions.updateProfile({

            id: user.id,

            user: {

              addresses: updatedAddresses

            }

          })

        );

      });

  }


  // ==========================================
  // PLACE ORDER
  // ==========================================

  placeOrder(): void {

    if (this.submitting || this.validatingCoupon) {

      return;

    }

    this.errorMessage = '';


    // --------------------------------------
    // VALIDATE NEW ADDRESS
    // --------------------------------------

    if (
      this.addressMode === 'add' &&
      (!this.checkoutForm || this.checkoutForm.invalid)
    ) {

      this.checkoutForm?.control.markAllAsTouched();

      setTimeout(() => {

        const firstInvalid =
          document.querySelector(
            '.checkout-form .ng-invalid:not(form)'
          ) as HTMLElement | null;

        firstInvalid?.focus();

        firstInvalid?.scrollIntoView({

          behavior: 'smooth',

          block: 'center'

        });

      });

      return;

    }


    // --------------------------------------
    // ENSURE ADDRESS IS SELECTED
    // --------------------------------------

    if (
      this.addressMode !== 'add' &&
      !this.selectedAddressId
    ) {

      this.errorMessage =
        'Please select a delivery address.';

      return;

    }


    // --------------------------------------
    // GET CART ITEMS
    // --------------------------------------

    this.store.select(selectCartItems)
      .pipe(take(1))
      .subscribe(items => {

        if (items.length === 0) {

          this.errorMessage = 'Your cart is empty.';

          return;

        }


        // --------------------------------------
        // CALCULATE SUBTOTAL
        // --------------------------------------

        const subtotal = items.reduce(

          (total, item) =>
            total + item.product.price * item.quantity,

          0

        );


        // --------------------------------------
        // VALIDATE COUPON AND CONTINUE
        // --------------------------------------

        this.validateAppliedCoupon(subtotal, items);

      });

  }


  // ==========================================
  // CONTINUE PLACE ORDER
  // ==========================================

  private continuePlaceOrder(
    subtotal: number,
    items: CartItem[]
  ): void {

    this.store.select(selectCurrentUser)
      .pipe(take(1))
      .subscribe(user => {

        if (!user?.id) {

          this.errorMessage =
            'Please log in to place an order.';

          return;

        }


        this.submitting = true;


        // --------------------------------------
        // GET PREVIOUS ORDERS
        // --------------------------------------

        this.orderService
          .getOrdersByUserId(String(user.id))
          .pipe(take(1))
          .subscribe({

            next: userOrders => {

              // Generate next order number

              const nextOrderNumber =
                userOrders.length + 1;


              // ----------------------------------
              // CREATE ORDER
              // ----------------------------------

              const order: Order = {

                userId: String(user.id),

                orderNumber: nextOrderNumber,

                customer: { ...this.customer },

                items: items.map(item => ({

                  ...item,

                  product: { ...item.product }

                })),

                total: this.calculatePayable(subtotal),

                paymentMethod: this.paymentMethod,

                status: 'Placed',

                createdAt: new Date().toISOString(),

                ...(this.validatedCoupon ? {

                  couponCode: this.validatedCoupon.code,

                  couponDiscount: this.couponDiscount

                } : {})

              };


              // ----------------------------------
              // SAVE ORDER
              // ----------------------------------

              this.orderService.createOrder(order)
                .pipe(take(1))
                .subscribe({

                  next: savedOrder => {

                    const coupon = this.validatedCoupon;


                    // No coupon applied

                    if (!coupon?.id) {

                      this.finishOrder(savedOrder);

                      return;

                    }


                    // --------------------------------
                    // UPDATE COUPON USAGE COUNT
                    // --------------------------------

                    this.couponService.updateCoupon(
                      coupon.id,
                      {
                        usedCount: coupon.usedCount + 1
                      }
                    )
                      .pipe(take(1))
                      .subscribe({

                        next: () => {

                          this.finishOrder(savedOrder);

                        },

                        error: error => {

                          console.error(
                            'Order saved, but coupon usage update failed:',
                            error
                          );

                          // Order is already saved.
                          // Do not make the customer place it again.

                          this.finishOrder(savedOrder);

                        }

                      });

                  },


                  error: error => {

                    console.error(
                      'Failed to place order:',
                      error
                    );

                    this.errorMessage =
                      'Unable to place your order. Please try again.';

                    this.submitting = false;

                  }

                });

            },


            error: error => {

              console.error(
                'Failed to retrieve previous orders:',
                error
              );

              this.errorMessage =
                'Unable to verify your previous orders. Please try again.';

              this.submitting = false;

            }

          });

      });

  }


  // ==========================================
  // FINISH ORDER
  // ==========================================

  private finishOrder(savedOrder: Order): void {

    this.store.dispatch(clearCart());

    this.router.navigate(['/order-confirmation'], {

      state: {
        order: savedOrder
      }

    });

  }

}