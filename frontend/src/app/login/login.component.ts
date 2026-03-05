import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    loginForm: FormGroup;
    showPassword: boolean = false;
    isSubmitting: boolean = false;
    rememberMe: boolean = false;
    errorMessage: string = '';
    returnUrl: string = '/dashboard';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            rememberMe: [false]
        });

        // Get return url from route parameters or default to dashboard
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    // Handle form submission
    onSubmit() {
        if (this.loginForm.valid) {
            this.isSubmitting = true;
            this.errorMessage = '';

            const { email, password } = this.loginForm.value;

            this.authService.login({ email, password }).subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    if (response.success) {
                        this.router.navigate([this.returnUrl]);
                    }
                },
                error: (error) => {
                    this.isSubmitting = false;
                    this.errorMessage = error.error?.message || error.error?.error || 'Login failed. Please check your credentials and try again.';
                    console.error('Login error:', error);
                    this.cdr.detectChanges(); // Force render immediately
                }
            });
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.loginForm.controls).forEach(key => {
                this.loginForm.get(key)?.markAsTouched();
            });
        }
    }

    // Navigate to signup
    navigateToSignup() {
        this.router.navigate(['/signup']);
    }

    // Navigate to forgot password
    navigateToForgotPassword() {
        // TODO: Create forgot password page
        alert('Forgot Password page coming soon!');
    }

    // Navigate back to landing
    navigateToLanding() {
        this.router.navigate(['/']);
    }

    // Get form control for easy access in template
    get f() {
        return this.loginForm.controls;
    }
}
