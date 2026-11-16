import { createReducer, on } from '@ngrx/store';

import { User } from '../../core/models/user.model';

import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const authReducer = createReducer(

  initialAuthState,

  // LOGIN
  on(AuthActions.login, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // REGISTER
  on(AuthActions.register, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.registerSuccess, (state) => ({
  ...state,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
})),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // UPDATE PROFILE
  on(AuthActions.updateProfile, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(AuthActions.updateProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null
  })),

  on(AuthActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // LOGOUT
  on(AuthActions.logout, () => ({
    ...initialAuthState
  })),


  on(AuthActions.forceLogout, () => ({
  ...initialAuthState
})),

  

);