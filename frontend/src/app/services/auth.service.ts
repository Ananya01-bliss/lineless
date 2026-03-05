import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        // Check if user is already logged in
        this.loadUserFromStorage();
    }

    // Dynamic API URL based on hostname
    private get apiUrl(): string {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000/api/auth';
        } else {
            return `http://${hostname}:3000/api/auth`;
        }
    }

    // Load user from localStorage on init
    private loadUserFromStorage(): void {
        const token = this.getToken();
        const userStr = localStorage.getItem('currentUser');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
            } catch (error) {
                console.error('Error parsing user from storage:', error);
                this.logout();
            }
        }
    }

    // Register new user
    register(userData: { name: string; email: string; password: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
            .pipe(
                tap(response => {
                    if (response.success && response.token && response.user) {
                        this.setSession(response.token, response.user);
                    }
                })
            );
    }

    // Login user
    login(credentials: { email: string; password: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
            .pipe(
                tap(response => {
                    if (response.success && response.token && response.user) {
                        this.setSession(response.token, response.user);
                    }
                })
            );
    }

    // Logout user
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    // Set session data
    private setSession(token: string, user: User): void {
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    // Get token
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    // Get current user
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    // Check if user is logged in
    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    // Get auth headers
    getAuthHeaders(): HttpHeaders {
        const token = this.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }

    // Forgot password
    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/forgotpassword`, { email });
    }

    // Reset password
    resetPassword(resetToken: string, password: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/resetpassword/${resetToken}`, { password });
    }
}
