import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

interface FoodItem { name: string; kcal: number; portion: string; }

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-inner fade-up">

        <!-- Header -->
        <div class="section-header">
          <div>
            <h2 class="section-title">🍽 Food & Calories</h2>
            <p class="section-sub">Track meals · Set daily target · Snap to count kcal with AI</p>
          </div>
          <span class="tag tag-fitness">Today</span>
        </div>

        <!-- ── Daily Target + Progress ────────────────────────── -->
        <div class="card target-card" style="margin-bottom: 1.5rem;">
          <div class="target-row">
            <div>
              <div class="stat-value">{{ todayKcal }}</div>
              <div class="stat-label">kcal consumed today</div>
            </div>
            <div style="text-align:right;">
              <div class="stat-value" style="font-size:1.3rem;">{{ dailyTarget }}</div>
              <div class="stat-label">daily target</div>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="progress-track">
            <div class="progress-bar" [style.width.%]="progressPct" [class.over]="progressPct >= 100"></div>
          </div>
          <div class="progress-label">
            <span [style.color]="progressPct >= 100 ? 'var(--danger)' : 'var(--success)'">
              {{ progressPct >= 100 ? '⚠️ Over target by ' + (todayKcal - dailyTarget) + ' kcal' : remaining + ' kcal remaining' }}
            </span>
          </div>

          <!-- Set target inline -->
          <div class="target-edit-row">
            <input class="form-input" style="width:120px; font-size:0.85rem; padding:0.45rem 0.7rem;" type="number" [(ngModel)]="newTarget" placeholder="e.g. 2000" min="500" max="10000" />
            <button class="btn btn-secondary" style="font-size:0.82rem;padding:0.45rem 0.9rem;" (click)="setTarget()" [disabled]="settingTarget">
              {{ settingTarget ? '...' : 'Set Target' }}
            </button>
          </div>
        </div>

        <!-- ── Camera / AI Food Analyser ─────────────────────── -->
        <div class="card camera-card" style="margin-bottom: 1.5rem;">
          <div class="camera-header">
            <div>
              <h3 style="font-size:0.95rem; font-weight:700;">📸 AI Calorie Scanner</h3>
              <p style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;">
                Take or upload a food photo → AI identifies items & estimates kcal
              </p>
            </div>
          </div>

          <!-- Hidden file input (triggers camera on mobile, file picker on desktop) -->
          <input #fileInput type="file" accept="image/*" capture="environment" style="display:none" (change)="onImageSelected($event)" id="camera-input" />

          <div class="camera-actions">
            <button id="take-photo-btn" class="btn camera-btn" (click)="fileInput.click()">
              📲 Take / Upload Photo
            </button>
            <button id="analyze-btn" class="btn btn-primary" (click)="analyzeImage()" [disabled]="!capturedImage || analyzing">
              <span *ngIf="analyzing" class="spinner"></span>
              <span *ngIf="!analyzing">🤖 Analyse with AI</span>
            </button>
          </div>

          <!-- Preview -->
          <div *ngIf="capturedImage" class="image-preview">
            <img [src]="capturedImage" alt="Food preview" class="preview-img" />
          </div>

          <!-- AI Result -->
          <div *ngIf="analyzeResult" class="analyze-result fade-up">
            <div class="divider"></div>
            <div class="result-header">
              <strong>🤖 AI detected {{ analyzeResult.foods.length }} item(s) — {{ analyzeResult.totalKcal }} kcal total</strong>
            </div>
            <p *ngIf="analyzeResult.details" style="font-size:0.82rem; color:var(--text-secondary); margin:0.4rem 0 0.8rem;">{{ analyzeResult.details }}</p>
            <div class="food-chips">
              <div class="food-chip" *ngFor="let f of analyzeResult.foods">
                <span class="food-chip-name">{{ f.name }}</span>
                <span class="food-chip-portion">{{ f.portion }}</span>
                <span class="food-chip-kcal">{{ f.kcal }} kcal</span>
              </div>
            </div>
            <button id="add-ai-foods-btn" class="btn btn-primary" style="margin-top:0.75rem; width:100%; justify-content:center;" (click)="addAiFoodsToLog()">
              ➕ Add All to Today's Log
            </button>
          </div>

          <div *ngIf="analyzeErr" class="alert alert-error" style="margin-top:0.75rem;">{{ analyzeErr }}</div>
        </div>

        <!-- ── Manual Log Form ────────────────────────────────── -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="font-size:0.95rem; font-weight:700; margin-bottom:1rem;">➕ Log Food Manually</h3>
          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label class="form-label">Food Item</label>
              <input id="food-name-input" class="form-input" type="text" [(ngModel)]="form.food_name" placeholder="e.g. Idli, Chicken rice, Apple..." />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">kcal</label>
              <input id="food-kcal-input" class="form-input" type="number" [(ngModel)]="form.kcal" placeholder="0" min="0" />
            </div>
          </div>
          <div class="form-row" style="margin-top:0.75rem;">
            <div class="form-group" style="flex:1">
              <label class="form-label">Amount</label>
              <input id="food-amount-input" class="form-input" type="number" [(ngModel)]="form.serving_size" placeholder="1.0" min="0" />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">Unit</label>
              <select id="food-unit-select" class="form-select" [(ngModel)]="form.serving_unit">
                <option value="quantity">Quantity</option>
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="katori">Katori</option>
                <option value="bowl">Bowl</option>
              </select>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">Meal</label>
              <select id="meal-type-select" class="form-select" [(ngModel)]="form.meal_type">
                <option value="breakfast">🌅 Breakfast</option>
                <option value="lunch">☀️ Lunch</option>
                <option value="dinner">🌙 Dinner</option>
                <option value="snack">🍎 Snack</option>
              </select>
            </div>
          </div>
          <div *ngIf="logErr" class="alert alert-error">{{ logErr }}</div>
          <div *ngIf="logOk" class="alert alert-success">{{ logOk }}</div>
          <button id="log-food-btn" class="btn btn-primary" (click)="logFood()" [disabled]="logging" style="margin-top:1rem;">
            <span *ngIf="logging" class="spinner"></span>
            <span *ngIf="!logging">Log Food</span>
          </button>
        </div>

        <!-- ── Today's Logs ────────────────────────────────────── -->
        <div class="section-header">
          <h3 class="section-title" style="font-size:1rem;">Today's Meals</h3>
          <span style="font-size:0.82rem; color:var(--text-secondary);">{{ todayLogs.length }} entries</span>
        </div>
        <div *ngIf="loadingToday" style="text-align:center;padding:2rem;"><span class="spinner"></span></div>
        <div *ngIf="!loadingToday && todayLogs.length === 0" class="empty-state">
          <div class="icon">🥗</div>
          <p>No meals logged today. Start tracking!</p>
        </div>
        <div class="meal-groups" *ngIf="!loadingToday && todayLogs.length > 0">
          <div *ngFor="let group of mealGroups">
            <div class="meal-group-label">{{ mealLabel(group.type) }}</div>
            <div class="log-list" style="margin-bottom:0.5rem;">
              <div class="log-item" *ngFor="let log of group.items">
                <div class="log-item-left">
                  <span class="log-item-title">{{ log.food_name }}</span>
                  <span class="log-item-meta">
                    {{ log.serving_size }} {{ log.serving_unit === 'quantity' ? 'qty' : log.serving_unit }}
                    <span *ngIf="log.image_analyzed"> · 📸 AI scanned</span>
                  </span>
                </div>
                <div class="log-item-right" style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="font-weight:700; color: var(--warning);">{{ log.kcal }} kcal</span>
                  <button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.72rem;" (click)="deleteLog(log.id)">🗑</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }

    /* Target card */
    .target-card { background: linear-gradient(135deg, rgba(34,197,94,0.06), rgba(16,185,129,0.03)); border-color: rgba(34,197,94,0.2); }
    .target-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }
    .stat-value { font-size: 2rem; font-weight: 800; background: var(--accent-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-label { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }

    .progress-track { height: 8px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; margin-bottom: 0.4rem; }
    .progress-bar { height: 100%; background: var(--accent-grad); border-radius: 99px; transition: width 0.5s ease; max-width: 100%; }
    .progress-bar.over { background: linear-gradient(90deg, #ef4444, #f97316); }
    .progress-label { font-size: 0.8rem; margin-bottom: 0.85rem; }
    .target-edit-row { display: flex; gap: 0.5rem; align-items: center; }

    /* Camera card */
    .camera-card { background: linear-gradient(135deg, rgba(56,189,248,0.06), rgba(108,99,255,0.04)); border-color: rgba(56,189,248,0.2); }
    .camera-header { margin-bottom: 0.85rem; }
    .camera-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .camera-btn {
      background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(108,99,255,0.1));
      border: 1px solid rgba(56,189,248,0.3);
      color: var(--info);
      font-weight: 700;
    }
    .camera-btn:hover { background: linear-gradient(135deg, rgba(56,189,248,0.25), rgba(108,99,255,0.18)); }

    .image-preview { margin-top: 0.75rem; border-radius: var(--radius-md); overflow: hidden; }
    .preview-img { width: 100%; max-height: 260px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--glass-border); }

    .result-header { font-size: 0.9rem; margin-bottom: 0.3rem; }
    .food-chips { display: flex; flex-direction: column; gap: 0.4rem; }
    .food-chip { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: 0.85rem; }
    .food-chip-name { flex: 1; font-weight: 600; }
    .food-chip-portion { color: var(--text-muted); font-size: 0.78rem; }
    .food-chip-kcal { font-weight: 700; color: var(--warning); }

    /* Meal groups */
    .meal-group-label { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin: 0.85rem 0 0.4rem; }
    .log-item { margin-bottom: 0; }
  `],
})
export class FoodComponent implements OnInit {
  form = {
    food_name: '',
    kcal: null as number | null,
    serving_unit: 'quantity',
    serving_size: 1.0,
    meal_type: 'snack' as 'breakfast' | 'lunch' | 'dinner' | 'snack'
  };
  todayLogs: any[] = [];
  todayKcal = 0;
  dailyTarget = 2000;
  newTarget: number | null = null;
  loadingToday = true;
  logging = false;
  settingTarget = false;
  logErr = ''; logOk = '';

  // Camera / AI
  capturedImage: string | null = null;
  analyzing = false;
  analyzeResult: { foods: FoodItem[]; totalKcal: number; details: string } | null = null;
  analyzeErr = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private api: ApiService) { }

  ngOnInit() { this.load(); }

  load() {
    this.loadingToday = true;
    this.api.getFoodTarget().subscribe({ next: (r) => { this.dailyTarget = r.daily_kcal_target; this.newTarget = r.daily_kcal_target; } });
    this.api.getFoodToday().subscribe({
      next: (r) => { this.todayLogs = r.logs; this.todayKcal = r.totalKcal; this.loadingToday = false; },
      error: () => { this.loadingToday = false; },
    });
  }

  get progressPct() { return Math.min(150, Math.round((this.todayKcal / this.dailyTarget) * 100)); }
  get remaining() { return Math.max(0, this.dailyTarget - this.todayKcal); }

  get mealGroups() {
    const order = ['breakfast', 'lunch', 'dinner', 'snack'];
    return order.map(type => ({ type, items: this.todayLogs.filter(l => l.meal_type === type) })).filter(g => g.items.length > 0);
  }

  mealLabel(type: string) {
    const map: any = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', dinner: '🌙 Dinner', snack: '🍎 Snack' };
    return map[type] || type;
  }

  setTarget() {
    if (!this.newTarget || this.newTarget < 500) return;
    this.settingTarget = true;
    this.api.setFoodTarget(this.newTarget).subscribe({
      next: (r) => { this.dailyTarget = r.daily_kcal_target; this.settingTarget = false; },
      error: () => { this.settingTarget = false; },
    });
  }

  logFood() {
    this.logErr = ''; this.logOk = '';
    if (!this.form.food_name || !this.form.kcal) { this.logErr = 'Food name and kcal are required.'; return; }
    this.logging = true;
    this.api.logFood({
      food_name: this.form.food_name,
      kcal: this.form.kcal!,
      serving_unit: this.form.serving_unit,
      serving_size: this.form.serving_size,
      meal_type: this.form.meal_type
    }).subscribe({
      next: () => {
        this.logOk = '✅ Food logged!';
        this.form = {
          food_name: '',
          kcal: null,
          serving_unit: 'quantity',
          serving_size: 1.0,
          meal_type: 'snack'
        };
        this.logging = false;
        this.load();
      },
      error: (e) => { this.logErr = e?.error?.message || 'Failed'; this.logging = false; },
    });
  }

  deleteLog(id: number) {
    this.api.deleteFoodLog(id).subscribe({ next: () => this.load() });
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.capturedImage = reader.result as string; this.analyzeResult = null; this.analyzeErr = ''; };
    reader.readAsDataURL(file);
  }

  analyzeImage() {
    if (!this.capturedImage) return;
    this.analyzing = true;
    this.analyzeResult = null;
    this.analyzeErr = '';
    this.api.analyzeFoodImage(this.capturedImage).subscribe({
      next: (res) => { this.analyzeResult = res; this.analyzing = false; },
      error: (e) => { this.analyzeErr = e?.error?.message || 'Analysis failed. Is Ollama running with llava pulled?'; this.analyzing = false; },
    });
  }

  addAiFoodsToLog() {
    if (!this.analyzeResult) return;
    const calls = this.analyzeResult.foods.map(f =>
      this.api.logFood({ food_name: f.name, kcal: f.kcal, meal_type: this.form.meal_type, image_analyzed: true })
    );
    let done = 0;
    calls.forEach(c => c.subscribe({ next: () => { done++; if (done === calls.length) { this.logOk = `✅ ${done} food item(s) added!`; this.load(); } } }));
    this.analyzeResult = null;
    this.capturedImage = null;
  }
}
