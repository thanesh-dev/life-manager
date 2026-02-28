import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'mysql2/promise';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateFinanceLogDto } from './dto/create-finance-log.dto';

@Injectable()
export class FinanceService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly enc: EncryptionService,
    ) { }

    async log(userId: number, dto: CreateFinanceLogDto) {
        const amountEnc = this.enc.encrypt(String(dto.amount));
        const noteEnc = dto.note ? this.enc.encrypt(dto.note) : null;
        const [result]: any = await this.pool.query(
            'INSERT INTO finance_logs (user_id, category, amount_enc, note_enc) VALUES (?, ?, ?, ?)',
            [userId, dto.category, amountEnc, noteEnc],
        );
        const [rows]: any = await this.pool.query(
            'SELECT id, category, logged_at FROM finance_logs WHERE id = ?',
            [result.insertId],
        );
        return { ...rows[0], amount: dto.amount, note: dto.note ?? null };
    }

    async getSummary(userId: number) {
        const [rows]: any = await this.pool.query(
            `SELECT * FROM finance_logs
             WHERE user_id = ? AND logged_at >= NOW() - INTERVAL 7 DAY
             ORDER BY logged_at DESC`,
            [userId],
        );
        const logs = rows.map((row: any) => ({
            id: row.id,
            category: row.category,
            amount: parseFloat(this.enc.safeDecrypt(row.amount_enc)),
            note: row.note_enc ? this.enc.safeDecrypt(row.note_enc) : null,
            logged_at: row.logged_at,
        }));
        const totalSaved = logs.reduce((s: number, r: any) => s + (isNaN(r.amount) ? 0 : r.amount), 0);
        return { logs, totalSaved };
    }
}
