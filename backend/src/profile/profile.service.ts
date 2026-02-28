import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) { }

    async getProfile(userId: number) {
        const [rows]: any = await this.pool.query(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [userId],
        );
        return rows[0] || null;
    }

    async updateProfile(userId: number, dto: UpdateProfileDto) {
        // Upsert logic
        const [existing]: any = await this.pool.query(
            'SELECT user_id FROM user_profiles WHERE user_id = ?',
            [userId],
        );

        if (existing.length > 0) {
            await this.pool.query(
                `UPDATE user_profiles SET 
                 age = COALESCE(?, age), 
                 height = COALESCE(?, height), 
                 weight = COALESCE(?, weight), 
                 profession = COALESCE(?, profession), 
                 goal_description = COALESCE(?, goal_description)
                 WHERE user_id = ?`,
                [dto.age, dto.height, dto.weight, dto.profession, dto.goal_description, userId],
            );
        } else {
            await this.pool.query(
                `INSERT INTO user_profiles (user_id, age, height, weight, profession, goal_description)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, dto.age || null, dto.height || null, dto.weight || null, dto.profession || null, dto.goal_description || null],
            );
        }

        return this.getProfile(userId);
    }
}
