export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    validUntil: string;
  };
  profilePicture?: string; // Optional profile picture URL
  local_currency?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
} 