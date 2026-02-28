import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

interface FoodItem { name: string; kcal: number; portion: string; }

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food.component.html',
  styleUrls: ['./food.component.css']
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
  estimatingKcal = false;
  suggestingTarget = false;
  suggestResult = '';
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

  suggestTarget() {
    this.suggestingTarget = true;
    this.suggestResult = '';
    this.api.suggestFoodTarget().subscribe({
      next: (res) => {
        this.newTarget = res.recommendedKcal;
        this.suggestResult = res.explanation;
        this.suggestingTarget = false;
      },
      error: (e) => {
        this.logErr = e?.error?.message || 'Please update your weight/height in Profile first.';
        this.suggestingTarget = false;
      }
    });
  }

  estimateKcal() {
    if (!this.form.food_name || this.form.serving_size === undefined || !this.form.serving_unit) return;
    this.estimatingKcal = true;
    this.logErr = ''; this.logOk = '';
    this.api.estimateFoodKcal(this.form.food_name, this.form.serving_size, this.form.serving_unit).subscribe({
      next: (res) => {
        this.form.kcal = res.kcal;
        this.logOk = `🤖 AI Estimate: ${res.explanation}`;
        this.estimatingKcal = false;
      },
      error: (e) => {
        this.logErr = e?.error?.message || 'AI Kcal estimation unavailable';
        this.estimatingKcal = false;
      },
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
