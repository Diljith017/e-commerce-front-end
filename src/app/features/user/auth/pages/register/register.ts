import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';

import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';


import {
  map,
  catchError,
  of,
  take
} from 'rxjs';

import * as AuthActions from '../../../../../store/auth/auth.actions';

import {
  selectAuthLoading,
  selectAuthError
} from '../../../../../store/auth/auth.selectors';

import { AuthService } from '../../../../../core/services/auth.service';

// Password matching validator
function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {

  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
}

// Email validation: must start with a letter
const EMAIL_PATTERN =
  /^(?!.*\.\.)[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);

  private actions$ = inject(Actions);
private destroyRef = inject(DestroyRef);
private router = inject(Router);


constructor() {
  this.actions$
    .pipe(
      ofType(AuthActions.registerSuccess),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(() => {
      alert('Registration successful! Please login.');
      this.router.navigate(['/login']);
    });
}

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  showPassword = false;
  showConfirmPassword = false;

  // Check whether email already exists
emailTakenValidator(): AsyncValidatorFn {

  return (control: AbstractControl) => {

    const email = control.value?.trim().toLowerCase();

    if (!email || control.invalid) {
      return of(null);
    }

    return this.authService.checkEmail(email).pipe(
      map(users =>
        users.length > 0 ? { emailTaken: true } : null
      ),
      catchError(() => of(null)),
      take(1)
    );
  };
}

  registerForm = this.fb.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z ]+$/)
        ]
      ],

     email: [
  '',
  {
    validators: [
      Validators.required,
      Validators.email,
      Validators.pattern(EMAIL_PATTERN)
    ],
    asyncValidators: [this.emailTakenValidator()],
    updateOn: 'change'
  }
],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[6-9][0-9]{9}$/)
        ]
      ],

      password: [
  '',
  [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(32),
    Validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!*?&])[A-Za-z\d@$!*?&]+$/
    )
  ]
],

      confirmPassword: [
        '',
        Validators.required
      ],

      terms: [
        false,
        Validators.requiredTrue
      ]
    },
    {
      validators: passwordMatchValidator
    }
  );

  get f() {
    return this.registerForm.controls;
  }

  // Password strength
  get passwordStrength(): number {

    const password = this.f.password.value || '';

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    return strength;
  }

  get passwordStrengthLabel(): string {

    const strength = this.passwordStrength;

    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';

    return 'Strong';
  }

  onSubmit(): void {

    if (this.registerForm.invalid || this.registerForm.pending) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const {
      name,
      email,
      phone,
      password
    } = this.registerForm.getRawValue();

    if (!name || !email || !phone || !password) {
      return;
    }

    this.store.dispatch(
      AuthActions.register({
        user: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone,
          password,
          role: 'user'
        }
      })
    );
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}