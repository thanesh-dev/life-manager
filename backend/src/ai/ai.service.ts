import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { EncryptionService } from '../encryption/encryption.service';
import { FinanceService } from '../finance/finance.service';
import { ProfileService } from '../profile/profile.service';
import { GoalsService } from '../goals/goals.service';
import axios from 'axios';

@Injectable()
export class AiService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly enc: EncryptionService,
        private readonly financeService: FinanceService,
        private readonly profileService: ProfileService,
        private readonly goalsService: GoalsService,
    ) { }

    private get ollamaUrl() { return process.env.OLLAMA_URL || 'http://localhost:11434'; }
    private get model() { return process.env.OLLAMA_MODEL || 'llama3'; }

    private async callOllama(prompt: string): Promise<string> {
        const url = `${this.ollamaUrl}/api/generate`;
        const body = { model: this.model, prompt, stream: false };

        try {
            const resp = await axios.post(url, body, { timeout: 60000 });
            return resp.data.response.trim();
        } catch (err: any) {
            throw new Error(`AI unavailable: ${err.message}. Make sure Ollama is running and ${body.model} is pulled.`);
        }
    }

    private async getProfileSummary(userId: number): Promise<string> {
        const profile = await this.profileService.getProfile(userId);
        if (!profile) return 'No profile data available.';
        return `User Profile: Age ${profile.age || 'N/A'}, Height ${profile.height || 'N/A'}cm, Weight ${profile.weight || 'N/A'}kg, Profession: ${profile.profession || 'N/A'}. Goals: ${profile.goal_description || 'None'}.`;
    }

    // ─── 1. Weekly Insight ────────────────────────────────────────────────────
    async getInsight(userId: number): Promise<{ advice: string }> {
        const [[fitnessRows], [financeRows], [learningRows]]: any = await Promise.all([
            this.pool.query(
                `SELECT activity, duration, calories FROM fitness_logs
                 WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY`, [userId]),
            this.pool.query(
                `SELECT category, amount_enc, note_enc FROM finance_logs
                 WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY`, [userId]),
            this.pool.query(
                `SELECT topic, content FROM learning_notes
                 WHERE user_id = ? AND created_at >= NOW() - INTERVAL 7 DAY`, [userId]),
        ]);

        const fitnessSummary = fitnessRows.length
            ? fitnessRows.map((r: any) => `${r.activity} for ${r.duration} min${r.calories ? `, ${r.calories} kcal` : ''}`).join('; ')
            : 'No fitness data this week.';

        const financeSummary = financeRows.length
            ? financeRows.map((r: any) => {
                const amt = this.enc.safeDecrypt(r.amount_enc);
                const note = r.note_enc ? ` (${this.enc.safeDecrypt(r.note_enc)})` : '';
                return `${r.category}: ₹${amt}${note}`;
            }).join('; ')
            : 'No finance data this week.';

        const learningSummary = learningRows.length
            ? learningRows.map((r: any) => r.topic).join(', ')
            : 'No learning notes this week.';

        const prompt = `You are a personal wellness and productivity coach. Give a short (3-5 bullet points), warm, and motivating response.

User data (private — do NOT store or repeat back):
- Fitness this week: ${fitnessSummary}
- Finance this week: ${financeSummary}
- Learning this week: ${learningSummary}

Provide specific, actionable advice based on this data. Be concise and encouraging.`;

        const advice = await this.callOllama(prompt);
        return { advice };
    }

    // ─── 2. Fitness Calorie Estimator (Activity) ──────────────────────────
    async estimateCalories(activity: string, duration: number, userId: number): Promise<{ calories: number; explanation: string }> {
        const profileSummary = await this.getProfileSummary(userId);
        const prompt = `You are a fitness expert. Estimate the active calories burned for this activity based on the user's details.
Activity: ${activity}
Duration: ${duration} minutes
${profileSummary}

Respond ONLY with a valid JSON object:
{"calories": <integer>, "explanation": "<one sentence explanation of why this amount was burned>"}
If the activity is common, use MET values (Metabolic Equivalent of Task).`;

        try {
            const raw = await this.callOllama(prompt);
            const jsonMatch = raw.match(/\{.*"calories".*"explanation".*\}/s);
            if (!jsonMatch) throw new Error('Invalid JSON from AI');
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                calories: Math.max(0, Math.round(Number(parsed.calories))),
                explanation: String(parsed.explanation)
            };
        } catch (err) {
            // Fallback: MET table
            const met: any = { 'walking': 3.5, 'running': 8.0, 'cycling': 7.5, 'gym': 5.0, 'yoga': 2.5, 'swimming': 7.0 };
            const lowerAct = activity.toLowerCase();
            let metVal = 4.0;
            for (const k in met) if (lowerAct.includes(k)) metVal = met[k];

            // If we have weight from profile, use it
            const profile = await this.profileService.getProfile(userId);
            const weight = profile?.weight || 70;
            const cal = Math.round((metVal * 3.5 * weight) / 200 * duration);
            return { calories: cal, explanation: `Estimated ${cal} kcal based on standard MET values for ${activity}.` };
        }
    }

    // ─── 3. Finance Goal Planner ──────────────────────────────────────────
    async financeGoalPlan(userId: number): Promise<{ plan: string }> {
        const logs = await this.financeService.getLast30DaysLogs(userId);
        const goals = await this.goalsService.findAll(userId, 'FINANCE');
        const profileSummary = await this.getProfileSummary(userId);

        const prompt = `You are a financial advisor. Analyze these logs and goals to provide a monthly budget plan.
${profileSummary}
Existing Finance Goals: ${JSON.stringify(goals)}
Last 30 days spending logic: (Decrypted items provided below)
${JSON.stringify(logs.map(l => ({ title: l.title, amount: l.amount, type: l.type })))}

Provide a clear plan with:
1. Health Assessment
2. Monthly targets for each goal
3. 3 spending tips
4. Recommended 50/30/20 split based on their income/profession.
Respond in plain Markdown.`;

        const plan = await this.callOllama(prompt).catch((err) => `⚠️ ${err.message}`);
        return { plan };
    }

    // ─── 4. AI Food Image Analyser (Camera) ───────────────────────────────────
    async analyzeFoodImage(base64Image: string): Promise<{ foods: Array<{ name: string; kcal: number; portion: string }>; totalKcal: number; details: string }> {
        const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const visionModel = process.env.OLLAMA_VISION_MODEL || 'llava';

        const prompt = `You are a nutrition expert and dietitian. Carefully analyze this food image.

Identify every food item visible. For each item estimate:
- Food name
- Estimated portion size (e.g. "1 cup", "100g", "1 medium")
- Estimated calories (kcal) for that portion

Respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "foods": [
    { "name": "food name", "portion": "serving size", "kcal": 123 }
  ],
  "totalKcal": 456,
  "details": "one sentence summary of the meal"
}`;

        try {
            const response = await axios.post(
                `${this.ollamaUrl}/api/generate`,
                { model: visionModel, prompt, images: [imageData], stream: false },
                { timeout: 90000 },
            );
            const raw: string = response.data.response.trim();
            const jsonMatch = raw.match(/\{[\s\S]*"foods"[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Could not parse vision response');
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                foods: parsed.foods || [],
                totalKcal: Math.round(Number(parsed.totalKcal) || 0),
                details: String(parsed.details || ''),
            };
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Vision model unavailable';
            throw new Error(`Food image analysis failed: ${msg}. Make sure llava is installed: ollama pull llava`);
        }
    }

    // ─── 5. AI Food Kcal Estimator ───────────────────────────────────────────
    async estimateFoodKcal(foodName: string, quantity: number, unit: string, userId: number): Promise<{ kcal: number; explanation: string }> {
        const profileSummary = await this.getProfileSummary(userId);
        const prompt = `You are a nutrition expert. Estimate the calories (kcal) for the following food item.
${profileSummary}
Food: ${foodName}
Quantity: ${quantity}
Unit: ${unit}

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{"kcal": <integer>, "explanation": "<one sentence explanation>"}
Be as accurate as possible for the given portion.`;

        try {
            const raw = await this.callOllama(prompt);
            const jsonMatch = raw.match(/\{[\s\S]*"kcal"[\s\S]*"explanation"[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Could not parse AI response');
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                kcal: Math.max(0, Math.round(Number(parsed.kcal))),
                explanation: String(parsed.explanation),
            };
        } catch (err: any) {
            throw new Error(`AI Kcal estimation failed: ${err.message}`);
        }
    }
}
