import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { CreateFoodLogDto, SetFoodTargetDto } from './dto/food.dto';

@Injectable()
export class FoodService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async logFood(userId: number, dto: CreateFoodLogDto) {
        const [result]: any = await this.pool.query(
            `INSERT INTO food_logs (user_id, food_name, kcal, serving_unit, serving_size, meal_type, image_analyzed)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, dto.food_name, dto.kcal, dto.serving_unit ?? 'quantity', dto.serving_size ?? 1.0, dto.meal_type ?? 'snack', dto.image_analyzed ?? false],
        );
        const [rows]: any = await this.pool.query('SELECT * FROM food_logs WHERE id = ?', [result.insertId]);
        return rows[0];
    }

    async getTodayLogs(userId: number) {
        const [rows]: any = await this.pool.query(
            `SELECT * FROM food_logs
             WHERE user_id = ? AND DATE(logged_at) = CURDATE()
             ORDER BY logged_at ASC`,
            [userId],
        );
        const totalKcal = rows.reduce((s: number, r: any) => s + r.kcal, 0);
        return { logs: rows, totalKcal };
    }

    async getWeeklyLogs(userId: number) {
        const [rows]: any = await this.pool.query(
            `SELECT DATE(logged_at) as date, SUM(kcal) as total_kcal, COUNT(*) as entries
             FROM food_logs
             WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY
             GROUP BY DATE(logged_at)
             ORDER BY date DESC`,
            [userId],
        );
        return rows;
    }

    async deleteLog(userId: number, id: number) {
        await this.pool.query('DELETE FROM food_logs WHERE id = ? AND user_id = ?', [id, userId]);
        return { message: 'Food log deleted' };
    }

    async setTarget(userId: number, dto: SetFoodTargetDto) {
        await this.pool.query(
            `INSERT INTO food_targets (user_id, daily_kcal_target)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE daily_kcal_target = VALUES(daily_kcal_target)`,
            [userId, dto.daily_kcal_target],
        );
        return { daily_kcal_target: dto.daily_kcal_target };
    }

    async getTarget(userId: number): Promise<{ daily_kcal_target: number }> {
        const [rows]: any = await this.pool.query(
            'SELECT daily_kcal_target FROM food_targets WHERE user_id = ?',
            [userId],
        );
        return { daily_kcal_target: rows.length > 0 ? rows[0].daily_kcal_target : 2000 };
    }
}
