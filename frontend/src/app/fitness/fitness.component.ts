import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

interface WorkoutSet { exercise: string; sets: number | null; reps: number | null; weight_kg: number | null; }

@Component({
  selector: 'app-fitness',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-inner fade-up">
        <div class="section-header">
          <div>
            <h2 class="section-title">🏃 Fitness Tracker</h2>
            <p class="section-sub">Log your workouts and track weekly progress</p>
          </div>
          <span class="tag tag-fitness">Last 7 days</span>
        </div>

        <!-- Stats -->
        <div class="stats-row" *ngIf="summary">
          <div class="stat-card">
            <div class="stat-value">{{ summary.count }}</div>
            <div class="stat-label">Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ summary.totalDuration }}</div>
            <div class="stat-label">Minutes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ summary.totalCalories }}</div>
            <div class="stat-label">kcal</div>
          </div>
          <div class="stat-card" *ngIf="summary.totalSteps > 0">
            <div class="stat-value">{{ summary.totalSteps | number }}</div>
            <div class="stat-label">Steps</div>
          </div>
        </div>

        <!-- Log Form -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 0.95rem; font-weight:700; margin-bottom: 1rem;">Log Activity</h3>

          <!-- Activity + Duration -->
          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label class="form-label">Activity</label>
              <input id="activity-input" class="form-input" type="text" [(ngModel)]="form.activity"
                     (ngModelChange)="onActivityChange()"
                     placeholder="e.g. Walking, Running, Gym Workout..." />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">Duration (min)</label>
              <input id="duration-input" class="form-input" type="number" [(ngModel)]="form.duration" placeholder="30" min="0" />
            </div>
          </div>

          <!-- Activity type badge -->
          <div class="type-badge-row" *ngIf="activityType !== 'other'">
            <span class="type-badge" [class.cardio]="activityType === 'cardio'" [class.gym]="activityType === 'gym'">
              {{ activityType === 'cardio' ? '🏃 Cardio detected — showing steps field' : '💪 Gym detected — add exercises below' }}
            </span>
          </div>

          <!-- CARDIO: Steps -->
          <div class="form-group" *ngIf="activityType === 'cardio'">
            <label class="form-label">Steps (optional)</label>
            <input id="steps-input" class="form-input" type="number" [(ngModel)]="form.steps" placeholder="e.g. 8500" min="0" />
          </div>

          <!-- GYM: Workout details table -->
          <div *ngIf="activityType === 'gym'" class="workout-section">
            <div class="workout-header">
              <label class="form-label">Exercises</label>
              <button class="btn btn-secondary" style="font-size:0.75rem; padding:0.3rem 0.7rem;" (click)="addSet()">+ Add Exercise</button>
            </div>
            <div class="workout-table" *ngIf="workoutSets.length > 0">
              <div class="workout-row header-row">
                <span>Exercise</span><span>Sets</span><span>Reps</span><span>Weight (kg)</span><span></span>
              </div>
              <div class="workout-row" *ngFor="let s of workoutSets; let i = index">
                <input class="form-input compact" [(ngModel)]="s.exercise" placeholder="Bench Press" />
                <input class="form-input compact num" type="number" [(ngModel)]="s.sets" placeholder="3" min="1" />
                <input class="form-input compact num" type="number" [(ngModel)]="s.reps" placeholder="10" min="1" />
                <input class="form-input compact num" type="number" [(ngModel)]="s.weight_kg" placeholder="60" min="0" />
                <button class="btn btn-danger" style="padding:0.3rem 0.5rem; font-size:0.72rem;" (click)="removeSet(i)">✕</button>
              </div>
            </div>
            <p *ngIf="workoutSets.length === 0" style="font-size:0.82rem; color:var(--text-muted); margin:0.5rem 0;">Click "+ Add Exercise" to log your sets</p>
          </div>

          <!-- Calories row with AI estimator -->
          <div class="calories-row">
            <div class="form-group calories-field">
              <label class="form-label">Calories (kcal)</label>
              <input id="calories-input" class="form-input" type="number" [(ngModel)]="form.calories" placeholder="leave blank to enter manually" min="0" />
            </div>
            <div class="ai-btn-wrap">
              <label class="form-label" style="visibility:hidden">·</label>
              <button id="estimate-cal-btn" class="btn ai-estimate-btn" (click)="estimateCalories()" [disabled]="estimating || !form.activity || !form.duration">
                <span *ngIf="estimating" class="spinner"></span>
                <span *ngIf="!estimating">🤖 Estimate with AI</span>
              </button>
            </div>
          </div>

          <!-- AI Explanation -->
          <div *ngIf="calEstimation" class="alert alert-info" style="font-size:0.85rem; margin-bottom:1rem;">
            <strong>🤖 AI Estimate:</strong> {{ calEstimation.calories }} kcal — {{ calEstimation.explanation }}
          </div>
          <div *ngIf="calError" class="alert alert-error">{{ calError }}</div>

          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <input id="notes-input" class="form-input" type="text" [(ngModel)]="form.notes" placeholder="Any notes..." />
          </div>

          <div *ngIf="err" class="alert alert-error">{{ err }}</div>
          <div *ngIf="ok" class="alert alert-success">{{ ok }}</div>

          <button id="log-fitness-btn" class="btn btn-primary" (click)="logActivity()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span>
            <span *ngIf="!saving">➕ Log Activity</span>
          </button>
        </div>

        <!-- Recent Logs -->
        <div class="section-header">
          <h3 class="section-title" style="font-size:1rem;">Recent Sessions</h3>
        </div>
        <div *ngIf="loading" style="text-align:center; padding: 2rem;"><span class="spinner"></span></div>
        <div *ngIf="!loading && summary?.logs?.length === 0" class="empty-state">
          <div class="icon">🏋️</div>
          <p>No sessions this week. Get moving!</p>
        </div>
        <div class="log-list" *ngIf="!loading && summary?.logs?.length > 0">
          <div class="log-item" *ngFor="let log of summary.logs">
            <div class="log-item-left">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="log-item-title">{{ log.activity }}</span>
                <span class="type-pill cardio" *ngIf="log.activity_type === 'cardio'">cardio</span>
                <span class="type-pill gym" *ngIf="log.activity_type === 'gym'">gym</span>
              </div>
              <span class="log-item-meta">
                {{ log.duration }} min
                {{ log.calories ? ' · ' + log.calories + ' kcal' : '' }}
                {{ log.steps ? ' · ' + (log.steps | number) + ' steps' : '' }}
              </span>
              <!-- Gym workout details -->
              <div class="mini-workout" *ngIf="log.workout_details?.length">
                <span class="mini-set" *ngFor="let s of log.workout_details">
                  {{ s.exercise }}{{ s.sets ? ' ' + s.sets + '×' + s.reps : '' }}{{ s.weight_kg ? ' @ ' + s.weight_kg + 'kg' : '' }}
                </span>
              </div>
            </div>
            <div class="log-item-right">{{ log.logged_at | date:'MMM d, h:mm a' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .form-row .form-group { min-width: 100px; }

    .type-badge-row { margin-bottom: 0.85rem; }
    .type-badge { display: inline-flex; align-items: center; padding: 0.3rem 0.8rem; border-radius: 99px; font-size: 0.78rem; font-weight: 600; }
    .type-badge.cardio { background: rgba(34,197,94,0.12); color: var(--success); border: 1px solid rgba(34,197,94,0.25); }
    .type-badge.gym { background: rgba(168,85,247,0.12); color: var(--accent-2); border: 1px solid rgba(168,85,247,0.25); }

    .type-pill { font-size: 0.62rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.06em; }
    .type-pill.cardio { background: rgba(34,197,94,0.12); color: var(--success); }
    .type-pill.gym { background: rgba(168,85,247,0.12); color: var(--accent-2); }

    /* Workout table */
    .workout-section { margin-bottom: 1rem; }
    .workout-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .workout-table { display: flex; flex-direction: column; gap: 0.4rem; }
    .workout-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 0.4rem; align-items: center; }
    .workout-row.header-row { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0.2rem; }
    .form-input.compact { padding: 0.45rem 0.6rem; font-size: 0.85rem; }
    .form-input.compact.num { text-align: center; }

    /* Calories row */
    .calories-row { display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 0; }
    .calories-field { flex: 1; min-width: 120px; margin-bottom: 0; }
    .ai-btn-wrap { display: flex; flex-direction: column; flex-shrink: 0; margin-bottom: 1rem; }
    .ai-estimate-btn {
      background: linear-gradient(135deg, #1a1a3e, #2d1b6b);
      border: 1px solid rgba(108,99,255,0.4);
      color: var(--accent);
      font-weight: 700; font-size: 0.82rem; white-space: nowrap;
    }
    .ai-estimate-btn:hover:not(:disabled) { background: linear-gradient(135deg, #2d1b6b, #4a2ead); border-color: var(--accent); color: #fff; box-shadow: 0 0 16px var(--accent-glow); }
    .ai-estimate-btn:disabled { opacity: 0.4; }

    /* Mini workout summary in log list */
    .mini-workout { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.3rem; }
    .mini-set { font-size: 0.72rem; padding: 0.15rem 0.5rem; background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2); border-radius: 99px; color: var(--accent-2); }
  `],
})
export class FitnessComponent implements OnInit {
  form = { activity: '', duration: null as number | null, calories: null as number | null, steps: null as number | null, notes: '' };
  workoutSets: WorkoutSet[] = [];
  activityType: 'cardio' | 'gym' | 'other' = 'other';
  summary: any = null;
  loading = true;
  saving = false;
  estimating = false;
  err = ''; ok = '';
  calEstimation: { calories: number; explanation: string } | null = null;
  calError = '';

  private readonly CARDIO_KEYWORDS = ['walking', 'running', 'jogging', 'hiking', 'trekking', 'cycling', 'walk', 'run', 'jog', 'hike', 'steps', 'cardio'];
  private readonly GYM_KEYWORDS = ['gym', 'weight', 'bench', 'squat', 'deadlift', 'lift', 'press', 'curl', 'row', 'dumbbell', 'barbell', 'workout', 'pullup', 'pushup'];

  constructor(private api: ApiService) { }
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getFitnessSummary().subscribe({ next: (s) => { this.summary = s; this.loading = false; }, error: () => { this.loading = false; } });
  }

  onActivityChange() {
    const a = this.form.activity.toLowerCase();
    if (this.CARDIO_KEYWORDS.some(k => a.includes(k))) this.activityType = 'cardio';
    else if (this.GYM_KEYWORDS.some(k => a.includes(k))) { this.activityType = 'gym'; if (this.workoutSets.length === 0) this.addSet(); }
    else this.activityType = 'other';
    this.calEstimation = null;
  }

  addSet() { this.workoutSets.push({ exercise: '', sets: null, reps: null, weight_kg: null }); }
  removeSet(i: number) { this.workoutSets.splice(i, 1); }

  estimateCalories() {
    if (!this.form.activity || !this.form.duration) return;
    this.estimating = true; this.calEstimation = null; this.calError = '';
    this.api.estimateCalories(this.form.activity, this.form.duration!).subscribe({
      next: (res) => { this.calEstimation = res; this.form.calories = res.calories; this.estimating = false; },
      error: (e) => { this.calError = e?.error?.message || 'AI estimation unavailable'; this.estimating = false; },
    });
  }

  logActivity() {
    this.err = ''; this.ok = '';
    if (!this.form.activity || !this.form.duration) { this.err = 'Activity and duration are required.'; return; }
    this.saving = true;
    const payload: any = {
      activity: this.form.activity,
      activity_type: this.activityType,
      duration: this.form.duration,
      calories: this.form.calories ?? undefined,
      notes: this.form.notes || undefined,
    };
    if (this.activityType === 'cardio' && this.form.steps) payload.steps = this.form.steps;
    if (this.activityType === 'gym' && this.workoutSets.length > 0) payload.workout_details = this.workoutSets.filter(s => s.exercise);
    this.api.logFitnessExtended(payload).subscribe({
      next: () => {
        this.ok = '✅ Activity logged!';
        this.form = { activity: '', duration: null, calories: null, steps: null, notes: '' };
        this.workoutSets = []; this.activityType = 'other'; this.calEstimation = null;
        this.saving = false; this.load();
      },
      error: (e) => { this.err = e?.error?.message || 'Failed to log'; this.saving = false; },
    });
  }
}
