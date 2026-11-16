import {
  Component,
  inject,
  DestroyRef
} from '@angular/core';

import {
  RouterOutlet,
  Router,
  NavigationEnd
} from '@angular/router';

import {
  filter,
  timer,
  switchMap,
  catchError,
  of,
  tap
} from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';

import { HeaderComponent } from './shared/components/header/header.component';
import { Navbar } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';



import { restoreAuth, forceLogout } from './store/auth/auth.actions';

import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    Navbar,
    FooterComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private store = inject(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  isAdminRoute = this.router.url.startsWith('/admin');

  private forcedLogoutHandled = false;

  constructor() {

    // RESTORE AUTHENTICATION
    this.store.dispatch(restoreAuth());

    // DETECT ADMIN ROUTES
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isAdminRoute = this.router.url.startsWith('/admin');
      });

    // CHECK USER ACCOUNT STATUS EVERY 3 SECONDS
    timer(3000, 3000)
      .pipe(
        switchMap(() =>
          this.authService.checkAccountStatus().pipe(
            catchError(() => of(null))
          )
        ),


        tap(user => {
  if (user && user.status !== 'blocked') {
    this.forcedLogoutHandled = false;
  }
}),

        filter(user => user?.status === 'blocked'),

        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        if (this.forcedLogoutHandled) {
          return;
        }

        this.forcedLogoutHandled = true;

        // CLEAR AUTHENTICATION
        this.store.dispatch(forceLogout());

        // REDIRECT TO LOGIN
        this.router.navigate(['/login']);

      });

  }

}