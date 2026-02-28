import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    profile: any = {
        age: null,
        height: null,
        weight: null,
        profession: '',
        goal_description: ''
    };

    loading = true;
    saving = false;
    message = '';
    error = '';

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.getProfile().subscribe({
            next: (res) => {
                if (res) this.profile = res;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    save() {
        this.saving = true;
        this.message = '';
        this.error = '';
        this.api.updateProfile(this.profile).subscribe({
            next: (res) => {
                this.profile = res;
                this.message = 'Profile updated successfully! AI prompts are now personalized.';
                this.saving = false;
            },
            error: (e) => {
                this.error = e?.error?.message || 'Failed to update profile';
                this.saving = false;
            }
        });
    }
}
