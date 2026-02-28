import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly base = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    private headers(): HttpHeaders {
        const token = localStorage.getItem('lm_token') || '';
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    // ── Auth ──────────────────────────────────────────
    register(username: string, password: string): Observable<any> {
        return this.http.post(`${this.base}/auth/register`, { username, password });
    }

    login(username: string, password: string): Observable<{ access_token: string; username: string }> {
        return this.http.post<any>(`${this.base}/auth/login`, { username, password });
    }

    // ── Fitness ───────────────────────────────────────
    logFitness(data: { activity: string; duration: number; calories?: number; notes?: string }): Observable<any> {
        return this.http.post(`${this.base}/fitness/log`, data, { headers: this.headers() });
    }

    getFitnessSummary(): Observable<any> {
        return this.http.get(`${this.base}/fitness/summary`, { headers: this.headers() });
    }

    // ── Finance ───────────────────────────────────────
    logFinance(data: { category: string; amount: number; note?: string }): Observable<any> {
        return this.http.post(`${this.base}/finance/log`, data, { headers: this.headers() });
    }

    getFinanceSummary(): Observable<any> {
        return this.http.get(`${this.base}/finance/summary`, { headers: this.headers() });
    }

    // ── Learning ──────────────────────────────────────
    addNote(data: { topic: string; content: string; tags?: string[] }): Observable<any> {
        return this.http.post(`${this.base}/learning/note`, data, { headers: this.headers() });
    }

    getNotes(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/learning/notes`, { headers: this.headers() });
    }

    deleteNote(id: number): Observable<any> {
        return this.http.delete(`${this.base}/learning/note/${id}`, { headers: this.headers() });
    }

    // ── Goals ─────────────────────────────────────────
    createGoal(data: { type: string; title: string; target?: any }): Observable<any> {
        return this.http.post(`${this.base}/goals`, data, { headers: this.headers() });
    }

    getGoals(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/goals`, { headers: this.headers() });
    }

    deleteGoal(id: number): Observable<any> {
        return this.http.delete(`${this.base}/goals/${id}`, { headers: this.headers() });
    }

    // ── AI ────────────────────────────────────────────
    getInsight(): Observable<{ advice: string }> {
        return this.http.post<any>(`${this.base}/ai/insight`, {}, { headers: this.headers() });
    }

    estimateCalories(activity: string, duration: number, weight?: number): Observable<{ calories: number; explanation: string }> {
        return this.http.post<any>(`${this.base}/ai/estimate-calories`, { activity, duration, weight }, { headers: this.headers() });
    }

    getFinanceGoalPlan(): Observable<{ plan: string }> {
        return this.http.post<any>(`${this.base}/ai/finance-goal-plan`, {}, { headers: this.headers() });
    }

    analyzeFoodImage(image: string): Observable<{ foods: Array<{ name: string; kcal: number; portion: string }>; totalKcal: number; details: string }> {
        return this.http.post<any>(`${this.base}/ai/analyze-food-image`, { image }, { headers: this.headers() });
    }

    estimateFoodKcal(food_name: string, serving_size: number, serving_unit: string): Observable<{ kcal: number; explanation: string }> {
        return this.http.post<any>(`${this.base}/ai/estimate-food-kcal`, { food_name, serving_size, serving_unit }, { headers: this.headers() });
    }

    getProfile(): Observable<any> {
        return this.http.get<any>(`${this.base}/profile`, { headers: this.headers() });
    }

    updateProfile(data: any): Observable<any> {
        return this.http.post<any>(`${this.base}/profile`, data, { headers: this.headers() });
    }

    // ── Food ─────────────────────────────────────────
    logFood(data: { food_name: string; kcal: number; serving_unit?: string; serving_size?: number; meal_type?: string; image_analyzed?: boolean }): Observable<any> {
        return this.http.post(`${this.base}/food/log`, data, { headers: this.headers() });
    }

    getFoodToday(): Observable<{ logs: any[]; totalKcal: number }> {
        return this.http.get<any>(`${this.base}/food/today`, { headers: this.headers() });
    }

    getFoodWeekly(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/food/weekly`, { headers: this.headers() });
    }

    deleteFoodLog(id: number): Observable<any> {
        return this.http.delete(`${this.base}/food/log/${id}`, { headers: this.headers() });
    }

    setFoodTarget(daily_kcal_target: number): Observable<{ daily_kcal_target: number }> {
        return this.http.post<any>(`${this.base}/food/target`, { daily_kcal_target }, { headers: this.headers() });
    }

    getFoodTarget(): Observable<{ daily_kcal_target: number }> {
        return this.http.get<any>(`${this.base}/food/target`, { headers: this.headers() });
    }

    // ── Fitness (extended) ────────────────────────────
    logFitnessExtended(data: any): Observable<any> {
        return this.http.post(`${this.base}/fitness/log`, data, { headers: this.headers() });
    }
}
