import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { FinanceModule } from '../finance/finance.module';
import { ProfileModule } from '../profile/profile.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
    imports: [FinanceModule, ProfileModule, GoalsModule],
    providers: [AiService],
    controllers: [AiController],
})
export class AiModule { }
