import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
    selector: 'app-goals',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page">
      <div class="page-inner fade-up">
        <div class="section-header">
          <div>
            <h2 class="section-title">🎯 Goals</h2>
            <p class="section-sub">Set and track your life goals</p>
          </div>
          <span class="tag tag-goals">{{ goals.length }} active</span>
        </div>

        <!-- Create Goal Form -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 0.95rem; font-weight:700; margin-bottom: 1rem;">New Goal</h3>
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Type</label>
              <select id="goal-type-select" class="form-select" [(ngModel)]="form.type">
                <option value="FITNESS">🏃 Fitness</option>
                <option value="FINANCE">💰 Finance</option>
                <option value="LEARNING">📚 Learning</option>
              </select>
            </div>
            <div class="form-group" style="flex:3">
              <label class="form-label">Goal Title</label>
              <input id="goal-title-input" class="form-input" type="text" [(ngModel)]="form.title" placeholder="e.g. Run 5km 3x per week, Save ₹10,000..." />
            </div>
          </div>

          <div *ngIf="err" class="alert alert-error">{{ err }}</div>
          <div *ngIf="ok" class="alert alert-success">{{ ok }}</div>

          <button id="create-goal-btn" class="btn btn-primary" (click)="create()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span>
            <span *ngIf="!saving">🎯 Create Goal</span>
          </button>
        </div>

        <!-- Goals List -->
        <div *ngIf="loading" style="text-align:center; padding: 2rem;"><span class="spinner"></span></div>
        <div *ngIf="!loading && goals.length === 0" class="empty-state">
          <div class="icon">🎯</div>
          <p>No goals yet. Set one to get started!</p>
        </div>
        <div class="log-list" *ngIf="!loading && goals.length > 0">
          <div class="log-item" *ngFor="let goal of goals">
            <div class="log-item-left">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
                <span class="tag" [ngClass]="typeTag(goal.type)">{{ goal.type }}</span>
                <span class="log-item-title">{{ goal.title }}</span>
              </div>
              <span class="log-item-meta">Created {{ goal.created_at | date:'MMM d, yyyy' }}</span>
            </div>
            <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem;" (click)="deleteGoal(goal.id)">🗑</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }`],
})
export class GoalsComponent implements OnInit {
    form = { type: 'FITNESS', title: '' };
    goals: any[] = [];
    loading = true;
    saving = false;
    err = '';
    ok = '';

    constructor(private api: ApiService) { }
    ngOnInit() { this.load(); }

    load() {
        this.loading = true;
        this.api.getGoals().subscribe({ next: (g) => { this.goals = g; this.loading = false; }, error: () => { this.loading = false; } });
    }

    typeTag(t: string) {
        const map: any = { FITNESS: 'tag-fitness', FINANCE: 'tag-finance', LEARNING: 'tag-learning' };
        return map[t] || 'tag-goals';
    }

    create() {
        this.err = ''; this.ok = '';
        if (!this.form.title) { this.err = 'Please enter a goal title.'; return; }
        this.saving = true;
        this.api.createGoal({ type: this.form.type, title: this.form.title }).subscribe({
            next: () => { this.ok = '✅ Goal created!'; this.form = { type: 'FITNESS', title: '' }; this.saving = false; this.load(); },
            error: (e) => { this.err = e?.error?.message || 'Failed'; this.saving = false; },
        });
    }

    deleteGoal(id: number) {
        this.api.deleteGoal(id).subscribe({ next: () => this.load() });
    }
}
