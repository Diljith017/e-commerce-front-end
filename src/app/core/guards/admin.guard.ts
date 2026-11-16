import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(

    map(user => {

      if (!user) {
        return router.createUrlTree(['/login']);
      }

      if (user.role === 'admin') {
        return true;
      }

      return router.createUrlTree(['/']);

    }),

    catchError(() => of(router.createUrlTree(['/login'])))

  );
};