import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="auth-bg">
      <div class="auth-card fade-up">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="logo-icon">🧬</div>
          <h1 class="logo-title">Life Manager</h1>
          <p class="logo-sub">Your personal wellness & finance hub</p>
        </div>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab" [class.active]="mode === 'login'" (click)="mode = 'login'">Login</button>
          <button class="auth-tab" [class.active]="mode === 'register'" (click)="mode = 'register'">Register</button>
        </div>

        <div class="divider"></div>

        <!-- Form -->
        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-input" type="text" [(ngModel)]="username" name="username" placeholder="Enter username" required autocomplete="username" id="username-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" type="password" [(ngModel)]="password" name="password" placeholder="Enter password" required autocomplete="current-password" id="password-input" />
          </div>

          <div *ngIf="error" class="alert alert-error">{{ error }}</div>
          <div *ngIf="success" class="alert alert-success">{{ success }}</div>

          <button id="submit-btn" class="btn btn-primary btn-full" type="submit" [disabled]="loading">
            <span *ngIf="loading" class="spinner"></span>
            <span *ngIf="!loading">{{ mode === 'login' ? '🔐 Sign In' : '🚀 Create Account' }}</span>
          </button>
        </form>

        <p class="auth-hint">Your data is encrypted end-to-end 🔒</p>
      </div>
    </div>
  `,
    styles: [`
    .auth-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      background-image: radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.08) 0%, transparent 60%);
      padding: 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--glass);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      padding: 2.5rem 2rem;
      backdrop-filter: blur(24px);
      box-shadow: var(--shadow-card), 0 0 60px rgba(108,99,255,0.08);
    }
    .auth-logo { text-align: center; margin-bottom: 1.5rem; }
    .logo-icon { font-size: 2.8rem; margin-bottom: 0.5rem; }
    .logo-title { font-size: 1.6rem; font-weight: 800; background: var(--accent-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .logo-sub { font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.3rem; }
    .auth-tabs { display: flex; gap: 0.5rem; background: rgba(0,0,0,0.3); border-radius: var(--radius-md); padding: 4px; margin-bottom: 1.25rem; }
    .auth-tab { flex: 1; padding: 0.55rem; border: none; border-radius: calc(var(--radius-md) - 4px); background: transparent; color: var(--text-secondary); font-family: inherit; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: var(--transition); }
    .auth-tab.active { background: var(--accent-grad); color: #fff; box-shadow: 0 2px 12px var(--accent-glow); }
    .auth-hint { text-align: center; font-size: 0.75rem; color: var(--text-muted); margin-top: 1.25rem; }
  `],
})
export class LoginComponent {
    mode: 'login' | 'register' = 'login';
    username = '';
    password = '';
    loading = false;
    error = '';
    success = '';

    constructor(private api: ApiService, private router: Router) { }

    submit() {
        this.error = '';
        this.success = '';
        if (!this.username || !this.password) {
            this.error = 'Please enter username and password.';
            return;
        }
        this.loading = true;
        if (this.mode === 'login') {
            this.api.login(this.username, this.password).subscribe({
                next: (res) => {
                    localStorage.setItem('lm_token', res.access_token);
                    localStorage.setItem('lm_user', res.username);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.error = err?.error?.message || 'Login failed';
                    this.loading = false;
                },
            });
        } else {
            this.api.register(this.username, this.password).subscribe({
                next: () => {
                    this.success = '✅ Account created! You can now log in.';
                    this.mode = 'login';
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err?.error?.message || 'Registration failed';
                    this.loading = false;
                },
            });
        }
    }
}
