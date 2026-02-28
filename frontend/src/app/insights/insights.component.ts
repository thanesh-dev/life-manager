import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';

@Component({
    selector: 'app-insights',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page">
      <div class="page-inner fade-up">
        <div class="section-header">
          <div>
            <h2 class="section-title">🤖 AI Insights</h2>
            <p class="section-sub">Powered by Ollama (local llama3) — data never stored</p>
          </div>
          <span class="tag tag-goals">Private</span>
        </div>

        <!-- Privacy Banner -->
        <div class="alert alert-info" style="margin-bottom: 1.5rem;">
          🔒 Your data is sent to a <strong>local</strong> Ollama model. Nothing leaves your machine. AI sees data once, then forgets.
        </div>

        <!-- Trigger Card -->
        <div class="card insight-card" style="margin-bottom: 1.5rem; text-align:center;">
          <div class="insight-icon">✨</div>
          <h3 style="margin-bottom:0.5rem; font-weight:700;">Get Your Weekly Insight</h3>
          <p style="color: var(--text-secondary); font-size:0.88rem; margin-bottom: 1.5rem;">
            Fetches your last 7 days of fitness, finance, and learning data, then asks AI for personalised advice.
          </p>
          <button id="get-insight-btn" class="btn btn-primary" style="min-width: 180px;" (click)="getInsight()" [disabled]="loading">
            <span *ngIf="loading" class="spinner"></span>
            <span *ngIf="!loading">🤖 Get Insight</span>
          </button>
        </div>

        <!-- Advice Display -->
        <div class="card advice-card fade-up" *ngIf="advice">
          <div class="advice-header">
            <span>💬 AI Response</span>
            <button class="btn btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.7rem;" (click)="advice = ''">Clear</button>
          </div>
          <div class="divider"></div>
          <div class="advice-body" [innerText]="advice"></div>
        </div>

        <!-- Error -->
        <div *ngIf="err" class="alert alert-error">{{ err }}</div>

        <!-- How it works -->
        <div class="how-it-works">
          <h3 class="section-title" style="font-size:0.95rem; margin-bottom: 1rem;">How it works</h3>
          <div class="steps">
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">Fetches your last 7 days of fitness, finance & learning data from the database</div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">Finance amounts are decrypted in-memory on the server (never logged)</div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">Builds an ephemeral prompt and sends it to your local Ollama <strong>llama3</strong> model</div>
            </div>
            <div class="step">
              <div class="step-num">4</div>
              <div class="step-text">Returns motivating advice. The AI retains nothing after the request</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .insight-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .advice-header { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 0.95rem; }
    .advice-body { white-space: pre-wrap; line-height: 1.75; font-size: 0.95rem; color: var(--text-primary); margin-top: 0.5rem; }
    .how-it-works { margin-top: 2rem; }
    .steps { display: flex; flex-direction: column; gap: 0.75rem; }
    .step { display: flex; align-items: flex-start; gap: 1rem; padding: 0.85rem 1rem; background: var(--glass); border: 1px solid var(--glass-border); border-radius: var(--radius-md); }
    .step-num {
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--accent-grad);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800; color: #fff;
      flex-shrink: 0;
    }
    .step-text { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; }
  `],
})
export class InsightsComponent {
    loading = false;
    advice = '';
    err = '';

    constructor(private api: ApiService) { }

    getInsight() {
        this.advice = '';
        this.err = '';
        this.loading = true;
        this.api.getInsight().subscribe({
            next: (res) => { this.advice = res.advice; this.loading = false; },
            error: (e) => { this.err = e?.error?.message || 'Failed to get insight. Is Ollama running?'; this.loading = false; },
        });
    }
}
