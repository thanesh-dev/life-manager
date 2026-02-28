import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
    selector: 'app-learning',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page">
      <div class="page-inner fade-up">
        <div class="section-header">
          <div>
            <h2 class="section-title">📚 Learning Notes</h2>
            <p class="section-sub">Capture what you're learning and tag topics</p>
          </div>
          <span class="tag tag-learning">All time</span>
        </div>

        <!-- Add Note Form -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 0.95rem; font-weight:700; margin-bottom: 1rem;">Add Note</h3>
          <div class="form-group">
            <label class="form-label">Topic</label>
            <input id="topic-input" class="form-input" type="text" [(ngModel)]="form.topic" placeholder="e.g. NestJS Guards, TypeScript Generics" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea id="content-input" class="form-textarea" [(ngModel)]="form.content" placeholder="Write your learning notes here..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Tags (comma separated)</label>
            <input id="tags-input" class="form-input" type="text" [(ngModel)]="tagsInput" placeholder="e.g. backend, security, typescript" />
          </div>

          <div *ngIf="err" class="alert alert-error">{{ err }}</div>
          <div *ngIf="ok" class="alert alert-success">{{ ok }}</div>

          <button id="add-note-btn" class="btn btn-primary" (click)="addNote()" [disabled]="saving">
            <span *ngIf="saving" class="spinner"></span>
            <span *ngIf="!saving">➕ Add Note</span>
          </button>
        </div>

        <!-- Notes List -->
        <div class="section-header">
          <h3 class="section-title" style="font-size:1rem;">All Notes ({{ notes.length }})</h3>
        </div>
        <div *ngIf="loading" style="text-align:center; padding: 2rem;"><span class="spinner"></span></div>
        <div *ngIf="!loading && notes.length === 0" class="empty-state">
          <div class="icon">📝</div>
          <p>No notes yet. Start documenting your learning!</p>
        </div>
        <div class="log-list" *ngIf="!loading && notes.length > 0">
          <div class="note-card" *ngFor="let note of notes">
            <div class="note-top">
              <span class="note-topic">{{ note.topic }}</span>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="log-item-right">{{ note.created_at | date:'MMM d' }}</span>
                <button id="delete-note-{{ note.id }}" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" (click)="deleteNote(note.id)">🗑</button>
              </div>
            </div>
            <p class="note-content">{{ note.content }}</p>
            <div *ngIf="note.tags?.length" class="note-tags">
              <span class="tag tag-learning" *ngFor="let t of note.tags">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .note-card {
      background: var(--glass);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 1rem 1.2rem;
      transition: var(--transition);
      margin-bottom: 0.75rem;
    }
    .note-card:hover { background: var(--glass-hover); }
    .note-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .note-topic { font-weight: 700; font-size: 0.95rem; }
    .note-content { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; margin-bottom: 0.6rem; }
    .note-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  `],
})
export class LearningComponent implements OnInit {
    form = { topic: '', content: '' };
    tagsInput = '';
    notes: any[] = [];
    loading = true;
    saving = false;
    err = '';
    ok = '';

    constructor(private api: ApiService) { }
    ngOnInit() { this.load(); }

    load() {
        this.loading = true;
        this.api.getNotes().subscribe({ next: (n) => { this.notes = n; this.loading = false; }, error: () => { this.loading = false; } });
    }

    addNote() {
        this.err = ''; this.ok = '';
        if (!this.form.topic || !this.form.content) { this.err = 'Topic and content are required.'; return; }
        const tags = this.tagsInput ? this.tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
        this.saving = true;
        this.api.addNote({ topic: this.form.topic, content: this.form.content, tags }).subscribe({
            next: () => { this.ok = '✅ Note added!'; this.form = { topic: '', content: '' }; this.tagsInput = ''; this.saving = false; this.load(); },
            error: (e) => { this.err = e?.error?.message || 'Failed'; this.saving = false; },
        });
    }

    deleteNote(id: number) {
        this.api.deleteNote(id).subscribe({ next: () => this.load() });
    }
}
