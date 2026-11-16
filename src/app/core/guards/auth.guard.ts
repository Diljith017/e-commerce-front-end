import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(

    map(user => {

      if (!user) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      // Admin cannot access customer pages
      if (user.role === 'admin') {
        return router.createUrlTree(['/admin/dashboard']);
      }

      // Only customers can access customer pages
      return true;

    }),

    catchError(() =>
      of(router.createUrlTree(['/login']))
    )

  );
};