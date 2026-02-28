import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { CreateLearningNoteDto } from './dto/create-learning-note.dto';

@Injectable()
export class LearningService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async createNote(userId: number, dto: CreateLearningNoteDto) {
        const tagsJson = JSON.stringify(dto.tags ?? []);
        const [result]: any = await this.pool.query(
            'INSERT INTO learning_notes (user_id, topic, content, tags) VALUES (?, ?, ?, ?)',
            [userId, dto.topic, dto.content, tagsJson],
        );
        const [rows]: any = await this.pool.query('SELECT * FROM learning_notes WHERE id = ?', [result.insertId]);
        const row = rows[0];
        return { ...row, tags: row.tags ? JSON.parse(row.tags) : [] };
    }

    async getNotes(userId: number) {
        const [rows]: any = await this.pool.query(
            'SELECT * FROM learning_notes WHERE user_id = ? ORDER BY created_at DESC',
            [userId],
        );
        return rows.map((r: any) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
    }

    async deleteNote(userId: number, id: number) {
        await this.pool.query('DELETE FROM learning_notes WHERE id = ? AND user_id = ?', [id, userId]);
        return { message: 'Note deleted' };
    }
}
