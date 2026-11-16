export interface SavedAddress {
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

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;

  addresses?: SavedAddress[];

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  role: 'user' | 'admin';
  status?: 'active' | 'blocked';
  profilePhoto?: string;
}

export interface RegisterRequest {
name: string;
email: string;
phone?: string;
password: string;
role: 'user' | 'admin';
}

export interface LoginRequest {
email: string;
password: string;
}
