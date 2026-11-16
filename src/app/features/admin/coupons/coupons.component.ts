import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Coupon } from '../../../core/models/coupon.model';
import { CouponService } from '../../../core/services/coupon.service';
import { ToastService } from '../../../core/services/toast.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.css'
})
export class CouponsComponent implements OnInit {

  private couponService = inject(CouponService);
  private toast = inject(ToastService);

  coupons: Coupon[] = [];

  showForm = false;
  isEditMode = false;
  editingId: string | null = null;

  couponForm: Coupon = this.getEmptyCoupon();

  ngOnInit(): void {
    this.loadCoupons();
  }

  // Coupon statistics

  get activeCouponsCount(): number {
    return this.coupons.filter(coupon => coupon.isActive).length;
  }

  get inactiveCouponsCount(): number {
    return this.coupons.filter(coupon => !coupon.isActive).length;
  }

  // Empty coupon form

  getEmptyCoupon(): Coupon {
    return {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscount: 0,
      expiryDate: '',
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }

  // Load coupons

  loadCoupons(): void {
    this.couponService.getCoupons().subscribe({
      next: (data) => {
        this.coupons = data;
      },
      error: () => {
        this.toast.show('Failed to load coupons', 'error');
      }
    });
  }

  // Open add form

  openAddForm(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.couponForm = this.getEmptyCoupon();
    this.showForm = true;
  }

  // Edit coupon

  editCoupon(coupon: Coupon): void {
    this.isEditMode = true;
    this.editingId = coupon.id ?? null;
    this.couponForm = { ...coupon };
    this.showForm = true;
  }

  // Close form

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  // Save coupon

saveCoupon(): void {

  this.couponForm.code =
    this.couponForm.code.trim().toUpperCase();

  this.couponForm.description =
    this.couponForm.description.trim();

  // Required fields

  if (!this.couponForm.code || !this.couponForm.description) {
    this.toast.show('Please fill in all required fields', 'warning');
    return;
  }

  // Validate values

  if (
    this.couponForm.discountValue <= 0 ||
    this.couponForm.minOrderAmount < 0 ||
    this.couponForm.usageLimit <= 0
  ) {
    this.toast.show('Please enter valid coupon values', 'warning');
    return;
  }

  // Validate percentage

  if (
    this.couponForm.discountType === 'percentage' &&
    this.couponForm.discountValue > 100
  ) {
    this.toast.show('Percentage discount cannot exceed 100%', 'warning');
    return;
  }

  // Validate expiry date

  if (!this.couponForm.expiryDate) {
    this.toast.show('Please select an expiry date', 'warning');
    return;
  }

  // Check duplicate coupon codes

  this.couponService.getCoupons()
    .pipe(take(1))
    .subscribe({

      next: (coupons) => {

        const duplicate = coupons.some(coupon =>
          coupon.code.trim().toUpperCase() ===
            this.couponForm.code &&
          coupon.id !== this.editingId
        );

        if (duplicate) {
          this.toast.show(
            'This coupon code already exists!',
            'warning'
          );
          return;
        }

        // UPDATE EXISTING COUPON

        if (this.isEditMode && this.editingId) {

          this.couponService.updateCoupon(
            this.editingId,
            this.couponForm
          ).subscribe({

            next: () => {
              this.toast.show(
                'Coupon updated successfully',
                'success'
              );

              this.closeForm();
              this.loadCoupons();
            },

            error: () => {
              this.toast.show(
                'Failed to update coupon',
                'error'
              );
            }

          });

        } else {

          // CREATE NEW COUPON

          this.couponService.createCoupon(
            this.couponForm
          ).subscribe({

            next: () => {
              this.toast.show(
                'Coupon created successfully',
                'success'
              );

              this.closeForm();
              this.loadCoupons();
            },

            error: () => {
              this.toast.show(
                'Failed to create coupon',
                'error'
              );
            }

          });

        }

      },

      error: () => {
        this.toast.show(
          'Unable to validate coupon code',
          'error'
        );
      }

    });

}

  // Enable / Disable coupon

  toggleStatus(coupon: Coupon): void {

    if (!coupon.id) return;

    this.couponService.updateCoupon(coupon.id, {
      isActive: !coupon.isActive
    }).subscribe({

      next: () => {
        this.toast.show(
          coupon.isActive ? 'Coupon deactivated' : 'Coupon activated',
          'success'
        );

        this.loadCoupons();
      },

      error: () => {
        this.toast.show('Failed to update coupon status', 'error');
      }

    });
  }

  // Delete coupon

  deleteCoupon(coupon: Coupon): void {

    if (!coupon.id) return;

    if (!confirm(`Are you sure you want to delete ${coupon.code}?`)) {
      return;
    }

    this.couponService.deleteCoupon(coupon.id).subscribe({

      next: () => {
        this.toast.show('Coupon deleted successfully', 'success');
        this.loadCoupons();
      },

      error: () => {
        this.toast.show('Failed to delete coupon', 'error');
      }

    });
  }

}