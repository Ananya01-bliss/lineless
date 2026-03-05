import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ── Whitelisted domains (mirror of backend list) ─────────────────────────
const ALLOWED_DOMAINS = new Set([
    'gmail.com', 'googlemail.com',
    'outlook.com', 'hotmail.com', 'hotmail.in', 'live.com', 'live.in', 'msn.com',
    'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com',
    'icloud.com', 'me.com', 'mac.com',
    'rediffmail.com', 'sify.com',
    'proton.me', 'protonmail.com',
    'zoho.com', 'aol.com', 'mail.com', 'gmx.com', 'gmx.net',
    'tutanota.com', 'fastmail.com', 'yandex.com', 'yandex.ru',
]);

function allowedDomainValidator(control: AbstractControl): ValidationErrors | null {
    const email: string = control.value || '';
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null; // Let the built-in email validator handle empty/invalid format
    if (ALLOWED_DOMAINS.has(domain)) return null;
    // Allow academic domains
    if (domain.endsWith('.edu') || domain.endsWith('.ac.in') ||
        domain.endsWith('.edu.in') || domain.endsWith('.ac.uk') ||
        domain.endsWith('.edu.au')) return null;
    return { domainNotAllowed: true };
}

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
    signupForm: FormGroup;
    passwordStrength: string = '';
    showPassword: boolean = false;
    isSubmitting: boolean = false;
    errorMessage: string = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email, allowedDomainValidator]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    // Custom validator to check if passwords match
    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        }
        return null;
    }

    // Calculate password strength
    onPasswordChange(event: any) {
        const password = event.target.value;
        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        if (strength === 0) this.passwordStrength = '';
        else if (strength <= 2) this.passwordStrength = 'weak';
        else if (strength <= 4) this.passwordStrength = 'medium';
        else this.passwordStrength = 'strong';
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    // Handle form submission
    onSubmit() {
        if (this.signupForm.valid) {
            this.isSubmitting = true;
            this.errorMessage = '';

            const { name, email, password } = this.signupForm.value;

            this.authService.register({ name, email, password }).subscribe({
                next: (response) => {
                    this.isSubmitting = false;
                    if (response.success) {
                        this.router.navigate(['/dashboard']);
                    }
                },
                error: (error) => {
                    this.isSubmitting = false;
                    this.errorMessage = error.error?.message || error.error?.error || 'Signup failed. Please try again.';
                    console.error('Signup error:', error);
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.signupForm.controls).forEach(key => {
                this.signupForm.get(key)?.markAsTouched();
            });
        }
    }

    // Navigate to login
    navigateToLogin() {
        this.router.navigate(['/login']);
    }

    // Navigate back to landing
    navigateToLanding() {
        this.router.navigate(['/']);
    }

    // Get form control for easy access in template
    get f() {
        return this.signupForm.controls;
    }
}
