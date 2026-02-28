import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { CreateFitnessLogDto } from './dto/create-fitness-log.dto';

@Injectable()
export class FitnessService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async log(userId: number, dto: CreateFitnessLogDto) {
        const workoutJson = dto.workout_details ? JSON.stringify(dto.workout_details) : null;

        // Auto-detect activity type if not provided
        const activityLower = dto.activity.toLowerCase();
        let activityType = dto.activity_type || 'other';
        if (!dto.activity_type) {
            if (['walking', 'running', 'jogging', 'hiking', 'trekking', 'cycling', 'walk', 'run', 'jog', 'hike'].some(k => activityLower.includes(k))) {
                activityType = 'cardio';
            } else if (['gym', 'weight', 'bench', 'squat', 'deadlift', 'lift', 'press', 'curl', 'row', 'dumbbell', 'barbell', 'workout'].some(k => activityLower.includes(k))) {
                activityType = 'gym';
            }
        }

        const [result]: any = await this.pool.query(
            `INSERT INTO fitness_logs 
             (user_id, activity, activity_type, duration, calories, steps, workout_details, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, dto.activity, activityType, dto.duration, dto.calories ?? null, dto.steps ?? null, workoutJson, dto.notes ?? null],
        );
        const [rows]: any = await this.pool.query('SELECT * FROM fitness_logs WHERE id = ?', [result.insertId]);
        const row = rows[0];
        return { ...row, workout_details: row.workout_details ? JSON.parse(row.workout_details) : null };
    }

    async getSummary(userId: number) {
        const [rows]: any = await this.pool.query(
            `SELECT * FROM fitness_logs
             WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY
             ORDER BY logged_at DESC`,
            [userId],
        );
        const logs = rows.map((r: any) => ({
            ...r,
            workout_details: r.workout_details ? JSON.parse(r.workout_details) : null,
        }));
        const totalCalories = logs.reduce((s: number, r: any) => s + (r.calories || 0), 0);
        const totalDuration = logs.reduce((s: number, r: any) => s + r.duration, 0);
        const totalSteps = logs.reduce((s: number, r: any) => s + (r.steps || 0), 0);
        return { logs, totalCalories, totalDuration, totalSteps, count: logs.length };
    }
}
