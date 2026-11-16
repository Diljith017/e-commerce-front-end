import { createAction, props } from '@ngrx/store';
import { User, LoginRequest, RegisterRequest } from '../../core/models/user.model';

// Login
export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginRequest }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Register
export const register = createAction(
  '[Auth] Register',
  props<{ user: RegisterRequest }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: User }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Auth] Logout');

// Restore authentication
export const restoreAuth = createAction(
  '[Auth] Restore Authentication'
);

// Update Profile

export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ id: string; user: Partial<User> }>()
);

export const updateProfileSuccess = createAction(
  '[Auth] Update Profile Success',
  props<{ user: User }>()
);

export const updateProfileFailure = createAction(
  '[Auth] Update Profile Failure',
  props<{ error: string }>()
);

// FORCE LOGOUT WHEN ADMIN BLOCKS USER
export const forceLogout = createAction(
  '[Auth] Force Logout'
);