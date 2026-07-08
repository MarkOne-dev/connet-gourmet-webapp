import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { User } from '../../domain/auth/models/auth.model';
import { API_CONFIG } from '../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$: Observable<string | null> = this.errorSubject.asObservable();

  private apiUrl = `${API_CONFIG.baseUrl}/api/auth/login`;

  constructor(private router: Router, private http: HttpClient) {
    const storedUser = localStorage.getItem('gc_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      // Evitar quedarse atorado con el usuario mock de la maqueta anterior
      if (parsed.id === 'chef-gaston') {
        localStorage.removeItem('gc_user');
        this.currentUserSubject.next(null);
      } else {
        this.currentUserSubject.next(parsed);
      }
    }
  }

  login(email: string, password: string): void {
    this.errorSubject.next(null);

    this.http.post<any>(this.apiUrl, { email, password }).subscribe({
      next: (apiUser: any) => {
        const userMapped: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name || apiUser.fullName || apiUser.profile?.fullName || apiUser.username,
          avatarUrl: apiUser.avatarUrl || apiUser.profile?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYUXB9Os_jDGO3-j-8Om-Pl-Dp41NYKcnHVMnxQR4A_bYZvEj4YpU3m1fMLkp6tpn7OWHW5lQluX61Szjk1-OEsdwJXzkfX4_MA7lzxnOZDA5bo-WWY_gQLx_RlaBQFAq7GDzah-Hgl75nSghnbXZtagXABkvdeurzfhRC9MgpQmz8_yfECS4BO9hH_RxCECcw0ozVDsd7buSN7F1uAWW4Bfn8d45ITi--PhZjUZ2nNfTnLor1jzAjgw',
          token: apiUser.id
        };

        localStorage.setItem('gc_user', JSON.stringify(userMapped));
        this.currentUserSubject.next(userMapped);
        this.router.navigate(['/feed']);
      },
      error: (err: any) => {
        const errorMsg = err.error || 'Correo o contraseña incorrectos.';
        this.errorSubject.next(typeof errorMsg === 'string' ? errorMsg : 'Error al iniciar sesión. Inténtalo de nuevo.');
      }
    });
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  logout(): void {
    localStorage.removeItem('gc_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  updateProfile(name: string, email: string): void {
    const user = this.currentUserSubject.value;
    if (user) {
      const updatedUser = { ...user, name, email };
      localStorage.setItem('gc_user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}
