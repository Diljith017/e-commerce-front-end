import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import * as AuthActions from '../../../../store/auth/auth.actions';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent {

  private store = inject(Store);
  private router = inject(Router);
  private toastService = inject(ToastService);

  showLogoutConfirm = false;

  logout(): void {
    this.showLogoutConfirm = true;
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  confirmLogout(): void {
    this.showLogoutConfirm = false;

    this.store.dispatch(AuthActions.logout());

    this.toastService.show(
      'Logged out successfully!',
      'success'
    );

    this.router.navigateByUrl('/login', {
      replaceUrl: true
    });
  }
}