import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';

import {
  User,
  LoginRequest,
  RegisterRequest
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  private userStorageKey = 'nutriforge_user_id';
  private adminStorageKey = 'nutriforge_admin_id';
  private tabRoleKey = 'nutriforge_tab_role';





 private getStorageKeyForCurrentTab(): string {
  return this.getTabRole() === 'admin'
    ? this.adminStorageKey
    : this.userStorageKey;
}


private getTabRole(): 'admin' | 'user' {
  const savedRole = sessionStorage.getItem(this.tabRoleKey);

  if (savedRole === 'admin' || savedRole === 'user') {
    return savedRole;
  }

  return window.location.pathname.startsWith('/admin')
    ? 'admin'
    : 'user';
}


  // REGISTER
  register(user: RegisterRequest): Observable<User> {
  return this.http.post<any>(this.apiUrl, {
    ...user,
    status: 'active'
  }).pipe(
    map(createdUser => this.removePassword(createdUser))
  );
}


 // LOGIN
login(credentials: LoginRequest): Observable<User[]> {

  const email = credentials.email.trim().toLowerCase();

  return this.http.get<any[]>(this.apiUrl, {
    params: {
      email,
      password: credentials.password
    }
  }).pipe(
    map(users => users.map(user => this.removePassword(user)))
  );

}

  // CHECK EMAIL
  checkEmail(email: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}?email=${encodeURIComponent(email)}`
    );
  }

  // UPDATE USER
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}`,
      user
    ).pipe(
      map(updatedUser => this.removePassword(updatedUser))
    );
  }

  // REMOVE PASSWORD
  private removePassword(user: any): User {
    const { password, ...safeUser } = user;
    return safeUser as User;
  }



  // SAVE ONLY USER ID
saveUser(user: User): void {
  if (!user.id) {
    throw new Error('Cannot save a session without a user ID.');
  }

  const storageKey =
    user.role === 'admin'
      ? this.adminStorageKey
      : this.userStorageKey;

  localStorage.setItem(storageKey, String(user.id));

  sessionStorage.setItem(this.tabRoleKey, user.role);
}



  // RESTORE USER FROM SERVER
 getCurrentUser(): Observable<User | null> {
  const storageKey = this.getStorageKeyForCurrentTab();
  const userId = localStorage.getItem(storageKey);

  if (!userId) {
    return of(null);
  }

  return this.http.get<any>(
    `${this.apiUrl}/${encodeURIComponent(userId)}`
  ).pipe(
    map(user => this.removePassword(user)),
    map(user => {
      if (!user.id || user.status === 'blocked') {
        this.logout();
        return null;
      }

      return user;
    })
  );
}




  // CHECK USER ACCOUNT STATUS
checkAccountStatus(): Observable<User | null> {
  return this.getCurrentUser();
}


// GET ALL USERS
getAllUsers(): Observable<User[]> {
  return this.http.get<any[]>(this.apiUrl).pipe(
    map(users => users.map(user => this.removePassword(user)))
  );
}

// BLOCK OR UNBLOCK USER
updateUserStatus(
  id: string,
  status: 'active' | 'blocked'
): Observable<User> {
  return this.updateUser(id, { status });
}

  // LOGOUT
 logout(): void {
  const storageKey = this.getStorageKeyForCurrentTab();

  localStorage.removeItem(storageKey);
}

}