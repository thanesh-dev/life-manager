import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { EncryptionModule } from './encryption/encryption.module';
import { AuthModule } from './auth/auth.module';
import { GoalsModule } from './goals/goals.module';
import { FitnessModule } from './fitness/fitness.module';
import { FinanceModule } from './finance/finance.module';
import { LearningModule } from './learning/learning.module';
import { AiModule } from './ai/ai.module';
import { FoodModule } from './food/food.module';
import { ProfileModule } from './profile/profile.module';

@Module({
    imports: [
        DatabaseModule,
        EncryptionModule,
        AuthModule,
        GoalsModule,
        FitnessModule,
        FinanceModule,
        LearningModule,
        AiModule,
        FoodModule,
        ProfileModule,
    ],
})
export class AppModule { }
