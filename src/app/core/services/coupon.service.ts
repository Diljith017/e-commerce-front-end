import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Coupon } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {

  private http = inject(HttpClient);

  private apiUrl = 'https://nutriforge-api-du2u.onrender.com/coupons';

  // Get all coupons (Admin)
  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl);
  }

  // Get active coupons (Customer)
  getActiveCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>(this.apiUrl, {
      params: { isActive: 'true' }
    });
  }

  // Get coupon by ID
  getCouponById(id: string): Observable<Coupon> {
    return this.http.get<Coupon>(`${this.apiUrl}/${id}`);
  }

  // Create coupon
  createCoupon(coupon: Coupon): Observable<Coupon> {
    return this.http.post<Coupon>(this.apiUrl, coupon);
  }

  // Update coupon
  updateCoupon(id: string, coupon: Partial<Coupon>): Observable<Coupon> {
    return this.http.patch<Coupon>(`${this.apiUrl}/${id}`, coupon);
  }

  // Delete coupon
  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}