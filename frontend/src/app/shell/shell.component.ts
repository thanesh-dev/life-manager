import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-icon">🧬</span>
          <span class="brand-name">Life Manager</span>
        </div>

        <nav class="nav">
          <button id="nav-fitness" class="nav-item" [class.active]="active === 'fitness'" (click)="go('fitness')">
            <span class="nav-icon">🏃</span><span class="nav-label">Fitness</span>
          </button>
          <button id="nav-finance" class="nav-item" [class.active]="active === 'finance'" (click)="go('finance')">
            <span class="nav-icon">💰</span><span class="nav-label">Finance</span>
          </button>
          <button id="nav-learning" class="nav-item" [class.active]="active === 'learning'" (click)="go('learning')">
            <span class="nav-icon">📚</span><span class="nav-label">Learning</span>
          </button>
          <button id="nav-goals" class="nav-item" [class.active]="active === 'goals'" (click)="go('goals')">
            <span class="nav-icon">🎯</span><span class="nav-label">Goals</span>
          </button>
          <button id="nav-insights" class="nav-item" [class.active]="active === 'insights'" (click)="go('insights')">
            <span class="nav-icon">🤖</span><span class="nav-label">AI Insights</span>
          </button>
          <button id="nav-food" class="nav-item" [class.active]="active === 'food'" (click)="go('food')">
            <span class="nav-icon">🍽</span><span class="nav-label">Food & Calories</span>
          </button>
          <button id="nav-profile" class="nav-item" [class.active]="active === 'profile'" (click)="go('profile')">
            <span class="nav-icon">⚙️</span><span class="nav-label">Settings</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="user-chip">
            <span class="user-avatar">{{ initial }}</span>
            <span class="user-name">{{ username }}</span>
          </div>
          <button id="logout-btn" class="btn btn-secondary logout-btn" (click)="logout()">Logout</button>
        </div>
      </aside>

      <!-- Mobile Bottom Bar -->
      <nav class="mobile-bar">
        <button class="mob-item" [class.active]="active === 'fitness'" (click)="go('fitness')">🏃</button>
        <button class="mob-item" [class.active]="active === 'finance'" (click)="go('finance')">💰</button>
        <button class="mob-item" [class.active]="active === 'learning'" (click)="go('learning')">📚</button>
        <button class="mob-item" [class.active]="active === 'goals'" (click)="go('goals')">🎯</button>
        <button class="mob-item" [class.active]="active === 'insights'" (click)="go('insights')">🤖</button>
        <button class="mob-item" [class.active]="active === 'food'" (click)="go('food')">🍽</button>
        <button class="mob-item" [class.active]="active === 'profile'" (click)="go('profile')">⚙️</button>
      </nav>

      <!-- Main Content -->
      <main class="main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; overflow: hidden; }

    /* ─── Sidebar ─ */
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: var(--bg-secondary);
      border-right: 1px solid var(--glass-border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      gap: 0;
    }
    .brand { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 2rem; padding: 0 0.25rem; }
    .brand-icon { font-size: 1.5rem; }
    .brand-name { font-size: 1rem; font-weight: 800; background: var(--accent-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .nav { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.85rem;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      text-align: left;
    }
    .nav-item:hover { background: var(--glass); color: var(--text-primary); }
    .nav-item.active { background: rgba(108,99,255,0.15); color: var(--text-primary); font-weight: 700; border: 1px solid rgba(108,99,255,0.25); }
    .nav-icon { font-size: 1.1rem; }
    .nav-label { font-size: 0.9rem; }

    .sidebar-footer { margin-top: auto; display: flex; flex-direction: column; gap: 0.75rem; }
    .user-chip { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.7rem; background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius-md); }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--accent-grad); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #fff; flex-shrink: 0; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .logout-btn { width: 100%; justify-content: center; font-size: 0.82rem; padding: 0.55rem; }

    /* ─── Main ─ */
    .main { flex: 1; overflow-y: auto; background: var(--bg-primary); }

    /* ─── Mobile Bar ─ */
    .mobile-bar { display: none; }

    @media (max-width: 700px) {
      .sidebar { display: none; }
      .mobile-bar {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: var(--bg-secondary);
        border-top: 1px solid var(--glass-border);
        z-index: 100;
        padding: 0.5rem 0;
      }
      .mob-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        padding: 0.4rem;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: var(--transition);
        opacity: 0.5;
      }
      .mob-item.active { opacity: 1; }
      .main { padding-bottom: 70px; }
    }
  `],
})
export class ShellComponent {
  active = 'fitness';
  username = localStorage.getItem('lm_user') || 'User';
  get initial() { return this.username[0]?.toUpperCase() || 'U'; }

  constructor(private router: Router) {
    const url = this.router.url.split('/').pop();
    if (url) this.active = url;
  }

  go(tab: string) {
    this.active = tab;
    this.router.navigate(['/dashboard', tab]);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
