import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { CreateFinanceLogDto } from './dto/create-finance-log.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post('log')
    log(@Request() req, @Body() dto: CreateFinanceLogDto) {
        return this.financeService.log(req.user.userId, dto);
    }

    @Get('summary')
    getSummary(@Request() req) {
        return this.financeService.getSummary(req.user.userId);
    }
}
