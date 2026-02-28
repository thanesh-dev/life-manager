import { Module, Global } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

const dbProvider = {
    provide: 'DATABASE_POOL',
    useFactory: async () => {
        return mysql.createPool({
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USER || 'root',
            password: process.env.DATABASE_PASSWORD || 'qwerty',
            database: process.env.DATABASE_NAME || 'lifemanager',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    },
};

@Global()
@Module({
    providers: [dbProvider],
    exports: ['DATABASE_POOL'],
})
export class DatabaseModule { }
