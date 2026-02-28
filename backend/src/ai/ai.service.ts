import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { EncryptionService } from '../encryption/encryption.service';
import axios from 'axios';

@Injectable()
export class AiService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly enc: EncryptionService,
    ) { }

    private get ollamaUrl() { return process.env.OLLAMA_URL || 'http://localhost:11434'; }
    private get model() { return process.env.OLLAMA_MODEL || 'llama3'; }

    private async callOllama(prompt: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.ollamaUrl}/api/generate`,
                { model: this.model, prompt, stream: false },
                { timeout: 60000 },
            );
            return response.data.response.trim();
        } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Ollama unavailable';
            throw new Error(`AI unavailable: ${msg}. Make sure Ollama is running (ollama serve) and ${this.model} is pulled.`);
        }
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

    // ─── 2. AI Calorie Estimator (Fitness) ───────────────────────────────────
    async estimateCalories(activity: string, duration: number, weight?: number): Promise<{ calories: number; explanation: string }> {
        const weightNote = weight ? `The person weighs approximately ${weight} kg.` : 'Assume average adult weight of 70 kg.';

        const prompt = `You are a fitness and nutrition expert. Estimate the calories burned for the following workout.

Activity: ${activity}
Duration: ${duration} minutes
${weightNote}

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{"calories": <integer>, "explanation": "<one sentence explanation>"}

Consider MET values, intensity, and standard calorie burn rates. Be realistic.`;

        try {
            const raw = await this.callOllama(prompt);
            // Extract JSON from the response (handle markdown code blocks)
            const jsonMatch = raw.match(/\{[\s\S]*"calories"[\s\S]*"explanation"[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Could not parse AI response');
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                calories: Math.max(1, Math.round(Number(parsed.calories))),
                explanation: String(parsed.explanation),
            };
        } catch {
            // Fallback: rough MET-based calculation
            const metMap: Record<string, number> = {
                running: 9.8, jogging: 7.5, walking: 3.8, cycling: 6.8,
                swimming: 6.0, yoga: 3.0, hiit: 10.0, gym: 5.0,
                dancing: 5.5, climbing: 8.0, basketball: 6.5, football: 7.0,
            };
            const key = activity.toLowerCase().split(' ')[0];
            const met = metMap[key] || 5.0;
            const calories = Math.round(met * 70 * (duration / 60));
            return { calories, explanation: `Estimated using MET value for ${activity}.` };
        }
    }

    // ─── 3. AI Finance Goal Planner ──────────────────────────────────────────
    async financeGoalPlan(userId: number): Promise<{ plan: string }> {
        // Fetch finance goals
        const [goals]: any = await this.pool.query(
            `SELECT title, target FROM goals WHERE user_id = ? AND type = 'FINANCE' ORDER BY created_at DESC LIMIT 10`,
            [userId],
        );

        // Fetch last 30 days of finance logs (decrypted in-memory)
        const [financeRows]: any = await this.pool.query(
            `SELECT category, amount_enc, note_enc, logged_at FROM finance_logs
             WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 30 DAY
             ORDER BY logged_at DESC`,
            [userId],
        );

        const logsDecrypted = financeRows.map((r: any) => ({
            category: r.category,
            amount: parseFloat(this.enc.safeDecrypt(r.amount_enc)) || 0,
            note: r.note_enc ? this.enc.safeDecrypt(r.note_enc) : null,
            date: r.logged_at,
        }));

        const totalIncome = logsDecrypted.filter((r: any) => r.category === 'Income').reduce((s: number, r: any) => s + r.amount, 0);
        const totalExpense = logsDecrypted.filter((r: any) => ['Expense', 'Food', 'Transport', 'Entertainment', 'Health', 'Other'].includes(r.category)).reduce((s: number, r: any) => s + r.amount, 0);
        const totalSaved = logsDecrypted.filter((r: any) => ['Savings', 'Investment'].includes(r.category)).reduce((s: number, r: any) => s + r.amount, 0);

        const goalsText = goals.length
            ? goals.map((g: any) => `- ${g.title}${g.target ? ` (target: ${JSON.stringify(g.target)})` : ''}`).join('\n')
            : '- No specific finance goals set yet.';

        const prompt = `You are a personal finance expert and advisor. Analyze the user's financial data and provide a concrete, actionable savings plan.

FINANCE GOALS (last set goals):
${goalsText}

LAST 30 DAYS SUMMARY (all amounts in ₹):
- Total Income logged: ₹${totalIncome.toFixed(0)}
- Total Expenses: ₹${totalExpense.toFixed(0)}
- Total Saved/Invested: ₹${totalSaved.toFixed(0)}
- Net (Income - Expenses - Savings): ₹${(totalIncome - totalExpense - totalSaved).toFixed(0)}

Provide a response with:
1. Current financial health assessment (1-2 sentences)
2. Specific monthly savings targets to achieve each goal (with realistic timelines)
3. 3 actionable tips to improve savings based on the spending pattern
4. A suggested budget split (% for needs, wants, savings)

Be specific with ₹ amounts. Keep it concise and encouraging.`;

        const plan = await this.callOllama(prompt).catch((err) => `⚠️ ${err.message}`);
        return { plan };
    }

    // ─── 4. AI Food Image Analyser (Camera) ───────────────────────────────────
    async analyzeFoodImage(base64Image: string): Promise<{ foods: Array<{ name: string; kcal: number; portion: string }>; totalKcal: number; details: string }> {
        // Strip data-URL prefix if present
        const imageData = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

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

        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const visionModel = process.env.OLLAMA_VISION_MODEL || 'llava';

        try {
            const response = await axios.post(
                `${ollamaUrl}/api/generate`,
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
    async estimateFoodKcal(foodName: string, quantity: number, unit: string): Promise<{ kcal: number; explanation: string }> {
        const prompt = `You are a nutrition expert. Estimate the calories (kcal) for the following food item.
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
