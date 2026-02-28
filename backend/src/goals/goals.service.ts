import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async create(userId: number, dto: CreateGoalDto) {
        const targetJson = dto.target ? JSON.stringify(dto.target) : null;
        const [result]: any = await this.pool.query(
            'INSERT INTO goals (user_id, type, title, target) VALUES (?, ?, ?, ?)',
            [userId, dto.type, dto.title, targetJson],
        );
        const [rows]: any = await this.pool.query('SELECT * FROM goals WHERE id = ?', [result.insertId]);
        return rows[0];
    }

    async findAll(userId: number, type?: string) {
        if (type) {
            const [rows]: any = await this.pool.query(
                'SELECT * FROM goals WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
                [userId, type],
            );
            return rows;
        }
        const [rows]: any = await this.pool.query(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
            [userId],
        );
        return rows;
    }

    async remove(userId: number, id: number) {
        await this.pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
        return { message: 'Goal deleted' };
    }
}
