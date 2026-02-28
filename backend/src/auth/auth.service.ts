import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Pool } from 'mysql2/promise';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: AuthDto): Promise<{ message: string }> {
        const [rows]: any = await this.pool.query('SELECT id FROM users WHERE username = ?', [dto.username]);
        if (rows.length > 0) {
            throw new ConflictException('Username already taken');
        }
        const hash = await bcrypt.hash(dto.password, 12);
        await this.pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [dto.username, hash]);
        return { message: 'User registered successfully' };
    }

    async login(dto: AuthDto): Promise<{ access_token: string; username: string }> {
        const [rows]: any = await this.pool.query(
            'SELECT id, username, password_hash FROM users WHERE username = ?',
            [dto.username],
        );
        if (rows.length === 0) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const user = rows[0];
        const valid = await bcrypt.compare(dto.password, user.password_hash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, username: user.username };
        const token = this.jwtService.sign(payload);
        return { access_token: token, username: user.username };
    }
}
