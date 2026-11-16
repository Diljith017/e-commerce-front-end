import { Injectable, inject } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';

import {
  of,
  map,
  exhaustMap,
  catchError,
  tap,
  switchMap
} from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

import * as AuthActions from './auth.actions';
import { ToastService } from '../../core/services/toast.service';

@Injectable()
export class AuthEffects {

  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  // LOGIN
  // LOGIN EFFECT
login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.login),
    exhaustMap(({ credentials }) =>
      this.authService.login(credentials).pipe(
        switchMap(users => {
          if (!users.length) {
            this.toast.show('Invalid email or password.', 'error');

            return of(AuthActions.loginFailure({
              error: 'Invalid email or password.'
            }));
          }

          const user = users[0];

//for to prevents blocked users from logging in again.
          if (user.status === 'blocked') {
  this.toast.show(
    'Your account has been blocked by the administrator.',
    'error'
  );

  return of(AuthActions.loginFailure({
    error: 'Your account is blocked. Please contact the administrator.'
  }));
}



          try {
            this.authService.saveUser(user);

            this.toast.show(
              `Welcome to NutriForge, ${user.name}!`,
              'success'
            );

            return of(AuthActions.loginSuccess({ user }));

          } catch {
            return of(AuthActions.loginFailure({
              error: 'Unable to create your login session.'
            }));
          }
        }),

        catchError(() => {
          this.toast.show('Unable to connect to the server.', 'error');

          return of(AuthActions.loginFailure({
            error: 'Unable to connect to the server. Please try again.'
          }));
        })
      )
    )
  )
);

  // REGISTER
  register$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.register),
    exhaustMap(({ user }) =>
      this.authService.checkEmail(user.email).pipe(
        switchMap(users => {
          if (users.length > 0) {
            return of(AuthActions.registerFailure({
              error: 'Email already registered. Please login.'
            }));
          }

          return this.authService.register(user).pipe(
            map(() => AuthActions.registerSuccess({
              user: user as any
            }))
          );
        }),
        catchError(() =>
          of(AuthActions.registerFailure({
            error: 'Registration failed. Please try again.'
          }))
        )
      )
    )
  )
);

  // UPDATE PROFILE
  updateProfile$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.updateProfile),

      exhaustMap(({ id, user }) =>

        this.authService.updateUser(id, user).pipe(

          map(updatedUser => {

            this.authService.saveUser(updatedUser);

            return AuthActions.updateProfileSuccess({
              user: updatedUser
            });

          }),

          catchError(() =>
            of(AuthActions.updateProfileFailure({
              error: 'Profile update failed. Please try again.'
            }))
          )

        )

      )

    )
  );

  // LOGOUT
  logout$ = createEffect(
    () =>
      this.actions$.pipe(

        ofType(AuthActions.logout),

        tap(() => this.authService.logout())

      ),
    { dispatch: false }
  );

  // RESTORE AUTHENTICATION
  restoreAuth$ = createEffect(() =>
    this.actions$.pipe(

      ofType(AuthActions.restoreAuth),

      exhaustMap(() =>
        this.authService.getCurrentUser().pipe(

          map(user => {

            if (user) {
              return AuthActions.loginSuccess({ user });
            }

            return AuthActions.logout();

          }),

          catchError(() => {
            this.authService.logout();
            return of(AuthActions.logout());
          })

        )
      )

    )
  );

  logoutToast$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.toast.show(
          'Logged out successfully!',
          'success'
        );
      })
    ),
  { dispatch: false }
);




// FORCE LOGOUT
forceLogout$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.forceLogout),
      tap(() => {
        this.authService.logout();

        this.toast.show(
          'Your account has been blocked by the administrator.',
          'error'
        );
      })
    ),
  { dispatch: false }
);

}