import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WishlistItem } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/wishlist';

  // Get wishlist of a particular user
  getWishlist(userId: string): Observable<WishlistItem[]> {

    const params = new HttpParams()
      .set('userId', userId);

    return this.http.get<WishlistItem[]>(this.apiUrl, { params });
  }

  // Add product to wishlist
  addToWishlist(item: WishlistItem): Observable<WishlistItem> {

    return this.http.post<WishlistItem>(this.apiUrl, item);
  }

  // Remove product from wishlist
  removeFromWishlist(id: string): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}