import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-inner fade-up">
        <div class="section-header">
          <div>
            <h2 class="section-title">💰 Finance Tracker</h2>
            <p class="section-sub">All amounts encrypted with AES-256-GCM</p>
          </div>
          <span class="tag tag-finance">Secure</span>
        </div>

        <!-- Stats -->
        <div class="stats-row" *ngIf="summary">
          <div class="stat-card">
            <div class="stat-value">{{ summary.logs?.length || 0 }}</div>
            <div class="stat-label">Entries</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">₹{{ summary.totalSaved | number:'1.0-0' }}</div>
            <div class="stat-label">Total (7d)</div>
          </div>
        </div>

        <!-- Log Form -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 0.95rem; font-weight:700; margin-bottom: 1rem;">Log Entry</h3>
          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label class="form-label">Category</label>
              <select id="category-select" class="form-select" [(ngModel)]="form.category">
                <option value="Savings">Savings</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Investment">Investment</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">Amount (₹)</label>
              <input id="amount-input" class="form-input" type="number" [(ngModel)]="form.amount" placeholder="0" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Note (optional)</label>
            <input id="note-input" class="form-input" type="text" [(ngModel)]="form.note" placeholder="e.g. Monthly salary, Groceries..." />
          </div>

          <div *ngIf="err" class="alert alert-error">{{ err }}</div>
          <div *ngIf="ok" class="alert alert-success">{{ ok }}</div>

          <button id="log-finance-btn" class="btn btn-primary" (click)="logEntry()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span>
            <span *ngIf="!saving">🔐 Log Entry (Encrypted)</span>
          </button>
        </div>

        <!-- ── AI Finance Goal Planner ── -->
        <div class="card ai-goal-card" style="margin-bottom: 1.5rem;">
          <div class="ai-goal-header">
            <div>
              <h3 style="font-size: 0.95rem; font-weight:700;">🤖 AI Finance Goal Calculator</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top:0.25rem;">
                Analyses your spending vs. Finance goals and builds a personalised savings plan
              </p>
            </div>
            <button id="ai-finance-plan-btn" class="btn ai-plan-btn" (click)="getGoalPlan()" [disabled]="planLoading">
              <span *ngIf="planLoading" class="spinner"></span>
              <span *ngIf="!planLoading">✨ Calculate Plan</span>
            </button>
          </div>

          <div *ngIf="planError" class="alert alert-error" style="margin-top:1rem;">{{ planError }}</div>

          <div *ngIf="goalPlan" style="margin-top: 1rem;">
            <div class="divider"></div>
            <div class="goal-plan-body" [innerText]="goalPlan"></div>
          </div>

          <div *ngIf="!goalPlan && !planLoading && !planError" class="plan-hint">
            💡 Add Finance goals in the <strong>Goals</strong> tab, then run this calculator to get a personalised savings plan.
          </div>
        </div>

        <!-- Logs -->
        <div class="section-header">
          <h3 class="section-title" style="font-size:1rem;">Recent Entries</h3>
        </div>
        <div *ngIf="loading" style="text-align:center; padding: 2rem;"><span class="spinner"></span></div>
        <div *ngIf="!loading && summary?.logs?.length === 0" class="empty-state">
          <div class="icon">💳</div>
          <p>No finance entries this week. Start tracking!</p>
        </div>
        <div class="log-list" *ngIf="!loading && summary?.logs?.length > 0">
          <div class="log-item" *ngFor="let log of summary.logs">
            <div class="log-item-left">
              <span class="log-item-title">{{ log.category }}</span>
              <span class="log-item-meta">{{ log.note || '—' }}</span>
            </div>
            <div class="log-item-right">
              <div style="font-size:1rem; font-weight:700; color: var(--success);">₹{{ log.amount | number:'1.0-2' }}</div>
              <div>{{ log.logged_at | date:'MMM d' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .form-row .form-group { min-width: 120px; }

    .ai-goal-card {
      background: linear-gradient(135deg, rgba(108,99,255,0.06), rgba(168,85,247,0.04));
      border-color: rgba(108,99,255,0.2);
    }
    .ai-goal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .ai-plan-btn {
      background: var(--accent-grad);
      color: #fff;
      font-weight: 700;
      font-size: 0.82rem;
      box-shadow: 0 4px 16px var(--accent-glow);
      flex-shrink: 0;
    }
    .ai-plan-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px var(--accent-glow); }

    .goal-plan-body {
      white-space: pre-wrap;
      line-height: 1.75;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .plan-hint {
      margin-top: 0.85rem;
      font-size: 0.82rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
  `],
})
export class FinanceComponent implements OnInit {
  form = { category: 'Savings', amount: null as number | null, note: '' };
  summary: any = null;
  loading = true;
  saving = false;
  err = '';
  ok = '';
  goalPlan = '';
  planLoading = false;
  planError = '';

  constructor(private api: ApiService) { }
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getFinanceSummary().subscribe({
      next: (s) => { this.summary = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  logEntry() {
    this.err = ''; this.ok = '';
    if (!this.form.amount || this.form.amount <= 0) { this.err = 'Please enter a valid amount.'; return; }
    this.saving = true;
    this.api.logFinance({ category: this.form.category, amount: this.form.amount!, note: this.form.note || undefined }).subscribe({
      next: () => {
        this.ok = '✅ Entry logged securely!';
        this.form = { category: 'Savings', amount: null, note: '' };
        this.saving = false;
        this.load();
      },
      error: (e) => { this.err = e?.error?.message || 'Failed to log'; this.saving = false; },
    });
  }

  getGoalPlan() {
    this.goalPlan = '';
    this.planError = '';
    this.planLoading = true;
    this.api.getFinanceGoalPlan().subscribe({
      next: (res) => { this.goalPlan = res.plan; this.planLoading = false; },
      error: (e) => {
        this.planError = e?.error?.message || 'Failed to get plan. Is Ollama running?';
        this.planLoading = false;
      },
    });
  }
}
