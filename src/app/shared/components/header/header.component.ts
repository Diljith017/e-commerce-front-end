import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { selectCartItemCount } from '../../../store/cart/cart.selectors';

import * as AuthActions from '../../../store/auth/auth.actions';

import { selectWishlistCount } from '../../../store/wishlist/wishlist.selectors';

import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  private store = inject(Store);
  private router = inject(Router);

  cartCount$: Observable<number> =
    this.store.select(selectCartItemCount);


    wishlistCount$: Observable<number> =
  this.store.select(selectWishlistCount);
  
  user$ = this.store.select(selectCurrentUser);

  isAuthenticated$ =
    this.store.select(selectIsAuthenticated);

  searchText = '';

  onSearch(): void {
    const search = this.searchText.trim();

    if (search) {
      this.router.navigate(['/products'], {
        queryParams: { search }
      });
    }
  }

  logout(): void {
  const confirmed = confirm('Are you sure you want to logout?');

  if (!confirmed) {
    return;
  }

  this.store.dispatch(AuthActions.logout());
  this.router.navigate(['/']);
}
}