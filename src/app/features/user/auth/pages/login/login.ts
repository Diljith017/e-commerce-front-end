import {
  Component,
  DestroyRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { take } from 'rxjs';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Store } from '@ngrx/store';

import {
  Router,
  RouterLink,
  ActivatedRoute
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import * as AuthActions from '../../../../../store/auth/auth.actions';

import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,selectCurrentUser
} from '../../../../../store/auth/auth.selectors';

const EMAIL_PATTERN =
  /^(?!.*\.\.)[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);
  isAuthenticated$ = this.store.select(selectIsAuthenticated);

  showPassword = false;

  // LOGIN FORM
  loginForm = this.fb.group({

    email: [
  '',
  [
    Validators.required,
    Validators.email,
    Validators.pattern(EMAIL_PATTERN)
  ]
],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ]

  });

  // FORM CONTROLS
  get f() {
    return this.loginForm.controls;
  }

 constructor() {

  this.isAuthenticated$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(isAuthenticated => {

      if (isAuthenticated) {

        this.store.select(selectCurrentUser)
          .pipe(take(1))
          .subscribe(user => {

            const returnUrl =
              this.route.snapshot.queryParamMap.get('returnUrl');

            const destination =
              returnUrl?.startsWith('/') &&
              !returnUrl.startsWith('//')
                ? returnUrl
                : user?.role === 'admin'
                  ? '/admin/dashboard'
                  : '/';

            this.router.navigateByUrl(destination, {
  replaceUrl: true
});

          });

      }

    });

}

  // LOGIN SUBMIT
  onSubmit(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;

    }

    const { email, password } =
      this.loginForm.getRawValue();

    if (!email || !password) {
      return;
    }

    this.store.dispatch(
      AuthActions.login({

        credentials: {
          email: email.trim().toLowerCase(),
          password
        }

      })
    );

  }

  // SHOW / HIDE PASSWORD
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

}