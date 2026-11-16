import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectCurrentUser,
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class Navbar {

  private router = inject(Router);
  private store = inject(Store);

  user$ = this.store.select(selectCurrentUser);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  showAllProducts(): void {
    this.router.navigate(['/products']);
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