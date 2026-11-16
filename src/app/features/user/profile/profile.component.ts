import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Router, RouterLink } from '@angular/router';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';

import {
  selectCurrentUser,
  selectAuthLoading,
  selectAuthError
} from '../../../store/auth/auth.selectors';

import * as AuthActions from '../../../store/auth/auth.actions';
import { AuthService } from '../../../core/services/auth.service';


interface SavedAddress {
  id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})


export class ProfileComponent {

  private store = inject(Store);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private actions$ = inject(Actions);


  // STORE SELECTORS
  user$ = this.store.select(selectCurrentUser);
  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);


  // PROFILE VARIABLES
  isEditing = false;
  successMessage = '';
  duplicateEmailError = '';
  showLogoutModal = false;


  // PROFILE FORM
  profileForm = this.fb.group({

    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(60)
    ]],

    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100)
    ]]

  });


  constructor() {

    this.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {

        if (user) {

          this.profileForm.patchValue({
            name: user.name,
            email: user.email
          });

        }

      });

  }


  get f() {
    return this.profileForm.controls;
  }



  // ==========================================
  // SAVED DELIVERY ADDRESSES
  // ==========================================

  isEditingAddress = false;

  addressSuccess = '';
  addressError = '';
  addressSaving = false;


  // TOAST NOTIFICATION
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  private toastTimer: ReturnType<typeof setTimeout> | undefined;


  private showToast(
    message: string,
    type: 'success' | 'error' = 'success'
  ): void {

    this.toastMessage = message;
    this.toastType = type;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 3000);

  }


  editingAddressId: string | null = null;


  // ADDRESS FORM
  addressForm = this.fb.group({

    label: [
      'HOME' as 'HOME' | 'WORK' | 'OTHER',
      Validators.required
    ],

    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(60)
    ]],

    email: ['', [
      Validators.required,
      Validators.email
    ]],

    phone: ['', [
      Validators.required,
      Validators.pattern(/^[6-9][0-9]{9}$/)
    ]],

    address: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]],

    city: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-Z ]+$/)
    ]],

    state: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.pattern(/^[a-zA-Z ]+$/)
    ]],

    pincode: ['', [
      Validators.required,
      Validators.pattern(/^[1-9][0-9]{5}$/)
    ]]

  });


  get af() {
    return this.addressForm.controls;
  }



  // ADD NEW ADDRESS
  addAddress(): void {

    this.editingAddressId = null;

    this.addressForm.reset({

      label: 'HOME',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'Kerala',
      pincode: ''

    });


    this.user$
      .pipe(take(1))
      .subscribe(user => {

        if (user) {

          this.addressForm.patchValue({

            name: user.name,
            email: user.email,
            phone: user.phone ?? ''

          });

        }

      });


    this.isEditingAddress = true;

    this.addressSuccess = '';
    this.addressError = '';

  }



  // EDIT EXISTING ADDRESS
  editAddress(address?: SavedAddress): void {

    this.editingAddressId = address?.id ?? null;


    if (address) {

      this.addressForm.reset({

        label: address.label ?? 'HOME',
        name: address.fullName ?? '',
        email: address.email ?? '',
        phone: address.phone ?? '',
        address: address.address ?? '',
        city: address.city ?? '',
        state: address.state ?? 'Kerala',
        pincode: address.pincode ?? ''

      });

    } else {

      // MIGRATE OLD SINGLE ADDRESS
      this.user$
        .pipe(take(1))
        .subscribe(user => {

          this.addressForm.reset({

            label: 'HOME',
            name: user?.name ?? '',
            email: user?.email ?? '',
            phone: user?.phone ?? '',
            address: user?.address ?? '',
            city: user?.city ?? '',
            state: user?.state ?? 'Kerala',
            pincode: user?.pincode ?? ''

          });

        });

    }


    this.isEditingAddress = true;

    this.addressSuccess = '';
    this.addressError = '';

  }



  // CANCEL ADDRESS EDIT
  cancelAddressEdit(): void {

    this.isEditingAddress = false;

    this.editingAddressId = null;

    this.addressSuccess = '';
    this.addressError = '';

  }



  // SAVE ADDRESS
  saveAddress(): void {

    if (this.addressForm.invalid || this.addressSaving) {

      this.addressForm.markAllAsTouched();
      return;

    }


    this.user$
      .pipe(take(1))
      .subscribe(user => {

        if (!user?.id) {

          this.addressError = 'User not found.';
          return;

        }


        const value = this.addressForm.getRawValue();

        const existingAddresses: SavedAddress[] =
          user.addresses ?? [];


        const addressId =
          this.editingAddressId ?? `address-${Date.now()}`;


        const existingAddress = existingAddresses.find(
          item => item.id === addressId
        );


        const savedAddress: SavedAddress = {

          id: addressId,

          label: value.label as 'HOME' | 'WORK' | 'OTHER',

          fullName: value.name?.trim() ?? '',

          email: value.email?.trim().toLowerCase() ?? '',

          phone: value.phone?.trim() ?? '',

          address: value.address?.trim() ?? '',

          city: value.city?.trim() ?? '',

          state: value.state?.trim() ?? '',

          pincode: value.pincode?.trim() ?? '',

          // First address becomes default automatically.
          // Existing address keeps its default status.
          isDefault:
            existingAddress?.isDefault ??
            !existingAddresses.some(item => item.isDefault)

        };


        let updatedAddresses: SavedAddress[];


        if (this.editingAddressId) {

          updatedAddresses = existingAddresses.map(item =>

            item.id === addressId
              ? savedAddress
              : item

          );

        } else {

          updatedAddresses = [
            ...existingAddresses,
            savedAddress
          ];

        }


        // Make sure at least one address is default.
        if (!updatedAddresses.some(item => item.isDefault)) {

          updatedAddresses = updatedAddresses.map(
            (item, index) => ({

              ...item,
              isDefault: index === 0

            })
          );

        }


        this.addressSaving = true;

        this.addressError = '';
        this.addressSuccess = '';


        // SUCCESS RESPONSE
        this.actions$
          .pipe(
            ofType(AuthActions.updateProfileSuccess),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {

            this.addressSaving = false;

            this.addressSuccess =
              'Address saved successfully!';

            this.showToast(
              'Address saved successfully!',
              'success'
            );

            this.isEditingAddress = false;

            this.editingAddressId = null;

          });


        // FAILURE RESPONSE
        this.actions$
          .pipe(
            ofType(AuthActions.updateProfileFailure),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {

            this.addressSaving = false;

            this.addressError =
              'Unable to save address. Please try again.';

            this.showToast(
              'Unable to save address. Please try again.',
              'error'
            );

          });


        // UPDATE USER THROUGH NGRX
        this.store.dispatch(

          AuthActions.updateProfile({

            id: user.id,

            user: {
              addresses: updatedAddresses
            }

          })

        );

      });

  }



  // SET DEFAULT ADDRESS
  setDefaultAddress(addressId: string): void {

    if (this.addressSaving) {
      return;
    }


    this.user$
      .pipe(take(1))
      .subscribe(user => {

        if (!user?.id || !user.addresses?.length) {
          return;
        }


        // Only one address can be default.
        const updatedAddresses: SavedAddress[] =
          user.addresses.map((address: SavedAddress) => ({

            ...address,

            isDefault: address.id === addressId

          }));


        this.addressSaving = true;

        this.addressError = '';
        this.addressSuccess = '';


        // SUCCESS RESPONSE
        this.actions$
          .pipe(
            ofType(AuthActions.updateProfileSuccess),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {

            this.addressSaving = false;

            this.addressSuccess =
              'Default address updated.';

            this.showToast(
              'Default address updated successfully!',
              'success'
            );

          });


        // FAILURE RESPONSE
        this.actions$
          .pipe(
            ofType(AuthActions.updateProfileFailure),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {

            this.addressSaving = false;

            this.addressError =
              'Unable to update the default address.';

            this.showToast(
              'Unable to update the default address.',
              'error'
            );

          });


        // UPDATE USER
        this.store.dispatch(

          AuthActions.updateProfile({

            id: user.id,

            user: {
              addresses: updatedAddresses
            }

          })

        );

      });

  }



  // ==========================================
  // EDIT PROFILE
  // ==========================================


  // EDIT PROFILE
  editProfile(): void {

    this.isEditing = true;

    this.successMessage = '';
    this.duplicateEmailError = '';

  }



  // CANCEL PROFILE EDIT
  cancelEdit(): void {

    this.isEditing = false;

    this.successMessage = '';
    this.duplicateEmailError = '';


    this.user$
      .pipe(take(1))
      .subscribe(user => {

        if (user) {

          this.profileForm.patchValue({

            name: user.name,
            email: user.email

          });

        }

      });

  }



  // SAVE PROFILE
  saveProfile(): void {

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();
      return;

    }


    this.user$
      .pipe(take(1))
      .subscribe(user => {

        if (!user?.id) {
          return;
        }


        const updatedUser = {

          name: this.profileForm.value.name?.trim() ?? '',

          email: this.profileForm.value.email
            ?.trim()
            .toLowerCase() ?? ''

        };


        this.successMessage = '';
        this.duplicateEmailError = '';


        // CHECK DUPLICATE EMAIL
        if (updatedUser.email !== user.email.toLowerCase()) {

          this.authService
            .checkEmail(updatedUser.email)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({

              next: users => {

                const emailExists = users.some(
                  existingUser => existingUser.id !== user.id
                );


                if (emailExists) {

                  this.duplicateEmailError =
                    'This email is already registered. Please use another email.';

                  return;

                }


                this.dispatchProfileUpdate(
                  user.id!,
                  updatedUser
                );

              },


              error: () => {

                this.duplicateEmailError =
                  'Unable to verify email. Please try again.';

              }

            });

        } else {

          this.dispatchProfileUpdate(
            user.id,
            updatedUser
          );

        }

      });

  }



  // DISPATCH PROFILE UPDATE
  private dispatchProfileUpdate(
    id: string,
    updatedUser: { name: string; email: string }
  ): void {


    // SUCCESS RESPONSE
    this.actions$
      .pipe(
        ofType(AuthActions.updateProfileSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.successMessage =
          'Profile updated successfully!';

        this.isEditing = false;

      });


    // FAILURE RESPONSE
    this.actions$
      .pipe(
        ofType(AuthActions.updateProfileFailure),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {

        this.isEditing = true;

      });


    // DISPATCH ACTION
    this.store.dispatch(

      AuthActions.updateProfile({

        id,
        user: updatedUser

      })

    );

  }



  // ==========================================
  // LOGOUT
  // ==========================================


  openLogoutModal(): void {

    this.showLogoutModal = true;

  }


  closeLogoutModal(): void {

    this.showLogoutModal = false;

  }


  confirmLogout(): void {

    this.showLogoutModal = false;

    this.store.dispatch(AuthActions.logout());

    this.router.navigate(['/']);

  }



  // ==========================================
  // PROFILE PHOTO
  // ==========================================


  photoPreview: string | null = null;

  photoError = '';
  photoSuccess = '';

  photoSaving = false;

  private selectedPhoto = '';



  // SELECT PROFILE PHOTO
  onPhotoSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];


    this.photoError = '';
    this.photoSuccess = '';


    if (!file) {
      return;
    }


    // VALIDATE FILE TYPE
    const allowedTypes = [

      'image/jpeg',
      'image/png',
      'image/webp'

    ];


    if (!allowedTypes.includes(file.type)) {

      this.photoError =
        'Please select JPG, PNG or WEBP image.';

      input.value = '';

      return;

    }


    // MAXIMUM FILE SIZE: 2 MB
    if (file.size > 2 * 1024 * 1024) {

      this.photoError =
        'Image size must be less than 2 MB.';

      input.value = '';

      return;

    }


    const reader = new FileReader();


    reader.onload = () => {

      const result = reader.result;

      if (typeof result === 'string') {

        this.selectedPhoto = result;

        this.photoPreview = result;

      }

    };


    reader.onerror = () => {

      this.photoError =
        'Unable to read the selected image.';

    };


    reader.readAsDataURL(file);

  }



  // SAVE PROFILE PHOTO
  savePhoto(): void {

    if (!this.selectedPhoto || this.photoSaving) {
      return;
    }


    this.user$
      .pipe(take(1))
      .subscribe(user => {

        if (!user?.id) {

          this.photoError = 'User not found.';

          return;

        }


        this.photoSaving = true;

        this.photoError = '';
        this.photoSuccess = '';


        // SUCCESS RESPONSE
        this.actions$
          .pipe(
            ofType(AuthActions.updateProfileSuccess),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {

            this.photoSaving = false;

            this.photoSuccess =
              'Profile photo updated successfully!';

            this.photoPreview = null;

            this.selectedPhoto = '';

          });


        // FAILURE RESPONSE
        this.actions$
          .pipe(
            ofType(AuthActions.updateProfileFailure),
            take(1),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {

            this.photoSaving = false;

            this.photoError =
              'Unable to save profile photo.';

          });


        // UPDATE PROFILE PHOTO
        this.store.dispatch(

          AuthActions.updateProfile({

            id: user.id,

            user: {
              profilePhoto: this.selectedPhoto
            }

          })

        );

      });

  }



  // CANCEL PHOTO CHANGE
  cancelPhoto(): void {

    this.photoPreview = null;

    this.selectedPhoto = '';

    this.photoError = '';
    this.photoSuccess = '';

  }

}